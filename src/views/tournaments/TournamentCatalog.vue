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
        <TournamentCover :src="t.coverPhoto" :alt="`Cancha de ${t.name}`" class="-mx-space-md -mt-space-md h-48">
          <StatusChip :status="t.status" class="absolute right-space-sm top-space-sm" />
          <span class="label-tactical text-secondary">{{ categoryLabel(t.category) }}</span>
          <h2 class="m-0 font-headline-md text-headline-md uppercase text-white">{{ t.name }}</h2>
        </TournamentCover>

        <div class="flex flex-col gap-1 text-body-sm text-on-surface-variant">
          <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ t.location }}</span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">calendar_month</span>{{ formatDate(t.startDate) }} – {{ formatDate(t.endDate) }}
          </span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">payments</span>Inscripción
            <span class="font-stat-mono tabular text-on-surface">{{ Number(t.entryFee) > 0 ? `$${t.entryFee}` : 'Gratis' }}</span>
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

        <div class="flex flex-wrap items-center gap-space-xs">
          <TournamentInfoButton :tournament="t" />
          <router-link :to="`/torneo/${t.id}`" class="btn-ghost text-body-sm">
            <span class="icon text-[18px]">emoji_events</span> Ver fixture y tabla
          </router-link>
        </div>

        <!-- Player participation indicator & waiver -->
        <template v-if="isPlayer && playerRegistrationOf(t)">
          <div class="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-sm">
            <div class="flex flex-wrap items-center justify-between gap-space-xs">
              <router-link
                :to="`/torneo/${t.id}`"
                class="inline-flex items-center gap-1 rounded-full bg-primary-container px-2.5 py-1 text-label-sm font-bold uppercase text-white no-underline"
              >
                <span class="icon text-[16px]">sports_basketball</span> Mi equipo juega aquí ({{ playerRegistrationOf(t).teamName }})
              </router-link>
              <StatusChip :status="playerRegistrationOf(t).status" />
            </div>
            <div class="flex flex-wrap items-center justify-between gap-space-xs pt-1">
              <span v-if="playerRegistrationOf(t).waiverAcceptedAt" class="flex items-center gap-1 text-body-sm text-secondary">
                <span class="icon text-[16px]">verified</span> Reglamento y deslinde aceptado
              </span>
              <button
                v-else
                type="button"
                class="btn-secondary text-body-sm"
                :disabled="acceptingWaiver === t.id"
                @click="acceptWaiver(t)"
              >
                <span class="icon text-[18px]">fact_check</span>
                {{ acceptingWaiver === t.id ? 'Aceptando…' : 'Aceptar reglamento y deslinde' }}
              </button>
            </div>
          </div>
        </template>

        <!-- Captain actions -->
        <template v-if="isCaptain && myTeam">
          <div v-if="registrationOf(t)" class="flex flex-wrap items-center gap-space-xs">
            <span class="text-body-sm text-on-surface-variant">{{ myTeam.name }}:</span>
            <StatusChip :status="registrationOf(t).status" />
            <button
              v-if="registrationOf(t).status === 'REJECTED' && t.status === 'REGISTRATION' && t.registeredTeams < t.maxTeams && confirming !== t.id"
              type="button"
              class="btn-secondary"
              @click="confirming = t.id"
            >
              <span class="icon">replay</span> Volver a inscribir
            </button>
          </div>
          <div v-if="confirming === t.id" class="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-md">
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
            v-else-if="!registrationOf(t) && t.status === 'REGISTRATION' && t.registeredTeams < t.maxTeams"
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
import { formatDate } from '@/utils/labels'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import teamsService from '@/services/teams'
import playersService from '@/services/players'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import { useConfirm } from '@/composables/useConfirm'
import StatusChip from '@/components/ui/StatusChip.vue'
import TournamentCover from '@/components/tournament/TournamentCover.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import TournamentInfoButton from '@/components/ui/TournamentInfoButton.vue'
import PaymentDialog from '@/components/tournament/PaymentDialog.vue'

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
const playerOverview = usePlayerOverview()

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
const isPlayer = computed(() => authStore.userRole === 'PLAYER')

const tournaments = ref([])
const myTeam = ref(null)
const loading = ref(true)
const loadingTeam = ref(true)
const search = ref('')
const status = ref('REGISTRATION')
const confirming = ref(null)
const registering = ref(false)
const acceptingWaiver = ref(null)
const paymentDialog = ref(null)

const categoryLabel = c => CATEGORIES[c] || c
const countStatus = s => (s === 'ALL' ? tournaments.value.length : tournaments.value.filter(t => t.status === s).length)
const registrationOf = t => myTeam.value?.registrations?.find(r => r.tournament.id === t.id)

const playerRegistrationOf = t => {
  if (!isPlayer.value) return null
  for (const membership of playerOverview.teams.value) {
    const reg = membership.registrations?.find(
      r => r.tournament?.id === t.id && (r.status === 'APPROVED' || r.status === 'PENDING')
    )
    if (reg) {
      return { ...reg, teamName: membership.team.name }
    }
  }
  return null
}

const acceptWaiver = async t => {
  const rulesText = t.rules || 'Me comprometo a respetar el reglamento deportivo del torneo y acepto el deslinde de responsabilidad médica y deportiva.'
  const ok = await confirm({
    title: `Reglamento y deslinde — ${t.name}`,
    message: `${rulesText}\n\n¿Confirmas que has leído y aceptas el reglamento y deslinde de responsabilidad?`,
    confirmText: 'Aceptar reglamento'
  })
  if (!ok) return
  acceptingWaiver.value = t.id
  try {
    await playersService.acceptTournamentWaiver(t.id)
    toast.success('Reglamento y deslinde aceptado')
    await playerOverview.load(true)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo registrar tu aceptación'))
  } finally {
    acceptingWaiver.value = null
  }
}

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

onMounted(() => {
  const tasks = [loadTournaments(), loadTeam()]
  if (isPlayer.value) tasks.push(playerOverview.load())
  Promise.all(tasks)
})
</script>
