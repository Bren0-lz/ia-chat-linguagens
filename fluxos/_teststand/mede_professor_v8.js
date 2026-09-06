// T009 — quanto a explicacao pre-gerada economiza, medido no v8 de AGORA.
//
// DESENHO. O controle NAO e o p90 historico de 17,8 s: aquele numero veio do v7.4,
// de outro modelo e outro prompt, e compara-lo com o v8 mediria tres mudancas de uma
// vez. As duas condicoes sao medidas no MESMO fluxo, na MESMA sessao, alternadas:
//
//   banco  — a rota do Professor com a linha presente em `topic_explanations`
//   modelo — a MESMA rota, com a MESMA linha (mesmo nivel, mesmo topico) removida
//            momentaneamente, caindo no fallback de geracao ao vivo
//
// Cada par (banco, modelo) usa o mesmo nivel e roda em sequencia, para que deriva de
// carga do n8n/Vertex ao longo da sessao atinja as duas condicoes por igual.
//
// ARMADILHAS (handoff §6), e o que este script faz com cada uma:
//   nº 2  duracao total nao e latencia — o balde de envio (retry do chat_id sintetico,
//         7 a 27 s) e separado e DESCARTADO do numero. Quem separa e o `decompoe()` do
//         `analisa_latencia.js`, reusado aqui em vez de reescrito.
//   nº 3  o turno e rotulado pelo que o `Roteador Mestre` REGISTROU (`professor:intro`),
//         nunca pela ordem de envio. Turno com outra rota e descartado, com aviso.
//   nº 7  ≥12 s entre turnos sequenciais do mesmo aluno; nº 15: ~35 s quando o turno
//         comeca por CALLBACK.
//   `mode_teacher` NAO dispara a explicacao — quem dispara e a mensagem seguinte. Aqui o
//         aluno ja nasce com mode='teacher' e teacher_state nulo, entao a PRIMEIRA
//         mensagem cai em `professor:intro`. Um turno rotulado errado contamina a media.
//
// Tambem mede a sobrecarga que o T008 introduziu: o no `Buscar Explicação` roda tambem
// nos turnos de QUESTAO e CORRECAO (saida `llm` do switch `Envio Professor`) e o
// resultado e descartado pelo `Rota Explicação`. Em DUVIDA ele nao roda — o script
// exercita a duvida para mostrar isso pela execucao, em vez de afirmar pela leitura.
//
// Escreve em duas coisas, so: alunos de teste na faixa 990000000-999999999 (que o
// `db/cleanup_test_users.js` apaga) e a linha de `topic_explanations` removida e
// reposta a cada par — restaurada no fim por `conteudo/seed_explicacoes.js`.
//
//   node fluxos/_teststand/mede_professor_v8.js [pares] [alunosSobrecarga]
process.env.IACHAT_TEST_PATH = 'iachat-test-v8';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { msg, cb, digest, nodeOut, sleep } = require('./harness');
const { decompoe, mean, pct } = require('./analisa_latencia');

const PARES = Number(process.argv[2] || 12);          // n por condicao
const SOBRECARGA = Number(process.argv[3] || 5);      // alunos na trilha questao/correcao/duvida
const NIVEIS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const ORDEM = 1;                                      // topico 1: e onde o aluno novo cai
const UID_BASE = 990000000 + (Date.now() % 8000000);
const SAIDA = path.join(__dirname, 'lat_professor_v8.json');

const mediana = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const f2 = (v) => (v == null ? '  —  ' : v.toFixed(2).padStart(6));

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

// Aluno de teste ja em modo Professor, sem teacher_state: a proxima mensagem de texto
// cai no subroute `intro` (ver `Roteador Mestre`) e dispara a explicacao do topico 1.
async function semear(uid, nivel) {
  const profile = { persona: 'buddy', interests: ['🎮 Games'], inferred_interests: [], level: nivel };
  await db((c) => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active,teacher_state)'
    + " VALUES ($1,'Lucas',16,'teacher','done',$2,$3::jsonb,3,1,1,$4,NULL)"
    + " ON CONFLICT (user_id) DO UPDATE SET mode='teacher',onboarding='done',level=$2,profile=$3::jsonb,teacher_state=NULL,updated_at=now()",
    [uid, nivel, JSON.stringify(profile), new Date()]
  ));
}

