<template>
  <div class="flex flex-col gap-space-lg">
    <router-link to="/app/organizer" class="btn-ghost self-start px-0">
      <span class="icon">arrow_back</span> Panel
    </router-link>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando torneo…</p>

    <template v-else-if="tournament">
      <!-- Header -->
      <header class="card flex flex-col gap-space-md p-space-lg">
        <div class="flex flex-wrap items-start justify-between gap-space-sm">
          <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">
            {{ tournament.name }}
          </h1>
          <StatusChip :status="tournament.status" />
        </div>
        <div class="flex flex-wrap gap-x-space-lg gap-y-1 text-body-sm text-on-surface-variant">
          <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ tournament.location }}</span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">calendar_month</span>{{ formatDate(tournament.startDate) }} – {{ formatDate(tournament.endDate) }}
          </span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">groups</span>
            <span class="font-stat-mono tabular">{{ registrations.length }}/{{ tournament.maxTeams }}</span> equipos
          </span>
        </div>
      </header>

      <!-- Organizer payment details (what captains see in "Pagar inscripción") -->
      <details v-if="tournament.entryFee > 0" class="card p-space-md">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-space-sm [&::-webkit-details-marker]:hidden">
          <span class="label-tactical flex items-center gap-space-xs text-on-surface">
            <span class="icon text-[18px] text-secondary">account_balance_wallet</span> Datos de pago · ${{ tournament.entryFee }}
          </span>
          <span class="text-body-sm text-on-surface-variant">{{ tournament.paymentInfo ? 'Publicados' : 'Sin publicar' }}</span>
        </summary>
        <form class="mt-space-md flex flex-col gap-space-md" @submit.prevent="savePaymentInfo">
          <PaymentInfoFields v-model="paymentInfoForm" id-prefix="m-pay" />
          <button type="submit" class="btn-primary self-end" :disabled="busy || ['IN_PROGRESS', 'FINISHED'].includes(tournament.status)">
            <span class="icon">save</span> Guardar datos de pago
          </button>
        </form>
      </details>

      <!-- Tabs -->
      <div class="flex gap-space-xs border-b border-solid border-x-0 border-t-0 border-outline-variant/40" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.value"
          type="button"
          role="tab"
          :aria-selected="tab === t.value"
          class="label-tactical cursor-pointer border-0 border-b-2 border-solid bg-transparent px-space-md py-space-sm text-[14px]"
          :class="tab === t.value ? 'border-primary-container text-primary' : 'border-transparent text-on-surface-variant'"
          @click="tab = t.value"
        >{{ t.label }}</button>
      </div>

      <!-- Registrations -->
      <section v-if="tab === 'registrations'" class="flex flex-col gap-space-sm">
        <p v-if="!registrations.length" class="text-body-md text-on-surface-variant">Todavía no hay equipos inscritos.</p>
        <article
          v-for="reg in registrations"
          :key="reg.id"
          class="card flex flex-col gap-space-sm p-space-md md:flex-row md:flex-wrap md:items-center md:justify-between"
        >
          <div class="min-w-0">
            <h3 class="m-0 font-title-sm text-title-sm">{{ reg.team.name }}</h3>
            <p class="m-0 text-body-sm text-on-surface-variant">Capitán: {{ reg.captain.fullName }}</p>
            <div class="mt-space-xs flex flex-wrap gap-space-xs">
              <StatusChip :status="reg.status" />
              <RosterChip v-if="reg.roster" :roster="reg.roster" />
            </div>
          </div>
          <div v-if="reg.status === 'PENDING'" class="flex gap-space-sm">
            <button type="button" class="btn-danger flex-1" :disabled="busy" @click="review(reg, 'REJECTED')">Rechazar</button>
            <button type="button" class="btn-primary flex-1" :disabled="busy" @click="review(reg, 'APPROVED')">Aprobar</button>
          </div>

          <!-- Registration payment (separate from approval, visible before approving) -->
          <div v-if="tournament.entryFee > 0" class="flex w-full flex-col gap-space-xs border-0 border-t border-solid border-outline-variant/40 pt-space-sm md:basis-full">
            <div class="flex flex-wrap items-center gap-space-xs">
              <StatusChip :status="reg.payment?.status || 'UNPAID'" :label="reg.payment ? PAYMENT_STATUS[reg.payment.status] : 'Sin pago reportado'" />
              <span v-if="reg.payment" class="text-body-sm text-on-surface-variant">{{ PAYMENT_METHODS[reg.payment.method] }}</span>
            </div>
            <dl v-if="reg.payment" class="m-0 grid grid-cols-2 gap-x-space-md gap-y-1 text-body-sm sm:grid-cols-4">
              <div><dt class="label-tactical text-on-surface-variant">Referencia</dt><dd class="m-0 break-all font-stat-mono">{{ reg.payment.reference }}</dd></div>
              <div><dt class="label-tactical text-on-surface-variant">Monto</dt><dd class="m-0 font-stat-mono" :class="{ 'text-error': reg.payment.amount < tournament.entryFee }">${{ reg.payment.amount }}</dd></div>
              <div><dt class="label-tactical text-on-surface-variant">Fecha</dt><dd class="m-0">{{ formatDate(reg.payment.paidAt) }}</dd></div>
              <div><dt class="label-tactical text-on-surface-variant">Banco</dt><dd class="m-0">{{ reg.payment.payerBank }}</dd></div>
              <div><dt class="label-tactical text-on-surface-variant">Cédula / RIF</dt><dd class="m-0 font-stat-mono">{{ reg.payment.payerId }}</dd></div>
              <div v-if="reg.payment.payerPhone"><dt class="label-tactical text-on-surface-variant">Teléfono</dt><dd class="m-0 font-stat-mono">{{ reg.payment.payerPhone }}</dd></div>
            </dl>
            <p v-if="reg.payment?.reviewNote" class="m-0 text-body-sm text-on-surface-variant">Nota: {{ reg.payment.reviewNote }}</p>
            <div v-if="reg.payment" class="flex flex-wrap gap-space-sm">
              <button v-if="reg.payment.hasReceipt" type="button" class="btn-ghost" @click="viewReceipt(reg.payment)">
                <span class="icon">receipt_long</span> Ver comprobante
              </button>
              <span v-else class="self-center text-body-sm text-on-surface-variant">Sin comprobante</span>
              <template v-if="reg.payment.status === 'PENDING_REVIEW'">
                <button type="button" class="btn-danger" :disabled="busy" @click="reviewPayment(reg, 'REJECTED')">Rechazar pago</button>
                <button type="button" class="btn-primary" :disabled="busy" @click="reviewPayment(reg, 'VERIFIED')">
                  <span class="icon">verified</span> Verificar pago
                </button>
              </template>
            </div>
          </div>
        </article>
      </section>

      <!-- Fixture -->
      <section v-if="tab === 'fixture'" class="flex flex-col gap-space-md">
        <div v-if="tournament.status === 'REGISTRATION'" class="card flex flex-col gap-space-sm p-space-md">
          <p class="m-0 text-body-md">
            Se generará un fixture todos contra todos con los
            <strong class="font-stat-mono">{{ approved.length }}</strong> equipos aprobados.
          </p>
          <p v-if="fixtureBlocker" class="m-0 flex items-center gap-space-xs text-body-sm text-error">
            <span class="icon text-[18px]">warning</span>{{ fixtureBlocker }}
          </p>
          <button type="button" class="btn-primary self-start" :disabled="!!fixtureBlocker || busy" @click="generateFixture">
            <span class="icon">account_tree</span> Generar fixture
          </button>
        </div>

        <FixtureList :matches="matches" :link-for="m => `/app/organizer/match/${m.id}`" />
      </section>

      <!-- Standings -->
      <StandingsTable v-if="tab === 'standings'" :standings="standings" />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import matchesService from '@/services/matches'
