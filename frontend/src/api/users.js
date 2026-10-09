import { api } from './client'

export function listUsers() {
  return api('/api/users')
}

export function createUser(payload) {
  return api('/api/users', {
    method: 'POST',
    body: payload,
  })
}

export function updateUser(userPk, payload) {
  return api(`/api/users/${userPk}`, {
    method: 'PUT',
    body: payload,
  })
}
