import { useState, useEffect } from 'react'
import { getProfile } from '../lib/api'
import type { Student } from '../types'

interface AuthState {
  student: Student | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAuth(): AuthState {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getProfile()
      .then((s) => { if (!cancelled) { setStudent(s); setError(null) } })
      .catch(() => { if (!cancelled) { setStudent(null); setError(null) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tick])

  return { student, loading, error, refetch: () => setTick((t) => t + 1) }
}
