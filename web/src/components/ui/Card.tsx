import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Card({ glow, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm
        ${glow ? 'ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/10' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
