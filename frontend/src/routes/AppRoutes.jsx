import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from '../components/AdminRoute'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import { Dashboard } from '../pages/Dashboard'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { Settings } from '../pages/Settings'
import { Users } from '../pages/Users'

function HomeRedirect() {
  const { status } = useAuth()
  if (status === 'loading') return <LoadingScreen />
  return <Navigate to={status === 'authenticated' ? '/dashboard' : '/login'} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <AdminRoute>
            <Users />
          </AdminRoute>
        }
      />
      <Route
        path="/settings/*"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
