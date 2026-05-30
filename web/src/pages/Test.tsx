import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CEFRBadge } from '../components/CEFRBadge'
import { TestQuestionCard } from '../components/TestQuestion'
import { getTestQuestions, submitTest, getTestAvailability } from '../lib/api'
import type { TestQuestion, TestResult } from '../types'

type Phase = 'loading' | 'blocked' | 'intro' | 'test' | 'result' | 'error'

export function Test() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<TestResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getTestAvailability()
      .then(({ available }) => {
        if (!available) { setPhase('blocked'); return }
        return getTestQuestions().then(({ questions: qs }) => {
          setQuestions(qs)
          setPhase('intro')
        })
      })
      .catch(() => setPhase('error'))
  }, [])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await submitTest(answers)
      setResult(res)
      setPhase('result')
    } catch {
      setPhase('error')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = questions.length > 0 ? Math.round(((current) / questions.length) * 100) : 0
  const currentQ = questions[current]
  const selectedAnswer = answers[currentQ?.id] ?? null
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Preparando o teste...</p>
        </div>
      </div>
    )
  }

  // ── Blocked ────────────────────────────────────────────────────────────────
  if (phase === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="text-2xl font-bold text-white">Limite mensal atingido</h2>
          <p className="text-slate-400">Você já fez os 2 testes permitidos este mês. Volte no próximo mês!</p>
          <Button onClick={() => navigate('/perfil')}>Voltar ao perfil</Button>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold text-white">Algo deu errado</h2>
          <p className="text-slate-400">Não foi possível carregar o teste. Tente novamente.</p>
          <Button onClick={() => navigate('/perfil')}>Voltar ao perfil</Button>
        </div>
      </div>
    )
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-lg w-full rounded-3xl bg-slate-800/60 border border-slate-700/50 p-8 text-center space-y-6">
          <div className="text-5xl">📝</div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Teste de Nivelamento CEFR</h2>
            <p className="text-slate-400">
              Responda {questions.length} questões de múltipla escolha. O resultado identifica seu nível
              real de inglês (A1–C2) e atualiza seu perfil.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { icon: '⏱️', label: 'Sem tempo limite' },
              { icon: '📊', label: `${questions.length} questões` },
              { icon: '⭐', label: '+50 XP ao concluir' },
            ].map((i) => (
              <div key={i.label} className="bg-slate-900/50 rounded-xl p-3">
                <div className="text-xl mb-1">{i.icon}</div>
                <p className="text-slate-300 font-medium text-xs">{i.label}</p>
              </div>
            ))}
          </div>
          <Button size="lg" className="w-full" onClick={() => setPhase('test')}>
            Começar o teste
          </Button>
          <button onClick={() => navigate('/perfil')} className="text-slate-500 text-sm hover:text-slate-400 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // ── Test ───────────────────────────────────────────────────────────────────
  if (phase === 'test' && currentQ) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 flex flex-col">
        {/* Top bar */}
        <div className="max-w-2xl mx-auto w-full mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Questão {current + 1} de {questions.length}</span>
            <span>{progress}% concluído</span>
          </div>
          <ProgressBar value={progress} />
        </div>

        {/* Question card */}
        <div className="max-w-2xl mx-auto w-full flex-1">
          <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6 sm:p-8 space-y-6">
            <TestQuestionCard
              question={currentQ}
              index={current}
              total={questions.length}
              selected={selectedAnswer}
              onSelect={(i) => setAnswers((a) => ({ ...a, [currentQ.id]: i }))}
            />

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <Button
                variant="secondary"
                disabled={current === 0}
                onClick={() => setCurrent((c) => c - 1)}
              >
                ← Anterior
              </Button>

              {current < questions.length - 1 ? (
                <Button
                  disabled={selectedAnswer === null}
                  onClick={() => setCurrent((c) => c + 1)}
                >
                  Próxima →
                </Button>
              ) : (
                <Button
                  disabled={!allAnswered || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Enviando...' : 'Finalizar teste ✓'}
                </Button>
              )}
            </div>

            {/* Jump dots */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-2">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrent(i)}
                  className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${
                    i === current
                      ? 'bg-indigo-500 text-white scale-110'
                      : answers[q.id] !== undefined
                      ? 'bg-emerald-600/60 text-emerald-300'
                      : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const pct = Math.round((result.correct / result.total) * 100)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-lg w-full rounded-3xl bg-slate-800/60 border border-slate-700/50 p-8 text-center space-y-6">
          <div className="text-5xl">🎉</div>
          <div>
            <p className="text-slate-400 text-sm mb-2">Seu nível CEFR</p>
            <div className="flex justify-center mb-3">
              <CEFRBadge level={result.level_result} size="lg" />
            </div>
            <p className="text-white text-lg">
              Você acertou <span className="font-bold text-emerald-400">{result.correct}/{result.total}</span> questões ({pct}%)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-indigo-400">+{result.xp_earned}</p>
              <p className="text-slate-400 text-xs mt-1">XP ganho</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-400">{pct}%</p>
              <p className="text-slate-400 text-xs mt-1">Aproveitamento</p>
            </div>
          </div>

          <p className="text-slate-400 text-sm">
            Seu nível foi atualizado no perfil e o bot IAChat já vai usar essa informação nas próximas aulas.
          </p>

          <Button size="lg" className="w-full" onClick={() => navigate('/perfil')}>
            Ver meu perfil atualizado
          </Button>
        </div>
      </div>
    )
  }

  return null
}
