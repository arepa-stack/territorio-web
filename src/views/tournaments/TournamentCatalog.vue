<template>
  <div class="flex flex-col gap-space-lg">
    <div class="flex flex-col gap-space-md md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Torneos</h1>
        <p class="m-0 mt-1 text-body-md text-on-surface-variant">Torneos de la liga, con sus cupos y canchas.</p>
      </div>
      <router-link v-if="isOrganizer" to="/app/organizer" class="btn-secondary">
        <span class="icon">dashboard</span> Gestionar mis torneos
      </router-link>
    </div>

    <!-- Captain without a team -->
    <div v-if="isCaptain && !loadingTeam && !myTeam" class="card flex flex-col gap-space-sm p-space-md md:flex-row md:items-center md:justify-between">
      <p class="m-0 text-body-md">Para inscribirte primero crea tu equipo.</p>
      <router-link to="/app/captain" class="btn-primary">Crear mi equipo</router-link>
    </div>

    <div class="flex flex-col gap-space-sm">
      <div class="relative">
        <label class="sr-only" for="tournament-search">Buscar torneo</label>
        <span class="icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input id="tournament-search" v-model="search" class="input pl-10" placeholder="Buscar por nombre o cancha" />
      </div>
      <div class="-mx-gutter flex gap-space-xs overflow-x-auto px-gutter pb-1 md:mx-0 md:px-0">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          type="button"
          class="filter-chip"
          :aria-pressed="status === f.value"
          @click="status = f.value"
        >{{ f.label }} ({{ countStatus(f.value) }})</button>
      </div>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando torneos…</p>
    <p v-else-if="!filtered.length" class="text-body-md text-on-surface-variant">No hay torneos con este filtro.</p>

    <div class="grid gap-space-md md:grid-cols-2 xl:grid-cols-3">
      <article v-for="t in filtered" :key="t.id" class="card group flex flex-col gap-space-md overflow-hidden p-space-md">
        <!-- Cover: court photo bleeding to the card edges, title over a dark gradient -->
        <div v-if="t.coverPhoto" class="relative -mx-space-md -mt-space-md h-48 overflow-hidden">
          <img
            :src="t.coverPhoto"
            :alt="`Cancha de ${t.name}`"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-[rgba(11,15,23,0.95)] via-[rgba(11,15,23,0.35)] to-transparent" />
          <StatusChip :status="t.status" class="absolute right-space-sm top-space-sm" />
          <div class="absolute inset-x-0 bottom-0 px-space-md pb-space-sm">
            <span class="label-tactical text-secondary">{{ categoryLabel(t.category) }}</span>
            <h2 class="m-0 font-headline-md text-headline-md uppercase text-white">{{ t.name }}</h2>
          </div>
        </div>
        <div v-else class="flex items-start justify-between gap-space-sm">
          <div class="min-w-0">
            <span class="label-tactical text-secondary">{{ categoryLabel(t.category) }}</span>
            <h2 class="m-0 font-headline-md text-headline-md uppercase">{{ t.name }}</h2>
          </div>
          <StatusChip :status="t.status" />
        </div>

        <div class="flex flex-col gap-1 text-body-sm text-on-surface-variant">
          <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ t.location }}</span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">calendar_month</span>{{ formatDate(t.startDate) }} – {{ formatDate(t.endDate) }}
          </span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">payments</span>Inscripción
            <span class="font-stat-mono tabular text-on-surface">${{ t.entryFee }}</span>
          </span>
        </div>

        <div>
          <div class="mb-1 flex justify-between">
            <span class="label-tactical text-on-surface-variant">Cupos</span>
            <span class="font-stat-mono text-stat-mono tabular">{{ t.registeredTeams }}/{{ t.maxTeams }}</span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
            <div class="h-full bg-secondary-container" :style="{ width: Math.min(100, (t.registeredTeams / t.maxTeams) * 100) + '%' }" />
          </div>
        </div>

        <TournamentInfoButton :tournament="t" class="self-start" />

        <!-- Captain actions -->
        <template v-if="isCaptain && myTeam">
          <div v-if="registrationOf(t)" class="flex flex-wrap items-center gap-space-xs">
            <span class="text-body-sm text-on-surface-variant">{{ myTeam.name }}:</span>
            <StatusChip :status="registrationOf(t).status" />
          </div>
          <div v-else-if="confirming === t.id" class="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-md">
            <p class="m-0 text-body-sm">Inscribir a <strong>{{ myTeam.name }}</strong>. Estado de tu plantel:</p>
            <RosterChip v-if="myTeam.roster" :roster="myTeam.roster" class="self-start" />
            <p v-if="myTeam.roster?.status === 'NOT_VALIDATED'" class="m-0 text-body-sm text-on-surface-variant">
              Puedes inscribirte igual; la inscripción se valida al llegar a 5 jugadores.
            </p>
            <div class="flex gap-space-sm">
              <button type="button" class="btn-ghost flex-1" @click="confirming = null">Cancelar</button>
              <button type="button" class="btn-primary flex-1" :disabled="registering" @click="register(t)">Confirmar</button>
            </div>
          </div>
          <button
            v-else-if="t.status === 'REGISTRATION' && t.registeredTeams < t.maxTeams"
            type="button"
            class="btn-primary"
            @click="confirming = t.id"
          >
            <span class="icon">how_to_reg</span> Inscribir mi equipo
          </button>
        </template>
      </article>
    </div>
    <PaymentDialog ref="paymentDialog" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import teamsService from '@/services/teams'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import StatusChip from '@/components/ui/StatusChip.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import TournamentInfoButton from '@/components/ui/TournamentInfoButton.vue'
