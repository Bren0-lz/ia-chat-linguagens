import { useState, useEffect } from 'react'
import { getProfile, getTestAvailability } from '../lib/api'
import type { Student } from '../types'

export function useProfile() {
  const [student, setStudent] = useState<Student | null>(null)
  const [canTest, setCanTest] = useState(false)
  const [testsThisMonth, setTestsThisMonth] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProfile(), getTestAvailability()])
      .then(([s, avail]) => {
        setStudent(s)
        setCanTest(avail.available)
        setTestsThisMonth(avail.tests_this_month)
      })
      .finally(() => setLoading(false))
  }, [])

  return { student, canTest, testsThisMonth, loading }
}
