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
function roda(bloco, resultados) {
  const saida = [];
  const gravado = [];
  const fsFalso = { appendFileSync: (_, t) => gravado.push(t) };
  const consoleFalso = { log: (...a) => saida.push(a.join(' ')) };
  const SENTINELA = {};
  let codigo = 0;
  const processFalso = { exit: (c) => { codigo = c; throw SENTINELA; } };
  const fn = new Function('resultados', 'fs', 'console', 'process', 'TR', bloco);
  try { fn(resultados, fsFalso, consoleFalso, processFalso, './tr_falso.md'); }
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

console.log(fails ? '\nREPROVOU: ' + fails + ' asserção(oes)' : '\nPASSOU: codigo de saida da Fase A');
process.exit(fails ? 1 : 0);
