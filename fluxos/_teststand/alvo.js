// Rotulo da versao e caminho da transcricao, derivados do ingress (IACHAT_TEST_PATH).
//
// Existe para que o alvo apareca UMA vez no relatorio e a evidencia de uma versao
// nunca sobrescreva a de outra: o v7.4 grava em `tr_bateria_a.md` (o nome historico,
// de 04/09) e qualquer outro ingress grava com sufixo.
//
// Limite que o `transcricaoDe` NAO resolve (armadilha no 22): ele distingue por VERSAO,
// nao por DATA -- duas rodadas no mesmo v8 colidem, e a gravacao e writeFileSync. Quem
// resolve isso e o `caminhoLivre`, abaixo. Este modulo continua PURO de proposito:
// nada de `fs`, nada de relogio. Quem tem o disco e o relogio injeta ("armadilha no 12:
// teste que sorteia a propria condicao mede sorte").
const ROTULOS = { 'iachat-test': 'v7.4', 'iachat-test-v8': 'v8' };

function rotuloDe(testPath) {
  return ROTULOS[testPath] || String(testPath);
}

function transcricaoDe(base, testPath) {
  const r = rotuloDe(testPath);
  if (r === 'v7.4') return './' + base + '.md';
  return './' + base + '_' + r.replace(/[^\w.-]+/g, '-') + '.md';
}

// Data em UTC (YYYY-MM-DD), para o nome nao depender do fuso de quem roda.
function dataDe(agora) {
  const d = agora instanceof Date ? agora : new Date(agora);
  if (isNaN(d.getTime())) throw new Error('caminhoLivre: "agora" invalido');
  const p = (n) => String(n).padStart(2, '0');
  return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
}

// Primeiro caminho LIVRE a partir de `alvo` (tipicamente o que `transcricaoDe` devolveu).
//
//   caminho livre        -> o proprio `alvo` (o v7.4 mantem `tr_bateria_a.md`, o v8
//                           mantem `tr_bateria_a_v8.md` -- os nomes ja publicados)
//   ja existe            -> `..._AAAA-MM-DD.md`
//   a data tambem existe -> `..._AAAA-MM-DD-2.md`, `-3`, ...
//
// `existe(caminho) -> bool` e `agora` (ms ou Date) sao INJETADOS: a funcao nao toca em
// disco nem no relogio, entao o teste manda a condicao em vez de torcer por ela.
function caminhoLivre(alvo, existe, agora) {
  if (typeof existe !== 'function') throw new Error('caminhoLivre: "existe" tem de ser funcao');
  if (!existe(alvo)) return alvo;

  const semExt = alvo.replace(/\.md$/, '');
  const dia = dataDe(agora);
  const datado = semExt + '_' + dia + '.md';
  if (!existe(datado)) return datado;

  for (let n = 2; n <= 999; n++) {
    const c = semExt + '_' + dia + '-' + n + '.md';
    if (!existe(c)) return c;
  }
  throw new Error('caminhoLivre: 1000 transcricoes em ' + dia + ' para ' + alvo);
}

module.exports = { rotuloDe, transcricaoDe, caminhoLivre };
