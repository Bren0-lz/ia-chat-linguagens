// Prova que o validador do T005 reprova de verdade, e que a bomba-relogio do T006 fechou.
//
// Uso:  node conteudo/testa_valida_explicacoes.js
//
// Cinco blocos:
//   1. FIXTURES  — `conteudo/_fixtures_explicacoes/<caso>/<NIVEL>/<arquivo>.md`, um caso por
//      classe de defeito. Cada caso declara o CODIGO que espera: fixture que reprova pelo
//      motivo errado nao vale como prova (o instrumento pode estar julgando a string errada,
//      handoff sec.6 nº13). O caso `ok-b1-portugues` tem de PASSAR — sem ele, um validador que
//      reprova tudo passaria neste teste.
//   2. IDIOMA VEM DO FLUXO — a expectativa de lingua e derivada do `const LANG` do no
//      "Professor Engine", nao cravada aqui. O teste inverte a diretiva e confere que a
//      derivacao acompanha — e, no 2b, que o VEREDITO DE UM .md REAL acompanha junto: e o que
//      reprova quem voltar a cravar o mapa de idiomas dentro do validador.
//   3. GABARITO — vazar e entregar o ITEM ESPECIFICO da questao, nao usar o vocabulario do
//      topico. Os dois lados sao testados: a explicacao que reproduz o enunciado resolvido
//      reprova; a que fala da mesma materia com as mesmas palavras passa. Em 3b e 3c, a
//      calibragem do T005c: citar a forma canonica ("Never have I seen such chaos") NAO
//      reprova, reproduzir o par enunciado->resposta reprova, e a simulacao dos 60 topicos
//      (`simula_vazamento.js`) tem de dar 0 falso positivo em VARIAS redacoes de aula
//      legitima, e pegar o item reproduzido nas duas ordens. Os eixos que o detector nao
//      cobre (distancia e remendo) sao IMPRESSOS, nao afirmados — teste que so mede a
//      redacao escolhida por ele mesmo nao e evidencia.
//   4. BOMBA DO T006 — .md truncado no disco: o gerador NAO pode pula-lo, e a gravacao tem
//      de ser atomica (se o rename falhar, o destino nao existe).
//   5. REGISTRO DO PROMPT — a diretiva que o gerador manda ao modelo sai do LANG daquele
//      nivel: B1 e C2 recebem linhas diferentes, e elas mudam quando o LANG do fluxo muda.

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  validaArquivo, contexto, listaMd, idiomaPorNivel, classificaDiretiva, achaVazamentos,
  diretivaExplicacaoPorNivel, DIR_CONTEUDO
} = require('./valida_explicacoes.js');
const { gravaAtomico, precisaGerar, montaPrompt } = require('./gerar_explicacoes.js');

const RAIZ = path.join(__dirname, '..');
const DIR_FIX = path.join(__dirname, '_fixtures_explicacoes');
const PILOTO = path.join(DIR_CONTEUDO, 'A1', '01-cumprimentos.md');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  x ' + msg); } else console.log('  . ' + msg); }

const ctx = contexto();

