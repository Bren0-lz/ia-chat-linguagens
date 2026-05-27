import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_auth'
import { getDb } from '../_db'

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** Maps score percentage + distribution to a CEFR level */
function calculateLevel(correctByLevel: Record<string, number>, totalByLevel: Record<string, number>): CEFRLevel {
  // Find the highest level where the student scored ≥ 60%
  let result: CEFRLevel = 'A1'
  for (const level of CEFR_ORDER) {
    const total = totalByLevel[level] ?? 0
    const correct = correctByLevel[level] ?? 0
    if (total > 0 && correct / total >= 0.6) {
      result = level as CEFRLevel
    }
  }
  return result
}

/** Check and potentially award badges */
async function checkBadges(db: ReturnType<typeof import('../_db').getDb>, userId: number) {
  const { rows: [student] } = await db.query(
    'SELECT badges, xp, msg_count FROM students WHERE user_id = $1',
    [userId]
  )
  if (!student) return

  const badges: { id: string; name: string; description: string; icon: string; unlocked_at: string }[] = student.badges ?? []
  const hasId = (id: string) => badges.some((b) => b.id === id)
  const newBadges = [...badges]

  const now = new Date().toISOString()

  if (!hasId('first_test')) {
    newBadges.push({ id: 'first_test', name: 'Primeiro Teste', description: 'Completou o primeiro teste CEFR', icon: '📝', unlocked_at: now })
  }

  if (newBadges.length !== badges.length) {
    await db.query('UPDATE students SET badges = $1 WHERE user_id = $2', [JSON.stringify(newBadges), userId])
  }
}

/** Update streak — increments if last_active was yesterday, resets if gap > 1 day */
async function updateStreak(db: ReturnType<typeof import('../_db').getDb>, userId: number) {
  const { rows: [student] } = await db.query(
    'SELECT streak_count, last_active FROM students WHERE user_id = $1',
    [userId]
  )
  if (!student) return

  const today = new Date().toISOString().split('T')[0]
  const lastActive = student.last_active ? new Date(student.last_active).toISOString().split('T')[0] : null

  let newStreak = student.streak_count ?? 0

  if (!lastActive || lastActive < today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]

    if (lastActive === yStr) {
      newStreak += 1
    } else if (!lastActive || lastActive < yStr) {
      newStreak = 1
    }
  }

  await db.query(
    'UPDATE students SET streak_count = $1, last_active = $2 WHERE user_id = $3',
    [newStreak, today, userId]
  )

  // Award streak badges
  const { rows: [updated] } = await db.query('SELECT badges FROM students WHERE user_id = $1', [userId])
  const badges = updated?.badges ?? []
  const hasId = (id: string) => badges.some((b: { id: string }) => b.id === id)
  const newBadges = [...badges]
  const now = new Date().toISOString()

  if (newStreak >= 3 && !hasId('streak_3')) {
    newBadges.push({ id: 'streak_3', name: '3-Day Streak', description: '3 dias seguidos estudando', icon: '🔥', unlocked_at: now })
  }
  if (newStreak >= 7 && !hasId('streak_7')) {
    newBadges.push({ id: 'streak_7', name: '7-Day Streak', description: '7 dias seguidos estudando', icon: '🏅', unlocked_at: now })
  }

  if (newBadges.length !== badges.length) {
    await db.query('UPDATE students SET badges = $1 WHERE user_id = $2', [JSON.stringify(newBadges), userId])
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const auth = requireAuth(req, res)
  if (!auth) return

  const { answers } = req.body as { answers: Record<number, number> }
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Respostas inválidas' })
  }

  const db = getDb()

  // Check limit
  const { rows: limitRows } = await db.query(
    `SELECT COUNT(*) AS cnt FROM test_attempts
     WHERE user_id = $1
       AND DATE_TRUNC('month', started_at) = DATE_TRUNC('month', NOW())
       AND finished_at IS NOT NULL`,
    [auth.user_id]
  )
  if (parseInt(limitRows[0].cnt, 10) >= 2) {
    return res.status(403).json({ error: 'Limite de 2 testes por mês atingido' })
  }

  // Get questions to verify answers
  const questionIds = Object.keys(answers).map(Number)
  if (questionIds.length === 0) return res.status(400).json({ error: 'Sem respostas enviadas' })

  const { rows: questions } = await db.query(
    `SELECT id, cefr_level, correct_index FROM test_questions WHERE id = ANY($1)`,
    [questionIds]
  )

  // Score by level
  const correctByLevel: Record<string, number> = {}
  const totalByLevel: Record<string, number> = {}
  let totalCorrect = 0

  for (const q of questions) {
    const level = q.cefr_level
    totalByLevel[level] = (totalByLevel[level] ?? 0) + 1
    if (answers[q.id] === q.correct_index) {
      correctByLevel[level] = (correctByLevel[level] ?? 0) + 1
      totalCorrect++
    }
  }

  const levelResult = calculateLevel(correctByLevel, totalByLevel)
  const score = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100 * 100) / 100 : 0
  const xpEarned = 50

  // Save attempt
  await db.query(
    `INSERT INTO test_attempts (user_id, finished_at, score, level_result, answers)
     VALUES ($1, NOW(), $2, $3, $4)`,
    [auth.user_id, score, levelResult, JSON.stringify(answers)]
  )

  // Update student level and XP
  await db.query(
    `UPDATE students SET level = $1, xp = xp + $2 WHERE user_id = $3`,
    [levelResult, xpEarned, auth.user_id]
  )

  // Update streak and check badges
  await updateStreak(db, auth.user_id)
  await checkBadges(db, auth.user_id)

  res.json({
    score,
    level_result: levelResult,
    correct: totalCorrect,
    total: questions.length,
    xp_earned: xpEarned,
  })
}
