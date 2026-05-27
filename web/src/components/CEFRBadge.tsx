import type { CEFRLevel } from '../types'

const colors: Record<CEFRLevel, string> = {
  A1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  A2: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
  B1: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  B2: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
  C1: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  C2: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
}

interface CEFRBadgeProps {
  level: CEFRLevel
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5 font-bold',
}

export function CEFRBadge({ level, size = 'md' }: CEFRBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-lg border font-semibold ${colors[level]} ${sizes[size]}`}>
      {level}
    </span>
  )
}
