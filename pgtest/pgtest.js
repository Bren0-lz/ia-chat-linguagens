const { Client } = require('pg');

const uri = process.argv[2];
if (!uri) {
  console.error('Uso: node pgtest.js "postgresql://USER:PASSWORD@HOST:5432/postgres"');
  process.exit(1);
}

const client = new Client({
  connectionString: uri,
  ssl: { rejectUnauthorized: false }, // mesmo efeito do "Ignore SSL Issues" do n8n
  connectionTimeoutMillis: 10000,
});

(async () => {
  try {
    await client.connect();
    const r = await client.query('select current_user, version()');
    console.log('✅ CONECTOU!');
    console.log('   usuario :', r.rows[0].current_user);
    console.log('   versao  :', r.rows[0].version.split(',')[0]);
    await client.end();
  } catch (e) {
    console.log('❌ FALHOU');
    console.log('   code    :', e.code);
    console.log('   message :', e.message);
    if (e.routine) console.log('   routine :', e.routine);
    process.exit(2);
  }
})();
