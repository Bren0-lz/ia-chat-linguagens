// Verificacao da migracao para o Vertex: exercita as QUATRO rotas de LLM com
// chamada real e diz, por rota, qual no de modelo rodou, quanto tempo levou e
// se a saida chegou. Nao substitui a bateria -- e uma prova de que a troca de
// modelo funciona ponta a ponta.
//
// Regras herdadas do projeto:
//  - resposta vazia NUNCA conta como aprovacao (armadilha 1)
//  - latencia lida por no, nunca a duracao total (armadilha 2)
//  - user_id derivado do relogio, na faixa que o cleanup apaga (armadilha 11)
//
// USO: N8N_API_KEY=... node fluxos/_teststand/verifica_vertex.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, cb, digest } = require('./harness');

const UID = 990000000 + (Date.now() % 9000000);
let n = 0;
const novoUid = () => UID + (n += 7);

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

async function semear(uid, extra) {
  const p = Object.assign({ mode: 'chat', level: 'A1', msg_count: 3 }, extra || {});
  const profile = { persona: 'buddy', interests: ['🎮 Games', '🎵 Música'], inferred_interests: [], level: p.level };
  await db((c) => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,'Lucas',16,$2,'done',$3,$4::jsonb,$5,1,1,now())"
    + ' ON CONFLICT (user_id) DO UPDATE SET mode=$2,level=$3,profile=$4::jsonb,msg_count=$5,updated_at=now()',
    [uid, p.mode, p.level, JSON.stringify(profile), p.msg_count]
  ));
}

const resultados = [];
function avalia(rota, noEsperado, exec) {
  if (!exec) { resultados.push({ rota, ok: false, nota: 'SEM EXECUCAO' }); return null; }
  const rd = exec.data.resultData.runData;
  const d = digest(exec);
  const rodou = Object.keys(rd).filter((k) => /^Modelo Vertex/.test(k));
  const erros = [];
  for (const [nome, runs] of Object.entries(rd))
    for (const r of runs) {
      if (!r.error) continue;
      // O envio ao Telegram SEMPRE falha aqui: o chat_id e sintetico e a API
      // devolve 400. Isso e propriedade do harness, nao do fluxo -- contar como
      // falha de rota esconderia o que o teste quer medir.
      if (/^(Enviar|Editar|Limpar|Responder|Typing)/.test(nome)) continue;
      erros.push(nome + ': ' + String(r.error.message || r.error).slice(0, 120));
    }

  const usouOEsperado = rodou.includes(noEsperado);
  const ms = usouOEsperado ? rd[noEsperado].map((r) => r.executionTime).join('/') : null;
  const temResposta = !!(d.reply && d.reply.trim());
  resultados.push({
    rota, ok: usouOEsperado && !erros.length && temResposta,
    nota: [
      'no=' + (rodou.join(',') || 'NENHUM'),
      ms ? ms + 'ms' : null,
      erros.length ? 'ERROS: ' + erros.join(' | ') : null,
      temResposta ? null : 'RESPOSTA VAZIA (nao e aprovacao)',
    ].filter(Boolean).join(' | '),
  });
  return d;
}

(async () => {
  // --- 1. Conversa -----------------------------------------------------------
  const u1 = novoUid();
  await semear(u1, { mode: 'chat' });
  const d1 = avalia('Conversa', 'Modelo Vertex Conversa', await msg(u1, 'hi! what do you like to do on weekends?'));
  if (d1) console.log('\n[Conversa]\n' + d1.reply + '\n');

  // --- 2. Professor: t_start pede uma questao --------------------------------
  const u2 = novoUid();
  await semear(u2, { mode: 'teacher' });
  const d2 = avalia('Professor', 'Modelo Vertex Professor', await cb(u2, 't_start'));
  if (d2) console.log('[Professor]\n' + d2.reply.slice(0, 700) + '\n');

  // --- 3. Duvida: t_doubt so ABRE a duvida; o agente roda na msg seguinte ----
  await cb(u2, 't_doubt');
  const d3 = avalia('Dúvida', 'Modelo Vertex Dúvida', await msg(u2, 'why is it "good morning" and not "good day"?'));
  if (d3) console.log('[Dúvida]\n' + d3.reply.slice(0, 700) + '\n');

  // --- 4. Extrator: msg_count>=20 dispara a atualizacao de perfil ------------
  const u3 = novoUid();
  await semear(u3, { mode: 'chat', msg_count: 19 });
  const ex4 = await msg(u3, 'i love playing football and cooking pasta with my sister');
  const d4 = avalia('Extrator', 'Modelo Vertex Extrator', ex4);
  if (ex4) console.log('[Extrator] nos que rodaram: ' + Object.keys(ex4.data.resultData.runData).join(', '));
  const st = await db((c) => c.query('SELECT profile FROM students WHERE user_id=$1', [u3]));
  const inf = ((st.rows[0] || {}).profile || {}).inferred_interests;
  console.log('[Extrator] inferred_interests no banco:', JSON.stringify(inf));

  // --- resumo ----------------------------------------------------------------
  console.log('\n===== RESUMO =====');
  for (const r of resultados) console.log((r.ok ? 'OK    ' : 'FALHA ') + r.rota.padEnd(10) + ' | ' + r.nota);
  console.log('\nusuarios de teste: ' + [u1, u2, u3].join(', ') + ' (limpe com: node db/cleanup_test_users.js --apply)');
})();
