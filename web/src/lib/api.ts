import type { Student, TestQuestion, TestResult, TelegramUser } from '../types'

const BASE = '/api'

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Auth ────────────────────────────────────────────────────────────────────
export function loginTelegram(user: TelegramUser) {
  const params = new URLSearchParams(user as unknown as Record<string, string>)
  window.location.href = `${BASE}/auth/telegram?${params}`
}

export function logout() {
  return request('/auth/logout', { method: 'POST' })
}

// ── Profile ─────────────────────────────────────────────────────────────────
export function getProfile(): Promise<Student> {
  return request('/profile/me')
}

// ── Tests ───────────────────────────────────────────────────────────────────
export function getTestAvailability(): Promise<{ available: boolean; tests_this_month: number }> {
  return request('/tests/available')
}

export function getTestQuestions(): Promise<{ questions: TestQuestion[] }> {
  return request('/tests/questions')
}

export function submitTest(answers: Record<number, number>): Promise<TestResult> {
  return request('/tests/submit', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}
