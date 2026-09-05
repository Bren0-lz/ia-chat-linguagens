// Abre-alas deterministico do modo Professor (T002): o aluno recebe
// `📚 Tópico N/10: <titulo>` ANTES da chamada ao modelo, so na rota de explicacao.
// Roda offline: extrai o jsCode do no do fluxo e executa fora do n8n.
// Uso:  node fluxos/_teststand/testa_abre_alas_professor.js [caminho/do/fluxo.json]
// Reprova o v7.4 de proposito: la o no nao existe.
const fs = require('fs');
const path = require('path');
const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v8.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));

const NO_CODIGO = 'Cabeçalho Tópico';
const NO_ENVIO = 'Enviar Cabeçalho Tópico';

const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;
const nodeByName = (nm) => flow.nodes.find(n => n.name === nm);

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }

function fim() {
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: abre-alas do Professor'));
  process.exit(fails ? 1 : 0);
}

// Executa um no de codigo. Diferente do helper da regressao, devolve a LISTA de
// itens: o abre-alas devolve [] nas rotas que nao sao explicacao de topico.
function runItems(nodeName, refs, input) {
  const $ = (name) => ({ first: () => ({ json: refs[name] }), all: () => (refs[name] || []).map(j => ({ json: j })) });
  const $input = { item: { json: (input || [])[0] }, all: () => (input || []).map(j => ({ json: j })) };
  const fn = new Function('$', '$input', '$json', code[nodeName] + '\n');
  const out = fn($, $input, (input || [])[0]);
  return Array.isArray(out) ? out : [out];
}

console.log('fluxo: ' + path.basename(FLOW));

// ---------- 1. o no existe e esta fiado ----------
console.log('\n== No e fiacao ==');
const noCod = nodeByName(NO_CODIGO);
const noEnv = nodeByName(NO_ENVIO);
ok(!!noCod && !!code[NO_CODIGO], 'no de codigo "' + NO_CODIGO + '" existe no fluxo');
ok(!!noEnv && noEnv.type === 'n8n-nodes-base.telegram', 'no telegram "' + NO_ENVIO + '" existe no fluxo');
if (!noCod || !code[NO_CODIGO] || !noEnv) fim();

const conn = flow.connections;
const saidaLlm = (conn['Envio Professor'] && conn['Envio Professor'].main && conn['Envio Professor'].main[0] || []).map(c => c.node);
ok(saidaLlm.indexOf(NO_CODIGO) >= 0, 'saida "llm" do Envio Professor alimenta o abre-alas (nao ficou orfao)');
ok(saidaLlm.indexOf('Agente Professor') >= 0, 'saida "llm" continua alimentando o Agente Professor');
ok(saidaLlm.indexOf(NO_CODIGO) < saidaLlm.indexOf('Agente Professor'), 'abre-alas vem ANTES do Agente Professor na ordem das conexoes');
ok(noCod.position[1] < nodeByName('Agente Professor').position[1],
   'abre-alas esta acima do Agente Professor no canvas (executionOrder v1 roda de cima para baixo)');
const saidaCab = (conn[NO_CODIGO] && conn[NO_CODIGO].main && conn[NO_CODIGO].main[0] || []).map(c => c.node);
ok(saidaCab.length === 1 && saidaCab[0] === NO_ENVIO, 'abre-alas alimenta o "' + NO_ENVIO + '"');

// Telegram usa HTML em todos os envios
const add = (noEnv.parameters && noEnv.parameters.additionalFields) || {};
ok(add.parse_mode === 'HTML', 'envio do cabecalho usa parse_mode HTML');
ok(/headerText/.test(String(noEnv.parameters.text || '')), 'texto do envio vem do campo headerText do abre-alas');
ok(noEnv.onError === 'continueRegularOutput', 'falha no cabecalho nao derruba o turno (onError=continueRegularOutput)');

