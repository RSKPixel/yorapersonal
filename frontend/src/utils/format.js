/** API datetimes are UTC; naive ISO strings must be treated as UTC. */
function parseApiDate(value) {
  if (value instanceof Date) return value
  if (typeof value !== 'string') return new Date(value)
  const trimmed = value.trim()
  if (!trimmed) return new Date(Number.NaN)
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) return new Date(trimmed)
  const withT = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  return new Date(`${withT}Z`)
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = parseApiDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
