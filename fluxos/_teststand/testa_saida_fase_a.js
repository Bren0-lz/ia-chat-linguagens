// Regressao offline do CODIGO DE SAIDA da Fase A (T013).
//
// A Fase A precisa de n8n e Postugres para rodar, entao nao cabe no gate. Mas o bloco que
// decide o codigo de saida e codigo puro: este teste EXTRAI o bloco RESUMO do
// `bateria_completa_a.js` e o executa fora da bateria, com `resultados` sinteticos — o mesmo
// truque que o teststand usa com o `jsCode` dos nos do fluxo.
//
// Reprova a versao anterior: o bloco antigo (reproduzido aqui como BLOCO_ANTIGO) nao chamava
// `process.exit`, entao saia 0 mesmo com FALHOU. Se um dia o bloco novo voltar a sair 0 com
// falha, este teste quebra.
//
// E011 acrescentou a categoria N/A (nao se aplica): no alvo EVENTO, B1/B3/B5 nao rodam porque
// o fluxo do evento nao tem teste de nivelamento. As regras antigas continuam valendo
// integralmente -- reprovacao sai 1, inconclusivo sai 2, inconclusivo nunca e aprovacao -- e as
// novas sao conferidas nas DUAS direcoes: no evento os N/A tem de ser exatamente os declarados;
// em v8/v7.4 nao pode haver N/A nenhum, e marcar um sai 1 (N/A nao e atalho para aprovar).
//
//   node fluxos/_teststand/testa_saida_fase_a.js

const fs = require('fs');
const path = require('path');

const ORIGEM = path.join(__dirname, 'bateria_completa_a.js');
const MARCA = '// ============ RESUMO ============';

let fails = 0;
function ok(nome, cond, detalhe) {
  console.log((cond ? '  . ' : '  X ') + nome + (detalhe ? '  — ' + detalhe : ''));
  if (!cond) fails++;
}

// ------------------------------------------------------------------ extracao
const fonte = fs.readFileSync(ORIGEM, 'utf8');
const ini = fonte.indexOf(MARCA);
if (ini < 0) {
  console.error('REPROVOU: nao achei "' + MARCA + '" em bateria_completa_a.js');
  process.exit(1);
}
const fim = fonte.indexOf('})().catch', ini);
if (fim < 0) {
  console.error('REPROVOU: nao achei o fim da IIFE depois do RESUMO');
  process.exit(1);
}
const BLOCO = fonte.slice(ini, fim);

// A lista de N/A e lida DO ARQUIVO, nao redigitada aqui: o teste tem de julgar a regua que
// vai rodar de verdade (armadilha no 13 -- o instrumento julgando a string errada).
const mMapa = fonte.match(/const NAO_SE_APLICA_EVENTO = \{[\s\S]*?\n\};/);
if (!mMapa) {
  console.error('REPROVOU: nao achei o mapa NAO_SE_APLICA_EVENTO em bateria_completa_a.js');
  process.exit(1);
}
const NA_EVENTO = new Function(mMapa[0] + ' return NAO_SE_APLICA_EVENTO;')();

// O bloco RESUMO de ONTEM (T013, pre-E011), ao pe da letra: sem categoria N/A. Ele conta
// `ok === 'na'` como "nao aprovado" e joga na lista ATENÇÃO, sem motivo declarado e sem
// distinguir do vermelho de verdade -- exatamente o placar que a E011 elimina.
const BLOCO_PRE_E011 = `
  const p = resultados.filter(r => r.ok === true).length;
  const f = resultados.filter(r => r.ok === false).length;
  const i = resultados.filter(r => r.ok === null).length;
  console.log('\\n===== FASE A: ' + p + ' passaram, ' + f + ' falharam, ' + i + ' inconclusivos =====');
  for (const r of resultados.filter(x => x.ok !== true)) console.log('  ATENÇÃO ' + r.id + ': ' + r.detalhe);
  fs.appendFileSync(TR, '\\n**Resumo:** ' + p + ' passaram, ' + f + ' falharam, ' + i + ' inconclusivos\\n');
  console.log('\\ntranscrição: ' + TR);
  process.exit(f > 0 ? 1 : (i > 0 ? 2 : 0));
`;

// A versao de ate 06/09, ao pe da letra: contava e imprimia, e nao saia.
const BLOCO_ANTIGO = `
  const p = resultados.filter(r => r.ok === true).length;
  const f = resultados.filter(r => r.ok === false).length;
  const i = resultados.filter(r => r.ok === null).length;
  console.log('\\n===== FASE A: ' + p + ' passaram, ' + f + ' falharam, ' + i + ' inconclusivos =====');
  for (const r of resultados.filter(x => x.ok !== true)) console.log('  ATENÇÃO ' + r.id + ': ' + r.detalhe);
  fs.appendFileSync(TR, '\\n**Resumo:** ' + p + ' passaram, ' + f + ' falharam, ' + i + ' inconclusivos\\n');
  console.log('\\ntranscrição: ' + TR);
`;

