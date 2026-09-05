// Prova que o validador do T005 reprova de verdade, e que a bomba-relogio do T006 fechou.
//
// Uso:  node conteudo/testa_valida_explicacoes.js
//
// Seis blocos:
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
//   6. O QUE AS CHECAGENS RECALIBRADAS NO T006 AINDA PEGAM — as quatro mudancas daquela tarefa
//      afrouxam ou deslocam uma checagem, e vieram logo depois de um lote que reprovou. Cada
//      uma tem aqui um caso que continua sendo reprovado; sem esse caso a checagem virou
//      carimbo e o certo e remove-la. Fecha com o teste de sanidade do idioma: o mesmo .md com
//      a prosa traduzida para ingles e os exemplos intactos tem de reprovar.

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  validaArquivo, contexto, listaMd, idiomaPorNivel, classificaDiretiva, achaVazamentos,
  diretivaExplicacaoPorNivel, medeIdioma, termosExigiveis, separaFrontmatter, DIR_CONTEUDO
} = require('./valida_explicacoes.js');
const { gravaAtomico, precisaGerar, montaPrompt, confereCorpo } = require('./gerar_explicacoes.js');

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
  'crase': 'HTML_MARKDOWN',
  'idioma-c1-prosa-em-ingles': 'IDIOMA',
  'idioma-bullets-em-ingles': 'IDIOMA',
  'lixo-semantico': 'REPETICAO',
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

// ---------------------------------------------------------------- 6. o que as checagens
// RECALIBRADAS no T006 ainda pegam.
//
// As quatro mudancas do T006 (prosa no IDIOMA, materia sem mobilia na COBERTURA/ERRO_COMUM,
// teto 3000->3800, crase como markdown) todas AFROUXAM ou DESLOCAM uma checagem, e vieram logo
// depois de um lote que reprovou. Esse e o momento em que um validador vira carimbo. Este bloco
// existe para que cada uma prove, com um caso concreto, que ainda reprova alguma coisa — se um
// destes ok() nao puder ser escrito, a checagem correspondente morreu e deve ser REMOVIDA, nao
// mantida de enfeite.
console.log('\n== 6. O que as checagens recalibradas do T006 ainda pegam ==');

const tmp6 = fs.mkdtempSync(path.join(os.tmpdir(), 'iachat-t006-'));
function comoArquivo(nivel, nome, conteudo) {
  const d = path.join(tmp6, nivel);
  fs.mkdirSync(d, { recursive: true });
  const p = path.join(d, nome);
  fs.writeFileSync(p, conteudo, 'utf8');
  return p;
}
const codigosDe = (p) => validaArquivo(p, ctx).problemas.map((x) => x.codigo);

// --- 6a. IDIOMA mede a PROSA, e a prosa em ingles continua reprovando.
// O teste de sanidade: o MESMO arquivo, os MESMOS exemplos e formas em ingles, so a prosa
// traduzida. O real passa; o traduzido reprova. Se o traduzido passar, a metrica nao mede nada.
const C1_REAL = path.join(DIR_CONTEUDO, 'C1', '03-cleft-sentences.md');
const C1_EN = path.join(DIR_FIX, 'idioma-c1-prosa-em-ingles', 'C1', '03-cleft-sentences.md');
const mReal = medeIdioma(separaFrontmatter(fs.readFileSync(C1_REAL, 'utf8')).corpo);
const mEn = medeIdioma(separaFrontmatter(fs.readFileSync(C1_EN, 'utf8')).corpo);
ok(codigosDe(C1_REAL).length === 0,
  'C1/03 real (prosa PT, formas e exemplos EN) passa — a regra antiga o reprovava com 43% ' +
  '(prosa: ' + Math.round(mReal.fracPt * 100) + '%)');
ok(codigosDe(C1_EN).indexOf('IDIOMA') >= 0,
  'SANIDADE: o MESMO arquivo com a prosa traduzida para ingles reprova por IDIOMA (prosa: ' +
  Math.round(mEn.fracPt * 100) + '%)');
ok(codigosDe(C1_EN).length === 1,
  'e reprova SO por IDIOMA — os exemplos sao identicos, entao nada mais mudou (codigos: ' +
  codigosDe(C1_EN).join(',') + ')');
// meia prosa em ingles tambem tem de cair: nao e so o caso extremo que a metrica ve.
const meia = fs.readFileSync(C1_REAL, 'utf8').replace(
  /^O principal erro é a concordância.*$/m,
  'The main mistake here is the agreement of the verb that comes after who and that, and it has to agree with the subject in focus and never with it, because that is what the structure does.')
  .replace(/^Existem dois tipos principais.*$/m,
    'There are two main types here, and you can see all of them below, with the forms that each one takes.');
ok(codigosDe(comoArquivo('C1', '03-cleft-sentences.md', meia)).indexOf('IDIOMA') >= 0,
  'e nem precisa do caso extremo: com PARTE da prosa em ingles ja reprova');