// Classifica a condicao pelo que a EXECUCAO gravou, nao pelo que o script pretendia.
// O caminho do banco carimba `explicacao_origem`; o de geracao ao vivo nao carimba nada
// (o `Parse Professor` e anterior ao T008), entao ali a marca e o `Agente Professor`
// ter rodado. As duas leituras vem do runData da propria execucao.
function origemDoTurno(d, exec) {
  const banco = nodeOut(exec.data.resultData.runData, 'Explicação do Banco');
  if (banco && banco.explicacao_origem === 'banco') return 'banco';
  if (d.ran.indexOf('Agente Professor') >= 0 && d.ran.indexOf('Explicação do Banco') < 0) return 'modelo';
  return 'indefinida';
}

const turnos = [];
const avisos = [];

async function turnoExplicacao(uid, nivel, condicao) {
  await semear(uid, nivel);
  const exec = await msg(uid, 'oi');
  if (!exec) { avisos.push(condicao + '/' + nivel + '/' + uid + ': nenhuma execucao encontrada'); return null; }
  const d = digest(exec);
  const dec = decompoe(exec);
  if (!dec) { avisos.push(condicao + '/' + nivel + ': execucao sem `Roteador Mestre`'); return null; }
  if (dec.rota !== 'professor:intro') {
    avisos.push('DESCARTADO ' + condicao + '/' + nivel + ' exec ' + d.id + ': o Roteador registrou `'
      + dec.rota + '`, nao `professor:intro` (armadilha nº 3)');
    return null;
  }
  const origem = origemDoTurno(d, exec);
  if (origem !== condicao) {
    avisos.push('DESCARTADO ' + condicao + '/' + nivel + ' exec ' + d.id + ': a execucao diz origem `' + origem + '`');
    return null;
  }
  const t = {
    fase: 'explicacao', condicao, nivel, rota: dec.rota, exec: d.id,
    real: dec.real, llm: dec.llm, infra: dec.infra, envio: dec.envio,
    busca: dec.porNo['Buscar Explicação'] || 0,
    chars: ((nodeOut(exec.data.resultData.runData, 'Explicação do Banco') || nodeOut(exec.data.resultData.runData, 'Parse Professor') || {}).finalText || '').length,
  };
  turnos.push(t);
  console.log('  ' + condicao.padEnd(6) + ' ' + nivel + ' exec ' + String(d.id).padEnd(6)
    + ' real ' + f2(t.real) + 's  (LLM ' + f2(t.llm) + '  infra ' + f2(t.infra)
    + ')  busca ' + f2(t.busca) + 's  [envio descartado: ' + f2(t.envio) + 's]  ' + t.chars + ' chars');
  return t;
}

// Turnos em que a consulta ao Postgres roda e o resultado e JOGADO FORA.
async function turnoExtra(fase, exec, esperada) {
  if (!exec) { avisos.push(fase + ': nenhuma execucao'); return; }
  const d = digest(exec);
  const dec = decompoe(exec);
  if (!dec) { avisos.push(fase + ': execucao sem Roteador'); return; }
  if (esperada && dec.rota !== esperada) {
    avisos.push('DESCARTADO ' + fase + ' exec ' + d.id + ': rota `' + dec.rota + '`, esperada `' + esperada + '`');
    return;
  }
  const rodou = d.ran.indexOf('Buscar Explicação') >= 0;
  turnos.push({
    fase, condicao: 'sobrecarga', rota: dec.rota, exec: d.id, real: dec.real, llm: dec.llm,
    infra: dec.infra, envio: dec.envio, buscaRodou: rodou, busca: dec.porNo['Buscar Explicação'] || 0,
  });
  console.log('  ' + fase.padEnd(10) + ' ' + dec.rota.padEnd(20) + ' exec ' + String(d.id).padEnd(6)
    + ' real ' + f2(dec.real) + 's  busca ' + (rodou ? f2(dec.porNo['Buscar Explicação']) + 's' : 'NAO RODOU'));
}

