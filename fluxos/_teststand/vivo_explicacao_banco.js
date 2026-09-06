// T008 AO VIVO — os dois caminhos da explicacao do topico, no v8 publicado.
//
// O `gate_vivo_v8.js` so percorre o onboarding: ele passaria sem encostar nesta rota. Este
// script DIRIGE a rota do Professor, com um aluno semeado, e julga cada caminho pelo que a
// execucao gravou — nao pela ordem de envio (armadilha nº 3).
//
//   CASO A — COM linha no banco: o aluno recebe o texto de `topic_explanations` e o
//            `Agente Professor` NAO aparece no runData. E a prova de que nao houve chamada
//            ao modelo.
//   CASO B — SEM linha: uma unica linha e removida da `topic_explanations` (a de A1/1) e
//            reposta no fim por `node conteudo/seed_explicacoes.js`. O aluno tem de receber
//            a explicacao GERADA AO VIVO, sem erro e sem silencio.
//
// So escreve em duas coisas: os alunos de teste (faixa 990000000-999999999, que o
// `db/cleanup_test_users.js` apaga) e a linha removida/reposta da `topic_explanations`.
//
// Uso:  node fluxos/_teststand/vivo_explicacao_banco.js
process.env.IACHAT_TEST_PATH = 'iachat-test-v8';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, cb, digest, nodeOut } = require('./harness');

const NIVEL = 'A1';
const ORDEM = 1;
const UID_BASE = 990000000 + (Date.now() % 9000000);

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

// Mesmo semear() da bateria_completa_b.js (P1: Lucas, A1, buddy), copiado para nao arrastar a
// bateria inteira. Escreve so na linha do aluno de teste.
async function semear(uid) {
  const profile = { persona: 'buddy', interests: ['🎮 Games', '🎵 Música'], inferred_interests: [], level: NIVEL };
  await db((c) => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,$2,$3,'chat','done',$4,$5::jsonb,3,1,1,$6)"
    + ' ON CONFLICT (user_id) DO UPDATE SET name=$2,age=$3,mode=\'chat\',level=$4,profile=$5::jsonb,updated_at=now()',
    [uid, 'Lucas', 16, NIVEL, JSON.stringify(profile), new Date()]
  ));
}

function relatorio(titulo, d, exec) {
  const rd = exec.data.resultData.runData;
  const cabec = nodeOut(rd, 'Cabeçalho Tópico');
  const banco = nodeOut(rd, 'Explicação do Banco');
  const parse = nodeOut(rd, 'Parse Professor');
  console.log('\n----- ' + titulo + ' | exec ' + d.id + ' -----');
  console.log('nos que rodaram no ramo: ' + ['Cabeçalho Tópico', 'Buscar Explicação', 'Rota Explicação',
    'Explicação do Banco', 'Agente Professor', 'Parse Professor', 'Enviar Explicacao Prof']
    .map((n) => (d.ran.indexOf(n) >= 0 ? '+' : '-') + n).join('  '));
  console.log('\n=== O QUE O ALUNO RECEBERIA ===');
  if (cabec) console.log('[msg 1 / abre-alas]\n' + cabec.headerText + '\n');
  console.log('[msg 2 / explicacao]\n' + ((banco && banco.finalText) || (parse && parse.finalText) || '(VAZIO)'));
  console.log('=== fim ===\n');
  if (d.errs && d.errs.length) console.log('erros de no (o de envio ao Telegram e esperado):', d.errs);
  return { cabec: cabec, banco: banco, parse: parse };
}

