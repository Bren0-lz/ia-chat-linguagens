// T035 — o que o `Professor Engine` interpola em HTML tem de sair escapado.
//
// O envio do Professor e `parse_mode: HTML`. O engine monta a moldura (`<b>…</b>`),
// que e HTML legitimo do fluxo, mas ate 11/09 jogava CONTEUDO cru la dentro:
//     out.feedback='❌ Quase! A resposta certa era: <b>'+String(ts.answer||'')+'</b>.'
// Um gabarito com `<`, `>` ou `&` quebra a mensagem inteira no Telegram — e quebra
// justamente no turno em que o aluno errou e precisava da correcao.
//
// Este teste roda o engine (e o `Parse Professor`, que e quem monta o texto final da
// correcao) fora do n8n e exige, em cada ponto de interpolacao:
//   - o texto final e HTML VALIDO para o Telegram (so tags permitidas, `&` so em entidade);
//   - a MOLDURA sobrevive: `<b>…</b>` continua sendo tag, nao `&lt;b&gt;`;
//   - o CONTEUDO aparece escapado (`a < b` vira `a &lt; b`);
//   - gabarito/nome comuns (`am`, `are`, `children`, `Lucas`) saem byte a byte como antes —
//     escape nao pode virar ruido no caso normal.
//
// Roda offline. Uso: node fluxos/_teststand/testa_html_correcao.js [caminho/do/fluxo.json]
// Reprova o v7.4 e qualquer v8 anterior ao T035.
const fs = require('fs');
const path = require('path');
const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v8.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));

const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }
function fim() {
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: conteudo escapado, moldura intacta'));
  process.exit(fails ? 1 : 0);
}

console.log('fluxo: ' + path.basename(FLOW));
for (const nm of ['Professor Engine', 'Parse Professor']) ok(!!code[nm], 'no de codigo "' + nm + '" existe no fluxo');
if (fails) fim();

// ---------- validador de HTML do Telegram ----------
// Tags aceitas pelo Bot API em parse_mode=HTML (subconjunto que o fluxo usa).
const TAG_OK = /^<\/?(b|strong|i|em|u|s|code|pre)>/;
const ENT_OK = /^&(amp|lt|gt|quot|#\d+);/;
// Devolve '' se valido, ou a descricao do primeiro problema.
function erroHTML(t) {
  const s = String(t == null ? '' : t);
  const pilha = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '&') {
      if (!ENT_OK.test(s.slice(i))) return '`&` solto em ...' + s.slice(Math.max(0, i - 12), i + 12) + '...';
      continue;
    }
    if (s[i] !== '<') continue;
    const m = s.slice(i).match(TAG_OK);
    if (!m) return '`<` que nao abre tag valida em ...' + s.slice(Math.max(0, i - 12), i + 12) + '...';
    const nome = m[0].replace(/[<>/]/g, '');
    if (m[0][1] === '/') { if (pilha.pop() !== nome) return 'fechamento </' + nome + '> sem abertura correspondente'; }
    else pilha.push(nome);
    i += m[0].length - 1;
  }
  if (pilha.length) return 'tag <' + pilha[pilha.length - 1] + '> ficou aberta';
  return '';
}

// O validador so vale se reprovar o texto errado e aprovar o certo (handoff §5.6).
ok(erroHTML('A resposta certa era: <b>am</b>.') === '', 'validador APROVA a moldura legitima');
ok(erroHTML('<b>a < b</b>') !== '', 'validador REPROVA `<` cru dentro da moldura');
ok(erroHTML('<b>Tom & Jerry</b>') !== '', 'validador REPROVA `&` cru');
ok(erroHTML('<b>a &lt; b &amp; c</b>') === '', 'validador APROVA conteudo escapado');
ok(erroHTML('<b>sem fechar') !== '', 'validador REPROVA tag nao fechada');
if (fails) fim();

// ---------- execucao dos nos ----------
const practice = [{ cefr_level: 'A1', prompt: 'Complete: I ___ happy.', answer: 'am', qtype: 'written', track_topic: 'Cumprimentos' }];

