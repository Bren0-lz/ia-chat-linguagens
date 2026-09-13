// E003 — os textos e os botoes que o participante do EVENTO le.
//
// No evento nao existe teste de nivelamento: o participante escolhe o proprio nivel. Tudo o que
// a interface diz sobre "teste de 10 questoes", "resultado" e "gabarito" passou a ser mentira —
// e mentira lida por usuario real, de pe num evento, minutos antes de responder um formulario.
// Este teste julga quatro coisas, lendo o JSON do fluxo e RODANDO os nos de codigo:
//
//   (a) `Etapa de Cadastro`  — o convite para escolher o nivel nao promete teste/questoes,
//       diz que vale a percepcao do aluno e que da pra trocar depois, e nao e vazio;
//   (b) `Enviar Pergunta Persona` — a abertura nao fala de "resultado" nem de "gabarito".
//       ATENCAO (armadilha no 14): esse texto mora na EXPRESSAO INLINE do no Telegram e e
//       invisivel ao `digest()`. Por isso ele e lido do JSON, nunca de uma execucao;
//   (c) o texto do atalho — roda o `Placement Engine` + o `Dividir Gabarito` DE VERDADE, nos
//       seis niveis, e exige que a mensagem que sai cite o nivel escolhido e NAO caia no
//       "Gabarito indisponivel." (a guarda do `Dividir Gabarito` quando `gabarito` vem vazio);
//   (d) `Enviar Pergunta Nivel` — os SEIS callbacks `pl_start_*`, distintos, nenhum fora do
//       conjunto valido, teclado em duas colunas e rotulos que situam quem nao conhece o CEFR.
//
// Contra o `IAChat_Telegram_v8.json` ele tem de REPROVAR: la o texto promete o teste de 10
// questoes, a persona abre com "Esse e o seu resultado!" e so existem quatro botoes.
//
// Roda offline: so le o JSON e executa jsCode fora do n8n.
// Uso:  node fluxos/_teststand/testa_textos_evento.js [caminho/do/fluxo.json]
const fs = require('fs');
const path = require('path');

const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_evento.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));
const no = (nome) => flow.nodes.find(n => n.name === nome);
const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  x ' + msg); } else console.log('  ok ' + msg); }
function fim() {
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)'
    : 'PASSOU: os textos e os botoes do evento nao prometem teste nem resultado'));
  process.exit(fails ? 1 : 0);
}

console.log('Fluxo sob teste: ' + path.basename(FLOW));
for (const nome of ['Etapa de Cadastro', 'Placement Engine', 'Dividir Gabarito'])
  ok(!!code[nome], 'o fluxo tem o no de codigo "' + nome + '"');
for (const nome of ['Enviar Pergunta Persona', 'Enviar Pergunta Nível'])
  ok(!!no(nome), 'o fluxo tem o no "' + nome + '"');
if (fails) fim();

// O que NAO pode aparecer em texto de escolha de nivel no evento: nao ha teste.
const PROMESSAS = [
  [/\bteste\b/i, 'a palavra "teste"'],
  [/quest(ã|a)o|quest(õ|o)es/i, '"questao"/"questoes"'],
  [/\d+\s*quest/i, 'contagem de questoes'],
  [/avali(ar|a[çc][ãa]o)/i, '"avaliar"/"avaliacao"'],
  [/ajuda externa/i, '"ajuda externa" (regra de prova)'],
  [/acertos?\b/i, '"acertos"'],
  [/corrig|corre[çc][ãa]o/i, 'promessa de correcao'],
  [/gabarito/i, '"gabarito"'],
  [/\bnota\b/i, '"nota"'],
  [/\bresultado/i, '"resultado"'],
];
function semPromessa(texto, onde) {
  for (const par of PROMESSAS)
    ok(!par[0].test(texto), onde + ': nao promete ' + par[1]);
}

