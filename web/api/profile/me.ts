import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_auth'
import { getDb } from '../_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireAuth(req, res)
  if (!auth) return

  const db = getDb()

  if (req.method === 'GET') {
    const { rows } = await db.query(
      `SELECT user_id, name, age, mode, level, xp, streak_count, last_active,
              badges, msg_count, telegram_username, telegram_photo_url
       FROM students
       WHERE user_id = $1`,
      [auth.user_id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Aluno não encontrado' })
    return res.json(rows[0])
  }

  if (req.method === 'PATCH') {
    const { mode } = req.body ?? {}
    if (!mode) return res.status(400).json({ error: 'Campo mode é obrigatório' })
    await db.query('UPDATE students SET mode = $1 WHERE user_id = $2', [mode, auth.user_id])
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
