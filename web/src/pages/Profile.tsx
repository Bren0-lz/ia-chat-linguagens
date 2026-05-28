import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ProfileCard } from '../components/ProfileCard'
import { GamificationPanel } from '../components/GamificationPanel'
import { useProfile } from '../hooks/useProfile'
import { logout } from '../lib/api'

const ADMIN_ID = Number(import.meta.env.VITE_ADMIN_TELEGRAM_ID)

export function Profile() {
  const navigate = useNavigate()
  const { student, canTest, testsThisMonth, loading } = useProfile()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    navigate('/')
    return null
  }

  async function handleLogout() {
    await logout().catch(() => {})
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-lg font-bold text-white">
            <span className="text-indigo-400">IA</span>Chat
          </button>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm hidden sm:block">{student.name}</span>
            {ADMIN_ID && student.user_id === ADMIN_ID && (
              <Button size="sm" variant="secondary" onClick={() => navigate('/admin')}>
                ⚙️ Admin
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <ProfileCard student={student} />

        {/* Test Banner */}
        <div className={`rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          canTest
            ? 'bg-indigo-900/30 border-indigo-700/40'
            : 'bg-slate-800/40 border-slate-700/40'
        }`}>
          <div>
            <p className="font-semibold text-white">
              {canTest ? '📝 Teste de nivelamento disponível!' : '✅ Testes do mês concluídos'}
            </p>
            <p className="text-slate-400 text-sm mt-0.5">
              {canTest
                ? `Você ainda tem ${2 - testsThisMonth} teste${2 - testsThisMonth > 1 ? 's' : ''} disponível${2 - testsThisMonth > 1 ? 'is' : ''} este mês.`
                : 'Você fez os 2 testes permitidos este mês. Volte no próximo mês!'}
            </p>
          </div>
          <Button
            disabled={!canTest}
            onClick={() => navigate('/teste')}
            className="shrink-0"
          >
            {canTest ? 'Fazer o teste' : 'Indisponível'}
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Mensagens', value: student.msg_count.toLocaleString('pt-BR'), icon: '💬' },
            { label: 'Nível', value: student.level ?? '—', icon: '📊' },
            { label: 'Testes/mês', value: `${testsThisMonth}/2`, icon: '📝' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-slate-800/60 border border-slate-700/40 p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Gamification */}
        <GamificationPanel student={student} />
      </main>
    </div>
  )
}
