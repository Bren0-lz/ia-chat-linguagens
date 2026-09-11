// T034 — o numero e o titulo do topico aparecem UMA vez para o aluno.
//
// O aluno recebe DUAS mensagens na rota de explicacao de topico:
//   1ª  `Cabecalho Topico` (abre-alas do T002): "📚 Tópico N/10: <titulo>"
//   2ª  `Explicação do Banco` / `Parse Professor`: feedback do engine + corpo
// Ate 11/09 o feedback do engine repetia numero e titulo nas duas pontas da trilha
// (inicio e avanco), e o aluno via a mesma informacao duas vezes seguidas.
//
// Este teste monta o PAR na ordem em que chega ao aluno e exige:
//   - numero e titulo do topico corrente aparecem exatamente 1x no par;
//   - o que so o feedback tem (celebracao, nivel, convite) NAO sumiu junto —
//     senao o conserto da duplicata vira perda de conteudo.
//
// Roda offline: extrai o jsCode dos nos do fluxo e executa fora do n8n.
// Uso:  node fluxos/_teststand/testa_topico_uma_vez.js [caminho/do/fluxo.json]
// Reprova o v7.4 e qualquer v8 anterior ao T034 (la o feedback repete).
const fs = require('fs');
const path = require('path');
const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v8.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));

const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }
function fim() {
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: topico anunciado uma vez so'));
  process.exit(fails ? 1 : 0);
}

console.log('fluxo: ' + path.basename(FLOW));
for (const nm of ['Professor Engine', 'Cabeçalho Tópico', 'Explicação do Banco']) {
  ok(!!code[nm], 'no de codigo "' + nm + '" existe no fluxo');
}
if (fails) fim();

// ---------- execucao dos nos ----------
const practice = [{ cefr_level: 'A1', prompt: 'Complete: I ___ happy.', answer: 'am', qtype: 'written' }];

function engine(sub, extra, ts) {
  const rm = Object.assign({
    userId: 222, name: 'Lucas', subroute: sub, teacher_state: ts,
    profile: { level: 'A1', persona: 'buddy' }, level: 'A1', text: '', callbackData: '',
    streak_count: 0, first_today: false,
  }, extra);
  const $ = () => ({ first: () => ({ json: rm }), all: () => practice.map(j => ({ json: j })) });
  const $input = { item: { json: practice[0] }, first: () => ({ json: practice[0] }), all: () => practice.map(j => ({ json: j })) };
  return new Function('$', '$input', '$json', code['Professor Engine'] + '\n')($, $input, practice[0]).json;
}

// 1ª mensagem: o abre-alas. Devolve [] fora da rota de explicacao.
function cabecalho(eng) {
  const $ = () => ({ first: () => ({ json: eng }), all: () => [{ json: eng }] });
  const $input = { item: { json: eng }, first: () => ({ json: eng }), all: () => [{ json: eng }] };
  const out = new Function('$', '$input', '$json', code['Cabeçalho Tópico'] + '\n')($, $input, eng);
  return Array.isArray(out) ? out : [out];
}

// 2ª mensagem: a explicacao servida do banco (rota normal desde o T008).
// O corpo e propositalmente neutro: quem esta sob julgamento e o feedback.
const CORPO = '<b>Aula</b>\nGood morning significa bom dia.';
function explicacao(eng) {
  const $ = () => ({ first: () => ({ json: eng }), all: () => [{ json: eng }] });
  const row = { body: CORPO };
  const $input = { item: { json: row }, first: () => ({ json: row }), all: () => [{ json: row }] };
  const out = new Function('$', '$input', '$json', code['Explicação do Banco'] + '\n')($, $input, row);
  return (Array.isArray(out) ? out[0] : out).json;
}

function conta(texto, agulha) { return String(texto).split(agulha).length - 1; }

// Monta o par NA ORDEM EM QUE O ALUNO RECEBE: cabecalho primeiro (executionOrder v1
// roda o ramo de cima do canvas antes do ramo da explicacao — invariante guardada
// pelo testa_abre_alas_professor.js), depois a explicacao com o feedback na frente.
function par(eng) {
  const cab = cabecalho(eng);
  if (cab.length !== 1) return null;
  return cab[0].json.headerText + '\n\n' + explicacao(eng).finalText;
}