// Roda um bloco com `resultados` sinteticos e devolve { codigo, saida, gravado }.
// `process.exit` vira excecao-sentinela; sem chamada, o codigo e 0 (foi isso que a versao
// anterior fazia, e e exatamente o defeito).
function roda(bloco, resultados, alvo) {
  const saida = [];
  const gravado = [];
  const fsFalso = { appendFileSync: (_, t) => gravado.push(t) };
  const consoleFalso = { log: (...a) => saida.push(a.join(' ')) };
  const SENTINELA = {};
  let codigo = 0;
  const processFalso = { exit: (c) => { codigo = c; throw SENTINELA; } };
  const fn = new Function('resultados', 'fs', 'console', 'process', 'TR', 'ALVO', 'NAO_SE_APLICA_EVENTO', bloco);
  try { fn(resultados, fsFalso, consoleFalso, processFalso, './tr_falso.md', alvo || 'v8', NA_EVENTO); }
  catch (e) { if (e !== SENTINELA) throw e; }
  return { codigo, saida: saida.join('\n'), gravado: gravado.join('') };
}

const T = (id) => ({ id, ok: true, detalhe: 'ok' });
const F = (id) => ({ id, ok: false, detalhe: 'reprovou de proposito' });
const I = (id) => ({ id, ok: null, detalhe: 'inconclusivo' });

const TUDO_OK = [T('A1'), T('A2'), T('B1')];
const COM_FALHA = [T('A1'), F('A2'), T('B1')];
const COM_INCONCL = [T('A1'), I('A2'), T('B1')];
const FALHA_E_INCONCL = [F('A1'), I('A2'), T('B1')];

console.log('CODIGO DE SAIDA DA FASE A (bloco RESUMO extraido de bateria_completa_a.js)');

console.log('\n1) o bloco de hoje');
const rOk = roda(BLOCO, TUDO_OK);
ok('todos passaram -> 0', rOk.codigo === 0, 'codigo=' + rOk.codigo);

const rFalha = roda(BLOCO, COM_FALHA);
ok('uma reprovacao forcada -> diferente de 0', rFalha.codigo !== 0, 'codigo=' + rFalha.codigo);
ok('reprovacao sai especificamente 1', rFalha.codigo === 1, 'codigo=' + rFalha.codigo);

const rInc = roda(BLOCO, COM_INCONCL);
ok('inconclusivo nao e aprovacao (codigo != 0)', rInc.codigo !== 0, 'codigo=' + rInc.codigo);
ok('inconclusivo se distingue de reprovacao (codigo 2)', rInc.codigo === 2, 'codigo=' + rInc.codigo);

const rAmbos = roda(BLOCO, FALHA_E_INCONCL);
ok('falha + inconclusivo -> 1 (reprovacao manda)', rAmbos.codigo === 1, 'codigo=' + rAmbos.codigo);

console.log('\n2) o relatorio impresso NAO mudou (o formato de 04/09 e o padrao do comparativo)');
ok('linha de resumo no console',
  /===== FASE A: 2 passaram, 1 falharam, 0 inconclusivos =====/.test(rFalha.saida),
  JSON.stringify(rFalha.saida.split('\n')[0]));
ok('linha ATENÇÃO por teste nao aprovado', /ATENÇÃO A2: reprovou de proposito/.test(rFalha.saida));
ok('caminho da transcricao impresso', /transcrição: \.\/tr_falso\.md/.test(rFalha.saida));
ok('resumo gravado na transcricao',
  /\*\*Resumo:\*\* 2 passaram, 1 falharam, 0 inconclusivos/.test(rFalha.gravado),
  JSON.stringify(rFalha.gravado));
ok('console identico ao da versao anterior',
  roda(BLOCO_ANTIGO, COM_FALHA).saida === rFalha.saida);
ok('transcricao identica a da versao anterior',
  roda(BLOCO_ANTIGO, COM_FALHA).gravado === rFalha.gravado);

console.log('\n3) a versao anterior reprova neste teste (prova de que o conserto conserta algo)');
const aFalha = roda(BLOCO_ANTIGO, COM_FALHA);
ok('bloco antigo saia 0 mesmo com FALHOU', aFalha.codigo === 0, 'codigo=' + aFalha.codigo);
const aInc = roda(BLOCO_ANTIGO, COM_INCONCL);
ok('bloco antigo saia 0 tambem com INCONCLUSIVO', aInc.codigo === 0, 'codigo=' + aInc.codigo);

// ------------------------------------------------- E011: a categoria N/A (nao se aplica)
const NA = (id) => ({ id, ok: 'na', detalhe: NA_EVENTO[id] || 'sem motivo declarado' });
const catorze = ['A1', 'A2', 'A2b', 'A3', 'A4', 'A6', 'A8', 'B6', 'X1', 'X2', 'X3', 'R2', 'R3', 'S1'].map(T);
const EVENTO_OK = catorze.concat([NA('B1'), NA('B3'), NA('B5')]);

