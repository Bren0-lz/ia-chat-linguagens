// T029 — markdown nao pode vazar para o aluno (o envio e parse_mode HTML, entao
// `**`, `*` e `#` chegam literais). Roda offline: extrai o jsCode dos nos do fluxo
// e executa a formatacao sobre fixtures.
//
// Duas rotas, porque cada uma monta o texto num lugar diferente:
//   1. DUVIDA:   Agente Dúvida -> Filtro Anti-Spoiler -> `Formatar Dúvida` -> Enviar Dúvida
//                (a formatacao morava na expressao inline do no Telegram, invisivel ao
//                 digest() — armadilha no 14 do handoff)
//   2. CORRECAO: Parse Professor, ramos llmTask==='wrong' e o 'explain' de fallback do LLM
//
// Ordem exigida: desmarkdown ANTES do escape de HTML, sem destruir o HTML legitimo
// que o proprio fluxo monta (<b>resposta certa</b> vem do `Professor Engine`).
//
// Uso: node fluxos/_teststand/testa_markdown_saida.js [caminho/do/fluxo.json]
const fs = require('fs');
const path = require('path');
const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v8.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));
const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }

function run(nodeName, ctx) {
  if (!code[nodeName]) throw new Error('no sem jsCode: ' + nodeName);
  const $ = (name) => ({ first: () => ({ json: ctx.refs[name] }), all: () => (ctx.refs[name] || []).map(j => ({ json: j })) });
  const $input = { first: () => ({ json: ctx.item }), item: { json: ctx.item }, all: () => (ctx.input || [ctx.item]).map(j => ({ json: j })) };
  const $json = ctx.item;
  const fn = new Function('$', '$input', '$json', code[nodeName] + '\n');
  const out = fn($, $input, $json);
  return Array.isArray(out) ? out[0].json : out.json;
}

// ---------- fixtures ----------
// Markdown real observado na saida do modelo (transcricao de 03/09) + injecao do aluno.
const MD = [
  '# Titulo que o modelo inventou',
  'O verbo precisa de **-ing** depois de *like*.',
  '```',
  'I like playing games.',
  '```',
  'Se o aluno escrever <script>alert(1)</script> tem de aparecer como texto.',
].join('\n');

