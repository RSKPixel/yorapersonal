import { AppLayout } from '../layouts/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Dashboard() {
  const { user } = useAuth()
  useDocumentTitle('Dashboard')
  const firstName = user?.full_name?.split(' ')[0] || 'there'

  return (
    <AppLayout title="Dashboard">
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Welcome back, {firstName}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
        This is your personal workspace.
      </p>
    </AppLayout>
  )
}