// --- 6b. COBERTURA cobra a materia e nao a mobilia — mas continua cobrando a materia.
const c24 = ctx.topicos.find((t) => t.nivel === 'C2' && t.ordem === 4);
const exig24 = termosExigiveis(c24.descricao);
ok(exig24.indexOf('fronting') >= 0, 'C2/4: "fronting" (a materia) continua exigido');
ok(['road', 'car', 'beautiful', 'view', 'came'].every((m) => exig24.indexOf(m) < 0),
  'C2/4: road, car, beautiful, view, came (a mobilia do exemplo) deixaram de ser exigidos');
const c24Real = fs.readFileSync(path.join(DIR_CONTEUDO, 'C2', '04-fronting-e-enfase.md'), 'utf8');
ok(codigosDe(comoArquivo('C2', '04-fronting-e-enfase.md', c24Real)).length === 0,
  'C2/4 real passa (reprovava com 46% de cobertura, e os 7 termos faltantes eram mobilia)');
const semMateria = c24Real.replace(/fronting/gi, 'esse recurso');
ok(codigosDe(comoArquivo('C2', '04-fronting-e-enfase.md', semMateria)).indexOf('COBERTURA') >= 0,
  'AINDA PEGA: o mesmo arquivo sem a palavra "fronting" reprova por COBERTURA');
// A regra (b) nao pode engolir INVENTARIO DE FORMAS anunciado por rotulo. Estes quatro sao os
// casos que a verificacao do T006 apontou como materia perdida.
const a16 = ctx.topicos.find((t) => t.nivel === 'A1' && t.ordem === 6);
const exig16 = termosExigiveis(a16.descricao);
ok(["i'm", "you're", "he's", "she's", "it's", "we're", "they're"].every((c) => exig16.indexOf(c) >= 0),
  'A1/6: as CONTRACOES continuam exigidas (rotulo de materia protege o inventario)');
ok(['are', 'you', 'they'].every((c) => exig16.indexOf(c) >= 0),
  'A1/6: a CONJUGACAO COMPLETA continua exigida');
const b19 = termosExigiveis(ctx.topicos.find((t) => t.nivel === 'B1' && t.ordem === 9).descricao);
ok(['quick', 'quickly', 'careful', 'carefully'].every((c) => b19.indexOf(c) >= 0),
  'B1/9: o par adjetivo->adverbio continua exigido (a seta so e demonstracao dentro do ERRO COMUM)');
const a29 = termosExigiveis(ctx.topicos.find((t) => t.nivel === 'A2' && t.ordem === 9).descricao);
ok(['worked', 'liked', 'stopped', 'studied'].every((c) => a29.indexOf(c) >= 0),
  'A2/9: as formas do -ED continuam exigidas');
const b24 = termosExigiveis(ctx.topicos.find((t) => t.nivel === 'B2' && t.ordem === 4).descricao);
ok(b24.length > 0, 'B2/4: voltou a ter termo exigivel (' + b24.length + '): ' + b24.join(' '));

// Cobertura vazia e checagem inexistente: um topico sem termo exigivel tem de REPROVAR como
// erro de configuracao do TRACK, nao virar "eixo aberto" silencioso.
const semTermo = ctx.topicos.filter((t) => termosExigiveis(t.descricao).length === 0);
ok(semTermo.length === 0, 'nenhum topico do TRACK fica sem termo exigivel (' +
  (semTermo.map((t) => t.nivel + '/' + t.ordem).join(' ') || 'confirmado nos 60') + ')');
const ctxFuro = Object.assign({}, ctx, {
  topicos: ctx.topicos.map((t) => (t.nivel === 'B2' && t.ordem === 4)
    ? Object.assign({}, t, { descricao: 'Foco no objeto. The house was built in 1990.' }) : t)
});
ok(termosExigiveis('Foco no objeto. The house was built in 1990.').length === 0,
  'cenario montado: uma descricao so com frase de exemplo nao rende termo nenhum');
const vFuro = validaArquivo(path.join(DIR_CONTEUDO, 'B2', '04-voz-passiva.md'), ctxFuro).problemas;
ok(vFuro.some((p) => p.codigo === 'COBERTURA' && /nenhum termo exigivel/.test(p.msg)),
  'AINDA PEGA: com o TRACK assim, o arquivo reprova por COBERTURA vazia — o defeito grita');

// --- 6c. ERRO_COMUM: a secao continua obrigatoria e o nome do erro continua cobrado.
const c22 = ctx.topicos.find((t) => t.nivel === 'C2' && t.ordem === 2);
// [0] e nao [2]: o validador passa o trecho COM o rotulo "ERRO COMUM:", que e o que autoriza
// descartar o par com seta ali dentro. O teste tem de medir o mesmo que a producao mede.
const secaoErro = (t) => t.descricao.match(/ERROS?\s+COMU(M|NS):?(.*)$/is)[0];
const exigErro22 = termosExigiveis(secaoErro(c22));
ok(exigErro22.indexOf('metaphors') >= 0,
  'C2/2: "mixed metaphors", o nome do erro, continua exigido na secao de erros');
