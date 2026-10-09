import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Alert } from '../components/ui/Alert'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/ui/Button'
import { formatDateTime } from '../utils/format'

export function AppLayout({ title, children }) {
  const { user, logout } = useAuth()
  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    ...(user?.is_admin ? [{ to: '/users', label: 'Users' }] : []),
  ]
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const sidebarOpen = isDesktop || menuOpen
  const lastLoginLabel = user?.last_login_at
    ? `Last login ${formatDateTime(user.last_login_at)}`
    : 'Last login —'

  async function handleLogout() {
    setLogoutError('')
    setLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      setLogoutError(error.message || 'Could not log out.')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {sidebarOpen && !isDesktop ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-stone-900/40"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-stone-900 text-stone-100 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-center border-b border-white/10 px-4 py-4">
          <BrandMark />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-stone-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-sm text-stone-300">
          <p className="truncate font-medium text-white">{user?.full_name}</p>
          <p className="mt-1 truncate text-xs text-stone-400">{lastLoginLabel}</p>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-stone-200 bg-stone-100/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-300 md:hidden"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              Menu
            </button>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/settings/profile"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 transition hover:bg-white"
            >
              Settings
            </Link>
            <Button variant="secondary" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Logging out…' : 'Log out'}
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 md:px-8">
          {logoutError ? <Alert>{logoutError}</Alert> : null}
          {children}
        </main>
      </div>
    </div>
  )
}