import StatusChip from '@/components/ui/StatusChip.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import FixtureList from '@/components/tournament/FixtureList.vue'
import StandingsTable from '@/components/tournament/StandingsTable.vue'
import PaymentInfoFields from '@/components/tournament/PaymentInfoFields.vue'
import paymentsService from '@/services/payments'
import { handleApiError } from '@/services/api'
import { useConfirm } from '@/composables/useConfirm'
import { PAYMENT_METHODS, PAYMENT_STATUS, emptyPaymentInfo, paymentInfoPayload } from '@/utils/labels'

const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const id = route.params.id

const tabs = [
  { value: 'registrations', label: 'Inscripciones' },
  { value: 'fixture', label: 'Fixture' },
  { value: 'standings', label: 'Tabla' }
]
const tab = ref('registrations')
const loading = ref(true)
const busy = ref(false)
const tournament = ref(null)
const registrations = ref([])
const matches = ref([])
const standings = ref([])
const paymentInfoForm = ref(emptyPaymentInfo())

const approved = computed(() => registrations.value.filter(r => r.status === 'APPROVED'))

// Same rules the backend enforces in generateFixtures, shown before the click
const fixtureBlocker = computed(() => {
  const min = tournament.value?.minTeams ?? 2
  if (approved.value.length < min) return `Se necesitan al menos ${min} equipos aprobados (hay ${approved.value.length}).`
  const notValid = approved.value.filter(r => r.roster?.status === 'NOT_VALIDATED')
  if (notValid.length) return `Planteles sin validar: ${notValid.map(r => r.team.name).join(', ')}.`
  return ''
})