function engine(sub, extra, ts) {
  const rm = Object.assign({
    userId: 333, name: 'Lucas', subroute: sub, teacher_state: ts,
    profile: { level: 'A1', persona: 'buddy' }, level: 'A1', text: '', callbackData: '',
    streak_count: 0, first_today: false,
  }, extra);
  const $ = () => ({ first: () => ({ json: rm }), all: () => practice.map(j => ({ json: j })) });
  const $input = { item: { json: practice[0] }, first: () => ({ json: practice[0] }), all: () => practice.map(j => ({ json: j })) };
  return new Function('$', '$input', '$json', code['Professor Engine'] + '\n')($, $input, practice[0]).json;
}

// O texto da correcao que chega ao aluno = feedback do engine + saida do LLM, montados
// pelo `Parse Professor` (ramo llmTask==='wrong').
function parse(eng, saidaLLM) {
  const $ = () => ({ first: () => ({ json: eng }), all: () => [{ json: eng }] });
  const item = { output: saidaLLM };
  const $input = { item: { json: item }, first: () => ({ json: item }), all: () => [{ json: item }] };
  const out = new Function('$', '$input', '$json', code['Parse Professor'] + '\n')($, $input, item);
  return (Array.isArray(out) ? out[0] : out).json;
}

function tsQuiz(answer, question) {
  return { level: 'A1', idx: 0, phase: 'quiz', streak: 0, answer: answer, question: question || 'Complete: I ___ happy.', q_answered: false };
}
const CORPO = 'Voce usa am com I.'; // corpo neutro: quem esta sob julgamento e a moldura

// ---------- 1. o defeito do T035: gabarito hostil dentro de <b> ----------
console.log('\n[1] gabarito com <, >, & e aspas na correcao');
const HOSTIS = [
  { g: 'a < b', esperado: 'a &lt; b' },
  { g: '5 > 3', esperado: '5 &gt; 3' },
  { g: 'Tom & Jerry', esperado: 'Tom &amp; Jerry' },
  { g: '<b>bold</b>', esperado: '&lt;b&gt;bold&lt;/b&gt;' },
  { g: 'she said "hi"', esperado: 'she said "hi"' },
  { g: "it's <no> & done", esperado: "it's &lt;no&gt; &amp; done" },
];
for (const c of HOSTIS) {
  const eng = engine('check', { text: 'wrong stuff' }, tsQuiz(c.g));
  const t = parse(eng, CORPO).finalText;
  const e = erroHTML(t);
  ok(e === '', 'gabarito ' + JSON.stringify(c.g) + ': HTML valido' + (e ? ' — ' + e : ''));
  ok(t.indexOf('<b>' + c.esperado + '</b>') >= 0, 'gabarito ' + JSON.stringify(c.g) + ': moldura intacta com conteudo escapado');
}

// ---------- 2. sem falso positivo: gabarito comum sai igual ao de antes ----------
console.log('\n[2] gabarito comum sai byte a byte como antes');
for (const g of ['am', 'are', 'children', 'good evening', "I'm fine"]) {
  const eng = engine('check', { text: 'wrong stuff' }, tsQuiz(g));
  ok(eng.feedback === '❌ Quase! A resposta certa era: <b>' + g + '</b>.',
    'gabarito ' + JSON.stringify(g) + ': feedback inalterado');
  ok(erroHTML(parse(eng, CORPO).finalText) === '', 'gabarito ' + JSON.stringify(g) + ': HTML valido');
}

// ---------- 3. enunciado hostil na volta a questao (resume_q) ----------
console.log('\n[3] enunciado com < e & ao voltar a questao');
{
  const eng = engine('resume_q', {}, tsQuiz('am', 'Qual e maior: 2 < 3 & 4?'));
  const t = eng.deterministicText;
  ok(erroHTML(t) === '', 'resume_q: HTML valido');
  ok(t.indexOf('2 &lt; 3 &amp; 4') >= 0, 'resume_q: enunciado escapado');
}

