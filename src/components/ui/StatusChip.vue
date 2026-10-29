<template>
  <span
    class="label-tactical inline-flex items-center gap-1 whitespace-nowrap rounded border border-solid px-space-sm py-1"
    :class="tone.classes"
  >
    <span v-if="tone.icon" class="icon text-[16px]">{{ tone.icon }}</span>
    <span v-else class="h-1.5 w-1.5 rounded-full" :class="[tone.dot, { 'animate-pulse': tone.pulse }]" />
    {{ tone.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

// One chip for registration approval and tournament / match status.
const TONES = {
  green: 'border-tertiary/50 bg-tertiary/10 text-tertiary',
  amber: 'border-secondary/50 bg-secondary/10 text-secondary',
  red: 'border-error/50 bg-error/10 text-error',
  orange: 'border-primary-container/60 bg-primary-container/10 text-primary',
  muted: 'border-outline-variant/60 bg-surface-container-high text-on-surface-variant'
}
const DOTS = { green: 'bg-tertiary', amber: 'bg-secondary', orange: 'bg-primary-container', muted: 'bg-on-surface-variant' }

const STATUS = {
  // Approval of a team registration
  PENDING: { label: 'Pendiente', tone: 'amber', pulse: true },
  APPROVED: { label: 'Aprobado', tone: 'green' },
  REJECTED: { label: 'Rechazado', tone: 'red', icon: 'cancel' },
  // Tournament
  REGISTRATION: { label: 'Inscripciones', tone: 'orange' },
  IN_PROGRESS: { label: 'En curso', tone: 'green', pulse: true },
  FINISHED: { label: 'Finalizado', tone: 'muted' },
  CANCELLED: { label: 'Cancelado', tone: 'red', icon: 'block' },
  // Match
  SCHEDULED: { label: 'Programado', tone: 'muted' },
  SUSPENDED: { label: 'Suspendido', tone: 'amber', icon: 'pause_circle' },
  FORFEIT: { label: 'W.O.', tone: 'red', icon: 'event_busy' },
  // Registration payment (REJECTED shared above)
  UNPAID: { label: 'Pago pendiente', tone: 'muted', icon: 'payments' },
  PENDING_REVIEW: { label: 'Pendiente de verificación', tone: 'amber', pulse: true },
  VERIFIED: { label: 'Verificado', tone: 'green', icon: 'verified' }
}

// label overrides the default text (e.g. 'Pago rechazado' vs a rejected registration)
const props = defineProps({ status: { type: String, required: true }, label: { type: String, default: '' } })

const tone = computed(() => {
  const s = STATUS[props.status] || { label: props.status, tone: 'muted' }
  return { ...s, ...(props.label && { label: props.label }), classes: TONES[s.tone], dot: DOTS[s.tone] }
})
</script>