function semMarkdown(s, rotulo) {
  ok(!/\*/.test(s), rotulo + ': nenhum `*` literal na saida');
  ok(!/(^|\n)#/.test(s), rotulo + ': nenhum `#` de titulo na saida');
  ok(!/```/.test(s), rotulo + ': nenhuma cerca de bloco de codigo na saida');
}
function semInjecao(s, rotulo) {
  ok(/&lt;script&gt;/.test(s) && !/<script/.test(s), rotulo + ': `<` digitado pelo aluno sai escapado');
}

// ============ ESTRUTURA DA ROTA DA DUVIDA ============
console.log('\n== Rota Dúvida: estrutura ==');
const nFmt = flow.nodes.find(n => n.name === 'Formatar Dúvida');
ok(!!nFmt && nFmt.type === 'n8n-nodes-base.code', 'existe o no de codigo `Formatar Dúvida`');
const cFas = flow.connections['Filtro Anti-Spoiler'];
const cFmt = flow.connections['Formatar Dúvida'];
ok(!!cFas && JSON.stringify(cFas).includes('Formatar Dúvida'),
  '`Filtro Anti-Spoiler` liga em `Formatar Dúvida` (no sem connections fica orfao)');
ok(!!cFmt && JSON.stringify(cFmt).includes('Enviar Dúvida'),
  '`Formatar Dúvida` liga em `Enviar Dúvida`');
const envDuv = flow.nodes.find(n => n.name === 'Enviar Dúvida');
const txt = envDuv && envDuv.parameters && String(envDuv.parameters.text || '');
ok(!!txt && /finalText/.test(txt) && !/\.output/.test(txt),
  '`Enviar Dúvida` envia o texto ja pronto (`finalText`), sem formatar na expressao inline');

// ============ ROTA DUVIDA: formatacao ============
console.log('\n== Rota Dúvida: formatação ==');
if (nFmt) {
  const d1 = run('Formatar Dúvida', { refs: {}, item: { output: MD } });
  const s1 = String(d1.finalText || '');
  semMarkdown(s1, 'dúvida');
  semInjecao(s1, 'dúvida');
  ok(/-ing/.test(s1) && /like/.test(s1), 'dúvida: o conteúdo sobrevive ao desmarkdown');

  // ordem: desmarkdown ANTES do escape. Se escapasse primeiro, `**` continuaria literal.
  const d2 = run('Formatar Dúvida', { refs: {}, item: { output: 'use **&** aqui' } });
  ok(/&amp;/.test(String(d2.finalText)) && !/\*/.test(String(d2.finalText)),
    'dúvida: `&` escapado E `**` removido (desmarkdown antes do escape)');

  // cadeia inteira: Filtro Anti-Spoiler (mascara o gabarito pendente) -> Formatar Dúvida
  const ts = { answer: 'playing', q_answered: false };
  const fas = run('Filtro Anti-Spoiler', {
    refs: { 'Professor Engine': { teacher_state_new: ts } },
    item: { output: 'A resposta é **playing**, porque *like* pede -ing.' },
  });
  const enc = run('Formatar Dúvida', { refs: {}, item: fas });
  const s3 = String(enc.finalText || '');
  ok(!/playing/.test(s3) && /___/.test(s3), 'dúvida: o anti-spoiler continua mascarando o gabarito na cadeia');
  semMarkdown(s3, 'dúvida (cadeia)');
} else {
  fails++; console.log('  ✗ dúvida: sem `Formatar Dúvida`, a rota não pode ser medida');
}

// ============ ROTA CORRECAO (Parse Professor) ============
console.log('\n== Rota Correção (Parse Professor) ==');
function parse(llmTask, out, feedback) {
  return run('Parse Professor', {
    refs: { 'Professor Engine': { llmTask, feedback: feedback || '', userId: 222, topicTitle: 'X', practice_bank: [] } },
    item: { output: out },
  });
}
const FB_WRONG = '❌ Quase! A resposta certa era: <b>am</b>.';
const w = parse('wrong', MD, FB_WRONG);
const sw = String(w.finalText || '');
ok(w.pkind === 'wrong', 'correção: ramo `wrong` reconhecido');
semMarkdown(sw, 'correção');
semInjecao(sw, 'correção');
ok(/<b>am<\/b>/.test(sw), 'correção: HTML legítimo do fluxo (<b> do feedback) preservado');

// fallback de explicacao gerada pelo LLM (quando o banco nao serve o topico)
const ex = parse('explain', MD, '📚 Modo Professor — nível A1.');
const sx = String(ex.finalText || '');
ok(ex.pkind === 'explain', 'explicação (fallback LLM): ramo `explain` reconhecido');
semMarkdown(sx, 'explicação (fallback LLM)');
semInjecao(sx, 'explicação (fallback LLM)');

// ============ MESMA LOGICA NOS TRES NOS ============
console.log('\n== Desmarkdown único ==');
function extraiDesmark(nome) {
  const m = String(code[nome] || '').match(/function desmarkdown\(s\)\{[\s\S]*?\}\n/);
  return m ? m[0] : null;
}
const alvos = ['Filtro Anti-Spoiler', 'Formatar Dúvida', 'Parse Professor'];
const blocos = alvos.map(extraiDesmark);
const semBloco = alvos.filter((n, i) => !blocos[i]);
ok(semBloco.length === 0, 'os três nós declaram `desmarkdown()`' + (semBloco.length ? ' — faltam: ' + semBloco.join(', ') : ''));
ok(blocos.every(Boolean) && new Set(blocos).size === 1,
  'o bloco de desmarkdown é idêntico nos três nós (uma regra só, não três dialetos)');

// ============ EXPLICACAO SERVIDA DO BANCO ============
// Conferencia de passagem: o corpo vem dos 60 .md, que `conteudo/valida_explicacoes.js`
// ja proibe de conter markdown (regra HTML_MARKDOWN). Aqui so se garante que o no nao
// reintroduz `*`/`#` e que o HTML revisado chega inteiro ao aluno.
console.log('\n== Explicação do Banco ==');
const body = '<b>O QUE É</b>\nUse <i>-ing</i> depois de like.';
ok(!!code['Explicação do Banco'], 'existe o nó `Explicação do Banco` (só do v8 em diante)');
const banco = !code['Explicação do Banco'] ? { finalText: '' } : run('Explicação do Banco', {
  refs: { 'Professor Engine': { feedback: '📚 Tópico 1/10', topicTitle: 'X', topicNum: 1 } },
  item: { body },
});
const sb = String(banco.finalText || '');
ok(sb.includes('<b>O QUE É</b>') && sb.includes('<i>-ing</i>'), 'banco: HTML revisado chega intacto');
semMarkdown(sb, 'banco');

console.log('\n' + (fails ? '✗ ' + fails + ' falha(s)' : '✓ tudo certo'));
process.exit(fails ? 1 : 0);
