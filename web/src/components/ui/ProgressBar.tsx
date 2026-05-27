interface ProgressBarProps {
  value: number      // 0–100
  color?: string
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ value, color = 'bg-indigo-500', className = '', showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`relative w-full h-3 rounded-full bg-slate-700 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${clamped}%` }}
      />
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
          {clamped}%
        </span>
      )}
    </div>
  )
}