// ---------- 2. o texto produzido, ponta a ponta com o Professor Engine ----------
console.log('\n== Texto, a partir do estado do aluno ==');
const practice = [{ cefr_level: 'A1', prompt: 'Complete: I ___ happy.', answer: 'am', qtype: 'written' }];
function engine(sub, extra, ts) {
  const rm = Object.assign({
    userId: 222, name: 'Lucas', subroute: sub, teacher_state: ts,
    profile: { level: 'A1', persona: 'buddy' }, level: 'A1', text: '', callbackData: '',
    streak_count: 0, first_today: false,
  }, extra);
  const $ = (name) => ({ first: () => ({ json: rm }), all: () => practice.map(j => ({ json: j })) });
  const $input = { item: { json: practice[0] }, all: () => practice.map(j => ({ json: j })) };
  const fn = new Function('$', '$input', '$json', code['Professor Engine'] + '\n');
  return fn($, $input, practice[0]).json;
}
function cabecalho(eng) {
  return runItems(NO_CODIGO, { 'Professor Engine': eng }, [eng]);
}

// Topico 1: entrada no modo Professor sem estado nenhum
const e1 = engine('intro', {}, null);
ok(e1.llmTask === 'explain', 'pre-condicao: entrada no Professor gera llmTask=explain');
const c1 = cabecalho(e1);
ok(c1.length === 1, 'rota de explicacao produz 1 item');
ok(c1.length === 1 && c1[0].json.headerText === '📚 Tópico 1/10: Cumprimentos',
   'topico 1: "📚 Tópico 1/10: Cumprimentos" (veio ' + JSON.stringify(c1[0] && c1[0].json.headerText) + ')');

// Topico 3: estado com idx=2
const e3 = engine('intro', {}, { level: 'A1', idx: 2, phase: 'intro', streak: 0, answer: '', question: '', q_answered: false });
const c3 = cabecalho(e3);
ok(c3.length === 1 && c3[0].json.headerText === '📚 Tópico 3/10: Números',
   'topico 3: "📚 Tópico 3/10: Números" (veio ' + JSON.stringify(c3[0] && c3[0].json.headerText) + ')');

// ---------- 3. rotas que NAO sao explicacao de topico ----------
console.log('\n== So na explicacao ==');
const eQ = engine('start_quiz', {}, { level: 'A1', idx: 0, phase: 'intro', streak: 0, answer: '', question: '', q_answered: false });
ok(eQ.send_kind === 'question' && cabecalho(eQ).length === 0, 'questao: nenhum cabecalho');

const tsAberto = { level: 'A1', idx: 0, phase: 'quiz', streak: 1, answer: 'am', question: 'Complete: I ___ ok.', q_answered: false };
const eW = engine('check', { text: 'is' }, tsAberto);
ok(eW.send_kind === 'wrong' && cabecalho(eW).length === 0, 'correcao de erro: nenhum cabecalho');

const eD = engine('doubt_msg', { text: 'nao entendi' }, tsAberto);
ok(eD.send_kind === 'doubt' && cabecalho(eD).length === 0, 'duvida: nenhum cabecalho');

// ---------- 4. avanco de topico tambem e explicacao, e do topico NOVO ----------
console.log('\n== Avanco de topico ==');
const eA = engine('check', { text: 'am' }, { level: 'A1', idx: 0, phase: 'quiz', streak: 4, answer: 'am', question: 'Complete: I ___ ok.', q_answered: false });
ok(eA.send_kind === 'advance', 'pre-condicao: 5 acertos seguidos avancam o topico');
const cA = cabecalho(eA);
ok(cA.length === 1 && cA[0].json.headerText === '📚 Tópico 2/10: Alfabeto',
   'avanco anuncia o topico NOVO: "📚 Tópico 2/10: Alfabeto" (veio ' + JSON.stringify(cA[0] && cA[0].json.headerText) + ')');

// ---------- 5. escape de HTML no titulo ----------
console.log('\n== Escape de HTML ==');
const cE = cabecalho({ llmTask: 'explain', send_kind: 'explain', topicNum: 5, topicTot: 10, topicTitle: 'Ir & <b>vir</b>' });
ok(cE.length === 1 && cE[0].json.headerText === '📚 Tópico 5/10: Ir &amp; &lt;b&gt;vir&lt;/b&gt;',
   'titulo com & < > escapado para o parse_mode HTML (veio ' + JSON.stringify(cE[0] && cE[0].json.headerText) + ')');

fim();
