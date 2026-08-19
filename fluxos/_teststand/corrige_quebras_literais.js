// Conserta nós de código cujo `\n` dentro de strings virou QUEBRA DE LINHA REAL.
//
// Esse defeito já apareceu três vezes neste projeto (`Mensagem Sistema` no fluxo
// principal e `Montar Nudge` no workflow de retenção). É JavaScript inválido: o
// nó não executa e a funcionalidade some sem erro visível para o usuário.
//
// Percorre linha a linha contando aspas simples não escapadas; se a linha termina
// com string aberta, junta com a próxima usando \n escapado.
//
//   node corrige_quebras_literais.js <arquivo.json> [--aplicar]
const fs = require('fs');

const arquivo = process.argv[2];
const aplicar = process.argv.includes('--aplicar');
if (!arquivo) { console.error('uso: node corrige_quebras_literais.js <arquivo.json> [--aplicar]'); process.exit(1); }

function aspasAbertas(linha) {
  let aberto = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '\\') { i++; continue; }
    if (ch === "'") aberto = !aberto;
  }
  return aberto;
}

function conserta(codigo) {
  const linhas = codigo.split('\n');
  const saida = [];
  let buffer = null, juncoes = 0;
  for (const l of linhas) {
    if (buffer !== null) {
      buffer += '\\n' + l;
      juncoes++;
      if (!aspasAbertas(buffer)) { saida.push(buffer); buffer = null; }
      continue;
    }
    if (aspasAbertas(l)) buffer = l; else saida.push(l);
  }
  if (buffer !== null) return null;
  return { codigo: saida.join('\n'), juncoes };
}

const j = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
let mexidos = 0, jaOk = 0, falhos = [];

for (const n of j.nodes) {
  const c = n.parameters && n.parameters.jsCode;
  if (!c) continue;
  try { new Function(c); jaOk++; continue; } catch (e) { /* quebrado, tenta consertar */ }

  const r = conserta(c);
  if (!r) { falhos.push(n.name + ': string aberta até o fim do código'); continue; }
  try { new Function(r.codigo); } catch (e) { falhos.push(n.name + ': ainda quebrado — ' + e.message); continue; }
  console.log('CORRIGIDO  ' + n.name + ' (' + r.juncoes + ' quebra(s) literal(is) → \\n)');
  n.parameters.jsCode = r.codigo;
  mexidos++;
}

console.log('\nnós válidos desde o início: ' + jaOk + ' | corrigidos: ' + mexidos + ' | falhos: ' + falhos.length);
for (const f of falhos) console.log('  FALHOU ' + f);

if (mexidos && aplicar) {
  fs.writeFileSync(arquivo, JSON.stringify(j, null, 2));
  console.log('\narquivo gravado: ' + arquivo);
} else if (mexidos) {
  console.log('\n(dry-run — rode com --aplicar para gravar)');
}
process.exit(falhos.length ? 1 : 0);
