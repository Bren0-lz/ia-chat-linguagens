import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Profile } from './pages/Profile'
import { Test } from './pages/Test'
import { Admin } from './pages/Admin'
import { useAuth } from './hooks/useAuth'
import './index.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { student, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!student) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teste"
          element={
            <ProtectedRoute>
              <Test />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