console.log('\n4) alvo EVENTO: B1/B3/B5 sao N/A, com motivo, e nao viram codigo 1');
ok('o mapa declara exatamente B1, B3 e B5',
  Object.keys(NA_EVENTO).sort().join(',') === 'B1,B3,B5', Object.keys(NA_EVENTO).join(','));
ok('o motivo cita o teste de nivelamento e a E002',
  Object.values(NA_EVENTO).every(m => /nivelamento/i.test(m) && /E002/.test(m)),
  JSON.stringify(NA_EVENTO.B1));

const rEv = roda(BLOCO, EVENTO_OK, 'evento');
ok('14 passaram + 3 N/A -> codigo 0', rEv.codigo === 0, 'codigo=' + rEv.codigo);
ok('placar do evento no console',
  /===== FASE A: 14 passaram, 0 falharam, 0 inconclusivos, 3 não se aplicam =====/.test(rEv.saida),
  JSON.stringify(rEv.saida.split('\n')[1]));
ok('o motivo aparece na linha de cada N/A',
  ['B1', 'B3', 'B5'].every(id => new RegExp('N/A ' + id + ': .*nivelamento').test(rEv.saida)));
ok('N/A NAO aparece como ATENÇÃO (nao polui o vermelho de verdade)', !/ATENÇÃO/.test(rEv.saida));
ok('a transcricao registra os 3 nao se aplicam',
  /\*\*Resumo:\*\* 14 passaram, 0 falharam, 0 inconclusivos, 3 não se aplicam/.test(rEv.gravado)
  && /\*\*B5\*\* não se aplica ao alvo evento/.test(rEv.gravado), JSON.stringify(rEv.gravado));

const rEvFalha = roda(BLOCO, EVENTO_OK.concat([F('A9')]), 'evento');
ok('no evento, reprovacao de verdade continua saindo 1', rEvFalha.codigo === 1, 'codigo=' + rEvFalha.codigo);
const rEvInc = roda(BLOCO, EVENTO_OK.concat([I('A9')]), 'evento');
ok('no evento, inconclusivo continua saindo 2', rEvInc.codigo === 2, 'codigo=' + rEvInc.codigo);

console.log('\n5) N/A nao e aprovacao: marcado no alvo errado, ou no teste errado, reprova');
const rV8Na = roda(BLOCO, catorze.concat([NA('B1'), NA('B3'), NA('B5')]), 'v8');
ok('N/A no alvo v8 -> codigo 1', rV8Na.codigo === 1, 'codigo=' + rV8Na.codigo);
ok('N/A no alvo v8 diz por que reprovou', /ERRO DE RÉGUA/.test(rV8Na.saida));
const rV74Na = roda(BLOCO, catorze.concat([NA('B1')]), 'v7.4');
ok('um unico N/A no alvo v7.4 -> codigo 1', rV74Na.codigo === 1, 'codigo=' + rV74Na.codigo);
const rEvFalta = roda(BLOCO, catorze.concat([T('B1'), NA('B3'), NA('B5')]), 'evento');
ok('no evento, N/A a menos que o declarado -> codigo 1', rEvFalta.codigo === 1, 'codigo=' + rEvFalta.codigo);
const rEvDemais = roda(BLOCO, catorze.slice(1).concat([NA('A1'), NA('B1'), NA('B3'), NA('B5')]), 'evento');
ok('teste que deveria rodar virando N/A -> codigo 1', rEvDemais.codigo === 1, 'codigo=' + rEvDemais.codigo);

console.log('\n6) a bateria de fato PULA B1/B3/B5 no evento — e nao apagou os casos');
for (const id of ['B1', 'B3', 'B5']) {
  ok(id + ' consulta pulaNoAlvo antes de rodar',
    new RegExp("if \\(pulaNoAlvo\\('" + id + "'\\)\\) reg\\('" + id + "', 'na'").test(fonte));
}
ok('o motor adaptativo continua coberto (jornadaPlacement segue no arquivo)',
  /jornadaPlacement\(u, \(\) => false\)/.test(fonte) && /placement_state\.status === 'paused'/.test(fonte));
ok('o alvo vem do rotuloDe (ingress), nao de nome de arquivo',
  /const ALVO = rotuloDe\(TEST_PATH\);/.test(fonte) && !/evento\.json/.test(fonte));

console.log('\n7) a versao pre-E011 reprova neste teste');
const preEv = roda(BLOCO_PRE_E011, EVENTO_OK, 'evento');
ok('bloco pre-E011 nao tinha placar de N/A', !/não se aplicam/.test(preEv.saida), JSON.stringify(preEv.saida.split('\n')[1]));
ok('bloco pre-E011 jogava os N/A em ATENÇÃO', /ATENÇÃO B1:/.test(preEv.saida));
ok('bloco pre-E011 nao reprovava N/A em alvo errado', roda(BLOCO_PRE_E011, catorze.concat([NA('B1')]), 'v8').codigo === 0);

console.log(fails ? '\nREPROVOU: ' + fails + ' asserção(oes)' : '\nPASSOU: codigo de saida da Fase A');
process.exit(fails ? 1 : 0);
