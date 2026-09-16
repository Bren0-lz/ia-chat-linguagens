// E003 — os textos e os botoes que o participante do EVENTO le.
//
// No evento nao existe teste de nivelamento: o participante escolhe o proprio nivel. Tudo o que
// a interface diz sobre "teste de 10 questoes", "resultado" e "gabarito" passou a ser mentira —
// e mentira lida por usuario real, de pe num evento, minutos antes de responder um formulario.
// Este teste julga cinco coisas, lendo o JSON do fluxo e RODANDO os nos de codigo:
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
//       conjunto valido, teclado em duas colunas e rotulos que situam quem nao conhece o CEFR;
//   (e) E015 — o texto ESTATICO (text + rotulos) de TODOS os nos Telegram nao promete o teste de
//       nivelamento: nem "teste", "refazer", "resultado", /pausa, /continuar; e fora do modo
//       Professor, nem "questoes", "acertos", "gabarito". Contra o arquivo anterior reprova na
//       tela de modos e no /menu ("/nivel — refazer o teste").
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

// ---------------- (e) o texto ESTATICO de TODOS os nos Telegram ----------------
// E015: a tela de modos (`Enviar Explicação Modos`) e o `/menu` (`Enviar Menu`) ainda diziam
// "/nivel — refazer o teste" e anunciavam "/pausa e /continuar ... durante o teste". Esse texto
// mora na expressao inline do no Telegram (armadilha no 14): nenhuma execucao o mostra. Por isso a
// varredura le o JSON de TODOS os nos Telegram — nao de uma lista escolhida a mao.
//
// O que se julga em cada no: o `text` e os rotulos dos botoes, SO a parte estatica. Dentro de
// `{{ }}` o que chega ao aluno sao os literais de string; referencias `$('Nome do No')` sao codigo,
// nao texto (sem isso, um `$('Dividir Gabarito')` seria acusado de prometer gabarito — nº 18).
//
// Decisoes DECLARADAS, para nao virar falso vermelho ao ampliar o escopo (nº 18). A lista abaixo
// e a MESMA `PROMESSAS` de (a)–(d) menos UMA palavra, mais o que so aparece em texto de no
// Telegram (nivelamento, prova, refazer, /pausa, /continuar e os botoes de pausa com emoji). Cada
// exclusao cita o texto legitimo que ela protege:
//   1. "correcao"/"corrig" FICA DE FORA — protege a tela de modos (`Enviar Explicação Modos`):
//      "Eu corrijo seus errinhos no meio do papo" (Conversa) e "com correção e explicação"
//      (Professor). E a unica palavra da `PROMESSAS` que nao entra aqui;
//   2. negacao colada de teste/prova ("não é prova", "não é um teste", "não tem teste") e removida
//      antes do julgamento — protege o convite de nivel da `Etapa de Cadastro` ("Não é prova —
//      vale a sua percepção"). "teste" solto continua reprovando;
//   3. os nos do MODO PROFESSOR, que tem exercicios de verdade, podem falar de "questão/questões",
//      contagem de questoes, "acertos" e "gabarito" — protege o botao "▶️ Começar questões" do
//      `Enviar Explicacao Prof`. Continuam proibidos ali: teste, nivelamento, prova, resultado,
//      refazer, avaliar, nota, ajuda externa, /pausa, /continuar e os botoes de pausa. Lista
//      fechada, cobra existencia;
//   4. os botoes "⏸️ Pausar" e "▶️ Continuar" sao julgados COM o emoji — protege o "E aí, como
//      você quer continuar? 👇" do `Enviar Menu` e do `Enviar Resultado Menu`. Eles so sao
//      tolerados nos tres nos do MOTOR DE TESTE (`Enviar Questão MC`, `Enviar Questão Escrita`,
//      `Enviar Pausa`): a E004 manteve o motor no `Placement Engine`, nenhum comando do evento
//      chega nele (guardado por `testa_rotas_sem_teste_evento.js`) e so o alcanca quem ja tinha
//      `placement_state` em andamento no banco — para esse aluno o botao e verdadeiro. Lista
//      fechada, cobra existencia, e vale SO para a regra dos botoes.
const PROMESSAS_NIVELAMENTO = [
  [/\bteste\b|\btestes\b/i, '"teste"', 'sempre'],
  [/nivelamento/i, '"nivelamento"', 'sempre'],
  [/\bprova\b/i, '"prova"', 'sempre'],
  [/\bresultado/i, '"resultado"', 'sempre'],
  [/refazer/i, '"refazer" (refazer o teste)', 'sempre'],
  [/avali(ar|a[çc][ãa]o)/i, '"avaliar"/"avaliacao"', 'sempre'],
  [/\bnota\b/i, '"nota"', 'sempre'],
  [/ajuda externa/i, '"ajuda externa" (regra de prova)', 'sempre'],
  [/\/pausa\b/i, 'o comando /pausa (pausar o teste)', 'sempre'],
  [/\/continuar\b/i, 'o comando /continuar (retomar o teste)', 'sempre'],
  [/⏸️?\s*Pausar/, 'o botao "⏸️ Pausar" (pausar o teste)', 'fora_motor'],
  [/▶️?\s*Continuar/, 'o botao "▶️ Continuar" (retomar o teste)', 'fora_motor'],
  [/quest(ã|a)o|quest(õ|o)es/i, '"questao"/"questoes"', 'fora_professor'],
  [/\d+\s*quest/i, 'contagem de questoes', 'fora_professor'],
  [/acertos?\b/i, '"acertos"', 'fora_professor'],
  [/gabarito/i, '"gabarito"', 'fora_professor'],
];
const NOS_DO_PROFESSOR = ['Enviar Explicacao Prof', 'Enviar Questão Professor', 'Enviar Correção',
                          'Enviar Dúvida', 'Enviar Peça Resposta', 'Enviar Cabeçalho Tópico'];
