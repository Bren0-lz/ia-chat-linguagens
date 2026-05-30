import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_auth'
import { getDb } from '../_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireAdmin(req, res)
  if (!auth) return

  const db = getDb()

  // GET — lista todos os alunos
  if (req.method === 'GET') {
    const { rows } = await db.query(
      `SELECT user_id, name, age, level, xp, streak_count, msg_count,
              telegram_username, last_active
       FROM students
       ORDER BY msg_count DESC`
    )
    return res.json({ students: rows })
  }

  // PATCH — atualiza nível de um aluno
  if (req.method === 'PATCH') {
    const { user_id, level } = req.body ?? {}
    const valid = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    if (!user_id || !valid.includes(level)) {
      return res.status(400).json({ error: 'user_id e level válido são obrigatórios' })
    }
    await db.query('UPDATE students SET level = $1 WHERE user_id = $2', [level, user_id])
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
