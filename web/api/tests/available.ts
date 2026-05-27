import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_auth'
import { getDb } from '../_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireAuth(req, res)
  if (!auth) return

  const db = getDb()
  const { rows } = await db.query(
    `SELECT COUNT(*) AS cnt FROM test_attempts
     WHERE user_id = $1
       AND DATE_TRUNC('month', started_at) = DATE_TRUNC('month', NOW())
       AND finished_at IS NOT NULL`,
    [auth.user_id]
  )
  const testsThisMonth = parseInt(rows[0].cnt, 10)
  res.json({ available: testsThisMonth < 2, tests_this_month: testsThisMonth })
}
