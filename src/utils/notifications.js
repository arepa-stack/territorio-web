// Notification presentation: category (icon + color) from the backend type, relative time, day groups

const CATEGORIES = [
  { test: t => t.includes('SANCTION') && !t.includes('FINE_PAID'), label: 'Sanción', icon: 'gavel', tone: 'bad' },
  { test: t => t.startsWith('PAYMENT') || t.includes('FINE_PAID'), label: 'Pago', icon: 'payments', tone: 'gold' },
  { test: t => t.startsWith('MATCH') || t.startsWith('RESCHEDULE'), label: 'Partido', icon: 'sports_basketball', tone: 'blaze' },
  { test: t => t.includes('REGISTRATION') || t.startsWith('TOURNAMENT'), label: 'Torneo', icon: 'emoji_events', tone: 'gold' },
  { test: t => t.includes('TEAM') || t.includes('JOIN') || t.includes('PLAYER') || t.includes('CAPTAIN') || t.includes('INVITE'), label: 'Equipo', icon: 'groups', tone: 'good' }
]
const FALLBACK = { label: 'Aviso', icon: 'notifications', tone: 'muted' }

export const categoryOf = type => CATEGORIES.find(c => c.test(type || '')) || FALLBACK

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
const STEPS = [
  [60, 'second', 1],
  [3600, 'minute', 60],
  [86400, 'hour', 3600],
  [604800, 'day', 86400]
]
export const relativeTime = date => {
  const secs = (new Date(date) - Date.now()) / 1000
  const abs = Math.abs(secs)
  if (abs < 45) return 'ahora'
  const step = STEPS.find(([limit]) => abs < limit)
  if (step) return rtf.format(Math.round(secs / step[2]), step[1])
  return new Date(date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
}

// Hoy / Ayer / Esta semana / Antes, keeping the list order (newest first)
export const groupByDay = list => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const day = 86400000
  const labelOf = d => {
    const t = new Date(d).getTime()
    if (t >= start.getTime()) return 'Hoy'
    if (t >= start.getTime() - day) return 'Ayer'
    if (t >= start.getTime() - 6 * day) return 'Esta semana'
    return 'Antes'
  }
  const groups = []
  for (const n of list) {
    const label = labelOf(n.createdAt)
    if (groups.at(-1)?.label !== label) groups.push({ label, items: [] })
    groups.at(-1).items.push(n)
  }
  return groups
}
