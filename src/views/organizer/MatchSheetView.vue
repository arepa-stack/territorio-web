<template>
  <div class="flex flex-col gap-space-lg">
    <router-link v-if="match" :to="`/app/organizer/tournament/${match.tournament.id}`" class="btn-ghost self-start px-0">
      <span class="icon">arrow_back</span> {{ match.tournament.name }}
    </router-link>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando planilla…</p>

    <template v-else-if="match">
      <!-- Scoreboard -->
      <section class="card flex flex-col gap-space-md p-space-lg">
        <div class="flex items-center justify-between gap-space-sm">
          <span class="label-tactical text-secondary">Mesa técnica · Jornada {{ match.round }}</span>
          <StatusChip :status="match.status" />
        </div>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-space-md text-center">
          <div>
            <span class="label-tactical text-on-surface-variant">Local</span>
            <p class="m-0 flex items-center justify-center gap-1.5 font-headline-md text-headline-md uppercase">
              <span
                v-if="match.homeTeam.homeColor"
                class="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-solid border-outline-variant"
                :style="{ backgroundColor: match.homeTeam.homeColor }"
                :title="`Uniforme local: ${match.homeTeam.homeColor}`"
              />
              {{ match.homeTeam.name }}
            </p>
            <p class="m-0 font-scoreboard-num text-[48px] leading-none tabular">{{ score.home }}</p>
          </div>
          <span class="font-scoreboard-num text-scoreboard-num text-on-surface-variant">:</span>
          <div>
            <span class="label-tactical text-on-surface-variant">Visitante</span>
            <p class="m-0 flex items-center justify-center gap-1.5 font-headline-md text-headline-md uppercase">
              <span
                v-if="awaySwatch"
                class="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-solid border-outline-variant"
                :style="{ backgroundColor: awaySwatch }"
                :title="`Uniforme visitante: ${awaySwatch}`"
              />
              {{ match.awayTeam.name }}
            </p>
            <p class="m-0 font-scoreboard-num text-[48px] leading-none tabular">{{ score.away }}</p>
          </div>
        </div>
        <p class="m-0 text-center text-body-sm text-on-surface-variant">{{ formatDate(match.matchDate) }} · {{ match.matchTime }} · {{ match.venue }}</p>
        <p
          v-if="clash && !finished"
          class="m-0 flex items-center justify-center gap-space-xs rounded border border-solid border-secondary/40 bg-secondary/10 p-space-sm text-body-sm text-secondary"
        >
          <span class="icon text-[18px]">checkroom</span>
          Ambos equipos tienen el mismo color principal ({{ match.homeTeam.homeColor }}). {{ match.awayTeam.name }} debe usar su uniforme alterno{{ match.awayTeam.awayColor ? ` (${match.awayTeam.awayColor})` : '' }}.
        </p>
        <p
          v-if="match.status === 'FORFEIT'"
          class="m-0 flex items-center justify-center gap-space-xs rounded border border-solid border-error/40 bg-error/10 p-space-sm text-body-sm text-error"
        >
          <span class="icon text-[18px]">event_busy</span>
          Partido definido por W.O. (no presentación de {{ forfeitTeamName }}) · Resultado FIBA 20–0.
        </p>
      </section>

      <template v-if="!finished">
        <!-- Quick entry -->
        <section class="card flex flex-col gap-space-md p-space-md">
          <div class="flex flex-wrap items-center justify-between gap-space-sm">
            <h2 class="m-0 font-headline-md text-headline-md uppercase">Entrada rápida</h2>
            <div class="flex gap-space-xs" role="group" aria-label="Cuarto">
              <button
                v-for="q in [1, 2, 3, 4]"
                :key="q"
                type="button"
                class="filter-chip"
                :aria-pressed="quarter === q"
                @click="quarter = q"
              >{{ q }}Q</button>
            </div>
          </div>

          <div class="grid gap-space-md md:grid-cols-2">
            <div v-for="side in sides" :key="side.key">
              <span class="field-label">{{ side.team.name }}</span>
              <div class="flex flex-wrap gap-space-xs">
                <button
                  v-for="p in side.players"
                  :key="p.id"
                  type="button"
                  class="filter-chip font-mono"
                  :class="{ 'cursor-not-allowed border-error/60 bg-error/15 text-error opacity-60': isSuspended(p.id) }"
                  :aria-pressed="selected?.id === p.id"
                  :disabled="isSuspended(p.id)"
                  :title="isSuspended(p.id) ? `${p.fullName} (Suspendido)` : p.fullName"
                  @click="!isSuspended(p.id) && (selected = p)"
                >
                  #{{ p.jerseyNumber }}
                  <span v-if="isSuspended(p.id)" class="ml-1 rounded bg-error px-1 text-[10px] font-bold uppercase text-white">
                    Suspendido
                  </span>
                </button>
              </div>
            </div>
          </div>

          <p class="m-0 text-body-sm text-on-surface-variant">
            Jugador activo:
            <strong class="text-on-surface">{{ selected ? `#${selected.jerseyNumber} ${selected.fullName}` : 'elige un dorsal' }}</strong>
          </p>

          <div class="grid grid-cols-3 gap-space-xs md:grid-cols-5">
            <button
              v-for="a in actions"
              :key="a.type"
              type="button"
              class="btn-secondary min-h-[56px] flex-col gap-0"
              :disabled="!selected || isSuspended(selected.id) || busy"
              @click="addEvent(a)"
            >
              <span class="font-scoreboard-num text-[18px]" :class="a.points ? 'text-primary' : 'text-on-surface'">{{ a.short }}</span>
              <span class="text-[11px] normal-case tracking-normal text-on-surface-variant">{{ a.label }}</span>
            </button>
          </div>
        </section>

        <div class="flex flex-wrap gap-space-sm">
          <button type="button" class="btn-primary flex-1" :disabled="busy || !events.length" @click="finish">
            <span class="icon">flag</span> Finalizar partido ({{ score.home }}–{{ score.away }})
          </button>
          <button type="button" class="btn-secondary" :disabled="busy" @click="markForfeit(match.homeTeam)">
            <span class="icon">event_busy</span> W.O. {{ match.homeTeam.name }}
          </button>
          <button type="button" class="btn-secondary" :disabled="busy" @click="markForfeit(match.awayTeam)">
            <span class="icon">event_busy</span> W.O. {{ match.awayTeam.name }}
          </button>
        </div>
      </template>

      <!-- Play-by-play -->
      <section>
        <SectionHeader title="Registro" icon="list" />
        <p v-if="!events.length" class="m-0 text-body-md text-on-surface-variant">Todavía no hay jugadas registradas.</p>
        <div class="flex flex-col gap-space-xs">
          <div v-for="e in [...events].reverse()" :key="e.id" class="card flex items-center gap-space-md p-space-sm">
            <span class="label-tactical w-8 text-on-surface-variant">{{ e.quarter }}Q</span>
            <span class="font-stat-mono text-stat-mono text-primary">#{{ e.player.jerseyNumber }}</span>
            <span class="min-w-0 flex-1 truncate text-body-md">{{ e.player.user?.fullName || 'Jugador' }} · {{ e.player.team.name }}</span>
            <span class="label-tactical">{{ labelOf(e.eventType) }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import api, { handleApiError } from '@/services/api'
import matchesService from '@/services/matches'
import teamsService from '@/services/teams'
import { formatDate, hasUniformClash } from '@/utils/labels'
import { useConfirm } from '@/composables/useConfirm'
import StatusChip from '@/components/ui/StatusChip.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'

const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const id = route.params.id

// Event types of the backend EventType enum
const actions = [
  { type: 'POINT_1', short: '+1', label: 'Tiro libre', points: 1 },
  { type: 'POINT_2', short: '+2', label: 'Doble', points: 2 },
  { type: 'POINT_3', short: '+3', label: 'Triple', points: 3 },
  { type: 'REBOUND', short: 'REB', label: 'Rebote' },
  { type: 'ASSIST', short: 'AST', label: 'Asistencia' },
  { type: 'STEAL', short: 'ROB', label: 'Robo' },
  { type: 'BLOCK', short: 'TAP', label: 'Tapón' },
  { type: 'TURNOVER', short: 'PER', label: 'Pérdida' },
  { type: 'FOUL', short: 'FP', label: 'Falta' },
  { type: 'TECHNICAL_FOUL', short: 'FT', label: 'Técnica' }
]
const labelOf = type => actions.find(a => a.type === type)?.label || type
const pointsOf = type => actions.find(a => a.type === type)?.points || 0

const match = ref(null)
const homePlayers = ref([])
const awayPlayers = ref([])
const events = ref([])
const loading = ref(true)
const busy = ref(false)
const quarter = ref(1)
const selected = ref(null)

const finished = computed(() => ['FINISHED', 'FORFEIT'].includes(match.value?.status))
const isSuspended = playerId => (match.value?.suspendedPlayerIds || []).includes(playerId)
const clash = computed(() => hasUniformClash(match.value?.homeTeam, match.value?.awayTeam))
const awaySwatch = computed(() =>
  clash.value ? match.value?.awayTeam?.awayColor || match.value?.awayTeam?.homeColor : match.value?.awayTeam?.homeColor || match.value?.awayTeam?.awayColor
)
const forfeitTeamName = computed(() => {
  if (!match.value?.forfeitTeamId) return ''
  return match.value.forfeitTeamId === match.value.homeTeam.id ? match.value.homeTeam.name : match.value.awayTeam.name
})
const sides = computed(() => [
  { key: 'home', team: match.value.homeTeam, players: homePlayers.value },
  { key: 'away', team: match.value.awayTeam, players: awayPlayers.value }
])

// The scoreboard is the sum of the scoring events (the stored score once finished)
const score = computed(() => {
  if (finished.value) return { home: match.value.homeScore ?? 0, away: match.value.awayScore ?? 0 }
  const sum = teamId => events.value.filter(e => e.player.team.id === teamId).reduce((n, e) => n + pointsOf(e.eventType), 0)
  return { home: sum(match.value.homeTeam.id), away: sum(match.value.awayTeam.id) }
})

const loadEvents = async () => {
  events.value = (await api.get(`/matches/${id}/events`)).data
}

const addEvent = async action => {
  busy.value = true
  try {
    await api.post('/matches/events', {
      matchId: id,
      playerId: selected.value.id,
      eventType: action.type,
      quarter: quarter.value,
      ...(action.points && { points: action.points })
    })
    await loadEvents()
    if (match.value.status === 'SCHEDULED') match.value.status = 'IN_PROGRESS'
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo registrar la jugada'))
  } finally {
    busy.value = false
  }
}

const finish = async () => {
  busy.value = true
  try {
    // Per-quarter partials from the same events
    const quarterScores = {}
    for (const q of [1, 2, 3, 4]) {
      const inQ = events.value.filter(e => e.quarter === q)
      const sum = teamId => inQ.filter(e => e.player.team.id === teamId).reduce((n, e) => n + pointsOf(e.eventType), 0)
      quarterScores[`q${q}`] = { home: sum(match.value.homeTeam.id), away: sum(match.value.awayTeam.id) }
    }
    const res = await api.post(`/matches/${id}/results`, {
      homeScore: score.value.home,
      awayScore: score.value.away,
      quarterScores
    })
    match.value = res.data
    toast.success('Partido finalizado')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cerrar el partido'))
  } finally {
    busy.value = false
  }
}

const markForfeit = async absentTeam => {
  const rival = absentTeam.id === match.value.homeTeam.id ? match.value.awayTeam : match.value.homeTeam
  const ok = await confirm({
    title: 'Marcar W.O. (no presentación)',
    message: `¿Confirmas que "${absentTeam.name}" no se presentó? Se otorgará victoria 20–0 a "${rival.name}" y 0 puntos de clasificación a "${absentTeam.name}".`,
    confirmText: 'Marcar W.O.',
    danger: true
  })
  if (!ok) return

  busy.value = true
  try {
    const res = await matchesService.forfeit(id, absentTeam.id)
    match.value = res.data
    toast.success(`Partido marcado como W.O. por inasistencia de ${absentTeam.name}`)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo marcar el W.O.'))
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    match.value = (await api.get(`/matches/${id}`)).data
    const [home, away] = await Promise.all([
      teamsService.getPlayers(match.value.homeTeam.id),
      teamsService.getPlayers(match.value.awayTeam.id),
      loadEvents()
    ])
    const byNumber = list => [...list.data].sort((a, b) => a.jerseyNumber - b.jerseyNumber)
    homePlayers.value = byNumber(home)
    awayPlayers.value = byNumber(away)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cargar el partido'))
  } finally {
    loading.value = false
  }
})
</script>
