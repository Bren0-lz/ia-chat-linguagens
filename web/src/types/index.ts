export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface Student {
  user_id: number
  name: string
  age: number | null
  mode: string | null
  level: CEFRLevel | null
  xp: number
  streak_count: number
  last_active: string | null
  badges: Badge[]
  msg_count: number
  telegram_username?: string
  telegram_photo_url?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked_at: string | null
}

export interface TestQuestion {
  id: number
  cefr_level: CEFRLevel
  question: string
  options: string[]
  skill: string
}

export interface TestResult {
  score: number
  level_result: CEFRLevel
  correct: number
  total: number
  xp_earned: number
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}
