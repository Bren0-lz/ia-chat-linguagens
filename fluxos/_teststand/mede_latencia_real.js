// L1 — latência PERCEBIDA, com chat_id real.
//
// A medição de 19/08 (`analisa_latencia.js`) mostrou que o PROCESSAMENTO custa
// 3,23s de média e p90 de 5,87s. Mas ela não mede a entrega ao Telegram: o
// harness usa chat_id sintético, o envio falha e o retry injeta 7 a 27s, que é
// artefato. O relatório mediu com entrega real e afirmou ">8s", então os dois
// números NÃO são comparáveis.
//
// Este script fecha a lacuna: manda para um chat_id REAL, o envio acontece de
// verdade, e mede o tempo total da execução — que é o que o aluno sente.
//
// ATENÇÃO: isto ENVIA MENSAGENS DE VERDADE para a conta indicada. Cada turno
// gera uma mensagem no Telegram do usuário.
//
//   CHAT_ID=<id real> N8N_API_KEY=... node mede_latencia_real.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, cb, digest, jget, API } = require('./harness');

const CHAT_ID = Number(process.env.CHAT_ID || 0);
const RUNS = Number(process.env.RUNS || 3);
const NIVEL = process.env.NIVEL || 'B1';

if (!CHAT_ID) {
  console.error('CHAT_ID obrigatório. Este teste ENVIA mensagens reais no Telegram.');
  console.error('uso: CHAT_ID=<id> node mede_latencia_real.js');
  process.exit(1);
}

const ehEnvio = n => /^(Enviar|Typing|Responder Callback|Limpar Botões|Editar Menu)/.test(n);
const ehLLM = n => /^(Agente |Modelo (Groq|Vertex)|Transcrever|Validar Nome)/.test(n);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const sd = a => a.length < 2 ? 0
  : Math.sqrt(a.map(v => Math.pow(v - mean(a), 2)).reduce((x, y) => x + y, 0) / (a.length - 1));
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

// Preserva o estado do usuário real e restaura no fim — a conta pode ter
// histórico de verdade e o teste não pode deixá-la alterada.
let backup = null;
async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}
async function salvarEstado() {
  const r = await db(c => c.query('SELECT * FROM students WHERE user_id=$1', [CHAT_ID]));
  backup = r.rows[0] || null;
  console.log(backup ? 'estado atual salvo para restauração' : 'usuário não existe na base; será criado');
}
async function prepararConversa() {
  await db(c => c.query(
    'INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, last_update_id, streak_count, last_active)'
    + " VALUES ($1,'Teste',24,'chat','done',$2,'{}'::jsonb,5,1,1,CURRENT_DATE)"
    + " ON CONFLICT (user_id) DO UPDATE SET mode='chat', onboarding='done', level=$2, updated_at=now()",
    [CHAT_ID, NIVEL]));
}
async function restaurar() {
  if (!backup) { await db(c => c.query('DELETE FROM students WHERE user_id=$1', [CHAT_ID])); console.log('\nusuário removido (não existia antes)'); return; }
  await db(c => c.query(
    'UPDATE students SET name=$2, age=$3, mode=$4, onboarding=$5, level=$6, profile=$7, msg_count=$8, streak_count=$9, last_active=$10, teacher_state=$11, placement_state=$12 WHERE user_id=$1',
    [CHAT_ID, backup.name, backup.age, backup.mode, backup.onboarding, backup.level, backup.profile,
     backup.msg_count, backup.streak_count, backup.last_active, backup.teacher_state, backup.placement_state]));
  console.log('\nestado original restaurado');
}

async function medir(rotulo, fn) {
  const exec = await fn();
  const d = digest(exec);
  const full = await jget(API + '/executions/' + d.id + '?includeData=true');
  const total = (new Date(full.stoppedAt) - new Date(full.startedAt)) / 1000;
  const rd = full.data.resultData.runData;
  let llm = 0, infra = 0, envio = 0;
  for (const n of Object.keys(rd)) for (const run of rd[n]) {
    const ms = Number(run.executionTime || 0);
    if (ehEnvio(n)) envio += ms; else if (ehLLM(n)) llm += ms; else infra += ms;
  }
  const erros = Object.keys(rd).filter(n => rd[n][0] && rd[n][0].error);
  console.log('  ' + rotulo.padEnd(22) + total.toFixed(2) + 's total'
    + '  (LLM ' + (llm / 1000).toFixed(2) + ' + infra ' + (infra / 1000).toFixed(2)
    + ' + ENVIO ' + (envio / 1000).toFixed(2) + ')'
    + (erros.length ? '  ERROS: ' + erros.join(',') : ''));
  return { total, llm: llm / 1000, infra: infra / 1000, envio: envio / 1000, erros: erros.length };
}

(async () => {
  console.log('L1 — latência REAL | chat_id ' + CHAT_ID + ' | ' + RUNS + ' repetições');
  console.log('ATENÇÃO: este teste envia mensagens de verdade no Telegram.\n');
  await salvarEstado();

  const amostras = [];
  try {
    for (let r = 1; r <= RUNS; r++) {
      console.log('=== repetição ' + r + '/' + RUNS + ' ===');
      await prepararConversa();
      amostras.push(await medir('menu (sem LLM)', () => msg(CHAT_ID, '/menu')));
      amostras.push(await medir('conversa', () => msg(CHAT_ID, 'hi! i played a great game yesterday')));
      console.log('');
    }
  } finally {
    await restaurar();
  }

  const totais = amostras.map(a => a.total);
  const envios = amostras.map(a => a.envio);
  console.log('\n===== L1 REAL =====');
  console.log('turnos: ' + totais.length
    + ' | média ' + mean(totais).toFixed(2) + 's'
    + ' | desvio ' + sd(totais).toFixed(2)
    + ' | p90 ' + pct(totais, 0.9).toFixed(2) + 's'
    + ' | max ' + Math.max(...totais).toFixed(2) + 's');
  console.log('acima de 8s: ' + totais.filter(v => v > 8).length + '/' + totais.length);
  console.log('custo do ENVIO real: ' + mean(envios).toFixed(2) + 's de média'
    + ' (com chat_id sintético eram 7 a 27s de retry — artefato)');
  console.log('erros em nós: ' + amostras.reduce((a, b) => a + b.erros, 0));
})().catch(e => { console.error('erro', e.message); process.exit(1); });