// ---------------- (a) Etapa de Cadastro ----------------
console.log('\n== (a) o convite para escolher o nivel ==');
function rodaCadastro(d) {
  const $input = { item: { json: d } };
  const fn = new Function('$', '$input', '$json', code['Etapa de Cadastro'] + '\n');
  return fn(undefined, $input, d).json;
}
// Os dois estados em que o fluxo manda a escolha de nivel: depois da idade, e o ramo de
// retomada (onboarding ja em placement_intro).
const ESTADOS = [
  ['depois da idade', { userId: 990123456, onboarding: 'awaiting_age', text: '24' }],
  ['retomada em placement_intro', { userId: 990123456, onboarding: 'placement_intro', text: 'oi' }],
];
for (const par of ESTADOS) {
  const nome = par[0];
  const r = rodaCadastro(par[1]);
  const reply = String(r.reply || '');
  ok(r.sendKind === 'level_pick', nome + ': sendKind e "level_pick" (foi "' + r.sendKind + '")');
  ok(reply.trim().length > 0, nome + ': o texto nao e vazio (armadilha no 1)');
  ok(reply.length >= 40, nome + ': o texto tem corpo (>=40 chars, foi ' + reply.length + ')');
  semPromessa(reply, nome);
  ok(/ingl(ê|e)s/i.test(reply), nome + ': convida a se situar no ingles');
  ok(/percep[çc]|parece com voc/i.test(reply), nome + ': deixa claro que e a percepcao dele');
  ok(/troc(ar|a)\b/i.test(reply), nome + ': diz que da pra trocar depois');
}

// ---------------- (b) abertura da persona ----------------
console.log('\n== (b) a abertura da escolha de personalidade (lida do JSON, armadilha no 14) ==');
const persona = no('Enviar Pergunta Persona');
const txtPersona = String((persona.parameters && persona.parameters.text) || '');
ok(txtPersona.trim().length > 0, 'o texto da persona nao e vazio');
const abertura = txtPersona.split('\n')[0];
ok(!/\bresultado/i.test(txtPersona), 'a abertura nao fala de "resultado" (nao houve teste)');
ok(!/gabarito/i.test(txtPersona), 'a abertura nao fala de "gabarito"');
ok(!/\bteste\b/i.test(txtPersona), 'a abertura nao fala de "teste"');
ok(!/quest(ã|a)o|quest(õ|o)es/i.test(txtPersona), 'a abertura nao fala de questoes');
ok(/n(í|i)vel/i.test(abertura), 'a abertura liga a escolha de nivel a de personalidade (cita o nivel): ' + JSON.stringify(abertura));
ok(/personalidade/i.test(txtPersona), 'o texto pede a escolha da personalidade');

// ---------------- (d) os seis botoes de nivel ----------------
console.log('\n== (d) os seis niveis, teclado em duas colunas ==');
const VALIDOS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(L => 'pl_start_' + L);
const nivel = no('Enviar Pergunta Nível');
const rows = (nivel.parameters && nivel.parameters.inlineKeyboard && nivel.parameters.inlineKeyboard.rows) || [];
const botoes = [];
for (const r of rows) for (const b of ((r.row && r.row.buttons) || [])) botoes.push(b);
const cbs = botoes.map(b => String((b.additionalFields || {}).callback_data || ''));
ok(cbs.length === 6, 'o teclado tem 6 botoes (tem ' + cbs.length + ')');
ok(new Set(cbs).size === cbs.length, 'nenhum callback duplicado');
for (const v of VALIDOS) ok(cbs.indexOf(v) >= 0, 'o callback ' + v + ' esta presente');
for (const c of cbs) ok(VALIDOS.indexOf(c) >= 0, 'nenhum callback fora do conjunto valido (' + JSON.stringify(c) + ')');
ok(rows.length === 3, 'duas colunas: 6 botoes em 3 linhas (tem ' + rows.length + ' linha(s))');
for (let i = 0; i < rows.length; i++) {
  const n = ((rows[i].row && rows[i].row.buttons) || []).length;
  ok(n === 2, 'linha ' + (i + 1) + ' tem 2 botoes (tem ' + n + ')');
}
for (const b of botoes) {
  const rot = String(b.text || '');
  const cb = String((b.additionalFields || {}).callback_data || '');
  const L = cb.replace('pl_start_', '');
  ok(rot.trim().length > 0, 'rotulo de ' + cb + ' nao e vazio');
  ok(rot.indexOf(L) >= 0, 'rotulo de ' + cb + ' mostra o codigo CEFR "' + L + '": ' + JSON.stringify(rot));
  // situa quem nao conhece o CEFR: tem texto em portugues ao lado do codigo
  ok(/[a-zà-ÿ]{3,}/i.test(rot.replace(L, '')), 'rotulo de ' + cb + ' explica o nivel em palavras');
  ok(rot.length <= 28, 'rotulo de ' + cb + ' cabe no celular (<=28 chars, tem ' + rot.length + ')');
  semPromessa(rot, 'rotulo de ' + cb);
}

