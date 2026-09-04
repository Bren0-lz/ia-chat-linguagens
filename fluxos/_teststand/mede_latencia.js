// L1 — instrumentação de latência por rota, medida POR NÓ.
//
// O relatório afirma "ultrapassa 8 segundos em interações complexas" sem
// nenhum número. Este script mede quanto cada etapa realmente custa.
//
// CUIDADO METODOLÓGICO (a primeira versão deste script errou nisso):
// medir a duração TOTAL da execução não serve. O harness usa chat_id sintético,
// então todo nó `Enviar *` falha no Telegram e o n8n faz retry (3 tentativas,
// 1,5s entre elas). Isso injeta ~8s em QUALQUER turno, até nos que não chamam
// LLM — o `HANDOFF.md` §5 já registrava esse artefato. Aqui somamos o tempo
// POR NÓ e separamos três números:
//   - LLM      : os nós de agente/modelo, o custo real do turno
//   - infra    : código, Postgres, roteamento
//   - envio    : nós de Telegram (inflados pelo retry; NÃO representam produção)
// A latência que um usuário real sente ≈ LLM + infra + 1 envio bem-sucedido.
//
//   N8N_API_KEY=... RUNS=3 node mede_latencia.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Client } = require('pg');
const { msg, cb, digest, jget, API } = require('./harness');

const RUNS = Number(process.env.RUNS || 3);
const NIVEL = process.env.NIVEL || 'B1';
const UID = Number(process.env.UID || 993950001);
const TR = './lat_resultado.json';

const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const sd = a => a.length < 2 ? 0
  : Math.sqrt(a.map(v => Math.pow(v - mean(a), 2)).reduce((x, y) => x + y, 0) / (a.length - 1));

const ehEnvio = n => /^(Enviar|Typing|Responder Callback|Limpar Botões|Editar Menu)/.test(n);
const ehLLM = n => /^(Agente |Modelo (Groq|Vertex)|Transcrever|Validar Nome)/.test(n);

async function semear(mode) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const profile = JSON.stringify({ persona: 'buddy', interests: ['games', 'music'], inferred_interests: [] });
  await c.query(
    'INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, last_update_id, streak_count, last_active)'
    + " VALUES ($1,'Marina',24,$4,'done',$2,$3::jsonb,5,1,1,CURRENT_DATE)"
    + " ON CONFLICT (user_id) DO UPDATE SET mode=$4, onboarding='done', level=$2,"
    + ' profile=$3::jsonb, teacher_state=NULL, updated_at=now()',
    [UID, NIVEL, profile, mode]);
  await c.query("DELETE FROM chat_memory WHERE split_part(session_id,':',1) = $1", [String(UID)]);
  await c.end();
}

// soma executionTime por categoria, direto do runData da execução
async function perfil(exec) {
  if (!exec || !exec.id) return null;
  const e = await jget(API + '/executions/' + exec.id + '?includeData=true');
  const rd = e && e.data && e.data.resultData && e.data.resultData.runData;
  if (!rd) return null;
  const r = { llm: 0, infra: 0, envio: 0, nos: 0, maiorNo: null, maiorMs: 0 };
  for (const nome of Object.keys(rd)) {
    for (const run of rd[nome]) {
      const ms = Number(run.executionTime || 0);
      r.nos++;
      if (ehEnvio(nome)) r.envio += ms;
      else if (ehLLM(nome)) r.llm += ms;
      else r.infra += ms;
      if (!ehEnvio(nome) && ms > r.maiorMs) { r.maiorMs = ms; r.maiorNo = nome; }
    }
  }
  return r;
}

const amostras = {};
async function medir(rota, fn) {
  const exec = await fn();
  const p = await perfil(exec);
  if (!p) { console.log('  ' + rota.padEnd(22) + '(sem dados)'); return; }
  const real = (p.llm + p.infra) / 1000;
  (amostras[rota] = amostras[rota] || []).push({ real, llm: p.llm / 1000, infra: p.infra / 1000, envio: p.envio / 1000, maiorNo: p.maiorNo, maiorMs: p.maiorMs });
  console.log('  ' + rota.padEnd(22) + real.toFixed(2) + 's  (LLM ' + (p.llm / 1000).toFixed(2)
    + ' + infra ' + (p.infra / 1000).toFixed(2) + ')  [envio descartado: ' + (p.envio / 1000).toFixed(1) + 's]');
}

(async () => {
  console.log('L1 — latência por rota (por nó) | ' + RUNS + ' repetições | nível ' + NIVEL + '\n');

  for (let r = 1; r <= RUNS; r++) {
    console.log('=== repetição ' + r + '/' + RUNS + ' ===');
    await semear('chat');
    await medir('menu (sem LLM)', () => msg(UID, '/menu'));
    await medir('conversa', () => msg(UID, 'i played a great game yesterday, it was amazing'));
    await medir('conversa (2o turno)', () => msg(UID, 'yes, i liked the story and the music a lot'));
    await semear('teacher');
    await medir('professor: explicacao', () => msg(UID, 'oi, quero aprender'));
    await medir('professor: questao', () => cb(UID, 't_start'));
    await medir('professor: duvida', async () => { await cb(UID, 't_doubt'); return msg(UID, 'nao entendi essa regra'); });
    await medir('professor: correcao', () => msg(UID, 'purple monkey dishwasher'));
    console.log('');
  }

  console.log('===== L1 — RESULTADO (latência real, sem o retry do envio) =====');
  console.log('rota                     n   media   desvio    LLM   infra   >8s');
  const linhas = [];
  for (const rota of Object.keys(amostras)) {
    const a = amostras[rota];
    const reais = a.map(x => x.real);
    const acima = reais.filter(v => v > 8).length;
    linhas.push({ rota, n: a.length, media: mean(reais), sd: sd(reais), llm: mean(a.map(x => x.llm)), infra: mean(a.map(x => x.infra)), acima });
    console.log('  ' + rota.padEnd(22) + String(a.length).padStart(2) + '  '
      + mean(reais).toFixed(2).padStart(6) + 's ' + sd(reais).toFixed(2).padStart(6) + '  '
      + mean(a.map(x => x.llm)).toFixed(2).padStart(5) + '  ' + mean(a.map(x => x.infra)).toFixed(2).padStart(5)
      + '   ' + (acima ? acima + '/' + a.length : '-'));
  }
  const todas = Object.values(amostras).flat();
  const reais = todas.map(x => x.real);
  console.log('\nturnos medidos: ' + reais.length + ' | media geral: ' + mean(reais).toFixed(2) + 's'
    + ' | acima de 8s: ' + reais.filter(v => v > 8).length
    + ' | pior turno: ' + Math.max(...reais).toFixed(2) + 's');
  const gargalos = {};
  for (const t of todas) if (t.maiorNo) gargalos[t.maiorNo] = (gargalos[t.maiorNo] || 0) + 1;
  console.log('\nnó mais caro por turno (contagem):');
  for (const k of Object.keys(gargalos).sort((a, b) => gargalos[b] - gargalos[a]))
    console.log('  ' + String(gargalos[k]).padStart(2) + 'x  ' + k);
  console.log('\nmedia do overhead de envio (ARTEFATO do harness, nao existe em producao): '
    + mean(todas.map(x => x.envio)).toFixed(2) + 's');
  fs.writeFileSync(TR, JSON.stringify({ nivel: NIVEL, runs: RUNS, amostras, resumo: linhas }, null, 1));
  console.log('dados brutos: ' + TR);
})().catch(e => { console.error('erro', e.message); process.exit(1); });
