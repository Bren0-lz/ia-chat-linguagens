// Confere que a tabela `topic_explanations` e os 60 .md de `conteudo/explicacoes/` sao a mesma
// verdade. E o gate do T007 — e fica FORA do `npm run gate`, do mesmo jeito que
// `extrai_questoes.js --conferir`: o gate roda offline (CLAUDE.md), este script precisa do
// Postgres. Rode a mao depois de semear.
//
// Uso:
//   node conteudo/confere_explicacoes_db.js            # compara e sai 1 se divergir
//   node conteudo/confere_explicacoes_db.js --detalhe  # imprime as 60 linhas conferidas
//
// Nao escreve nada. DATABASE_URL vem do ambiente ou do `.env` da raiz, e nao e impressa.

const { leExplicacoes, leDoBanco, conecta, TABELA } = require('./seed_explicacoes.js');

const CAMPOS = ['slug', 'titulo', 'corpo', 'modelo'];

function resumoCorpo(s) {
  return String(s).length + ' chars';
}

async function confere(detalhe) {
  const doDisco = leExplicacoes();
  const c = conecta();
  let doBanco;
  await c.connect();
  try { doBanco = await leDoBanco(c); } finally { await c.end(); }

  const porChaveBanco = new Map(doBanco.map((r) => [r.nivel + '/' + r.ordem, r]));
  const problemas = [];
  let conferidas = 0;

  for (const d of doDisco) {
    const chave = d.nivel + '/' + d.ordem;
    const b = porChaveBanco.get(chave);
    if (!b) { problemas.push(chave + ' (' + d.arquivo + '): sem linha no banco'); continue; }
    porChaveBanco.delete(chave);
    const difs = CAMPOS.filter((k) => String(d[k] == null ? '' : d[k]) !== String(b[k] == null ? '' : b[k]));
    if (difs.length) {
      problemas.push(chave + ' (' + d.arquivo + '): difere em ' + difs.join(', ') +
        (difs.indexOf('corpo') >= 0
          ? ' [md ' + resumoCorpo(d.corpo) + ' x banco ' + resumoCorpo(b.corpo) + ']' : ''));
      continue;
    }
    conferidas++;
    if (detalhe) console.log('  ok ' + chave.padEnd(6) + ' ' + d.titulo + ' (' + resumoCorpo(d.corpo) + ')');
  }
  for (const sobra of porChaveBanco.keys()) {
    problemas.push(sobra + ': linha no banco sem .md correspondente');
  }
  return { total: doDisco.length, conferidas: conferidas, noBanco: doBanco.length, problemas: problemas };
}

if (require.main === module) {
  const detalhe = process.argv.indexOf('--detalhe') >= 0;
  confere(detalhe).then((r) => {
    if (r.problemas.length) {
      for (const p of r.problemas) console.log('  ' + p);
      console.log('REPROVOU: ' + r.problemas.length + ' divergencia(s) entre os .md e ' + TABELA +
        ' (' + r.conferidas + '/' + r.total + ' conferidas, ' + r.noBanco + ' linha(s) no banco).' +
        ' Reseede com: node conteudo/seed_explicacoes.js');
      process.exit(1);
    }
    console.log('PASSOU: ' + r.conferidas + ' explicacoes conferidas — os .md e ' + TABELA +
      ' sao a mesma verdade (' + r.noBanco + ' linha(s) no banco).');
    process.exit(0);
  }).catch((e) => {
    console.error('ERRO: ' + e.message);
    process.exit(1);
  });
}

module.exports = { confere };
