import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [sessionExpired, setSessionExpired] = useState(false)
  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    let active = true
    authApi
      .me()
      .then((current) => {
        if (!active) return
        setUser(current)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!active) return
        setUser(null)
        setStatus('anonymous')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (statusRef.current === 'authenticated') setSessionExpired(true)
      setUser(null)
      setStatus('anonymous')
    })
    return () => setUnauthorizedHandler(() => {})
  }, [])

  const login = useCallback(async (username, password) => {
    const current = await authApi.login(username, password)
    setUser(current)
    setStatus('authenticated')
    setSessionExpired(false)
    return current
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    setStatus('anonymous')
    setSessionExpired(false)
  }, [])

  const clearSessionExpired = useCallback(() => setSessionExpired(false), [])

  const updateProfile = useCallback(async (payload) => {
    const current = await authApi.updateProfile(payload)
    setUser(current)
    setStatus('authenticated')
    return current
  }, [])

  const value = useMemo(
    () => ({ user, status, sessionExpired, login, logout, clearSessionExpired, updateProfile }),
    [user, status, sessionExpired, login, logout, clearSessionExpired, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
