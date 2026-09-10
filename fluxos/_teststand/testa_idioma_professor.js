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

// ---------------------------------------------------------------------------
// O CABECALHO DE INTERFACE NAO E ENUNCIADO (achado em 10/09)
//
// O `Parse Professor` concatena o feedback do engine a questao. Esse feedback e
// portugues POR DESENHO, em todos os niveis -- e interface, nao enunciado.
// Julgando o texto inteiro, o T3 acusava "enunciado em portugues" em B2 com o
// enunciado impecavel em ingles: falso vermelho 3/3, publicado no relatorio do v8
// como se fosse regressao do produto. Armadilha nº 13: julgar a string errada.
const { soEnunciado } = require('./idioma_professor.js');

// texto REAL capturado da exec 3930 (v8, B2)
const REAL_B2 = '▶️ Questões de “Present perfect continuous”. Acerte 5 seguidas para liberar'
  + ' o próximo tópico! (sequência atual: 0/5)\n\n❓ Complete the sentence: I have been studying ___ two hours.';

ok('soEnunciado descarta o cabecalho do quiz',
  !/Acerte 5 seguidas/.test(soEnunciado(REAL_B2)));
ok('soEnunciado preserva o enunciado',
  /Complete the sentence/.test(soEnunciado(REAL_B2)));
ok('B2 com enunciado EN + cabecalho PT -> APROVA (era o falso vermelho)',
  vereditoT3('B2', 'Explicação em português, com você e não para acionar o detector.', REAL_B2, contrato).ok === true);

// A contraprova: enunciado REALMENTE em portugues continua reprovando. Sem isto o
// conserto viraria carimbo -- que foi o erro cometido na tentativa 2 do T005c.
const RUIM_B2 = '▶️ Questões de “X”. Acerte 5 seguidas para liberar o próximo tópico!'
  + '\n\n❓ Complete a frase: eu tenho estudado ___ duas horas, e você não parou.';
ok('B2 com enunciado em PT -> REPROVA (o conserto nao virou carimbo)',
  vereditoT3('B2', 'Explicação em português com você e não.', RUIM_B2, contrato).ok === false);

// A1 manda enunciado em PT: o mesmo cabecalho nao pode fazer o A1 reprovar nem aprovar por engano
ok('A1 com enunciado em PT -> APROVA',
  vereditoT3('A1', 'Explicação em português com você e não.',
    '▶️ Questões de “Cumprimentos”. Acerte 5 seguidas!\n\n❓ Como você diz "oi" em inglês?', contrato).ok === true);

ok('so cabecalho, sem enunciado -> INCONCLUSIVO, nunca aprovacao',
  vereditoT3('B2', 'Explicação em português com você e não.',
    '▶️ Questões de “X”. Acerte 5 seguidas para liberar o próximo tópico!', contrato).ok === null);

console.log(fails ? '\nREPROVOU: ' + fails + ' asserção(oes)' : '\nPASSOU: contrato de idioma da trilha');
process.exit(fails ? 1 : 0);