// ---------- 4. nome do aluno dentro de texto HTML ----------
console.log('\n[4] nome do aluno (conteudo vindo do cadastro)');
{
  // conclusao da trilha: ts na ultima posicao, streak 4 -> acerta a 5a
  // ts NOVO a cada chamada: o engine muta o objeto que recebe (idx++, streak=0).
  const tsFim = () => ({ level: 'A1', idx: 9, phase: 'quiz', streak: 4, answer: 'am', question: 'Complete: I ___ happy.', q_answered: false });
  const eng = engine('check', { text: 'am', name: 'Ana <b>&' }, tsFim());
  ok(eng.send_kind === 'track_done', 'trilha concluida (pre-condicao do caso)');
  ok(erroHTML(eng.deterministicText) === '', 'track_done: HTML valido com nome hostil');
  ok(eng.deterministicText.indexOf('Ana &lt;b&gt;&amp;') >= 0, 'track_done: nome escapado');

  const engOK = engine('check', { text: 'am', name: 'Lucas' }, tsFim());
  ok(engOK.deterministicText.indexOf('🏆 Incrível, Lucas!') === 0, 'track_done: nome comum inalterado');
}
{
  // avanco de topico: streak 4 + acerto, com topico que nao e o ultimo
  const tsAv = () => ({ level: 'A1', idx: 0, phase: 'quiz', streak: 4, answer: 'am', question: 'Q', q_answered: false });
  const eng = engine('check', { text: 'am', name: 'Ana & <Cia>' }, tsAv());
  ok(eng.send_kind === 'advance', 'avanco de topico (pre-condicao do caso)');
  ok(erroHTML(eng.feedback) === '', 'advance: HTML valido com nome hostil');
  ok(eng.feedback.indexOf('Ana &amp; &lt;Cia&gt;') >= 0, 'advance: nome escapado');

  const engOK = engine('check', { text: 'am', name: 'Lucas' }, tsAv());
  ok(engOK.feedback.indexOf('🎉 Excelente, Lucas!') === 0, 'advance: nome comum inalterado');
}
{
  // comemoracao de streak: entra como prefixo do feedback/deterministicText
  const eng = engine('ask_doubt', { name: 'R&B <fan>', streak_count: 5, first_today: true }, tsQuiz('am'));
  ok(erroHTML(eng.deterministicText) === '', 'streak: HTML valido com nome hostil');
  ok(eng.deterministicText.indexOf('R&amp;B &lt;fan&gt;') >= 0, 'streak: nome escapado');

  const engOK = engine('ask_doubt', { name: 'Lucas', streak_count: 5, first_today: true }, tsQuiz('am'));
  ok(engOK.deterministicText.indexOf('🔥 5 dias seguidos praticando, Lucas!') === 0, 'streak: nome comum inalterado');
}

// ---------- 5. titulo do topico dentro de <b> (hoje inofensivo, amanha nao) ----------
console.log('\n[5] titulo do topico');
{
  const eng = engine('ask_doubt', {}, tsQuiz('am'));
  ok(erroHTML(eng.deterministicText) === '', 'ask_doubt: HTML valido');
  ok(eng.deterministicText.indexOf('<b>Cumprimentos</b>') >= 0, 'ask_doubt: titulo comum inalterado dentro da moldura');
  const engQ = engine('start_quiz', {}, tsQuiz('am'));
  ok(erroHTML(engQ.feedback) === '', 'start_quiz: HTML valido');
  // o titulo vem do TRACK (estatico), entao o escape aqui e defesa: o gate exige que passe por esc()
  const src = code['Professor Engine'];
  ok(/<b>'\+esc\(topic\[0\]\)\+'<\/b>/.test(src), 'ask_doubt interpola o titulo via esc()');
  ok(/'▶️ Questões de “'\+esc\(topic\[0\]\)\+'”/.test(src), 'start_quiz interpola o titulo via esc()');
  ok(/function esc\(s\)\{ return String\(s==null\?'':s\)\.replace\(\/&\/g,'&amp;'\)\.replace\(\/<\/g,'&lt;'\)\.replace\(\/>\/g,'&gt;'\); \}/.test(src),
    'esc() do engine e byte a byte o mesmo do `Parse Professor`');
}

fim();
