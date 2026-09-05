// Prova que o validador do T005 reprova de verdade, e que a bomba-relogio do T006 fechou.
//
// Uso:  node conteudo/testa_valida_explicacoes.js
//
// Tres blocos:
//   1. FIXTURES  — `conteudo/_fixtures_explicacoes/<caso>/<NIVEL>/<arquivo>.md`, um caso por
//      classe de defeito. Cada caso declara o CODIGO que espera: fixture que reprova pelo
//      motivo errado nao vale como prova (o instrumento pode estar julgando a string errada,
//      handoff sec.6 nº13). O caso `ok-b1-ingles` tem de PASSAR — sem ele, um validador que
//      reprova tudo passaria neste teste.
//   2. IDIOMA VEM DO FLUXO — a expectativa de lingua e derivada do `const LANG` do no
//      "Professor Engine", nao cravada aqui. O teste inverte a diretiva e confere que a
//      derivacao acompanha.
//   3. GABARITO — vazar e entregar o ITEM ESPECIFICO da questao, nao usar o vocabulario do
//      topico. Os dois lados sao testados: a explicacao que reproduz o enunciado resolvido
//      reprova; a que fala da mesma materia com as mesmas palavras passa.
//   4. BOMBA DO T006 — .md truncado no disco: o gerador NAO pode pula-lo, e a gravacao tem
//      de ser atomica (se o rename falhar, o destino nao existe).

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  validaArquivo, contexto, listaMd, idiomaPorNivel, classificaDiretiva, achaVazamentos,
  DIR_CONTEUDO
} = require('./valida_explicacoes.js');
const { gravaAtomico, precisaGerar } = require('./gerar_explicacoes.js');

const RAIZ = path.join(__dirname, '..');
const DIR_FIX = path.join(__dirname, '_fixtures_explicacoes');
const PILOTO = path.join(DIR_CONTEUDO, 'A1', '01-cumprimentos.md');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  x ' + msg); } else console.log('  . ' + msg); }

const ctx = contexto();

// ---------------------------------------------------------------- 1. fixtures
// caso -> codigo que DEVE aparecer entre os problemas; null = tem de passar limpo.
const CASOS = {
  'ok-b1-ingles': null,
  'frontmatter-incompleto': 'FRONTMATTER',
  'slug-divergente': 'SLUG',
  'corpo-truncado': 'FRONTMATTER',
  'corpo-curto': 'TAMANHO',
  'markdown': 'HTML_MARKDOWN',
  'tag-desbalanceada': 'HTML_TAG',
  'e-comercial': 'HTML_AMP',
  'sem-erro-comum': 'ERRO_COMUM',
  'idioma-a1-em-ingles': 'IDIOMA',
  'idioma-b1-em-portugues': 'IDIOMA',
  'vaza-gabarito': 'GABARITO',
  'nao-vaza-mesmo-assunto': null
};

console.log('== 1. Piloto e fixtures ==');
const r0 = validaArquivo(PILOTO, ctx);
ok(r0.problemas.length === 0, 'piloto A1/01 aprovado' +
  (r0.problemas.length ? ': ' + r0.problemas.map((p) => '[' + p.codigo + '] ' + p.msg).join(' · ') : ''));

const casosNoDisco = fs.readdirSync(DIR_FIX, { withFileTypes: true })
  .filter((e) => e.isDirectory()).map((e) => e.name).sort();
ok(casosNoDisco.join(',') === Object.keys(CASOS).sort().join(','),
  'todo caso no disco esta declarado no teste (disco: ' + casosNoDisco.join(' ') + ')');

for (const caso of Object.keys(CASOS)) {
  const arquivos = listaMd(path.join(DIR_FIX, caso));
  if (arquivos.length !== 1) { ok(false, caso + ': esperava 1 .md, achei ' + arquivos.length); continue; }
  const r = validaArquivo(arquivos[0], ctx);
  const codigos = r.problemas.map((p) => p.codigo);
  if (CASOS[caso] === null) {
    ok(codigos.length === 0, caso + ': passa limpo' + (codigos.length ? ' (reprovou por ' + codigos.join(',') + ')' : ''));
  } else {
    ok(codigos.indexOf(CASOS[caso]) >= 0,
      caso + ': reprova por ' + CASOS[caso] + ' (codigos: ' + (codigos.join(',') || 'NENHUM — PASSOU') + ')');
  }
}

// ---------------------------------------------------------------- 2. idioma vem do fluxo (bloco 2)
console.log('\n== 2. Idioma derivado do LANG do fluxo ==');
const idi = idiomaPorNivel();
ok(JSON.stringify(idi) === JSON.stringify({ A1: 'pt', A2: 'pt', B1: 'en', B2: 'en', C1: 'en', C2: 'en' }),
  'politica de hoje lida do v8: ' + JSON.stringify(idi));
ok(JSON.stringify(idiomaPorNivel(path.join(RAIZ, 'fluxos', 'IAChat_Telegram_v7.4.json'))) === JSON.stringify(idi),
  'v7.4 e v8 declaram a mesma politica de idioma');
ok(classificaDiretiva('A1', 'Escreva a explicação INTEIRAMENTE em inglês simples, SEM português. Perguntas em inglês.') === 'en',
  'se o fluxo passar a mandar A1 em ingles, a derivacao vira "en" (nada cravado no validador)');
