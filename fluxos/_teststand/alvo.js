// Rotulo da versao e caminho da transcricao, derivados do ingress (IACHAT_TEST_PATH).
//
// Existe para que o alvo apareca UMA vez no relatorio e a evidencia de uma versao
// nunca sobrescreva a de outra: o v7.4 grava em `tr_bateria_a.md` (o nome historico,
// de 04/09) e qualquer outro ingress grava com sufixo.
const ROTULOS = { 'iachat-test': 'v7.4', 'iachat-test-v8': 'v8' };

function rotuloDe(testPath) {
  return ROTULOS[testPath] || String(testPath);
}

function transcricaoDe(base, testPath) {
  const r = rotuloDe(testPath);
  if (r === 'v7.4') return './' + base + '.md';
  return './' + base + '_' + r.replace(/[^\w.-]+/g, '-') + '.md';
}

module.exports = { rotuloDe, transcricaoDe };
