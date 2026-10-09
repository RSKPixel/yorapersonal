import { api } from './client'

export function login(username, password) {
  return api('/api/auth/login', {
    method: 'POST',
    body: { username, password },
    skipAuthHandler: true,
  })
}

export function logout() {
  return api('/api/auth/logout', { method: 'POST' })
}

export function me() {
  return api('/api/auth/me', { skipAuthHandler: true })
}

export function updateProfile(payload) {
  return api('/api/auth/me', {
    method: 'PUT',
    body: payload,
  })
}
