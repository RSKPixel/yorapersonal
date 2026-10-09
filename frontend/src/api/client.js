const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export const API_BASE_URL = String(rawBaseUrl).replace(/\/$/, '')

const CSRF_COOKIE = 'csrf_token'

let onUnauthorized = () => {}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function readCookie(name) {
  const prefix = `${name}=`
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length))
    }
  }
  return ''
}

function errorMessage(payload, fallback) {
  if (!payload) return fallback
  if (typeof payload.detail === 'string') return payload.detail
  if (Array.isArray(payload.detail)) {
    const messages = payload.detail.map((item) => item?.msg).filter(Boolean)
    if (messages.length > 0) return messages.join(' ')
  }
  return fallback
}

export async function api(path, { method = 'GET', body, skipAuthHandler = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const verb = method.toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(verb)) {
    const csrf = readCookie(CSRF_COOKIE)
    if (csrf) headers['X-CSRF-Token'] = csrf
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: verb,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('The server took too long to respond.', 0)
    }
    throw new ApiError('Cannot reach the server. Check that the API is running.', 0)
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && !skipAuthHandler) onUnauthorized()
    throw new ApiError(errorMessage(payload, 'Request failed.'), response.status)
  }
  return payload
}
