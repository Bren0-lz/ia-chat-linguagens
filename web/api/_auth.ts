import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'
import { parse } from 'cookie'

export interface JWTPayload {
  user_id: number
  name: string
}

export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET not set')
  return s
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, getJwtSecret()) as JWTPayload
}

export function requireAuth(req: VercelRequest, res: VercelResponse): JWTPayload | null {
  try {
    const cookies = parse(req.headers.cookie ?? '')
    const token = cookies['auth_token']
    if (!token) {
      res.status(401).json({ error: 'Não autenticado' })
      return null
    }
    return verifyToken(token)
  } catch {
    res.status(401).json({ error: 'Token inválido' })
    return null
  }
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): JWTPayload | null {
  const auth = requireAuth(req, res)
  if (!auth) return null
  const adminId = process.env.ADMIN_TELEGRAM_ID
  if (!adminId || String(auth.user_id) !== String(adminId)) {
    res.status(403).json({ error: 'Acesso negado' })
    return null
  }
  return auth
}