// ---------- 0. o detector reprova a duplicata e aprova a mensagem unica ----------
// Testado nas duas direcoes ANTES de julgar o produto (handoff §5.6).
console.log('\n== O detector, nas duas direcoes ==');
const DUP = '📚 Tópico 1/10: Cumprimentos\n\n📚 Modo Professor — nível A1. Vamos começar a trilha! Tópico 1/10: “Cumprimentos”.';
const UNI = '📚 Tópico 1/10: Cumprimentos\n\n📚 Modo Professor — nível A1. Vamos começar a trilha!';
ok(conta(DUP, '1/10') === 2 && conta(DUP, 'Cumprimentos') === 2, 'detector ACUSA o par duplicado (2x numero, 2x titulo)');
ok(conta(UNI, '1/10') === 1 && conta(UNI, 'Cumprimentos') === 1, 'detector APROVA o par sem duplicata (1x numero, 1x titulo)');

// ---------- 1. inicio da trilha ----------
console.log('\n== Inicio da trilha ==');
const e1 = engine('intro', {}, null);
ok(e1.llmTask === 'explain' && e1.send_kind === 'explain', 'pre-condicao: entrada no Professor gera explicacao (e o cabecalho dispara)');
const p1 = par(e1);
ok(p1 !== null, 'pre-condicao: o abre-alas produziu a 1ª mensagem');
if (p1 !== null) {
  ok(conta(p1, '1/10') === 1, 'numero do topico aparece 1x no par (veio ' + conta(p1, '1/10') + 'x)');
  ok(conta(p1, 'Cumprimentos') === 1, 'titulo do topico aparece 1x no par (veio ' + conta(p1, 'Cumprimentos') + 'x)');
  ok(!/t[oó]pico\s*\(?\s*\d+\s*\/\s*\d+/i.test(e1.feedback), 'o feedback do engine nao repete "Tópico N/TOT"');
  ok(/n[ií]vel A1/.test(e1.feedback), 'o NIVEL continua no feedback (nao sumiu junto com a duplicata)');
  ok(/Vamos come[cç]ar a trilha/.test(e1.feedback), 'o CONVITE continua no feedback');
  ok(/Modo Professor/.test(e1.feedback), 'o anuncio do modo continua no feedback');
  ok(p1.indexOf(CORPO) > 0, 'o corpo da explicacao continua chegando depois do feedback');
}

// ---------- 2. avanco de topico ----------
console.log('\n== Avanco de topico ==');
const eA = engine('check', { text: 'am' }, { level: 'A1', idx: 0, phase: 'quiz', streak: 4, answer: 'am', question: 'Complete: I ___ ok.', q_answered: false });
ok(eA.send_kind === 'advance' && eA.llmTask === 'explain', 'pre-condicao: 5 acertos seguidas avancam o topico (e o cabecalho dispara)');
const pA = par(eA);
ok(pA !== null, 'pre-condicao: o abre-alas produziu a 1ª mensagem do topico novo');
if (pA !== null) {
  ok(conta(pA, '2/10') === 1, 'numero do topico NOVO aparece 1x no par (veio ' + conta(pA, '2/10') + 'x)');
  ok(conta(pA, 'Alfabeto') === 1, 'titulo do topico NOVO aparece 1x no par (veio ' + conta(pA, 'Alfabeto') + 'x)');
  ok(!/Alfabeto/.test(eA.feedback), 'o feedback nao anuncia o topico novo (quem anuncia e o cabecalho)');
  ok(!/t[oó]pico\s*\(?\s*\d+\s*\/\s*\d+/i.test(eA.feedback), 'o feedback nao repete "Próximo tópico (N/TOT)"');
  // o que so o feedback tem:
  ok(/🎉 Excelente, Lucas!/.test(eA.feedback), 'a CELEBRACAO continua (nome do aluno incluso)');
  ok(/acertou 5 seguidas/.test(eA.feedback), 'o motivo da celebracao continua ("acertou 5 seguidas")');
  ok(/dominou “Cumprimentos”/.test(eA.feedback), 'o topico DOMINADO continua citado (e o anterior, nao o do cabecalho)');
}

fim();
