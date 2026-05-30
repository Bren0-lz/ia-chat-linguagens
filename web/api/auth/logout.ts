import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', 'auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
  res.status(200).json({ ok: true })
}
