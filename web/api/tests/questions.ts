import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_auth'
import { getDb } from '../_db'

const QUESTIONS_PER_LEVEL: Record<string, number> = {
  A1: 4, A2: 4, B1: 4, B2: 4, C1: 2, C2: 2,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireAuth(req, res)
  if (!auth) return

  const db = getDb()
  const allQuestions: unknown[] = []

  for (const [level, count] of Object.entries(QUESTIONS_PER_LEVEL)) {
    const { rows } = await db.query(
      `SELECT id, cefr_level, question, options, skill
       FROM test_questions
       WHERE cefr_level = $1
       ORDER BY RANDOM()
       LIMIT $2`,
      [level, count]
    )
    allQuestions.push(...rows)
  }

  // Shuffle questions
  const shuffled = allQuestions.sort(() => Math.random() - 0.5)
  res.json({ questions: shuffled })
}
