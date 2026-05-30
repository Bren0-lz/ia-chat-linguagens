import { Pool } from 'pg'

let pool: Pool | null = null

export function getDb(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  }
  return pool
}
