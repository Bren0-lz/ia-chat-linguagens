// Runner do cleanup_test_users.sql para ambientes sem psql no PATH.
//
//   node db/cleanup_test_users.js           -> dry-run (so mostra o que faria)
//   node db/cleanup_test_users.js --apply   -> executa dentro de uma transacao
//
// Criterio (ver o .sql): user_id de 9 digitos iniciando em 99, faixa fechada em
// cima para nao alcancar contas reais do Telegram, que tem 10 digitos.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

const APPLY = process.argv.includes('--apply');
const FAIXA = 'user_id >= 990000000 AND user_id < 1000000000';

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const alvo = await c.query(
      'SELECT user_id, name, level, last_active FROM students WHERE ' + FAIXA + ' ORDER BY user_id');
    const preservar = await c.query(
      'SELECT user_id, name, level, msg_count FROM students WHERE NOT (' + FAIXA + ') ORDER BY user_id');
    const mem = await c.query(
      "SELECT count(*) n FROM chat_memory WHERE split_part(session_id, ':', 1) ~ '^99[0-9]{7}$'");
    const pl = await c.query('SELECT count(*) n FROM placement_attempts WHERE ' + FAIXA);

    console.log('A REMOVER — ' + alvo.rowCount + ' alunos de teste');
    for (const r of alvo.rows.slice(0, 5)) console.log('   ' + r.user_id + ' | ' + (r.name || '(sem nome)') + ' | ' + (r.level || '-'));
    if (alvo.rowCount > 5) console.log('   ... e mais ' + (alvo.rowCount - 5));
    console.log('   + ' + pl.rows[0].n + ' placement_attempts, ' + mem.rows[0].n + ' linhas de chat_memory');

    console.log('\nA PRESERVAR — ' + preservar.rowCount + ' conta(s):');
    for (const r of preservar.rows) {
      const digitos = String(r.user_id).length;
      console.log('   ' + r.user_id + ' (' + digitos + ' digitos) | ' + (r.name || '(sem nome)') + ' | msgs: ' + r.msg_count);
    }

    if (!APPLY) {
      console.log('\nDRY-RUN — nada foi apagado. Para executar: node db/cleanup_test_users.js --apply');
      return;
    }

    await c.query('BEGIN');
    const dPl = await c.query('DELETE FROM placement_attempts WHERE ' + FAIXA);
    const dMem = await c.query("DELETE FROM chat_memory WHERE split_part(session_id, ':', 1) ~ '^99[0-9]{7}$'");
    const dSt = await c.query('DELETE FROM students WHERE ' + FAIXA);
    const rest = await c.query('SELECT count(*) n FROM students WHERE ' + FAIXA);
    if (Number(rest.rows[0].n) !== 0) throw new Error('sobraram ' + rest.rows[0].n + ' usuarios de teste — revertendo');
    await c.query('COMMIT');

    console.log('\nAPLICADO: students -' + dSt.rowCount + ' | placement_attempts -' + dPl.rowCount + ' | chat_memory -' + dMem.rowCount);
    const total = await c.query('SELECT count(*) n FROM students');
    console.log('students restantes na base: ' + total.rows[0].n);
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (x) {}
    console.error('ERRO (rollback feito):', e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})();