// ---------------------------------------------------------------- 1. fixtures
// caso -> codigo que DEVE aparecer entre os problemas; null = tem de passar limpo.
const CASOS = {
  'ok-b1-portugues': null,
  'frontmatter-incompleto': 'FRONTMATTER',
  'slug-divergente': 'SLUG',
  'corpo-truncado': 'FRONTMATTER',
  'corpo-curto': 'TAMANHO',
  'markdown': 'HTML_MARKDOWN',
  'tag-desbalanceada': 'HTML_TAG',
  'e-comercial': 'HTML_AMP',
  'sem-erro-comum': 'ERRO_COMUM',
  'idioma-a1-em-ingles': 'IDIOMA',
  'idioma-b1-em-ingles': 'IDIOMA',
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
ok(JSON.stringify(idi) === JSON.stringify({ A1: 'pt', A2: 'pt', B1: 'pt', B2: 'pt', C1: 'pt', C2: 'pt' }),
  'politica de hoje lida do v8 (T005b: todos os seis explicam em PT): ' + JSON.stringify(idi));
const idi74 = idiomaPorNivel(path.join(RAIZ, 'fluxos', 'IAChat_Telegram_v7.4.json'));
ok(JSON.stringify(idi74) === JSON.stringify({ A1: 'pt', A2: 'pt', B1: 'en', B2: 'en', C1: 'en', C2: 'en' }),
  'v7.4 (congelado, no ar) ainda declara a politica antiga: ' + JSON.stringify(idi74));
ok(classificaDiretiva('A1', 'Escreva a explicação INTEIRAMENTE em inglês simples, SEM português. Perguntas em inglês.') === 'en',
  'se o fluxo passar a mandar A1 em ingles, a derivacao vira "en" (nada cravado no validador)');
ok(classificaDiretiva('C2', 'Escreva a explicação em português, com exemplos em inglês. Perguntas em inglês.') === 'pt',
  'se o fluxo passar a mandar C2 em portugues, a derivacao vira "pt"');
let derivouAsCegas = false;
try { classificaDiretiva('B1', 'Seja didatico e conciso.'); derivouAsCegas = true; } catch (e) { /* esperado */ }
ok(!derivouAsCegas, 'diretiva sem idioma explicito e ERRO ruidoso, nao um palpite');

// 2b. A rede que faltava: na verificacao do T005 dava para cravar `idiomaPorNivel` num mapa fixo
// e o gate seguia VERDE, porque nada media o VEREDITO DE UM ARQUIVO contra um fluxo diferente.
// Aqui o fluxo e mutado em disco (B1 volta a "inteiramente em ingles") e o mesmo .md tem de
// trocar de lado. Com um mapa cravado, os dois vereditos ficam iguais e este bloco reprova.
const fluxoMutado = path.join(os.tmpdir(), 'iachat-lang-mutado-' + process.pid + '.json');
{
  const bruto = JSON.parse(fs.readFileSync(path.join(RAIZ, 'fluxos', 'IAChat_Telegram_v8.json'), 'utf8'));
  const engine = bruto.nodes.find((n) => n.name === 'Professor Engine');
  const antes = engine.parameters.jsCode;
  engine.parameters.jsCode = antes.replace(
    /B1:'[^']*'/,
    "B1:'Escreva a explicação INTEIRAMENTE em inglês claro e simples, SEM português. Perguntas em inglês com resposta curta.'");
  ok(engine.parameters.jsCode !== antes, 'consegui mutar a diretiva de B1 no fluxo de teste');
  fs.writeFileSync(fluxoMutado, JSON.stringify(bruto, null, 2), 'utf8');
}
const ctxMutado = contexto(fluxoMutado);
ok(ctxMutado.idioma.B1 === 'en' && ctx.idioma.B1 === 'pt',
  'o fluxo mutado diz B1=' + ctxMutado.idioma.B1 + ' e o fluxo real diz B1=' + ctx.idioma.B1);

const MD_PT = path.join(DIR_FIX, 'ok-b1-portugues', 'B1', '01-past-continuous.md');
const MD_EN = path.join(DIR_FIX, 'idioma-b1-em-ingles', 'B1', '01-past-continuous.md');
const cods = (md, c) => validaArquivo(md, c).problemas.map((p) => p.codigo);
ok(cods(MD_PT, ctx).length === 0 && cods(MD_PT, ctxMutado).indexOf('IDIOMA') >= 0,
  'o MESMO .md de B1 em portugues passa no fluxo real e reprova por IDIOMA no fluxo mutado');
ok(cods(MD_EN, ctx).indexOf('IDIOMA') >= 0 && cods(MD_EN, ctxMutado).length === 0,
  'o MESMO .md de B1 em ingles reprova no fluxo real e passa no fluxo mutado');
fs.rmSync(fluxoMutado, { force: true });

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

// --- 3b. calibragem do T005c: forma canonica x item reproduzido
// A regra antiga ("a resposta sozinha, se for frase, e vazamento") reprovava a frase que
// qualquer material usa para ensinar o topico. Cada assercao abaixo REPROVA aquela versao.
const c12 = ctx.topicos.find((t) => t.nivel === 'C1' && t.ordem === 2);
ok(achaVazamentos(
  'Na inversao o auxiliar vem antes do sujeito: Never have I seen such chaos. Repare na ordem.',
  c12, ctx.questoes).length === 0,
  'C1/2: citar a forma canonica da inversao ("Never have I seen such chaos") NAO e vazamento');

const b21 = ctx.topicos.find((t) => t.nivel === 'B2' && t.ordem === 1);
ok(achaVazamentos('A forma e have/has been + -ing: I have been learning English.', b21, ctx.questoes).length === 0,
  'B2/1: citar "have been learning" numa frase propria NAO e vazamento');