const formatDate = d => (d ? new Date(d).toLocaleDateString() : '-')

const load = async () => {
  try {
    const [t, regs, ms, st] = await Promise.allSettled([
      tournamentsService.getById(id),
      tournamentsService.getRegistrations(id),
      matchesService.getByTournament(id),
      matchesService.getStandings(id)
    ])
    if (t.status === 'rejected') throw t.reason
    tournament.value = t.value.data
    paymentInfoForm.value = emptyPaymentInfo(tournament.value.paymentInfo)
    registrations.value = regs.status === 'fulfilled' ? regs.value.data : []
    matches.value = ms.status === 'fulfilled' ? ms.value.data.matches || [] : []
    standings.value = st.status === 'fulfilled' ? st.value.data.standings || [] : []
  } catch (error) {
    toast.error(error.response?.data?.message || 'No se pudo cargar el torneo')
  } finally {
    loading.value = false
  }
}

const run = async (action, okMessage) => {
  busy.value = true
  try {
    await action()
    toast.success(okMessage)
    await load()
  } catch (error) {
    toast.error(error.response?.data?.message || 'No se pudo completar la acción')
  } finally {
    busy.value = false
  }
}

const review = (reg, decision) =>
  run(
    () => tournamentsService.processRegistration(id, { registrationId: reg.id, decision }),
    `${reg.team.name}: ${decision === 'APPROVED' ? 'aprobado' : 'rechazado'}`
  )

const savePaymentInfo = () => {
  const paymentInfo = paymentInfoPayload(paymentInfoForm.value)
  if (!paymentInfo) return toast.error('Llena los datos de al menos un método de pago')
  return run(() => tournamentsService.update(id, { paymentInfo }), 'Datos de pago guardados')
}

const viewReceipt = async payment => {
  try {
    await paymentsService.openReceipt(payment.id)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo abrir el comprobante'))
  }
}

const reviewPayment = async (reg, status) => {
  const verified = status === 'VERIFIED'
  const note = await confirm({
    title: verified ? 'Verificar pago' : 'Rechazar pago',
    message: verified
      ? `Confirma que recibiste $${reg.payment.amount} de ${reg.team.name} (ref. ${reg.payment.reference}).`
      : `El capitán de ${reg.team.name} será notificado y podrá reenviar el pago.`,
    confirmText: verified ? 'Verificar' : 'Rechazar',
    danger: !verified,
    input: { label: verified ? 'Nota (opcional)' : 'Motivo del rechazo (opcional)', placeholder: verified ? '' : 'La referencia no aparece en el banco' }
  })
  if (note === false) return
  await run(
    () => paymentsService.review(reg.payment.id, { status, ...(note && { note }) }),
    `Pago de ${reg.team.name} ${verified ? 'verificado' : 'rechazado'}`
  )
}

const generateFixture = () => run(() => tournamentsService.generateFixtures(id), 'Fixture generado')

onMounted(load)
</script>