ok(classificaDiretiva('C2', 'Escreva a explicação em português, com exemplos em inglês. Perguntas em inglês.') === 'pt',
  'se o fluxo passar a mandar C2 em portugues, a derivacao vira "pt"');
let derivouAsCegas = false;
try { classificaDiretiva('B1', 'Seja didatico e conciso.'); derivouAsCegas = true; } catch (e) { /* esperado */ }
ok(!derivouAsCegas, 'diretiva sem idioma explicito e ERRO ruidoso, nao um palpite');

// ---------------------------------------------------------------- 3. gabarito
console.log('\n== 3. Vazamento de gabarito (o criterio nao pode ser grosseiro) ==');
const nTopicos = ctx.topicos.filter((t) => (ctx.questoes.practice || []).some((q) => q.topico === t.titulo)).length;
ok(nTopicos > 0, 'practice_questions.track_topic liga questao a topico do TRACK (' +
  nTopicos + ' de ' + ctx.topicos.length + ' topicos com questao)');

// O piloto contem "good morning", que E a resposta da practice #91 daquele topico — e passa
// assim mesmo: vocabulario do topico nao e vazamento.
ok(/good morning/i.test(fs.readFileSync(PILOTO, 'utf8')),
  'piloto contem a resposta curta de uma questao do topico ("good morning")');
ok(validaArquivo(PILOTO, ctx).problemas.filter((p) => p.codigo === 'GABARITO').length === 0,
  'e mesmo assim NAO e acusado de vazar (senao o validador reprovaria os 60 no T006)');

const b12 = ctx.topicos.find((t) => t.nivel === 'B1' && t.ordem === 2);
const vazMandado = achaVazamentos('errado: I have seen him yesterday. o certo e: I saw him yesterday.', b12, ctx.questoes);
ok(vazMandado.length > 0 && vazMandado.every((v) => v.mandadoPeloTrack),
  'trecho que a propria descricao do TRACK manda ensinar vira AVISO, nao reprovacao (' +
  (vazMandado[0] ? vazMandado[0].origem : 'nenhum achado') + ')');

const b11 = ctx.topicos.find((t) => t.nivel === 'B1' && t.ordem === 1);
const vazReal = achaVazamentos('Example: While I was cooking, the phone rang.', b11, ctx.questoes);
ok(vazReal.length > 0 && vazReal.some((v) => !v.mandadoPeloTrack),
  'enunciado resolvido que nao esta no TRACK e vazamento de verdade');
ok(achaVazamentos('Example: She was cooking when the doorbell rang.', b11, ctx.questoes).length === 0,
  'a mesma estrutura com outro sujeito e outro final NAO e vazamento');

// ---------------------------------------------------------------- 4. a bomba do T006
console.log('\n== 4. Retomada e gravacao atomica (bomba do T006) ==');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iachat-t005-'));
const topicoA1 = ctx.topicos.find((t) => t.nivel === 'A1' && t.ordem === 1);
const dirA1 = path.join(tmpDir, 'A1');
fs.mkdirSync(dirA1, { recursive: true });
const alvo = path.join(dirA1, '01-cumprimentos.md');

// (a) truncado por Ctrl-C no meio da escrita: 25 bytes cortados no frontmatter
fs.writeFileSync(alvo, fs.readFileSync(PILOTO, 'utf8').slice(0, 25), 'utf8');
ok(fs.existsSync(alvo), 'cenario montado: .md truncado (25 bytes) existe no disco');
const dTrunc = precisaGerar(topicoA1, ctx, alvo);
ok(dTrunc.gerar === true, 'gerador NAO pula o truncado (' + dTrunc.motivo.slice(0, 80) + ')');

// (b) arquivo bom: continua sendo pulado, senao a retomada perde o sentido
fs.copyFileSync(PILOTO, alvo);
const dBom = precisaGerar(topicoA1, ctx, alvo);
ok(dBom.gerar === false, 'gerador pula o arquivo que passa no validador (' + dBom.motivo + ')');

// (c) atomicidade: se o rename falhar, o destino nao pode ter sido tocado, e o .tmp some
const novo = path.join(dirA1, '01-cumprimentos.md.novo');
const renameReal = fs.renameSync;
fs.renameSync = () => { throw new Error('falha simulada no rename'); };
let estourou = false;
try { gravaAtomico(novo, 'conteudo parcial que nunca deveria chegar ao destino'); }
catch (e) { estourou = true; }
fs.renameSync = renameReal;
ok(estourou, 'gravaAtomico propaga a falha do rename em vez de engolir');
ok(!fs.existsSync(novo), 'destino NAO existe quando o rename falha (nada de arquivo pela metade)');
ok(fs.readdirSync(dirA1).filter((f) => f.indexOf('.tmp') >= 0).length === 0, 'nenhum .tmp orfao ficou para tras');

// (d) caminho feliz: grava e o conteudo chega inteiro
gravaAtomico(novo, 'ok\n');
ok(fs.readFileSync(novo, 'utf8') === 'ok\n', 'gravaAtomico grava o conteudo inteiro no caminho feliz');

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: validador reprova cada classe de defeito e a retomada nao pula lixo'));
process.exit(fails ? 1 : 0);