function resumo(rotulo, arr, campo) {
  const v = arr.map((x) => x[campo]);
  if (!v.length) return null;
  const r = { n: v.length, media: mean(v), mediana: mediana(v), p90: pct(v, 0.9), max: Math.max(...v), min: Math.min(...v) };
  console.log('  ' + rotulo.padEnd(22) + ' n=' + String(r.n).padStart(2)
    + '  mediana ' + f2(r.mediana) + 's  p90 ' + f2(r.p90) + 's  media ' + f2(r.media)
    + 's  min ' + f2(r.min) + '  max ' + f2(r.max));
  return r;
}

(async () => {
  const linhas = (await db((c) => c.query(
    'SELECT cefr_level, topic_order, slug, title, body, model FROM topic_explanations WHERE topic_order=$1 ORDER BY cefr_level', [ORDEM]))).rows;
  const porNivel = {};
  for (const r of linhas) porNivel[r.cefr_level] = r;
  const faltando = NIVEIS.filter((l) => !porNivel[l]);
  if (faltando.length) { console.log('BLOCKED: sem linha em topic_explanations para ' + faltando.join(',') + '/' + ORDEM); process.exit(1); }
  const totalAntes = (await db((c) => c.query('SELECT count(*)::int n FROM topic_explanations'))).rows[0].n;
  console.log('T009 | ' + PARES + ' pares (banco x modelo), topico ' + ORDEM + ' | ' + totalAntes + ' linhas em topic_explanations | base de uid ' + UID_BASE + '\n');

  const cols = Object.keys(linhas[0]);
  let removida = null;
  try {
    for (let i = 0; i < PARES; i++) {
      const nivel = NIVEIS[i % NIVEIS.length];
      console.log('par ' + (i + 1) + '/' + PARES + ' — ' + nivel);
      // (1) condicao BANCO: linha presente
      await turnoExplicacao(UID_BASE + i * 10, nivel, 'banco');
      // (2) condicao MODELO: a MESMA linha, removida so por este turno
      const row = porNivel[nivel];
      const del = await db((c) => c.query('DELETE FROM topic_explanations WHERE cefr_level=$1 AND topic_order=$2', [nivel, ORDEM]));
      if (del.rowCount !== 1) { avisos.push('nao removeu a linha ' + nivel + '/' + ORDEM + ' (rowCount=' + del.rowCount + ')'); continue; }
      removida = nivel;
      try {
        await turnoExplicacao(UID_BASE + i * 10 + 1, nivel, 'modelo');
      } finally {
        await db((c) => c.query(
          'INSERT INTO topic_explanations (' + cols.join(',') + ') VALUES (' + cols.map((_, k) => '$' + (k + 1)).join(',') + ')'
          + ' ON CONFLICT (cefr_level, topic_order) DO NOTHING', cols.map((k) => row[k])));
        removida = null;
      }
    }

    // ---- sobrecarga: a consulta que roda e e descartada -------------------------------
    console.log('\n== sobrecarga do `Buscar Explicação` nos turnos que NAO usam o resultado ==');
    for (let i = 0; i < SOBRECARGA; i++) {
      const nivel = NIVEIS[i % NIVEIS.length];
      const uid = UID_BASE + 500 + i * 10;
      await semear(uid, nivel);
      const intro = await msg(uid, 'oi');                 // explicacao (ja medida acima; aqui so posiciona o aluno)
      if (!intro) { avisos.push('sobrecarga: intro sem execucao para ' + uid); continue; }
      await sleep(13000);                                  // armadilha nº 7
      await turnoExtra('questao', await cb(uid, 't_start'), 'professor:start_quiz');
      await sleep(13000);
      await turnoExtra('correcao', await msg(uid, 'zzzz'), 'professor:check');
      await sleep(13000);
      await turnoExtra('pede_duvida', await cb(uid, 't_doubt'), 'professor:ask_doubt');
      await sleep(13000);
      await turnoExtra('duvida', await msg(uid, 'nao entendi, pode explicar de novo?'), 'professor:doubt_msg');
    }
  } finally {
    if (removida) {
      const row = porNivel[removida];
      await db((c) => c.query(
        'INSERT INTO topic_explanations (' + cols.join(',') + ') VALUES (' + cols.map((_, k) => '$' + (k + 1)).join(',') + ')'
        + ' ON CONFLICT (cefr_level, topic_order) DO NOTHING', cols.map((k) => row[k])));
    }
    const { execFileSync } = require('child_process');
    execFileSync(process.execPath, [path.join(__dirname, '..', '..', 'conteudo', 'seed_explicacoes.js')], { stdio: 'inherit' });
  }

  // ---- resultado ---------------------------------------------------------------------
  const expl = turnos.filter((t) => t.fase === 'explicacao');
  const banco = expl.filter((t) => t.condicao === 'banco');
  const modelo = expl.filter((t) => t.condicao === 'modelo');
  console.log('\n== latencia real da rota `professor:intro` (envio DESCARTADO) ==');
  const rb = resumo('banco  (real)', banco, 'real');
  const rm = resumo('modelo (real)', modelo, 'real');
  resumo('banco  (LLM)', banco, 'llm');
  resumo('modelo (LLM)', modelo, 'llm');
  resumo('banco  (infra)', banco, 'infra');
  resumo('modelo (infra)', modelo, 'infra');
  resumo('banco  (busca PG)', banco, 'busca');

  console.log('\n== sobrecarga da consulta descartada ==');
  for (const fase of ['questao', 'correcao', 'pede_duvida', 'duvida']) {
    const a = turnos.filter((t) => t.fase === fase);
    if (!a.length) { console.log('  ' + fase.padEnd(12) + ' (sem turno valido)'); continue; }
    const rodaram = a.filter((t) => t.buscaRodou);
    console.log('  ' + fase.padEnd(12) + ' n=' + a.length + '  a busca rodou em ' + rodaram.length + '/' + a.length);
    if (rodaram.length) resumo('  ' + fase + ' busca', rodaram, 'busca');
  }

  if (avisos.length) { console.log('\nAVISOS/DESCARTES:'); for (const a of avisos) console.log('  - ' + a); }

  const totalDepois = (await db((c) => c.query('SELECT count(*)::int n FROM topic_explanations'))).rows[0].n;
  console.log('\ntopic_explanations: ' + totalAntes + ' -> ' + totalDepois + ' linhas');
  fs.writeFileSync(SAIDA, JSON.stringify({ quando: new Date().toISOString(), pares: PARES, turnos, avisos, totalAntes, totalDepois }, null, 1));
  console.log('bruto em ' + SAIDA);

  let fails = 0;
  if (!rb || rb.n < 10) { console.log('REPROVOU: n da condicao banco = ' + (rb ? rb.n : 0) + ' (<10)'); fails++; }
  if (!rm || rm.n < 10) { console.log('REPROVOU: n da condicao modelo = ' + (rm ? rm.n : 0) + ' (<10)'); fails++; }
  if (rb && rm) {
    console.log('\nGANHO no p90: ' + rm.p90.toFixed(2) + 's -> ' + rb.p90.toFixed(2) + 's  ('
      + (rm.p90 - rb.p90).toFixed(2) + 's, ' + (100 * (1 - rb.p90 / rm.p90)).toFixed(0) + '%)');
    console.log('GANHO na mediana: ' + rm.mediana.toFixed(2) + 's -> ' + rb.mediana.toFixed(2) + 's  ('
      + (rm.mediana - rb.mediana).toFixed(2) + 's, ' + (100 * (1 - rb.mediana / rm.mediana)).toFixed(0) + '%)');
    if (!(rb.p90 < rm.p90)) { console.log('REPROVOU: o p90 do banco NAO ficou abaixo do p90 do modelo'); fails++; }
  }
  if (totalDepois !== 60) { console.log('REPROVOU: topic_explanations com ' + totalDepois + ' linhas, esperadas 60'); fails++; }
  console.log(fails ? '\nREPROVOU: ' + fails + ' condicao(oes)' : '\nPASSOU');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
