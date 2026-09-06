// T010 — CAMADA 2 da validacao de nome, AO VIVO, pelo ingress do v8.
//
// O nó `Validar Nome (IA)` foi reapontado ao Vertex (commit 929f5d4) reusando a
// Service Account `mKfC2ANkOKHfbKal`. Está nos dois fluxos e NUNCA rodou de verdade.
//
// O ponto desta prova NAO e "o nome foi aceito?". O `Veredito IA` e fail-open: se a
// credencial nao autenticar, ele devolve verdict='ok' com reason='ia_indisponivel',
// nada quebra, nada aparece no log, e `asdfgh` vira nome de aluno. Visto de fora,
// "a camada 2 recusou" e "a camada 2 morreu e o fail-open deixou passar" sao
// indistinguiveis num teste que so olhe o desfecho.
//
// Por isso este script julga TRES coisas separadas, por caso:
//   1. a camada 2 foi EXERCITADA  — `Triagem de Nome` mandou 'ask_ai' e o nó HTTP rodou;
//   2. a camada 2 AUTENTICOU      — o nó HTTP nao registrou erro E o `Veredito IA` nao
//                                   caiu no fail-open (reason !== 'ia_indisponivel');
//   3. o veredito e o esperado    — 'asdfgh' RECUSADO, e o nome legitimo ACEITO, com o
//                                   `Etapa de Cadastro` concordando (gravou / nao gravou).
//
// Se (2) falhar, o relatorio diz isso explicitamente, com o erro exato do nó lido do
// runData — e o script REPROVA. Fail-open que passa despercebido e o defeito, nao o
// resultado. (Handoff §6 nº 1: resposta vazia nao e aprovacao; §6 nº 13: confira que
// voce esta julgando a string que sai do nó certo.)
//
//   node fluxos/_teststand/testa_nome_camada2_vivo.js
//
// Exige: n8n no ar com o workflow v8 ativo (ingress `iachat-test-v8`) e Postgres.
// Nao publica, nao ativa, nao manda mensagem real no Telegram.

// O WEBHOOK do harness e calculado em tempo de carga: setar a env ANTES do require.
process.env.IACHAT_TEST_PATH = 'iachat-test-v8';

const { msg, digest, nodeOut, sleep, WEBHOOK } = require('./harness');

// Handoff §6 nº 11: ID derivado do relogio, faixa 990000000-999999999 (a que o
// cleanup_test_users.js apaga). Handoff §6 nº 12: um aluno NOVO por caso — mandar
// varios nomes ao mesmo aluno bate no escape do loop da 3a recusa e passa a medir a
// propria feature em vez da validacao.
const BASE_UID = 990000000 + (Date.now() % 8000000);

// Espacamento entre turnos de texto do mesmo aluno (handoff §6 nº 7).
const GAP = Number(process.env.GAP_MS || 12000);

// O nome legitimo tem de cair em `ask_ai` na camada 1, senao o caso nao exercita a
// camada 2 (é o que acontece com 'Rafael', que esta na lista branca). 'Kaique' nao
// esta em lista nenhuma — a camada 1 se declara incerta e a IA decide.
const CASOS = [
  { rotulo: 'asdfgh (sequencia de teclado, 6 letras)', texto: 'asdfgh', esperado: 'reject' },
  { rotulo: 'Kaique (nome legitimo fora da lista branca)', texto: 'Kaique', esperado: 'ok' },
];

let fails = 0;
const ok = (cond, txt) => { if (!cond) { fails++; console.log('  ✗ ' + txt); } else console.log('  ✓ ' + txt); };

function erroDoNo(rd, nome) {
  try {
    const r = rd[nome] && rd[nome][0];
    if (!r) return null;
    if (r.error) return String(r.error.message || r.error.description || JSON.stringify(r.error)).slice(0, 400);
    // onError=continueRegularOutput: o erro tambem viaja como item de saida.
    const out = r.data && r.data.main && r.data.main[0] && r.data.main[0][0] && r.data.main[0][0].json;
    if (out && out.error) return String(out.error.message || JSON.stringify(out.error)).slice(0, 400);
    return null;
  } catch (e) { return null; }
}

async function rodaCaso(uid, texto) {
  const e1 = await msg(uid, 'oi');
  if (!e1) throw new Error('execucao do "oi" nao apareceu para o user ' + uid);
  const d1 = digest(e1);
  if (!d1.student || d1.student.onboarding === undefined) {
    throw new Error('`Carregar Aluno` nao devolveu estado para o user ' + uid + ' (Postgres de pe?)');
  }
  await sleep(GAP);
  const e2 = await msg(uid, texto);
  if (!e2) throw new Error('execucao do nome nao apareceu para o user ' + uid);
  return e2;
}