const c22Real = fs.readFileSync(path.join(DIR_CONTEUDO, 'C2', '02-idioms-avancados-e-metafora.md'), 'utf8');
ok(codigosDe(comoArquivo('C2', '02-idioms-avancados-e-metafora.md', c22Real)).length === 0,
  'C2/2 real passa: o corpo diz "mixed metaphor" no singular, e plural nao e materia');
const semNome = c22Real.replace(/mixed metaphors?/gi, 'esse problema');
ok(codigosDe(comoArquivo('C2', '02-idioms-avancados-e-metafora.md', semNome)).indexOf('ERRO_COMUM') >= 0,
  'AINDA PEGA: sem nomear o erro ("mixed metaphor"), reprova por ERRO_COMUM');
const a21 = ctx.topicos.find((t) => t.nivel === 'A2' && t.ordem === 1);
const exigErro21 = termosExigiveis(secaoErro(a21));
ok(exigErro21.indexOf('work') < 0 && exigErro21.indexOf('works') < 0,
  'A2/1: "(he work -> he works)" e demonstracao, nao materia — deixou de ser exigido');

// --- 6d. TAMANHO: o teto subiu para 3800 por decisao do Breno, mas ainda existe.
const piloto = fs.readFileSync(PILOTO, 'utf8');
const enche = (alvo) => {
  const frase = '\nEste paragrafo existe apenas para chegar ao tamanho que o teste precisa medir.';
  let s = piloto;
  while (s.length < alvo) s += frase;
  return s;
};
ok(codigosDe(comoArquivo('A1', '01-cumprimentos.md', enche(3500))).indexOf('TAMANHO') < 0,
  'um corpo de ~3500 chars passa (com o teto antigo de 3000 reprovaria)');
ok(codigosDe(comoArquivo('A1', '01-cumprimentos.md', enche(4200))).indexOf('TAMANHO') >= 0,
  'AINDA PEGA: um corpo de ~4200 chars reprova por TAMANHO (o teto subiu, nao sumiu)');

// --- 6e. crase: pega no validador E na barreira do gerador, que e quem impede o .md de nascer.
ok(codigosDe(path.join(DIR_FIX, 'crase', 'A1', '01-cumprimentos.md')).join(',') === 'HTML_MARKDOWN',
  'AINDA PEGA: um unico termo em `crase` reprova por HTML_MARKDOWN, e so por ele');
ok(confereCorpo('O termo `must` marca certeza. ' + 'texto valido de enchimento. '.repeat(30))
  .some((p) => /crase/.test(p)),
  'e o gerador barra a crase ANTES de gravar o .md (confereCorpo)');
ok(confereCorpo('Nenhuma crase aqui. ' + 'texto valido de enchimento. '.repeat(30)).length === 0,
  'e nao acusa texto limpo (senao nada seria gerado)');

// --- 6f. a excecao do TRACK deixou de depender de uma palavra de funcao — e so ela.
// (Quinta mudanca do T006, feita depois de 12 geracoes seguidas do B2/10 reprovarem pelo mesmo
// trecho.) O que virou AVISO e o que o TRACK MANDA ensinar; o que nao esta no TRACK continua
// reprovando, com ou sem o "to" na frente.
const b210 = ctx.topicos.find((t) => t.nivel === 'B2' && t.ordem === 10);
const vazB210 = achaVazamentos('O certo é: I need to make a decision.', b210, ctx.questoes);
ok(vazB210.length > 0 && vazB210.every((v) => v.mandadoPeloTrack),
  'B2/10: "to make a decision" vira AVISO — o TRACK manda ensinar "make a decision" e o erro ' +
  '"do a decision" -> make a decision');
const b11b = ctx.topicos.find((t) => t.nivel === 'B1' && t.ordem === 1);
const aindaVaza = achaVazamentos('Veja: to while i was cooking the phone rang.', b11b, ctx.questoes);
ok(aindaVaza.length > 0 && aindaVaza.some((v) => !v.mandadoPeloTrack),
  'AINDA PEGA: um enunciado resolvido que NAO esta no TRACK reprova mesmo com "to" na frente');
ok(validaArquivo(path.join(DIR_FIX, 'vaza-gabarito', 'B1', '01-past-continuous.md'), ctx)
  .problemas.some((p) => p.codigo === 'GABARITO'),
  'AINDA PEGA: a fixture de vazamento continua reprovando por GABARITO');

fs.rmSync(tmp6, { recursive: true, force: true });

console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: validador reprova cada classe de defeito e a retomada nao pula lixo'));
process.exit(fails ? 1 : 0);
