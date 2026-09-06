// Regressao offline do contrato de idioma da TRILHA (T013) — o que o T3 da Fase B julga.
//
// Reprova a versao anterior: a regua antiga do T3 era `!temPortugues(explicacao)`, isto e,
// "explicacao de B2 sem portugues". Este arquivo roda a regua antiga LADO A LADO com a nova
// sobre as mesmas fixtures e exige que ela erre — se um dia as duas concordarem, ou o produto
// voltou atras ou alguem cravou a politica de novo, e nos dois casos o teste tem de gritar.
//
//   node fluxos/_teststand/testa_idioma_professor.js [fluxo.json]

const path = require('path');
const {
  contratoIdioma, classificaDiretivaPergunta, temPortugues, vereditoT3,
} = require('./idioma_professor');

const FLUXO = process.argv[2] ? path.resolve(process.argv[2]) : undefined;

let fails = 0;
function ok(nome, cond, detalhe) {
  console.log((cond ? '  . ' : '  X ') + nome + (detalhe ? '  — ' + detalhe : ''));
  if (!cond) fails++;
}

// ------------------------------------------------------------------ fixtures
// B2 no estado alvo do T005b: explicacao em portugues, enunciado da questao em ingles.
const EXPL_PT = 'Vamos falar do present perfect. Você usa essa forma para algo que começou no '
  + 'passado e continua agora. A estrutura é have/has + past participle, e não muda com o sujeito '
  + 'que você escolher.';
const EXPL_EN = 'Let us look at the present perfect. It links a past action to the present moment, '
  + 'and the structure is have or has plus the past participle of the main verb.';
const PERG_EN = 'Complete the sentence: I ____ (live) here since 2019.';
const PERG_PT = 'Complete a frase: I ____ (live) here desde 2019, com o verbo no tempo certo.';

const contrato = contratoIdioma(FLUXO);

console.log('CONTRATO DE IDIOMA DA TRILHA (derivado do LANG do "Professor Engine")');
for (const n of Object.keys(contrato)) {
  console.log('  ' + n + ': explicacao=' + contrato[n].explicacao + ' pergunta=' + contrato[n].pergunta);
}

console.log('\n1) o contrato bate com o estado alvo do T005b');
for (const n of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
  ok(n + ' explica em PT', contrato[n] && contrato[n].explicacao === 'pt',
    'lido: ' + (contrato[n] || {}).explicacao);
}
ok('A1 enuncia em PT', contrato.A1.pergunta === 'pt', 'lido: ' + contrato.A1.pergunta);
ok('A2 enuncia em PT', contrato.A2.pergunta === 'pt', 'lido: ' + contrato.A2.pergunta);
for (const n of ['B1', 'B2', 'C1', 'C2']) {
  ok(n + ' enuncia em EN', contrato[n].pergunta === 'en', 'lido: ' + contrato[n].pergunta);
}

console.log('\n2) o veredito do T3 (B2)');
const alvo = vereditoT3('B2', EXPL_PT, PERG_EN, contrato);
ok('explicacao PT + enunciado EN -> APROVA', alvo.ok === true, alvo.detalhe);

const inverso = vereditoT3('B2', EXPL_EN, PERG_PT, contrato);
ok('explicacao EN + enunciado PT -> REPROVA', inverso.ok === false, inverso.detalhe);

const soExpl = vereditoT3('B2', EXPL_EN, PERG_EN, contrato);
ok('explicacao EN (sozinha) -> REPROVA', soExpl.ok === false, soExpl.detalhe);

const soPerg = vereditoT3('B2', EXPL_PT, PERG_PT, contrato);
ok('enunciado PT (sozinho) -> REPROVA', soPerg.ok === false, soPerg.detalhe);

const vazio = vereditoT3('B2', EXPL_PT, '', contrato);
ok('enunciado nao capturado -> INCONCLUSIVO, nunca aprovacao', vazio.ok === null, vazio.detalhe);

console.log('\n3) a regua ANTIGA erra nas mesmas fixtures (prova de que o teste mudou de veredito)');
const antigaNoAlvo = !temPortugues(EXPL_PT);           // era o `reg('T3', !pt, ...)`
const antigaNoInverso = !temPortugues(EXPL_EN);
ok('regua antiga REPROVAVA o estado alvo (falso vermelho)', antigaNoAlvo === false,
  'antiga=' + antigaNoAlvo + ' nova=' + alvo.ok);
ok('regua antiga APROVAVA a explicacao em ingles (falso verde)', antigaNoInverso === true,
  'antiga=' + antigaNoInverso + ' nova=' + inverso.ok);

console.log('\n4) a politica NAO pode estar cravada: mutar o LANG tem de mudar o veredito');
// Se alguem trocar a derivacao por um mapa fixo, esta asserção continua verde no fluxo real mas
// quebra aqui: o classificador recebe uma diretiva sintetica e tem de obedecer a ELA.
ok('LANG sintetico "explicacao em ingles" -> en',
  require('../../conteudo/valida_explicacoes.js').classificaDiretiva('X',
    'Escreva a EXPLICAÇÃO INTEIRAMENTE em inglês, SEM português. As PERGUNTAS ficam em inglês.') === 'en');
ok('LANG sintetico "enunciado em portugues" -> pt',
  classificaDiretivaPergunta('X',
    'Escreva a EXPLICAÇÃO em português. As PERGUNTAS devem ter enunciado em português e resposta curta em inglês.') === 'pt');
ok('LANG sintetico "perguntas INTEIRAMENTE em ingles" -> en',
  classificaDiretivaPergunta('X',
    'Escreva a EXPLICAÇÃO em português. As PERGUNTAS são escritas INTEIRAMENTE em inglês, enunciado e resposta.') === 'en');
let estourou = false;
try { classificaDiretivaPergunta('X', 'Escreva a EXPLICAÇÃO em português e pronto.'); }
catch (e) { estourou = true; }
ok('LANG sem diretiva de PERGUNTAS -> estoura, nao chuta', estourou);

console.log(fails ? '\nREPROVOU: ' + fails + ' asserção(oes)' : '\nPASSOU: contrato de idioma da trilha');
process.exit(fails ? 1 : 0);