(async () => {
  console.log('testa_nome_camada2_vivo | ingress ' + WEBHOOK);
  console.log('users ' + BASE_UID + ' e ' + (BASE_UID + 1) + ' | gap ' + GAP + ' ms\n');

  let autenticou = null; // null = ainda nao se sabe
  const diagnostico = [];

  for (let i = 0; i < CASOS.length; i++) {
    const c = CASOS[i];
    const uid = BASE_UID + i;
    console.log('== caso ' + (i + 1) + '/' + CASOS.length + ': ' + c.rotulo + ' | user ' + uid);

    const exec = await rodaCaso(uid, c.texto);
    const rd = exec.data.resultData.runData;
    const ran = Object.keys(rd);

    const triagem = nodeOut(rd, 'Triagem de Nome');
    const veredito = nodeOut(rd, 'Veredito IA');
    const cadastro = nodeOut(rd, 'Etapa de Cadastro');
    const rodouHttp = ran.indexOf('Validar Nome (IA)') >= 0;
    const errHttp = erroDoNo(rd, 'Validar Nome (IA)');

    const vTriagem = triagem && triagem.nameCheck ? triagem.nameCheck.verdict : '(sem nameCheck)';
    const nc = veredito && veredito.nameCheck ? veredito.nameCheck : null;

    console.log('  exec ' + exec.id + ' | ' + ran.length + ' nos');
    console.log('  Triagem de Nome   : verdict=' + vTriagem + ' reason=' + (triagem && triagem.nameCheck ? triagem.nameCheck.reason : '-'));
    console.log('  Validar Nome (IA) : ' + (rodouHttp ? 'rodou' : 'NAO RODOU') + (errHttp ? ' | ERRO: ' + errHttp : ''));
    console.log('  Veredito IA       : ' + (nc ? 'verdict=' + nc.verdict + ' reason=' + nc.reason + ' name=' + JSON.stringify(nc.name) : '(nao rodou)'));
    console.log('  Etapa de Cadastro : saveName=' + JSON.stringify(cadastro && cadastro.saveName) + ' next=' + (cadastro && cadastro.next));
    console.log('  reply: ' + String((cadastro && cadastro.reply) || '(vazia)').replace(/\n/g, ' ').slice(0, 120));

    // (1) a camada 2 foi exercitada?
    ok(vTriagem === 'ask_ai', 'camada 1 devolveu ask_ai (o caso exercita mesmo a camada 2)');
    ok(rodouHttp, 'o nó `Validar Nome (IA)` rodou nesta execucao');

    // (2) a camada 2 autenticou? — a pergunta central da tarefa
    const failOpen = !!(nc && nc.reason === 'ia_indisponivel');
    const auth = rodouHttp && !errHttp && !failOpen;
    if (autenticou === null) autenticou = auth; else autenticou = autenticou && auth;
    if (!auth) {
      diagnostico.push('caso "' + c.texto + '": ' + (errHttp ? 'nó HTTP com erro -> ' + errHttp
        : failOpen ? 'sem erro de nó, mas o `Veredito IA` caiu no FAIL-OPEN (reason=ia_indisponivel): a resposta do Vertex nao trouxe JSON legivel'
          : 'o nó `Validar Nome (IA)` nao rodou'));
    }
    ok(!errHttp, 'o nó `Validar Nome (IA)` nao registrou erro (Service Account autenticou)');
    ok(!failOpen, 'o `Veredito IA` NAO caiu no fail-open (reason != ia_indisponivel)');

    // (3) o veredito e o desfecho no cadastro
    if (c.esperado === 'reject') {
      ok(!!nc && nc.verdict === 'reject', 'veredito = reject para ' + JSON.stringify(c.texto));
      ok(!!cadastro && cadastro.saveName === null && cadastro.next === 'awaiting_name',
        'o cadastro NAO gravou o nome e continua em awaiting_name');
    } else {
      ok(!!nc && nc.verdict === 'ok' && nc.reason === 'ia_ok',
        'veredito = ok com reason=ia_ok (decidido pela IA, nao pelo fail-open)');
      ok(!!cadastro && String(cadastro.saveName || '').toLowerCase().indexOf(c.texto.toLowerCase()) === 0
        && cadastro.next === 'awaiting_age',
        'o cadastro gravou ' + JSON.stringify(cadastro && cadastro.saveName) + ' e seguiu para awaiting_age');
    }
    console.log('');
  }

  if (autenticou === false) {
    console.log('DIAGNOSTICO — a camada 2 NAO esta funcionando ao vivo:');
    for (const d of diagnostico) console.log('  - ' + d);
    console.log('  O `Veredito IA` e fail-open: sem a camada 2, "asdfgh" entra como nome de aluno');
    console.log('  e nada aparece no log. Alternativa registrada no handoff §5.1: credencial');
    console.log('  `googlePalmApi` com API key do Google AI Studio.');
  }

  console.log(fails ? 'REPROVOU: ' + fails + ' assercao(oes)' : 'PASSOU: camada 2 autenticou, recusou "asdfgh" e aceitou "Kaique"');
  console.log('Limpeza: node db/cleanup_test_users.js --apply');
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.log('REPROVOU: erro inesperado — ' + (e && e.message ? e.message : e));
  process.exit(1);
});
