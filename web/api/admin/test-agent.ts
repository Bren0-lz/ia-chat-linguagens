import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const auth = requireAdmin(req, res)
  if (!auth) return

  const { message, user_id } = req.body ?? {}
  if (!message) return res.status(400).json({ error: 'message é obrigatório' })

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) return res.status(500).json({ error: 'N8N_WEBHOOK_URL não configurada' })

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { text: message },
        from: { id: user_id || auth.user_id, first_name: auth.name },
        chat: { id: user_id || auth.user_id },
        date: Math.floor(Date.now() / 1000),
        _source: 'admin_test',
      }),
    })

    const text = await response.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    res.json({ ok: true, status: response.status, response: data })
  } catch (err) {
    res.status(500).json({ error: `Erro ao chamar n8n: ${(err as Error).message}` })
  }
}
