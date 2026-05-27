import type { Student } from '../types'
import { CEFRBadge } from './CEFRBadge'

interface Props {
  student: Student
}

const CEFR_LABELS: Record<string, string> = {
  A1: 'Iniciante',
  A2: 'Básico',
  B1: 'Intermediário',
  B2: 'Intermediário Avançado',
  C1: 'Avançado',
  C2: 'Fluente',
}

export function ProfileCard({ student }: Props) {
  const initials = student.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-800/60 border border-indigo-700/30 p-6 flex items-center gap-5">
      {/* Avatar */}
      {student.telegram_photo_url ? (
        <img
          src={student.telegram_photo_url}
          alt={student.name}
          className="w-16 h-16 rounded-full ring-2 ring-indigo-500/50 object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white ring-2 ring-indigo-500/50 shrink-0">
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xl font-bold text-white truncate">{student.name}</p>
        {student.telegram_username && (
          <p className="text-slate-400 text-sm">@{student.telegram_username}</p>
        )}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {student.level ? (
            <>
              <CEFRBadge level={student.level} size="sm" />
              <span className="text-slate-400 text-xs">{CEFR_LABELS[student.level]}</span>
            </>
          ) : (
            <span className="text-xs text-slate-500 italic">Nível não definido — faça o teste!</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
        <p className="text-2xl font-bold text-indigo-400">{student.xp.toLocaleString('pt-BR')}</p>
        <p className="text-slate-400 text-xs">XP total</p>
        <p className="text-sm text-orange-400 font-semibold">{student.streak_count} 🔥 dias</p>
      </div>
    </div>
  )
}