const NOS_DO_MOTOR_DE_TESTE = ['Enviar Questão MC', 'Enviar Questão Escrita', 'Enviar Pausa'];
function isenta(par, nome) {
  return (par[2] === 'fora_professor' && NOS_DO_PROFESSOR.indexOf(nome) >= 0) ||
         (par[2] === 'fora_motor' && NOS_DO_MOTOR_DE_TESTE.indexOf(nome) >= 0);
}
const NEGACAO = /n(ã|a)o\s+(é|e|tem|há|ha)\s+(um\s+|uma\s+)?(teste|prova)\b/gi;

function textoEstatico(v) {
  let s = String(v == null ? '' : v);
  if (s[0] !== '=') return s;
  s = s.slice(1);
  const literais = [];
  const fora = s.replace(/\{\{([\s\S]*?)\}\}/g, (m, expr) => {
    const semRef = expr.replace(/\$\(\s*(['"])(?:(?!\1).)*\1\s*\)/g, '');
    const re = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;
    let x;
    while ((x = re.exec(semRef))) literais.push(x[1] !== undefined ? x[1] : x[2]);
    return ' ';
  });
  return fora + ' ' + literais.join(' ');
}

console.log('\n== (e) texto estatico de TODOS os nos Telegram (lido do JSON, armadilha no 14) ==');
const telegram = flow.nodes.filter(n => n.type === 'n8n-nodes-base.telegram');
ok(telegram.length >= 30, 'a varredura pega os nos Telegram do arquivo (achou ' + telegram.length + ')');
for (const nome of NOS_DO_PROFESSOR) {
  const n = no(nome);
  ok(!!n && n.type === 'n8n-nodes-base.telegram', 'excecao declarada do Professor existe e e Telegram: "' + nome + '"');
}
for (const nome of NOS_DO_MOTOR_DE_TESTE) {
  const n = no(nome);
  ok(!!n && n.type === 'n8n-nodes-base.telegram', 'excecao declarada do motor de teste existe e e Telegram: "' + nome + '"');
}
let julgados = 0;
for (const n of telegram) {
  const p = n.parameters || {};
  const partes = [textoEstatico(p.text)];
  const rows = (p.inlineKeyboard && p.inlineKeyboard.rows) || [];
  for (const r of rows) for (const b of ((r.row && r.row.buttons) || [])) partes.push(textoEstatico(b.text));
  const texto = partes.join('\n').replace(NEGACAO, ' ');
  if (!texto.trim()) continue;
  julgados++;
  const achados = [];
  for (const par of PROMESSAS_NIVELAMENTO) {
    if (isenta(par, n.name)) continue;
    const m = texto.match(par[0]);
    if (m) {
      const i = texto.search(par[0]);
      achados.push(par[1] + ' em ' + JSON.stringify(texto.slice(Math.max(0, i - 30), i + 40)));
    }
  }
  ok(achados.length === 0, '"' + n.name + '": nao promete teste de nivelamento' +
     (achados.length ? ' — ' + achados.join('; ') : ''));
}
ok(julgados >= 15, 'julgou texto estatico em pelo menos 15 nos (julgou ' + julgados + ')');

// Autoteste do detector nas duas direcoes: o texto antigo da tela de modos TEM de reprovar, e as
// frases legitimas (negacao, descricao do Professor com questoes/correcao) TEM de passar.
function acusa(texto, nome) {
  const t = textoEstatico(texto).replace(NEGACAO, ' ');
  return PROMESSAS_NIVELAMENTO.some(par => !isenta(par, nome || '') && par[0].test(t));
}
const PROF = 'Enviar Explicacao Prof';
ok(acusa('/nivel — refazer o teste de nível'), 'autoteste: acusa "/nivel — refazer o teste de nível"');
ok(acusa('/pausa e /continuar — pausar e retomar durante o teste'), 'autoteste: acusa a linha de /pausa e /continuar');
ok(acusa('={{ 1 }}Comandos:\n/nivel — refazer o teste'), 'autoteste: acusa texto estatico depois de uma expressao');
ok(acusa("={{ $json.x ? 'Seu resultado' : '' }}"), 'autoteste: acusa literal de string dentro da expressao');
ok(acusa('Isso é um teste rápido'), 'autoteste: "teste" sem negacao colada continua acusado');
ok(!acusa('Não é prova — vale a sua percepção'), 'autoteste: nao acusa "Não é prova"');
ok(!acusa('Isso não é um teste 🙂'), 'autoteste: nao acusa "não é um teste"');
ok(!acusa("={{ $('Dividir Gabarito').first().json.x }}"), 'autoteste: nao acusa nome de no referenciado');
ok(!acusa('📚 Professor — exercícios com correção e explicação. Eu corrijo seus errinhos'), 'autoteste: nao acusa a descricao de correcao');
ok(!acusa('▶️ Começar questões', PROF), 'autoteste: nao acusa "Começar questões" num no do Professor');
ok(acusa('▶️ Começar questões'), 'autoteste: "questões" fora do Professor e acusado');
ok(acusa('Questões do teste', PROF), 'autoteste: "teste" num no do Professor continua acusado');
// o que a primeira versao da (e) tinha tirado sem motivo declarado — nas duas direcoes
ok(acusa('Vou avaliar seu inglês com 10 perguntas'), 'autoteste: acusa "avaliar"');
ok(acusa('Faça a avaliação agora'), 'autoteste: acusa "avaliação"');
ok(acusa('Ao final você vê sua nota'), 'autoteste: acusa "nota"');
ok(acusa('Responda sem ajuda externa'), 'autoteste: acusa "ajuda externa"');
ok(acusa('São 10 questões rápidas'), 'autoteste: acusa contagem de questoes');
ok(/\d+\s*quest/i.test('10 questões') && !/quest(ã|a)o|quest(õ|o)es/i.test('10 quest.'), 'autoteste: a regra de contagem acusa sozinha o que a de "questoes" nao pega ("10 quest.")');
ok(acusa('10 quest.'), 'autoteste: acusa contagem abreviada "10 quest."');
ok(acusa('Ao final você vê sua nota', PROF), 'autoteste: "nota" num no do Professor continua acusado');
ok(acusa('Vou avaliar seu inglês', 'Enviar Correção'), 'autoteste: "avaliar" num no do Professor continua acusado');
ok(acusa('Sem ajuda externa', PROF), 'autoteste: "ajuda externa" num no do Professor continua acusado');
ok(!acusa('🎯 Nível anotado: B1'), 'autoteste: nao acusa "anotado" ("nota" so como palavra inteira)');
ok(!acusa('Faça 5 exercícios'), 'autoteste: nao acusa contagem de exercicios');
ok(!acusa('5 questões seguidas', 'Enviar Questão Professor'), 'autoteste: nao acusa contagem de questoes num no do Professor');
// os botoes de pausa do teste, com emoji
ok(acusa('⏸️ Pausar'), 'autoteste: acusa o botao "⏸️ Pausar" fora do motor de teste');
ok(acusa('▶️ Continuar'), 'autoteste: acusa o botao "▶️ Continuar" fora do motor de teste');
ok(acusa('⏸ Pausar'), 'autoteste: acusa "⏸ Pausar" sem o seletor de variacao U+FE0F');
ok(acusa('▶️ Continuar', PROF), 'autoteste: "▶️ Continuar" num no do Professor continua acusado');
ok(!acusa('E aí, como você quer continuar? 👇'), 'autoteste: nao acusa "quer continuar" (Enviar Menu / Enviar Resultado Menu)');
ok(!acusa('Pode pausar quando quiser e continuar depois'), 'autoteste: nao acusa pausar/continuar sem o emoji do botao');
ok(!acusa('⏸️ Pausar', 'Enviar Questão MC'), 'autoteste: nao acusa "⏸️ Pausar" no motor de teste (excecao declarada)');
ok(!acusa('▶️ Continuar', 'Enviar Pausa'), 'autoteste: nao acusa "▶️ Continuar" no motor de teste (excecao declarada)');
ok(acusa('Teste pausado', 'Enviar Pausa'), 'autoteste: a excecao do motor vale so para os botoes ("teste" continua acusado)');

fim();
