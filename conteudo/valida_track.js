// Impede que o TRACK tenha DUAS verdades. Reextrai os 6x10 topicos do jsCode do no
// `Professor Engine` (fonte unica) e compara, campo a campo, com `conteudo/track.json`.
// Diverge = sai 1. Isso vale para os dois lados: mexer no fluxo sem regerar o JSON reprova,
// e editar o JSON a mao reprova tambem.
//
// Uso:  node conteudo/valida_track.js [caminho/do/fluxo.json]
// Regerar:  node conteudo/extrai_track.js
const fs = require('fs');
const path = require('path');
const { extrai, FLUXO_PADRAO, DESTINO, NO } = require('./extrai_track.js');

const FLUXO = process.argv[2] || FLUXO_PADRAO;
const NIVEIS_ESPERADOS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const TOPICOS_POR_NIVEL = 10;

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  x ' + msg); } else console.log('  . ' + msg); }
function fim() {
  console.log('\n' + (fails
    ? 'REPROVOU: ' + fails + ' falha(s). Se o fluxo mudou, regere com: node conteudo/extrai_track.js'
    : 'PASSOU: track.json e o TRACK do fluxo sao a mesma verdade'));
  process.exit(fails ? 1 : 0);
}

console.log('fluxo: ' + path.basename(FLUXO));
console.log('json:  ' + path.relative(path.join(__dirname, '..'), DESTINO));

// ---------- 1. o arquivo existe e e legivel ----------
console.log('\n== Arquivo ==');
if (!fs.existsSync(DESTINO)) {
  ok(false, 'conteudo/track.json existe (rode: node conteudo/extrai_track.js)');
  fim();
}
let gravado;
try { gravado = JSON.parse(fs.readFileSync(DESTINO, 'utf8')); }
catch (e) { ok(false, 'conteudo/track.json e JSON valido: ' + e.message); fim(); }
ok(true, 'conteudo/track.json existe e e JSON valido');

// ---------- 2. reextracao do fluxo ----------
let doFluxo;
try { doFluxo = extrai(FLUXO); }
catch (e) { ok(false, 'reextracao do no "' + NO + '" funcionou: ' + e.message); fim(); }
ok(true, 'TRACK reextraido do no "' + NO + '"');

// ---------- 3. forma: 6 niveis x 10 topicos, nada vazio ----------
console.log('\n== Forma ==');
ok(Array.isArray(doFluxo.topicos) && doFluxo.topicos.length === 60,
   '60 topicos no fluxo (achei ' + (doFluxo.topicos || []).length + ')');
ok(NIVEIS_ESPERADOS.join(',') === (doFluxo.niveis || []).join(','),
   'niveis sao ' + NIVEIS_ESPERADOS.join('/') + ' (achei ' + (doFluxo.niveis || []).join('/') + ')');
for (const nivel of NIVEIS_ESPERADOS) {
  const doNivel = (doFluxo.topicos || []).filter(t => t.nivel === nivel);
  ok(doNivel.length === TOPICOS_POR_NIVEL, nivel + ': ' + TOPICOS_POR_NIVEL + ' topicos (achei ' + doNivel.length + ')');
  const ordens = doNivel.map(t => t.ordem).join(',');
  ok(ordens === '1,2,3,4,5,6,7,8,9,10', nivel + ': ordem 1..10 sem buraco (' + ordens + ')');
}
const vazios = (doFluxo.topicos || []).filter(t => !String(t.titulo || '').trim() || !String(t.descricao || '').trim());
ok(vazios.length === 0, 'nenhum titulo ou descricao vazio (' + vazios.length + ' vazio(s))');
const semSlug = (doFluxo.topicos || []).filter(t => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.slug || ''));
ok(semSlug.length === 0, 'todo slug e estavel e sem acento (' + semSlug.map(t => t.nivel + '/' + t.ordem).join(' ') + ')');
const dupSlug = [];
const vistos = new Set();
for (const t of (doFluxo.topicos || [])) {
  const chave = t.nivel + '/' + t.slug;
  if (vistos.has(chave)) dupSlug.push(chave);
  vistos.add(chave);
}
ok(dupSlug.length === 0, 'slug unico dentro do nivel (' + dupSlug.join(' ') + ')');

// ---------- 4. o que impede as duas verdades ----------
console.log('\n== Fluxo x track.json ==');
ok((gravado.topicos || []).length === (doFluxo.topicos || []).length,
   'mesma quantidade de topicos (json ' + (gravado.topicos || []).length + ' x fluxo ' + (doFluxo.topicos || []).length + ')');
ok((gravado.niveis || []).join(',') === (doFluxo.niveis || []).join(','), 'mesma lista de niveis');

const CAMPOS = ['nivel', 'ordem', 'slug', 'titulo', 'descricao'];
let divergencias = 0;
const n = Math.max((gravado.topicos || []).length, (doFluxo.topicos || []).length);
for (let i = 0; i < n; i++) {
  const g = (gravado.topicos || [])[i];
  const f = (doFluxo.topicos || [])[i];
  const onde = f ? (f.nivel + '/' + String(f.ordem).padStart(2, '0')) : ('#' + (i + 1));
  if (!g) { divergencias++; console.log('  x ' + onde + ': existe no fluxo e falta no track.json'); continue; }
  if (!f) { divergencias++; console.log('  x #' + (i + 1) + ': existe no track.json e nao no fluxo'); continue; }
  for (const campo of CAMPOS) {
    if (g[campo] !== f[campo]) {
      divergencias++;
      console.log('  x ' + onde + ' campo "' + campo + '" divergiu');
      console.log('      fluxo:      ' + JSON.stringify(String(f[campo]).slice(0, 120)));
      console.log('      track.json: ' + JSON.stringify(String(g[campo]).slice(0, 120)));
    }
  }
}
if (divergencias) fails += divergencias;
ok(divergencias === 0, 'todos os 60 topicos identicos ao fluxo, campo a campo');

// byte a byte: pega ate reordenacao ou campo extra que a comparacao acima nao veria
const canon = (o) => JSON.stringify((o.topicos || []).map(t => CAMPOS.map(c => t[c])));
ok(canon(gravado) === canon(doFluxo), 'serializacao canonica identica (ordem e campos)');

fim();
