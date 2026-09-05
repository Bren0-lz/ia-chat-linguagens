// Tira do Postgres um retrato das QUESTOES (o que o aluno tem de responder sozinho) e grava
// `conteudo/questoes.json`. O validador do T005 usa esse retrato para conferir que a
// explicacao pre-gerada nao entrega o gabarito da questao daquele topico.
//
// Por que um retrato em git, e nao uma consulta no validador: `npm run gate` roda OFFLINE
// (CLAUDE.md) — sem n8n, sem Postgres, sem LLM. O retrato e para o validador o que o
// `track.json` e para o TRACK: uma projecao versionada da fonte.
//
// Uso:
//   node conteudo/extrai_questoes.js             # regrava o retrato (precisa do Postgres)
//   node conteudo/extrai_questoes.js --conferir  # so compara banco x retrato; sai 1 se divergir
//
// O vinculo questao -> topico e a coluna `practice_questions.track_topic`, que guarda o
// TITULO do topico do TRACK — e a mesma chave que o no `Parse Professor` usa para escolher a
// questao do topico corrente. `exam_questions` (placement) NAO tem vinculo com topico: so
// `cefr_level` e `skill`, entao entra no retrato ligada apenas ao nivel.
//
// DATABASE_URL vem do ambiente ou do `.env` da raiz, e NAO e impressa em lugar nenhum.

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DESTINO_Q = path.join(__dirname, 'questoes.json');

function conecta() {
  if (!process.env.DATABASE_URL) {
    try { require(path.join(RAIZ, 'node_modules', 'dotenv')).config({ path: path.join(RAIZ, '.env') }); }
    catch (e) { /* sem dotenv: resta o ambiente */ }
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL ausente (ambiente ou .env da raiz)');
  }
  const { Client } = require(path.join(RAIZ, 'db', 'node_modules', 'pg'));
  return new Client({ connectionString: process.env.DATABASE_URL, ssl: false });
}

async function leDoBanco() {
  const c = conecta();
  await c.connect();
  try {
    const pr = await c.query(
      'SELECT id, cefr_level, track_topic, qtype, prompt, answer FROM practice_questions ORDER BY id');
    const ex = await c.query(
      'SELECT id, cefr_level, skill, qtype, prompt, answer FROM exam_questions ORDER BY id');
    return {
      _fonte: 'postgres :: practice_questions (por track_topic) + exam_questions (por cefr_level)',
      _aviso: 'NAO editar a mao. Gerado por conteudo/extrai_questoes.js; confira com --conferir (precisa do Postgres).',
      practice: pr.rows.map((r) => ({
        id: r.id, nivel: r.cefr_level, topico: r.track_topic,
        qtype: r.qtype, prompt: r.prompt, answer: r.answer
      })),
      exam: ex.rows.map((r) => ({
        id: r.id, nivel: r.cefr_level, skill: r.skill,
        qtype: r.qtype, prompt: r.prompt, answer: r.answer
      }))
    };
  } finally {
    await c.end();
  }
}

function serializa(d) {
  return JSON.stringify(d, null, 2) + '\n';
}

module.exports = { leDoBanco, DESTINO_Q };

if (require.main === module) {
  const conferir = process.argv.indexOf('--conferir') >= 0;
  leDoBanco().then((dados) => {
    const texto = serializa(dados);
    if (conferir) {
      const atual = fs.existsSync(DESTINO_Q) ? fs.readFileSync(DESTINO_Q, 'utf8') : '';
      if (atual === texto) {
        console.log('PASSOU: questoes.json e o banco sao a mesma verdade (' +
          dados.practice.length + ' practice, ' + dados.exam.length + ' exam)');
        process.exit(0);
      }
      console.log('REPROVOU: questoes.json divergiu do banco. Regere com: node conteudo/extrai_questoes.js');
      process.exit(1);
    }
    fs.writeFileSync(DESTINO_Q, texto, 'utf8');
    console.log('practice: ' + dados.practice.length + ' | exam: ' + dados.exam.length);
    console.log('gravado: ' + path.relative(RAIZ, DESTINO_Q).replace(/\\/g, '/'));
  }).catch((e) => {
    console.error('ERRO: ' + e.message);
    process.exit(2);
  });
}