// ---------------- (c) a confirmacao do atalho, rodando os nos de verdade ----------------
console.log('\n== (c) a confirmacao que o participante recebe apos escolher o nivel ==');
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const exam = [];
let id = 1;
for (const L of LEVELS) for (let i = 0; i < 10; i++)
  exam.push({ id: id++, cefr_level: L, skill: 'grammar', qtype: i % 2 ? 'written' : 'mc',
    prompt: L + ' q' + i, options: i % 2 ? null : ['am', 'is', 'are', 'be'],
    answer: i % 2 ? 'are' : 'is', explanation: 'exp' });

function refFn(refs) {
  return (name) => ({
    first: () => ({ json: refs[name] }),
    all: () => (Array.isArray(refs[name]) ? refs[name] : [refs[name]]).map(j => ({ json: j })),
  });
}
function rodaPlacement(callbackData) {
  const rm = { userId: 990123456, subroute: 'start', placement_state: null, profile: {}, text: '', callbackData: callbackData };
  const $ = refFn({ 'Roteador Mestre': rm });
  const $input = { item: { json: exam[0] }, all: () => exam.map(j => ({ json: j })) };
  return new Function('$', '$input', '$json', code['Placement Engine'] + '\n')($, $input, exam[0]).json;
}
function rodaDivideGabarito(saidaPlacement) {
  const $ = refFn({ 'Placement Engine': saidaPlacement, 'Normalizar': { chatId: 990123456 } });
  const $input = { item: { json: saidaPlacement }, all: () => [{ json: saidaPlacement }] };
  const itens = new Function('$', '$input', '$json', code['Dividir Gabarito'] + '\n')($, $input, saidaPlacement);
  return itens.map(x => x.json.messageText).join('\n');
}
for (const L of LEVELS) {
  const r = rodaPlacement('pl_start_' + L);
  const msg = rodaDivideGabarito(r);
  ok(msg.trim().length > 0, L + ': a confirmacao nao e vazia');
  ok(msg.indexOf('Gabarito indispon') < 0, L + ': NAO cai no "Gabarito indisponivel." ' + JSON.stringify(msg.slice(0, 60)));
  ok(msg.indexOf(L) >= 0, L + ': a confirmacao cita o nivel escolhido');
  for (const outro of LEVELS) if (outro !== L)
    ok(msg.indexOf(outro) < 0, L + ': a confirmacao nao cita o nivel ' + outro);
  ok(/personalidade|assuntos|praticar/i.test(msg), L + ': diz o que acontece agora');
  semPromessa(msg.replace(/^🎯 /, ''), L + ': confirmacao');
  ok(!/Quest(ã|a)o\s*\d+\s*\/\s*\d+/i.test(String(r.text || '') + msg), L + ': nenhuma questao no que o aluno recebe');
}

fim();
