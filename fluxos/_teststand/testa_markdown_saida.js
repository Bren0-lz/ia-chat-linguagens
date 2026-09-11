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

// ============ T033: BULLET DE LISTA ============
// A T029 nao tratava marcador de lista em inicio de linha — que e a forma que o
// modelo MAIS produz numa explicacao. Evidencia ao vivo (exec 4274, 11/09): o aluno
// recebeu "*   Good morning (bom dia) ...". Fixture copiada dessa transcricao.
// Decisao: o marcador vira `•` (a lista e conteudo didatico; achatar juntaria os itens).
console.log('\n== Bullet de lista (T033) ==');
const BULLETS = [
  'A diferença é simples:',
  '*   Good morning (bom dia) a gente usa de manhã, quando o sol tá nascendo.',
  '*   Good afternoon (boa tarde) a gente usa à tarde, depois do meio-dia.',
  '- Use **do** com I/you/we/they.',
  '+ E o terceiro marcador que o modelo usa.',
  '  - item indentado com hífen',
  '    * item indentado com asterisco',
].join('\n');

function conferBullets(s, rotulo) {
  ok(!/(^|\n)[ \t]*[*+-][ \t]/.test(s), rotulo + ': nenhum marcador de lista cru (`* `, `- `, `+ `) em início de linha');
  ok((s.match(/•/g) || []).length === 6, rotulo + ': os 6 itens viraram `•` (a lista sobrevive, não some)');
  ok(/•\s+Good morning \(bom dia\)/.test(s), rotulo + ': o conteúdo do item continua logo após o `•`');
  ok(/\n {2}• item indentado com hífen/.test(s) && /\n {4}• item indentado com asterisco/.test(s),
    rotulo + ': a indentação do item aninhado é preservada');
  ok(/• Use do com I\/you\/we\/they\./.test(s), rotulo + ': `**negrito**` dentro do item também é desmarcado');
  ok(/(^|\n)A diferença é simples:/.test(s), rotulo + ': linha sem marcador não ganha `•`');
}

// Contra-exemplos: nao sao lista e tem de sobreviver intactos (falso positivo e o
// risco real desta tarefa). Testados linha a linha para o diagnostico ser preciso.
const CONTRA = [
  ['2 * 3 = 6 é a conta.', '2 * 3 = 6 é a conta.', 'multiplicação `2 * 3` em início de linha'],
  ['-5 graus é frio demais.', '-5 graus é frio demais.', 'número negativo `-5` em início de linha'],
  ['+55 11 90000-0000 é o telefone.', '+55 11 90000-0000 é o telefone.', 'DDI `+55` em início de linha'],
  ['— Bom dia, disse ela.', '— Bom dia, disse ela.', 'travessão de diálogo'],
  ['3 - 1 = 2, simples assim.', '3 - 1 = 2, simples assim.', 'subtração com hífen cercado de espaços'],
  ['Isso é *importante* mesmo.', 'Isso é importante mesmo.', '*ênfase* no meio da frase (perde o `*`, não vira item)'],
  ['*ênfase* no início da linha vale igual.', 'ênfase no início da linha vale igual.', '*ênfase* colada no início da linha'],
  ['-', '-', 'marcador sozinho, sem conteúdo, não vira item'],
];

for (const no of ['Formatar Dúvida', 'Parse Professor']) {
  const rotulo = no === 'Formatar Dúvida' ? 'dúvida' : 'correção';
  const saida = no === 'Formatar Dúvida'
    ? String(run('Formatar Dúvida', { refs: {}, item: { output: BULLETS } }).finalText || '')
    : String(parse('wrong', BULLETS, FB_WRONG).finalText || '');
  conferBullets(saida, rotulo);
  for (const [entrada, esperado, desc] of CONTRA) {
    const got = no === 'Formatar Dúvida'
      ? String(run('Formatar Dúvida', { refs: {}, item: { output: entrada } }).finalText || '')
      : String(parse('wrong', entrada, FB_WRONG).finalText || '');
    ok(got.includes(esperado) && !got.includes('•'),
      rotulo + ': sobrevive intacto — ' + desc + (got.includes(esperado) ? '' : ' [recebeu: ' + got.replace(/\n/g, '\\n') + ']'));
  }
}

// cadeia real da duvida: Filtro Anti-Spoiler -> Formatar Dúvida
{
  const fasB = run('Filtro Anti-Spoiler', {
    refs: { 'Professor Engine': { teacher_state_new: { answer: 'playing', q_answered: true } } },
    item: { output: BULLETS },
  });
  conferBullets(String(run('Formatar Dúvida', { refs: {}, item: fasB }).finalText || ''), 'dúvida (cadeia)');
}

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