const b22 = ctx.topicos.find((t) => t.nivel === 'B2' && t.ordem === 2);
ok(achaVazamentos('O past perfect marca o anterior: he had never seen anything like it.', b22, ctx.questoes).length === 0,
  'B2/2: citar "had never seen" numa frase propria NAO e vazamento');

// O outro lado: reproduzir o ITEM — enunciado e resposta juntos, na mesma ordem — continua
// sendo vazamento, e pelo motivo certo (tipo "item reproduzido", nao "resposta").
const parVaza = achaVazamentos(
  'Exercicio resolvido: de "I have never seen such chaos" fica "Never have I seen such chaos".',
  c12, ctx.questoes);
ok(parVaza.length === 1 && parVaza[0].tipo === 'item reproduzido' && !parVaza[0].mandadoPeloTrack,
  'C1/2: reproduzir o par enunciado->resposta E vazamento (' +
  (parVaza[0] ? parVaza[0].origem + ' ' + parVaza[0].tipo : 'nao pegou') + ')');

// A ORDEM NAO importa (simetria fechada na verificacao do T005c): a prosa didatica escreve
// primeiro a forma certa e so depois a frase que ela corrige, e exigir "fonte antes da
// resposta" deixava escapar 100% dos itens escritos assim.
const invertido = achaVazamentos(
  'A forma correta e Never have I seen such chaos. Ela corrige a frase "I have never seen such chaos".',
  c12, ctx.questoes);
ok(invertido.length === 1 && invertido[0].tipo === 'item reproduzido',
  'reproduzir o item na ordem INVERTIDA tambem e vazamento (' +
  (invertido[0] ? invertido[0].origem : 'ESCAPOU') + ')');

// A PROXIMIDADE, sim, importa — e o preco dela e um eixo cego, declarado no comentario do
// validador e medido pelo gate: as duas frases longe uma da outra escapam.
const longe = 'I have never seen such chaos.' + ' bla bla bla filler.'.repeat(30) + ' Never have I seen such chaos.';
ok(achaVazamentos(longe, c12, ctx.questoes).length === 0,
  'EIXO ABERTO, nao virtude: as duas frases a 600 chars de distancia escapam (a janela e o que ' +
  'impede o falso positivo; sem ela, aula que cite as duas em paragrafos distintos reprovaria)');

// --- 3c. a simulacao dos 60 topicos e das 100 questoes (conteudo/simula_vazamento.js).
// O teste NAO pode se apoiar numa unica redacao: a primeira versao deste bloco media um texto
// que nunca emitia o enunciado contra uma regra que exige o enunciado, e o "0/60" era
// tautologico. Aqui cada lado tem varias redacoes, e as que ficam abertas sao IMPRESSAS, nao
// afirmadas — para que o numero do gate descreva a capacidade real.
const sim = require('./simula_vazamento.js');
// Numeros da regra anterior (medidos na verificacao do T005c, com estas mesmas redacoes).
const ANTES = { 'forma-canonica': '22/60 topicos e 26/101 questoes', 'forma-fonte-longe': '17/60 topicos e 17/18 questoes' };
for (const r of sim.SAO_FORMA) {
  const maus = sim.porTopico(ctx, r).filter((c) => c.reprova.length);
  const m = sim.porQuestao(ctx, r);
  ok(maus.length === 0 && m.pegas === 0,
    'FORMA "' + r + '": material de ensino legitimo nao reprova — ' + maus.length + '/60 topicos, ' +
    m.pegas + '/' + m.aplicaveis + ' questoes (regra anterior: ' + ANTES[r] + ')');
}
for (const r of sim.SAO_ITEM) {
  const m = sim.porQuestao(ctx, r);
  const taxa = m.aplicaveis ? Math.round((m.pegas / m.aplicaveis) * 100) : 100;
  if (sim.ABERTOS.indexOf(r) >= 0) {
    console.log('  ~ EIXO ABERTO "' + r + '": pega ' + m.pegas + '/' + m.aplicaveis +
      ' (' + taxa + '%) — declarado no validador, nao exigido aqui');
    continue;
  }
  ok(m.pegas / m.aplicaveis >= 0.9,
    'ITEM "' + r + '": reproduzir o item continua sendo pego — ' + m.pegas + '/' + m.aplicaveis + ' (' + taxa + '%)');
}

