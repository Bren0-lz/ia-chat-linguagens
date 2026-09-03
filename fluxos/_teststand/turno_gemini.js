// Um turno de Conversa pelo ingress de teste, para verificar o Gemini ao vivo.
// Nao e teste da bateria: e uma sonda de fumaca da troca de modelo (03/09).
//
// Semeia um aluno A1 (P1 do roteiro), manda UMA mensagem e imprime a resposta
// crua, os erros de no e o tempo do no de modelo. Latencia por no, nunca a
// duracao total: o chat_id sintetico faz o envio ao Telegram falhar e o retry
// injeta 7-27s em qualquer turno (armadilha 2 do handoff).
//
// USO: node fluxos/_teststand/turno_gemini.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, digest } = require('./harness');

const UID = 990000000 + (Date.now() % 9000000); // faixa que o cleanup apaga

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

(async () => {
  const profile = { persona: 'buddy', interests: ['🎮 Games', '🎵 Música'], inferred_interests: [], level: 'A1' };
  await db((c) => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,'Lucas',16,'chat','done','A1',$2::jsonb,3,1,1,now())"
    + ' ON CONFLICT (user_id) DO UPDATE SET profile=$2::jsonb,updated_at=now()',
    [UID, JSON.stringify(profile)]
  ));
  console.log('aluno semeado: user_id=' + UID + ' | A1 | modo chat | persona buddy\n');

  const exec = await msg(UID, 'hi! what do you like to do on weekends?');
  if (!exec) { console.log('SEM EXECUCAO — o webhook nao produziu execucao. n8n de pe? workflow ativo?'); process.exit(1); }

  const d = digest(exec);
  const rd = exec.data.resultData.runData;

  console.log('status:', exec.status, '| execucao:', exec.id);
  console.log('nos que rodaram:', Object.keys(rd).length);

  const modelo = Object.keys(rd).find((n) => /Modelo (Gemini|Vertex)/i.test(n));
  if (modelo) {
    const t = rd[modelo].map((r) => r.executionTime).join(', ');
    console.log('no de modelo:', modelo, '| executionTime(ms):', t, '| chamadas:', rd[modelo].length);
  } else {
    console.log('ATENCAO: nenhum no "Modelo ..." registrou execucao');
  }

  const errs = [];
  for (const [nome, runs] of Object.entries(rd)) {
    for (const r of runs) if (r.error) errs.push(nome + ': ' + String(r.error.message || r.error).slice(0, 200));
  }
  console.log('\nerros de no:', errs.length ? '\n  ' + errs.join('\n  ') : 'nenhum');

  console.log('\n--- resposta ---');
  console.log(d.reply && d.reply.trim() ? d.reply : '(VAZIA — nao confundir com aprovacao; ver armadilha 1)');
  console.log('\nlimpe depois com: node db/cleanup_test_users.js --apply');
})();
