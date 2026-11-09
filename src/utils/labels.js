// Spanish labels for API enums, shared by every view.

export const POSITIONS = {
  BASE: 'Base',
  ESCOLTA: 'Escolta',
  ALERO: 'Alero',
  ALA_PIVOT: 'Ala-Pívot',
  PIVOT: 'Pívot'
}

export const CATEGORIES = {
  OPEN: 'Libre',
  SUB_13: 'Sub-13',
  SUB_15: 'Sub-15',
  SUB_17: 'Sub-17',
  SUB_19: 'Sub-19',
  VETERANS: 'Veteranos +35',
  FEMALE: 'Femenina',
  MIXED: 'Mixta'
}

// Playoff options when creating a tournament (0 = champion is the leader of the standings)
export const PLAYOFF_OPTIONS = [
  { value: 0, label: 'Sin playoffs (campeón = 1.º de la tabla)' },
  { value: 2, label: 'Final entre los 2 primeros' },
  { value: 4, label: 'Semifinales con los 4 primeros' },
  { value: 8, label: 'Cuartos con los 8 primeros' }
]
export const PHASE_LABEL = { QF: 'Cuartos de final', SF: 'Semifinales', F: 'Final' }

export const toOptions = map => Object.entries(map).map(([value, label]) => ({ value, label }))

// Dates are stored as UTC calendar days: format in UTC or Venezuela (UTC-4) shows the day before.
// ponytail: timestamps (createdAt) late at night show the next day; add a local formatter if that matters
export const formatDate = d =>
  d ? new Date(d).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-'

export const formatDay = d =>
  d ? new Date(d).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : '-'

// Status label and color on the "cartel de cancha" pages
export const POSTER_STATUS = {
  REGISTRATION: { label: 'Inscripciones', color: '#FF4F12' },
  IN_PROGRESS: { label: 'En juego', color: '#4FD18B' },
  FINISHED: { label: 'Finalizado', color: '#8C877C' },
  CANCELLED: { label: 'Cancelado', color: '#8C877C' },
  DRAFT: { label: 'Borrador', color: '#8C877C' },
  SCHEDULED: { label: 'Programado', color: '#A8A397' },
  SUSPENDED: { label: 'Suspendido', color: '#F5B21B' },
  FORFEIT: { label: 'W.O.', color: '#FF7A45' }
}

export const PAYMENT_METHODS = {
  PAGO_MOVIL: 'Pago Móvil',
  TRANSFERENCIA: 'Transferencia'
}

// Venezuela pays by Pago Móvil; Colombia's phone wallets are Nequi / Daviplata (same fields: bank, phone, id)
export const paymentMethodLabel = (method, country) =>
  method === 'PAGO_MOVIL' && country === 'CO' ? 'Nequi / Daviplata' : PAYMENT_METHODS[method] || method

export const PAYMENT_STATUS = {
  PENDING_REVIEW: 'Pago pendiente de verificación',
  VERIFIED: 'Pago verificado',
  REJECTED: 'Pago rechazado'
}

export const RESCHEDULE_STATUS = {
  PENDING: 'Reprogramación pendiente',
  APPROVED: 'Reprogramación aprobada',
  REJECTED: 'Reprogramación rechazada'
}

export const SANCTION_TYPES = {
  WARNING: 'Amonestación',
  TECHNICAL_FOUL: 'Falta técnica',
  SUSPENSION: 'Suspensión',
  FINE: 'Multa',
  EXPULSION: 'Expulsión',
  PERMANENT_BAN: 'Expulsión definitiva'
}

export const VIOLATION_TYPES = {
  UNSPORTSMANLIKE_CONDUCT: 'Conducta antideportiva',
  VERBAL_ABUSE: 'Insultos',
  PHYSICAL_AGGRESSION: 'Agresión física',
  FIGHTING: 'Pelea',
  OFFICIAL_ABUSE: 'Agresión o insulto al árbitro',
  SPECTATOR_ABUSE: 'Problema con el público',
  EQUIPMENT_ABUSE: 'Daño al equipamiento',
  LATE_ARRIVAL: 'Llegada tarde',
  UNIFORM_VIOLATION: 'Uniforme reglamentario',
  DOPING: 'Doping',
  OTHER: 'Otra'
}

export const SEVERITIES = { MINOR: 'Leve', MAJOR: 'Mayor', SERIOUS: 'Grave' }

export const hasUniformClash = (homeTeam, awayTeam) => {
  const hc = homeTeam?.homeColor?.trim().toLowerCase()
  const ac = awayTeam?.homeColor?.trim().toLowerCase()
  return Boolean(hc && ac && hc === ac)
}

// Organizer payment details form <-> API paymentInfo (a section is sent only if something was typed)
export const emptyPaymentInfo = (info = {}) => ({
  pagoMovil: { banco: '', telefono: '', cedula: '', ...info?.pagoMovil },
  transferencia: { banco: '', cuenta: '', titular: '', rif: '', ...info?.transferencia }
})

export const paymentInfoPayload = form => {
  const pick = section => {
    const trimmed = Object.fromEntries(Object.entries(section).map(([k, v]) => [k, (v || '').trim()]))
    return Object.values(trimmed).some(Boolean) ? trimmed : undefined
  }
  const pagoMovil = pick(form.pagoMovil)
  const transferencia = pick(form.transferencia)
  return pagoMovil || transferencia ? { pagoMovil, transferencia } : undefined
}
