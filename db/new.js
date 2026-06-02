// Cria uma nova migration com numeração automática.
// Uso: npm run db:new -- <nome_da_migration>
// Ex.:  npm run db:new -- add_level_column
//       -> cria db/migrations/007_add_level_column.sql

const fs = require('fs');
const path = require('path');

const rawName = process.argv[2];
if (!rawName) {
  console.error('❌  Faltou o nome da migration.');
  console.error('    Uso: npm run db:new -- <nome>');
  console.error('    Ex.: npm run db:new -- add_level_column');
  process.exit(1);
}

const slug = String(rawName).trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

if (!slug) {
  console.error('❌  Nome inválido. Use letras, números e underscores.');
  process.exit(1);
}

const dir = path.join(__dirname, 'migrations');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const files = fs.readdirSync(dir).filter(f => /^\d{3}_.*\.sql$/.test(f));
const maxNum = files.reduce((m, f) => Math.max(m, parseInt(f.slice(0, 3), 10)), 0);
const next = String(maxNum + 1).padStart(3, '0');

const filename = `${next}_${slug}.sql`;
const filepath = path.join(dir, filename);

if (fs.existsSync(filepath)) {
  console.error(`❌  Já existe: db/migrations/${filename}`);
  process.exit(1);
}

const stub = `-- Migration: ${slug.replace(/_/g, ' ')}
-- Criada em: ${new Date().toISOString().slice(0, 10)}
-- Use IF EXISTS / IF NOT EXISTS para deixar idempotente.

-- TODO: escrever o SQL aqui

`;

fs.writeFileSync(filepath, stub);
console.log(`✅  Criada: db/migrations/${filename}`);
console.log(`    Edite o arquivo e depois rode: npm run db:push`);
