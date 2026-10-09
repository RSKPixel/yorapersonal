import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingScreen } from './ui/LoadingScreen'
import { ProtectedRoute } from './ProtectedRoute'

function AdminOnly({ children }) {
  const { status, user } = useAuth()
  if (status === 'loading') return <LoadingScreen />
  if (!user?.is_admin) return <Navigate to="/dashboard" replace />
  return children
}

export function AdminRoute({ children }) {
  return (
    <ProtectedRoute>
      <AdminOnly>{children}</AdminOnly>
    </ProtectedRoute>
  )
}
