import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CEFRBadge } from '../components/CEFRBadge'
import { TelegramLoginButton } from '../components/TelegramLoginButton'
import { loginTelegram } from '../lib/api'
import type { TelegramUser, CEFRLevel } from '../types'

const BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'IAChat_Bot'
const TELEGRAM_LINK = import.meta.env.VITE_TELEGRAM_BOT_LINK || 'https://t.me/IAChat_Bot'

const CEFR_LEVELS: { level: CEFRLevel; label: string; desc: string }[] = [
  { level: 'A1', label: 'Iniciante', desc: 'Frases simples, saudações e vocabulário básico.' },
  { level: 'A2', label: 'Básico', desc: 'Comunicação em situações cotidianas e familiares.' },
  { level: 'B1', label: 'Intermediário', desc: 'Textos simples sobre assuntos conhecidos.' },
  { level: 'B2', label: 'Int. Avançado', desc: 'Conversas espontâneas com fluência relativa.' },
  { level: 'C1', label: 'Avançado', desc: 'Uso flexível e eficaz do idioma em contextos complexos.' },
  { level: 'C2', label: 'Fluente', desc: 'Compreensão fácil de praticamente tudo que ouve ou lê.' },
]

const MODES = [
  {
    icon: '💬',
    title: 'Conversação Livre',
    desc: 'Pratique inglês em um chat natural com o IAChat. O bot te corrige com gentileza e te incentiva a produzir mais.',
  },
  {
    icon: '🎯',
    title: 'Trilha Estruturada',
    desc: 'Siga uma trilha com tópicos progressivos (gramática, vocabulário, leitura) calibrada ao seu nível CEFR.',
  },
]

export function Landing() {
  const navigate = useNavigate()

  function handleAuth(user: TelegramUser) {
    loginTelegram(user)
    navigate('/perfil')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-white">
            <span className="text-indigo-400">IA</span>Chat
          </span>
          <TelegramLoginButton botName={BOT_NAME} onAuth={handleAuth} buttonSize="small" cornerRadius={8} />
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
          🇺🇸 Aprenda inglês de verdade
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Inglês personalizado
          <br />
          <span className="text-indigo-400">pelo seu nível CEFR</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          O IAChat é seu professor de inglês no Telegram — ele aprende com você, te corrige na hora certa
          e adapta cada aula ao seu nível real.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => window.open(TELEGRAM_LINK, '_blank')}
          >
            <span>Começar no Telegram</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.17 13.9l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.983.659z"/>
            </svg>
          </Button>
          <Button size="lg" variant="secondary">
            <TelegramLoginButton botName={BOT_NAME} onAuth={handleAuth} buttonSize="large" cornerRadius={10} />
          </Button>
        </div>
      </section>

      {/* Modos */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-3">Dois modos de aprendizado</h2>
        <p className="text-center text-slate-400 mb-10">Escolha como quer estudar — ou alterne quando quiser.</p>
        <div className="grid sm:grid-cols-2 gap-6">
          {MODES.map((m) => (
            <div key={m.title} className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
              <div className="text-4xl mb-3">{m.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{m.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CEFR Levels */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-3">Escala CEFR</h2>
        <p className="text-center text-slate-400 mb-10">
          O Common European Framework of Reference for Languages define 6 níveis de proficiência.
          Seu nível é atualizado a cada teste.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CEFR_LEVELS.map(({ level, label, desc }) => (
            <div key={level} className="rounded-2xl bg-slate-800/60 border border-slate-700/40 p-5 flex gap-4">
              <CEFRBadge level={level} size="md" />
              <div>
                <p className="font-semibold text-white text-sm">{label}</p>
                <p className="text-slate-400 text-xs leading-relaxed mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gamification */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-3">Gamificação real</h2>
        <p className="text-center text-slate-400 mb-10">Cada XP reflete produção real, não apenas presença.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: '⭐', title: 'XP por produção', items: ['+10 responder em inglês', '+20 corrigir o próprio erro', '+30 escrever frase completa'] },
            { icon: '🔥', title: 'Streak diário', items: ['Mantém a sequência de dias', 'Badges especiais para 3, 7, 30 dias', 'Streak aparece no perfil'] },
            { icon: '🏅', title: 'Badges', items: ['Por tópico (verb to be, etc.)', 'Por conquista (primeira aula)', 'Por consistência (7-day streak)'] },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl bg-slate-800/60 border border-slate-700/40 p-6">
              <div className="text-3xl mb-3">{c.icon}</div>
              <h3 className="font-bold text-white mb-3">{c.title}</h3>
              <ul className="space-y-1.5">
                {c.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-slate-400 text-sm">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900/50 to-slate-800/60 border border-indigo-700/30 p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para começar?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Abra o IAChat no Telegram, faça o teste de nivelamento e comece a aprender inglês do jeito certo.
          </p>
          <Button size="lg" onClick={() => window.open(TELEGRAM_LINK, '_blank')}>
            Acessar o IAChat no Telegram →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        IAChat © {new Date().getFullYear()} — Ensino de inglês com IA
      </footer>
    </div>
  )
}
