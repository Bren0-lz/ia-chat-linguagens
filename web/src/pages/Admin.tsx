import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CEFRBadge } from '../components/CEFRBadge'
import { useAuth } from '../hooks/useAuth'
import type { CEFRLevel } from '../types'

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const ADMIN_ID = Number(import.meta.env.VITE_ADMIN_TELEGRAM_ID)

interface StudentRow {
  user_id: number
  name: string
  age: number | null
  level: CEFRLevel | null
  xp: number
  streak_count: number
  msg_count: number
  telegram_username: string | null
  last_active: string | null
}

// ── API helpers ──────────────────────────────────────────────────────────────
async function fetchStudents(): Promise<StudentRow[]> {
  const res = await fetch('/api/admin/students', { credentials: 'include' })
  if (!res.ok) throw new Error('Sem acesso')
  const data = await res.json()
  return data.students
}

async function updateLevel(user_id: number, level: CEFRLevel) {
  const res = await fetch('/api/admin/students', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, level }),
  })
  if (!res.ok) throw new Error('Erro ao atualizar')
}

async function testAgent(message: string, user_id: number) {
  const res = await fetch('/api/admin/test-agent', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, user_id }),
  })
  return res.json()
}

// ── Component ────────────────────────────────────────────────────────────────
export function Admin() {
  const navigate = useNavigate()
  const { student, loading } = useAuth()
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [localLevels, setLocalLevels] = useState<Record<number, CEFRLevel>>({})
  const [savedId, setSavedId] = useState<number | null>(null)

  // Agent test state
  const [testMsg, setTestMsg] = useState('')
  const [testUserId, setTestUserId] = useState('')
  const [agentResponse, setAgentResponse] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  // Guard: só admin acessa
  useEffect(() => {
    if (!loading && (!student || student.user_id !== ADMIN_ID)) {
      navigate('/')
    }
  }, [student, loading, navigate])

  useEffect(() => {
    if (!ADMIN_ID || !student) return
    fetchStudents()
      .then((rows) => {
        setStudents(rows)
        const init: Record<number, CEFRLevel> = {}
        rows.forEach((r) => { if (r.level) init[r.user_id] = r.level })
        setLocalLevels(init)
      })
      .finally(() => setLoadingStudents(false))
  }, [student])

  async function handleSaveLevel(user_id: number) {
    const level = localLevels[user_id]
    if (!level) return
    setSavingId(user_id)
    try {
      await updateLevel(user_id, level)
      setSavedId(user_id)
      setTimeout(() => setSavedId(null), 2000)
    } finally {
      setSavingId(null)
    }
  }

  async function handleTestAgent() {
    if (!testMsg.trim()) return
    setTestLoading(true)
    setAgentResponse(null)
    try {
      const uid = testUserId ? Number(testUserId) : student!.user_id
      const result = await testAgent(testMsg, uid)
      setAgentResponse(JSON.stringify(result, null, 2))
    } catch (e) {
      setAgentResponse(`Erro: ${(e as Error).message}`)
    } finally {
      setTestLoading(false)
    }
  }

  if (loading || loadingStudents) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-lg font-bold text-white">
              <span className="text-indigo-400">IA</span>Chat
            </button>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md px-2 py-0.5 font-semibold">
              ADMIN
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/perfil')}>
            ← Voltar ao perfil
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ── Seção: Alunos ─────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Alunos cadastrados</h2>
            <span className="text-slate-400 text-sm">{students.length} alunos</span>
          </div>

          <div className="rounded-2xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80 text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Aluno</th>
                  <th className="px-4 py-3 font-medium">Msgs</th>
                  <th className="px-4 py-3 font-medium">XP</th>
                  <th className="px-4 py-3 font-medium">Streak</th>
                  <th className="px-4 py-3 font-medium">Nível atual</th>
                  <th className="px-4 py-3 font-medium">Alterar nível</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {students.map((s) => (
                  <tr key={s.user_id} className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{s.name}</p>
                      <p className="text-slate-500 text-xs">
                        {s.telegram_username ? `@${s.telegram_username}` : `ID ${s.user_id}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{s.msg_count}</td>
                    <td className="px-4 py-3 text-indigo-400 font-semibold">{s.xp}</td>
                    <td className="px-4 py-3 text-orange-400">{s.streak_count}🔥</td>
                    <td className="px-4 py-3">
                      {s.level ? <CEFRBadge level={s.level} size="sm" /> : <span className="text-slate-500 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={localLevels[s.user_id] ?? ''}
                        onChange={(e) =>
                          setLocalLevels((prev) => ({ ...prev, [s.user_id]: e.target.value as CEFRLevel }))
                        }
                        className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">— selecionar —</option>
                        {CEFR_LEVELS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={savedId === s.user_id ? 'secondary' : 'primary'}
                        disabled={!localLevels[s.user_id] || savingId === s.user_id}
                        onClick={() => handleSaveLevel(s.user_id)}
                      >
                        {savingId === s.user_id ? '...' : savedId === s.user_id ? '✅ Salvo' : 'Salvar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Seção: Testar Agente ───────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Testar agente n8n</h2>
          <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6 space-y-4">
            <p className="text-slate-400 text-sm">
              Envia uma mensagem diretamente para o webhook do n8n como se fosse do Telegram.
              Use para verificar se o bot está respondendo corretamente com o nível atualizado.
            </p>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Mensagem</label>
                <input
                  type="text"
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestAgent()}
                  placeholder="Ex: Hello! What should I practice today?"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Telegram ID do aluno <span className="text-slate-600">(padrão: seu ID)</span>
                </label>
                <input
                  type="text"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  placeholder={String(student?.user_id ?? '')}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <Button
              disabled={!testMsg.trim() || testLoading}
              onClick={handleTestAgent}
            >
              {testLoading ? 'Enviando...' : '▶ Enviar para o agente'}
            </Button>

            {agentResponse && (
              <div className="mt-4">
                <p className="text-xs text-slate-400 mb-2">Resposta do n8n:</p>
                <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-emerald-400 overflow-auto max-h-64 whitespace-pre-wrap">
                  {agentResponse}
                </pre>
              </div>
            )}

            {!import.meta.env.VITE_ADMIN_TELEGRAM_ID && (
              <p className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                ⚠️ Adicione <code className="font-mono">VITE_ADMIN_TELEGRAM_ID</code> e <code className="font-mono">N8N_WEBHOOK_URL</code> no seu <code className="font-mono">.env</code>
              </p>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}
