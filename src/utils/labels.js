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

export const toOptions = map => Object.entries(map).map(([value, label]) => ({ value, label }))

export const formatDate = d => (d ? new Date(d).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')

export const formatDay = d =>
  d ? new Date(d).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'

export const PAYMENT_METHODS = {
  PAGO_MOVIL: 'Pago Móvil',
  TRANSFERENCIA: 'Transferencia'
}

export const PAYMENT_STATUS = {
  PENDING_REVIEW: 'Pago pendiente de verificación',
  VERIFIED: 'Pago verificado',
  REJECTED: 'Pago rechazado'
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