(async () => {
  const linha = (await db((c) => c.query(
    'SELECT id, cefr_level, topic_order, slug, title, body, model FROM topic_explanations WHERE cefr_level=$1 AND topic_order=$2',
    [NIVEL, ORDEM]))).rows[0];
  if (!linha) { console.log('BLOCKED: nao ha linha ' + NIVEL + '/' + ORDEM + ' em topic_explanations; rode conteudo/seed_explicacoes.js'); process.exit(1); }

  // ---------------------------------------------------------- CASO A: com linha no banco
  console.log('== CASO A — topico COM explicacao no banco (' + NIVEL + '/' + ORDEM + ': ' + linha.title + ') ==');
  const uidA = UID_BASE;
  await semear(uidA);
  // Caminho real do produto: `mode_teacher` so confirma a troca de modo ("mande qualquer
  // mensagem para receber o primeiro"); e a mensagem seguinte que cai no subroute `intro` e
  // dispara a explicacao do topico. Turno por CALLBACK leva ~35 s (armadilha nº 15).
  const confA = await cb(uidA, 'mode_teacher');
  if (!confA) { console.log('REPROVOU: mode_teacher nao gerou execucao para o user ' + uidA); process.exit(1); }
  ok((digest(confA).student || {}).user_id != null, 'A: aluno semeado e carregado pelo fluxo');
  const execA = await msg(uidA, 'oi');
  if (!execA) { console.log('REPROVOU: nenhuma execucao para o user ' + uidA + ' (n8n no ar? v8 ativo?)'); process.exit(1); }
  const dA = digest(execA);
  const rA = relatorio('CASO A — servido do banco', dA, execA);

  ok(dA.ran.indexOf('Buscar Explicação') >= 0, 'A: o no "Buscar Explicação" rodou');
  ok(dA.ran.indexOf('Explicação do Banco') >= 0, 'A: a rota mandou para "Explicação do Banco"');
  ok(dA.ran.indexOf('Agente Professor') < 0, 'A: o "Agente Professor" NAO rodou — nenhuma chamada ao modelo');
  ok(dA.ran.indexOf('Parse Professor') < 0, 'A: o "Parse Professor" NAO rodou (so existe na geracao ao vivo)');
  ok(!!rA.banco && String(rA.banco.finalText || '').trim().length > 0, 'A: o aluno recebeu texto (nao ficou mudo)');
  ok(!!rA.banco && String(rA.banco.finalText).indexOf(String(linha.body).trim()) >= 0,
     'A: o texto recebido contem, na integra, o body de topic_explanations');
  ok(!!rA.banco && rA.banco.explicacao_origem === 'banco', 'A: a origem registrada e "banco"');
  ok(!!rA.cabec && /^📚 Tópico 1\/10: /.test(String(rA.cabec.headerText || '')),
     'A: o abre-alas do T002 continua vindo antes (' + (rA.cabec && rA.cabec.headerText) + ')');
  ok(dA.ran.indexOf('Enviar Explicacao Prof') >= 0, 'A: saiu pelo no de envio de sempre ("Enviar Explicacao Prof")');

  // ---------------------------------------------------------- CASO B: sem linha no banco
  console.log('\n== CASO B — a MESMA linha removida: o aluno tem de receber a explicacao gerada ao vivo ==');
  let removida = false;
  try {
    const del = await db((c) => c.query('DELETE FROM topic_explanations WHERE cefr_level=$1 AND topic_order=$2', [NIVEL, ORDEM]));
    removida = del.rowCount === 1;
    ok(removida, 'B: 1 linha removida da topic_explanations (' + NIVEL + '/' + ORDEM + ')');
    const restam = (await db((c) => c.query('SELECT count(*)::int n FROM topic_explanations'))).rows[0].n;
    ok(restam === 59, 'B: restam 59 linhas — so uma tabela e so uma linha foram tocadas (veio ' + restam + ')');

    const uidB = UID_BASE + 1;
    await semear(uidB);
    const confB = await cb(uidB, 'mode_teacher');
    if (!confB) { console.log('REPROVOU: mode_teacher nao gerou execucao para o user ' + uidB); fails++; }
    const execB = await msg(uidB, 'oi');
    if (!execB) { console.log('REPROVOU: nenhuma execucao para o user ' + uidB); fails++; }
    else {
      const dB = digest(execB);
      const rB = relatorio('CASO B — gerado ao vivo (fallback)', dB, execB);
      ok(dB.ran.indexOf('Buscar Explicação') >= 0, 'B: a busca rodou e nao achou linha');
      ok(dB.ran.indexOf('Explicação do Banco') < 0, 'B: NAO passou pelo caminho do banco');
      ok(dB.ran.indexOf('Agente Professor') >= 0, 'B: caiu na geracao ao vivo — o "Agente Professor" rodou');
      ok(!!rB.parse && String(rB.parse.finalText || '').trim().length > 0,
         'B: o aluno recebeu a explicacao gerada (requisito duro: nunca fica sem explicacao)');
      const semModelo = (dB.errs || []).filter((e) => /Agente Professor|Modelo Vertex|Buscar Explicação|Rota Explicação/.test(e));
      ok(semModelo.length === 0, 'B: nenhum erro nos nos da rota (veio ' + JSON.stringify(semModelo) + ')');
      ok(!!rB.cabec && /^📚 Tópico 1\/10: /.test(String(rB.cabec.headerText || '')), 'B: o abre-alas tambem veio');
    }
  } finally {
    if (removida) {
      const { execFileSync } = require('child_process');
      execFileSync(process.execPath, [require('path').join(__dirname, '..', '..', 'conteudo', 'seed_explicacoes.js')],
        { stdio: 'inherit' });
      const volta = (await db((c) => c.query('SELECT body FROM topic_explanations WHERE cefr_level=$1 AND topic_order=$2', [NIVEL, ORDEM]))).rows[0];
      const total = (await db((c) => c.query('SELECT count(*)::int n FROM topic_explanations'))).rows[0].n;
      ok(!!volta && String(volta.body) === String(linha.body) && total === 60,
         'RESTAURO: a linha voltou identica e a tabela tem 60 linhas de novo (' + total + ')');
    }
  }

  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: banco serve com linha, gera ao vivo sem linha'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
