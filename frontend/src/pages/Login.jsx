import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { BrandMark } from '../components/BrandMark'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { Form } from '../components/ui/Form'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { safeNextPath } from '../utils/paths'

export function Login() {
  const { status, login, sessionExpired, clearSessionExpired } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useDocumentTitle('Sign in')

  // Chrome often autofills the first text field as a username; clear it on mount.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUsername('')
      setPassword('')
    }, 50)
    return () => window.clearTimeout(timer)
  }, [])

  if (status === 'loading') return <LoadingScreen />
  if (status === 'authenticated') {
    return <Navigate to={safeNextPath(location.state?.from?.pathname)} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!username.trim()) nextErrors.username = 'Enter your username.'
    if (!password) nextErrors.password = 'Enter your password.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await login(username.trim(), password)
      clearSessionExpired()
      navigate(safeNextPath(location.state?.from?.pathname), { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError('Invalid username or password.')
      } else {
        setFormError(error.message || 'Could not sign in.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-stone-100 lg:grid-cols-2">
      <section className="hidden flex-col justify-center bg-stone-900 px-12 py-14 text-stone-100 lg:flex">
        <BrandMark size="lg" />
        <p className="mt-8 max-w-sm text-sm leading-6 text-stone-300">
          A private workspace. Sign in to continue.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <BrandMark tone="light" size="sm" className="lg:hidden" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900 lg:mt-0">Sign in</h2>
          <p className="mt-2 text-sm text-stone-600">Use the administrator account created for this installation.</p>

          <Form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
            {sessionExpired ? <Alert>Your session has expired. Sign in again.</Alert> : null}
            {formError ? <Alert>{formError}</Alert> : null}
            <TextField
              id="yora_signin_code"
              name="yora_signin_code"
              label="Username"
              type="text"
              autoCapitalize="none"
              disableUsernameAutofill
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              error={errors.username}
            />
            <TextField
              id="yora_signin_secret"
              name="yora_signin_secret"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
            />
            <button
              type="button"
              className="text-sm font-medium text-teal-800 hover:text-teal-900"
              onClick={() => setShowPassword((current) => !current)}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Form>
        </div>
      </section>
    </div>
  )
}
