// T029 AO VIVO — a rota da duvida, no v8 publicado.
//
// O `gate_vivo_v8.js` so percorre o onboarding: ele passa sem encostar nesta rota, e foi
// justamente esta que o T029 mudou. Este script DIRIGE a rota da duvida e julga pelo que a
// execucao gravou (armadilha nº 3), nao pela ordem de envio.
//
// Prova tres coisas, nesta ordem de importancia:
//   1. o no `Formatar Duvida` EXISTE no workflow publicado e RODOU — se o v8 no ar fosse a
//      versao antiga, ele nao apareceria no runData e o teste reprova (era o falso PASSOU
//      que o CLAUDE.md adverte: sem republicar, o gate ao vivo testa a versao velha);
//   2. o texto que o aluno receberia nao tem markdown literal (`*`, `#`, cerca de bloco);
//   3. o texto nao esta vazio — resposta vazia nao e aprovacao (armadilha nº 1).
//
// Escreve so no aluno de teste (faixa 990000000-999999999, que `db/cleanup_test_users.js` apaga).
//
// Uso:  node fluxos/_teststand/vivo_duvida_markdown.js
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

// As mesmas marcas que o desmarkdown do fluxo tem de ter tirado.
function marcasDeMarkdown(s) {
  const t = String(s == null ? '' : s);
  const achadas = [];
  if (/\*/.test(t)) achadas.push("'*' literal");
  if (/^#{1,6}\s/m.test(t)) achadas.push("'#' de titulo");
  if (/```/.test(t)) achadas.push('cerca de bloco de codigo');
  return achadas;
}

(async () => {
  await semear(UID);

  // `mode_teacher` so confirma o modo; e a mensagem seguinte que dispara o subroute intro.
  const conf = await cb(UID, 'mode_teacher');
  if (!conf) { console.log('REPROVOU: mode_teacher nao gerou execucao para o user ' + UID); process.exit(1); }
  const intro = await msg(UID, 'oi');
  if (!intro) { console.log('REPROVOU: a mensagem de intro nao gerou execucao'); process.exit(1); }
  console.log('intro: exec ' + digest(intro).id + ' | nos: ' + digest(intro).ran.length);

  // Botao "tenho uma duvida" e, em seguida, a duvida em si (dois turnos, como o produto exige).
  const pedido = await cb(UID, 't_doubt');
  if (!pedido) { console.log('REPROVOU: t_doubt nao gerou execucao'); process.exit(1); }

  const exec = await msg(UID, 'what is the difference between good morning and good afternoon?');
  if (!exec) { console.log('REPROVOU: a duvida nao gerou execucao (n8n no ar? v8 ativo?)'); process.exit(1); }

  const d = digest(exec);
  const rd = exec.data && exec.data.resultData && exec.data.resultData.runData;
  const fmt = nodeOut(rd, 'Formatar Dúvida');
  console.log('\n----- duvida | exec ' + d.id + ' -----');
  console.log('nos do ramo: ' + ['Professor Engine', 'Agente Dúvida', 'Filtro Anti-Spoiler', 'Formatar Dúvida', 'Enviar Dúvida']
    .map((n) => (d.ran.indexOf(n) >= 0 ? '+' : '-') + n).join('  '));

  const texto = fmt ? String(fmt.finalText == null ? '' : fmt.finalText) : '';
  console.log('\n=== O QUE O ALUNO RECEBERIA ===\n' + (texto || '(VAZIO)') + '\n=== fim ===\n');
  if (d.errs && d.errs.length) console.log('erros de no (o de envio ao Telegram e esperado):', d.errs);

  // 1. a versao publicada e a nova
  ok(d.ran.indexOf('Formatar Dúvida') >= 0,
    'o no "Formatar Duvida" RODOU — o v8 no ar e a versao com o T029 (se falhar: republicar)');
  // 2. sem markdown literal
  const marcas = marcasDeMarkdown(texto);
  ok(marcas.length === 0, 'nenhuma marca de markdown na saida' + (marcas.length ? ' (veio: ' + marcas.join(', ') + ')' : ''));
  // 3. nao ficou mudo
  ok(texto.trim().length > 0, 'o aluno recebeu texto — resposta vazia nao e aprovacao');
  ok(d.ran.indexOf('Enviar Dúvida') >= 0, 'saiu pelo no de envio de sempre ("Enviar Duvida")');

  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: a rota da duvida no ar passa pelo Formatar Duvida e chega sem markdown'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
