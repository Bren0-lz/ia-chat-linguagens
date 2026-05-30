import type { Student, Badge } from '../types'
import { ProgressBar } from './ui/ProgressBar'

// XP needed per level thresholds
const XP_LEVELS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000]

function getXPProgress(xp: number) {
  let currentLevel = 0
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i]) currentLevel = i
    else break
  }
  const current = XP_LEVELS[currentLevel]
  const next = XP_LEVELS[currentLevel + 1] ?? current + 1000
  const progress = Math.round(((xp - current) / (next - current)) * 100)
  return { currentLevel: currentLevel + 1, xpForNext: next - xp, progress }
}

const ALL_BADGES: Badge[] = [
  { id: 'first_chat', name: 'Primeira Conversa', description: 'Começou a estudar com o IAChat', icon: '💬', unlocked_at: null },
  { id: 'verb_to_be', name: 'Verb To Be', description: 'Dominou o verb to be', icon: '✅', unlocked_at: null },
  { id: 'streak_3', name: '3-Day Streak', description: '3 dias seguidos estudando', icon: '🔥', unlocked_at: null },
  { id: 'streak_7', name: '7-Day Streak', description: '7 dias seguidos estudando', icon: '🏅', unlocked_at: null },
  { id: 'first_test', name: 'Primeiro Teste', description: 'Completou o primeiro teste CEFR', icon: '📝', unlocked_at: null },
  { id: 'level_up', name: 'Level Up!', description: 'Subiu de nível CEFR', icon: '⬆️', unlocked_at: null },
]

function mergeBadges(earned: Badge[]): Badge[] {
  return ALL_BADGES.map((b) => {
    const found = earned.find((e) => e.id === b.id)
    return found ? { ...b, unlocked_at: found.unlocked_at } : b
  })
}

interface Props {
  student: Student
}

export function GamificationPanel({ student }: Props) {
  const { currentLevel, xpForNext, progress } = getXPProgress(student.xp)
  const badges = mergeBadges(student.badges ?? [])
  const unlockedCount = badges.filter((b) => b.unlocked_at).length

  return (
    <div className="space-y-6">
      {/* XP Bar */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-400 text-sm">Nível de experiência</p>
            <p className="text-2xl font-bold text-white">Nível {currentLevel}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-400">{student.xp.toLocaleString('pt-BR')}</p>
            <p className="text-slate-400 text-xs">XP total</p>
          </div>
        </div>
        <ProgressBar value={progress} />
        <p className="text-slate-500 text-xs mt-2">{xpForNext} XP para o próximo nível</p>
      </div>

      {/* Streak */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5 flex items-center gap-4">
        <div className="text-4xl">🔥</div>
        <div>
          <p className="text-2xl font-bold text-orange-400">{student.streak_count} dias</p>
          <p className="text-slate-400 text-sm">de sequência estudando</p>
        </div>
        {student.streak_count >= 7 && (
          <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg px-3 py-1 font-semibold">
            🏆 Semana completa!
          </span>
        )}
      </div>

      {/* Badges */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Conquistas</h3>
          <span className="text-slate-400 text-sm">{unlockedCount}/{badges.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              title={badge.description}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all
                ${badge.unlocked_at
                  ? 'bg-indigo-500/10 border border-indigo-500/30'
                  : 'bg-slate-900/40 border border-slate-700/30 opacity-40 grayscale'
                }
              `}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-xs font-medium text-slate-300 leading-tight">{badge.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
