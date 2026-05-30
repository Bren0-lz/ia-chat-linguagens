import type { TestQuestion as TQ } from '../types'
import { CEFRBadge } from './CEFRBadge'

interface Props {
  question: TQ
  index: number
  total: number
  selected: number | null
  onSelect: (index: number) => void
}

export function TestQuestionCard({ question, index, total, selected, onSelect }: Props) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">
          Questão {index + 1} de {total}
        </span>
        <CEFRBadge level={question.cefr_level} size="sm" />
      </div>

      {/* Question */}
      <p className="text-xl font-semibold text-white leading-relaxed">{question.question}</p>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`
              w-full text-left px-5 py-4 rounded-xl border transition-all duration-150 font-medium
              ${selected === i
                ? 'border-indigo-500 bg-indigo-500/20 text-white ring-1 ring-indigo-500/50'
                : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-700/50'
              }
            `}
          >
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-xs font-bold ${
              selected === i ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
