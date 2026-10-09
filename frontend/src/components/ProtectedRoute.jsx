import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingScreen } from './ui/LoadingScreen'

export function ProtectedRoute({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingScreen />
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
