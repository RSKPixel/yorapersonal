export function safeNextPath(path) {
  if (typeof path !== 'string') return '/dashboard'
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/login')) {
    return '/dashboard'
  }
  return path
}