import PaymentDialog from '@/components/tournament/PaymentDialog.vue'

const toast = useToast()
const authStore = useAuthStore()

const CATEGORIES = {
  OPEN: 'Libre', SUB_13: 'Sub-13', SUB_15: 'Sub-15', SUB_17: 'Sub-17', SUB_19: 'Sub-19',
  VETERANS: 'Veteranos +35', FEMALE: 'Femenina', MIXED: 'Mixta'
}
const statusFilters = [
  { value: 'REGISTRATION', label: 'Inscripciones' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'FINISHED', label: 'Finalizados' },
  { value: 'ALL', label: 'Todos' }
]

const isCaptain = computed(() => authStore.userRole === 'TEAM_CAPTAIN')
const isOrganizer = computed(() => authStore.userRole === 'ORGANIZER')

const tournaments = ref([])
const myTeam = ref(null)
const loading = ref(true)
const loadingTeam = ref(true)
const search = ref('')
const status = ref('REGISTRATION')
const confirming = ref(null)
const registering = ref(false)
const paymentDialog = ref(null)

const categoryLabel = c => CATEGORIES[c] || c
const formatDate = d => (d ? new Date(d).toLocaleDateString() : '-')
const countStatus = s => (s === 'ALL' ? tournaments.value.length : tournaments.value.filter(t => t.status === s).length)
const registrationOf = t => myTeam.value?.registrations?.find(r => r.tournament.id === t.id)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return tournaments.value.filter(
    t =>
      (status.value === 'ALL' || t.status === status.value) &&
      (!q || t.name.toLowerCase().includes(q) || t.location?.toLowerCase().includes(q))
  )
})

const loadTournaments = async () => {
  try {
    const res = await tournamentsService.getAll({ limit: 100 })
    tournaments.value = res.data.tournaments || []
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron cargar los torneos'))
  } finally {
    loading.value = false
  }
}

const loadTeam = async () => {
  if (!isCaptain.value) return (loadingTeam.value = false)
  try {
    const res = await teamsService.getMyTeams()
    myTeam.value = res.data[0] || null
  } catch {
    myTeam.value = null
  } finally {
    loadingTeam.value = false
  }
}

const register = async t => {
  registering.value = true
  try {
    const res = await tournamentsService.registerTeam({ tournamentId: t.id, teamId: myTeam.value.id })
    const validated = res.data.roster?.status === 'VALIDATED'
    toast.success(`Inscrito en ${t.name}. Queda pendiente de aprobación${validated ? '' : ' y tu plantel aún no está validado'}.`)
    const warn = res.data.warning || (res.data.warnings?.length ? res.data.warnings.join(' · ') : '')
    if (warn) toast.warning(warn)
    confirming.value = null
    await Promise.all([loadTournaments(), loadTeam()])
    // Paid tournament: go straight to the payment flow (it can also be done later from the captain panel)
    if (Number(t.entryFee) > 0) {
      tournamentsService
        .getById(t.id)
        .then(({ data }) => paymentDialog.value.open({ id: res.data.id, tournament: data, payment: null }))
        .catch(() => toast.info('Paga la inscripción desde tu panel de capitán'))
    }
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo inscribir el equipo'))
  } finally {
    registering.value = false
  }
}

onMounted(() => Promise.all([loadTournaments(), loadTeam()]))
</script>
