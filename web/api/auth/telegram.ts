import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { getDb } from '../_db'
import { signToken } from '../_auth'

/** Validates Telegram Login Widget data using HMAC-SHA256 */
function validateTelegramHash(data: Record<string, string>, botToken: string): boolean {
  const { hash, ...rest } = data
  const checkString = Object.entries(rest)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const expectedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')
  return expectedHash === hash
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const params = req.query as Record<string, string>
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return res.status(500).json({ error: 'Bot token não configurado' })

    // Validate required fields
    if (!params.id || !params.hash) {
      return res.status(400).json({ error: 'Dados Telegram inválidos' })
    }

    // Check auth_date freshness (max 1 hour)
    const authDate = parseInt(params.auth_date ?? '0', 10)
    if (Date.now() / 1000 - authDate > 3600) {
      return res.status(400).json({ error: 'Login expirado — tente novamente' })
    }

    // Verify hash
    if (!validateTelegramHash(params, botToken)) {
      return res.status(401).json({ error: 'Assinatura Telegram inválida' })
    }

    const telegramId = parseInt(params.id, 10)
    const name = [params.first_name, params.last_name].filter(Boolean).join(' ')
    const db = getDb()

    // Upsert student (only insert if not exists — preserve existing data)
    await db.query(
      `INSERT INTO students (user_id, name, xp, streak_count, badges, msg_count)
       VALUES ($1, $2, 0, 0, '[]', 0)
       ON CONFLICT (user_id) DO UPDATE
         SET name = EXCLUDED.name`,
      [telegramId, name]
    )

    // Optionally store telegram username/photo (we add these columns if they don't exist)
    await db.query(
      `ALTER TABLE students
       ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255),
       ADD COLUMN IF NOT EXISTS telegram_photo_url TEXT`
    ).catch(() => {/* ignore if already exists */})

    await db.query(
      `UPDATE students SET telegram_username = $1, telegram_photo_url = $2 WHERE user_id = $3`,
      [params.username ?? null, params.photo_url ?? null, telegramId]
    )

    const token = signToken({ user_id: telegramId, name })

    // Set httpOnly cookie + redirect to /perfil
    const secure = process.env.NODE_ENV === 'production'
    res.setHeader('Set-Cookie', [
      `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax${secure ? '; Secure' : ''}`,
    ])
    res.redirect(302, '/perfil')
  } catch (err) {
    console.error('Telegram auth error:', err)
    res.status(500).json({ error: 'Erro interno' })
  }
}
