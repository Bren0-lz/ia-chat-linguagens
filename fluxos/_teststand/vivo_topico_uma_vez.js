// T034 AO VIVO — o par de mensagens da rota Professor, no v8 publicado.
//
// O `gate_vivo_v8.js` so percorre o onboarding e o `vivo_duvida_markdown.js` cobre a duvida:
// nenhum dos dois encosta no par que o T034 mudou. Este script dirige a entrada na trilha e
// julga pelo que a execucao gravou (armadilha nº 3), nao pela ordem de envio.
//
// O aluno recebe DUAS mensagens ao entrar no modo Professor:
//   msg 1 — `Cabecalho Topico`  -> "📚 Topico N/10: <titulo>"   (abre-alas do T002)
//   msg 2 — `Explicacao do Banco` (ou `Parse Professor`, no fallback) -> feedback + corpo
//
// Antes do T034 o ANUNCIO do topico vinha nas duas. Este teste prova que, no fluxo PUBLICADO,
// ele aparece uma vez — e que o feedback nao perdeu o que so ele diz (nivel e convite), porque
// conserto que apaga conteudo tambem e defeito.
//
// O QUE E JULGADO: cabecalho + FEEDBACK. O corpo da explicacao vem do banco e legitimamente
// fala do assunto — o de A1/1 comeca com "Cumprimentos e despedidas sao as palavras que
// usamos...". A primeira versao deste teste somava o corpo e acusou 2x o titulo: nao era o
// produto repetindo, era o instrumento julgando a string errada (armadilha nº 13). O corpo
// entra num assert proprio, so para provar que chegou inteiro.
//
// Nao usa LLM: a explicacao vem do banco. Escreve so no aluno de teste (faixa
// 990000000-999999999, que `db/cleanup_test_users.js` apaga).
//
// Uso:  node fluxos/_teststand/vivo_topico_uma_vez.js
process.env.IACHAT_TEST_PATH = 'iachat-test-v8';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, cb, digest, nodeOut } = require('./harness');

const NIVEL = 'A1';
const UID = 990000000 + (Date.now() % 9000000);

let fails = 0;
function ok(cond, texto) { if (!cond) { fails++; console.log('  ✗ ' + texto); } else console.log('  ✓ ' + texto); }

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

async function semear(uid) {
  const profile = { persona: 'buddy', interests: ['🎮 Games'], inferred_interests: [], level: NIVEL };
  await db((c) => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,$2,$3,'chat','done',$4,$5::jsonb,3,1,1,$6)"
    + " ON CONFLICT (user_id) DO UPDATE SET name=$2,age=$3,mode='chat',level=$4,profile=$5::jsonb,updated_at=now()",
    [uid, 'Lucas', 16, NIVEL, JSON.stringify(profile), new Date()]
  ));
}

function ocorrencias(texto, agulha) {
  if (!agulha) return 0;
  let n = 0, i = 0;
  for (;;) { const k = texto.indexOf(agulha, i); if (k < 0) break; n++; i = k + agulha.length; }
  return n;
}

(async () => {
  await semear(UID);

  const conf = await cb(UID, 'mode_teacher');
  if (!conf) { console.log('REPROVOU: mode_teacher nao gerou execucao para o user ' + UID); process.exit(1); }
  const exec = await msg(UID, 'oi');
  if (!exec) { console.log('REPROVOU: a mensagem de intro nao gerou execucao (n8n no ar? v8 ativo?)'); process.exit(1); }

  const d = digest(exec);
  const rd = exec.data && exec.data.resultData && exec.data.resultData.runData;
  const cabec = nodeOut(rd, 'Cabeçalho Tópico');
  const banco = nodeOut(rd, 'Explicação do Banco');
  const parse = nodeOut(rd, 'Parse Professor');
  const eng = nodeOut(rd, 'Professor Engine');

  const msg1 = cabec ? String(cabec.headerText || '') : '';
  const msg2 = String((banco && banco.finalText) || (parse && parse.finalText) || '');
  const feedback = eng ? String(eng.feedback || '') : '';
  const par = msg1 + '\n\n' + feedback;

  console.log('\n----- entrada na trilha | exec ' + d.id + ' -----');
  console.log('nos: ' + ['Professor Engine', 'Cabeçalho Tópico', 'Buscar Explicação', 'Explicação do Banco', 'Enviar Explicacao Prof']
    .map((n) => (d.ran.indexOf(n) >= 0 ? '+' : '-') + n).join('  '));
  console.log('\n=== O QUE O ALUNO RECEBE ===\n[msg 1]\n' + (msg1 || '(VAZIO)') + '\n\n[msg 2]\n' + (msg2 || '(VAZIO)') + '\n=== fim ===');
  console.log('\n=== O QUE ESTE TESTE JULGA (cabecalho + feedback) ===\n' + par + '\n=== fim ===\n');
  if (d.errs && d.errs.length) console.log('erros de no (o de envio ao Telegram e esperado):', d.errs);

  const titulo = eng ? String(eng.topicTitle || '') : '';
  const num = eng ? String(eng.topicNum || '') + '/' + String(eng.topicTot || '') : '';

  ok(!!msg1 && !!msg2, 'o aluno recebeu as duas mensagens (nenhuma vazia)');
  ok(!!titulo, 'o engine publicou o titulo do topico (' + JSON.stringify(titulo) + ')');
  ok(ocorrencias(par, titulo) === 1, 'o TITULO aparece uma vez no anuncio (veio ' + ocorrencias(par, titulo) + 'x)');
  ok(ocorrencias(par, num) === 1, 'o NUMERO do topico (' + num + ') aparece uma vez no anuncio (veio ' + ocorrencias(par, num) + 'x)');
  // O conserto do T034 nao pode ter levado junto o que so o feedback diz.
  ok(/Modo Professor/.test(feedback), 'o feedback preservou o "Modo Professor" (nivel e convite)');
  ok(new RegExp('nível\\s+' + NIVEL, 'i').test(feedback), 'o feedback ainda anuncia o nivel do aluno');
  // O corpo do banco fica fora do julgamento acima, mas tem de chegar inteiro.
  ok(msg2.length > feedback.length + 200, 'o corpo da explicacao do banco chegou junto (msg 2 tem ' + msg2.length + ' chars)');

  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: no fluxo publicado o topico e anunciado uma vez, sem perder o que so o feedback diz'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
