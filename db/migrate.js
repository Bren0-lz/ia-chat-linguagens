// Roda todas as migrations em ordem, pulando as já aplicadas
// Uso: node db/migrate.js "postgresql://usuario:senha@host:5432/banco"

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌  Passe a DATABASE_URL como argumento:')
  console.error('   node db/migrate.js "postgresql://usuario:senha@host/banco"')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    console.log('✅  Conectado ao banco!\n')

    // Cria tabela de controle de migrations se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    const { rows: applied } = await client.query('SELECT name FROM _migrations')
    const appliedSet = new Set(applied.map(r => r.name))

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()

    let ran = 0
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏭   Pulando ${file} (já aplicada)`)
        continue
      }
      const filePath = path.join(MIGRATIONS_DIR, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      process.stdout.write(`▶   Rodando ${file} ...`)
      await client.query(sql)
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
      console.log(' ✅')
      ran++
    }

    if (ran === 0) {
      console.log('\n✨  Tudo já está atualizado — nenhuma migration nova.')
    } else {
      console.log(`\n🎉  ${ran} migration(s) aplicada(s) com sucesso!`)
    }
  } catch (err) {
    console.error('\n❌  Erro:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