// Divida registrada, nao consertada: questoes que nenhum detector alcanca. O teste segura o
// numero para que ele nao cresca em silencio; abaixar e bem-vindo, subir precisa de decisao.
const cob = sim.cobertura(ctx);
ok(cob.cegas.length <= 65,
  'ponto cego estrutural: ' + cob.cegasPractice + '/' + cob.practice + ' practice e ' +
  cob.cegasExam + '/' + cob.exam + ' exam sem detector nenhum (teto declarado: 65 no total)');

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

// ---------------------------------------------------------------- 5. registro do prompt (T005c)
// A diretiva que o gerador manda ao modelo sai do LANG daquele nivel, com o REGISTRO que o
// fluxo escreveu. Ate o T005c era um molde unico por idioma, copiado do A1 — B1..C2 recebiam
// "sempre com o termo em ingles seguido da traducao" e a progressao do LANG virava pó.
console.log('\n== 5. Registro do prompt vem do LANG, por nivel ==');
const b1t = ctx.topicos.find((t) => t.nivel === 'B1' && t.ordem === 1);
const c2t = ctx.topicos.find((t) => t.nivel === 'C2' && t.ordem === 1);
const linhaIdioma = (p) => (p.split('\n').find((l) => l.indexOf('IDIOMA E REGISTRO') === 0) || '');
const pB1 = linhaIdioma(montaPrompt(b1t, 10, ctx.diretiva.B1));
const pC2 = linhaIdioma(montaPrompt(c2t, 10, ctx.diretiva.C2));
ok(pB1 !== pC2, 'a diretiva de B1 e a de C2 sao DIFERENTES (antes eram a mesma linha)');
ok(pB1.indexOf(ctx.diretiva.B1) > 0 && pC2.indexOf(ctx.diretiva.C2) > 0,
  'cada uma e, ao pe da letra, o trecho de EXPLICACAO do LANG daquele nivel');
ok(pB1.indexOf('PERGUNTAS') < 0 && pC2.indexOf('PERGUNTAS') < 0,
  'a parte do LANG que fala das PERGUNTAS nao entra no prompt da explicacao');
console.log('      B1: ' + pB1.slice(0, 150));
console.log('      C2: ' + pC2.slice(0, 150));

// E ela acompanha o fluxo: muda o LANG, muda o prompt. Sem isso, um mapa cravado no gerador
// passaria neste teste.
const fluxoC2 = path.join(os.tmpdir(), 'iachat-registro-mutado-' + process.pid + '.json');
{
  const bruto = JSON.parse(fs.readFileSync(path.join(RAIZ, 'fluxos', 'IAChat_Telegram_v8.json'), 'utf8'));
  const engine = bruto.nodes.find((n) => n.name === 'Professor Engine');
  const antes = engine.parameters.jsCode;
  engine.parameters.jsCode = antes.replace(
    /C2:'[^']*'/,
    "C2:'Escreva a EXPLICAÇÃO em português telegráfico, só bullet points. As PERGUNTAS são em inglês; resposta curta.'");
  ok(engine.parameters.jsCode !== antes, 'consegui mutar a diretiva de C2 no fluxo de teste');
  fs.writeFileSync(fluxoC2, JSON.stringify(bruto, null, 2), 'utf8');
}
const dirMutada = diretivaExplicacaoPorNivel(fluxoC2);
const pC2m = linhaIdioma(montaPrompt(c2t, 10, dirMutada.C2));
ok(pC2m !== pC2 && pC2m.indexOf('telegrafico') < 0 && pC2m.indexOf('telegráfico') > 0,
  'trocando o LANG de C2 no fluxo, a diretiva do prompt muda junto: ' + pC2m.slice(38, 110));
ok(diretivaExplicacaoPorNivel(fluxoC2).B1 === ctx.diretiva.B1,
  'e so o nivel mutado muda — B1 segue igual');
fs.rmSync(fluxoC2, { force: true });

let semDiretiva = false;
try { montaPrompt(c2t, 10, ''); semDiretiva = true; } catch (e) { /* esperado */ }
ok(!semDiretiva, 'sem diretiva no fluxo o gerador estoura, em vez de cair num molde escondido');

console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: validador reprova cada classe de defeito e a retomada nao pula lixo'));
process.exit(fails ? 1 : 0);
