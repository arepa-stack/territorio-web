<template>
  <div ref="root" class="ls">
    <router-link v-if="match" :to="`/app/organizer/tournament/${match.tournament.id}`" class="btn-ghost self-start px-0">
      <span class="icon">arrow_back</span> {{ match.tournament.name }}
    </router-link>

    <p v-if="loading" class="ls__muted">Cargando planilla…</p>

    <template v-else-if="match">
      <!-- Scoreboard -->
      <section class="board">
        <div class="board__team">
          <span class="board__name">
            <span v-if="match.homeTeam.homeColor" class="board__swatch" :style="{ background: match.homeTeam.homeColor }" />
            {{ match.homeTeam.name }}
          </span>
          <span class="board__score">{{ score.home }}</span>
        </div>
        <div class="board__mid">
          <span class="board__label">{{ finished ? 'Final' : `Mesa técnica · J${match.round}` }}</span>
          <GameClock v-if="!finished" :match-id="match.id" :quarter="quarter" :minutes="match.tournament.quarterDuration || 10" />
          <div v-if="!finished" class="board__periods" role="group" aria-label="Periodo">
            <button v-for="q in PERIODS" :key="q" type="button" class="filter-chip board__period" :aria-pressed="quarter === q" @click="quarter = q">{{ periodLabel(q) }}</button>
          </div>
          <StatusChip v-else :status="match.status" />
          <button v-if="!finished" type="button" class="btn-ghost board__fs" @click="toggleFullscreen">
            <span class="icon">{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}</span>
            {{ isFullscreen ? 'Salir' : 'Pantalla completa' }}
          </button>
        </div>
        <div class="board__team board__team--away">
          <span class="board__name">
            <span v-if="awaySwatch" class="board__swatch" :style="{ background: awaySwatch }" />
            {{ match.awayTeam.name }}
          </span>
          <span class="board__score">{{ score.away }}</span>
        </div>
      </section>

      <p v-if="clash && !finished" class="ls__warn">
        Mismo color principal ({{ match.homeTeam.homeColor }}): {{ match.awayTeam.name }} usa su uniforme alterno{{ match.awayTeam.awayColor ? ` (${match.awayTeam.awayColor})` : '' }}.
      </p>
      <p v-if="match.status === 'FORFEIT'" class="ls__warn ls__warn--bad">
        Partido definido por W.O. (no presentación de {{ forfeitTeamName }}) · Resultado FIBA 20–0.
      </p>

      <!-- Live entry: one column per team -->
      <div v-if="!finished" class="pad">
        <section v-for="side in sides" :key="side.key" class="pad__side" :aria-label="side.team.name">
          <div class="pad__head">
            <span class="pad__team">{{ side.team.name }}</span>
            <span class="pad__prompt" :class="{ 'is-on': promptOf(side.key) }">{{ promptOf(side.key) || 'Jugada o dorsal' }}</span>
          </div>

          <div class="pad__points">
            <button v-for="a in SCORING" :key="a.type" type="button" class="pad__pts" @click="tapAction(side.key, a)">+{{ a.points }}</button>
          </div>
          <div class="pad__others">
            <button v-for="a in OTHERS" :key="a.type" type="button" class="pad__act" :title="a.label" @click="tapAction(side.key, a)">{{ a.short }}</button>
          </div>

          <!-- Unassigned plays for this team, oldest first -->
          <div v-if="pendingOf(side.key).length" class="pad__queue">
            <span v-for="p in pendingOf(side.key)" :key="p.key" class="pad__chip">
              {{ p.action.points ? `+${p.action.points}` : p.action.short }}
              <button type="button" class="pad__chip-x" :aria-label="`Quitar ${p.action.label} sin jugador`" @click="dropPending(p)">✕</button>
            </span>
          </div>
          <button v-if="assist?.side === side.key" type="button" class="pad__skip" @click="assist = null">Sin asistencia</button>

          <div class="pad__jerseys">
            <button
              v-for="pl in side.players"
              :key="pl.id"
              type="button"
              class="pad__jersey"
              :class="{ 'is-armed': armed?.id === pl.id, 'is-scorer': assist?.scorerId === pl.id }"
              :disabled="isSuspended(pl.id) || assist?.scorerId === pl.id"
              :title="isSuspended(pl.id) ? `${pl.fullName} (suspendido)` : pl.fullName"
              @click="tapJersey(side.key, pl)"
            >
              <span class="pad__num">{{ pl.jerseyNumber }}</span>
              <span class="pad__pname">{{ isSuspended(pl.id) ? 'Suspendido' : shortName(pl.fullName) }}</span>
              <span v-if="pointsBy[pl.id]" class="pad__ppts">{{ pointsBy[pl.id] }}</span>
            </button>
          </div>
        </section>
      </div>

      <div v-if="!finished" class="ls__actions">
        <button type="button" class="btn-secondary" :disabled="!undoable" @click="undoLast">
          <span class="icon">undo</span> Deshacer última
        </button>
        <button type="button" class="btn-primary ls__finish" :disabled="busy || !events.length || pendingCount > 0" @click="finish">
          <span class="icon">flag</span>
          {{ pendingCount ? `Asigna ${pendingCount} jugada${pendingCount > 1 ? 's' : ''} sin jugador` : `Finalizar partido (${score.home}–${score.away})` }}
        </button>
        <button type="button" class="btn-ghost" :disabled="busy" @click="markForfeit(match.homeTeam)">W.O. {{ match.homeTeam.name }}</button>
        <button type="button" class="btn-ghost" :disabled="busy" @click="markForfeit(match.awayTeam)">W.O. {{ match.awayTeam.name }}</button>
      </div>

      <!-- Play-by-play, newest first -->
      <section class="log">
        <h2 class="log__title">Registro · {{ events.length }} jugadas</h2>
        <p v-if="!events.length" class="ls__muted">Todavía no hay jugadas registradas.</p>
        <div v-for="e in [...events].reverse()" :key="e.id" class="log__row" :class="{ 'is-saving': e.saving }">
          <span class="log__q">{{ periodLabel(e.quarter) }}</span>
          <span class="log__what" :class="{ 'is-pts': pointsOf(e.eventType) }">{{ shortOf(e.eventType) }}</span>
          <span class="log__num">#{{ e.player.jerseyNumber }}</span>
          <span class="log__who">{{ e.player.user?.fullName || e.player.fullName || 'Jugador' }} · {{ e.player.team.name }}</span>
          <span v-if="e.saving" class="log__state">Guardando…</span>
          <button v-else-if="!finished" type="button" class="log__del" :aria-label="`Borrar ${labelOf(e.eventType)} de #${e.player.jerseyNumber}`" @click="removeEvent(e)">✕</button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GameClock from '@/components/organizer/GameClock.vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import api, { handleApiError } from '@/services/api'
import matchesService from '@/services/matches'
import teamsService from '@/services/teams'
import { hasUniformClash } from '@/utils/labels'
import { useConfirm } from '@/composables/useConfirm'
import StatusChip from '@/components/ui/StatusChip.vue'

const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const id = route.params.id

// Event types of the backend EventType enum
const SCORING = [
  { type: 'POINT_1', short: '+1', label: 'Tiro libre', points: 1 },
  { type: 'POINT_2', short: '+2', label: 'Doble', points: 2 },
  { type: 'POINT_3', short: '+3', label: 'Triple', points: 3 }
]
const OTHERS = [
  { type: 'REBOUND', short: 'REB', label: 'Rebote' },
  { type: 'ASSIST', short: 'AST', label: 'Asistencia' },
  { type: 'STEAL', short: 'ROB', label: 'Robo' },
  { type: 'BLOCK', short: 'TAP', label: 'Tapón' },
  { type: 'TURNOVER', short: 'PER', label: 'Pérdida' },
  { type: 'FOUL', short: 'FALTA', label: 'Falta personal' },
  { type: 'TECHNICAL_FOUL', short: 'TÉC', label: 'Falta técnica' }
]
const ACTIONS = [...SCORING, ...OTHERS]
const PERIODS = [1, 2, 3, 4, 5, 6] // 5+ = overtime
const periodLabel = q => (q > 4 ? `TE${q - 4}` : `${q}Q`)
const labelOf = type => ACTIONS.find(a => a.type === type)?.label || type
const shortOf = type => ACTIONS.find(a => a.type === type)?.short || type
const pointsOf = type => ACTIONS.find(a => a.type === type)?.points || 0
const shortName = name => (name || '').split(' ').slice(0, 2).join(' ')

const root = ref(null)
const match = ref(null)
const homePlayers = ref([])
const awayPlayers = ref([])
const events = ref([]) // saved + optimistic (saving: true)
const loading = ref(true)
const busy = ref(false)
const quarter = ref(1)

// Fast entry state
const pending = ref([]) // plays tapped without a player yet, per side, FIFO
const armed = ref(null) // player tapped first: the next play of their team goes to them
const assist = ref(null) // { side, scorerId } right after a basket is assigned
let seq = 0

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
const teamIdOf = side => (side === 'home' ? match.value.homeTeam.id : match.value.awayTeam.id)

// Scoreboard: saved/optimistic events plus points still waiting for a player (the basket did happen)
const score = computed(() => {
  if (finished.value) return { home: match.value.homeScore ?? 0, away: match.value.awayScore ?? 0 }
  const sum = side =>
    events.value.filter(e => e.player.team.id === teamIdOf(side)).reduce((n, e) => n + pointsOf(e.eventType), 0) +
    pending.value.filter(p => p.side === side).reduce((n, p) => n + (p.action.points || 0), 0)
  return { home: sum('home'), away: sum('away') }
})
const pointsBy = computed(() => {
  const map = {}
  for (const e of events.value) map[e.player.id] = (map[e.player.id] || 0) + pointsOf(e.eventType)
  return map
})
const pendingOf = side => pending.value.filter(p => p.side === side)
const pendingCount = computed(() => pending.value.length)
const promptOf = side => {
  const first = pendingOf(side)[0]
  if (first) return `¿Quién? ${first.action.points ? `+${first.action.points}` : first.action.label}`
  if (assist.value?.side === side) return '¿Asistencia?'
  if (armed.value && sides.value.find(s => s.key === side).players.includes(armed.value)) return `#${armed.value.jerseyNumber}: elige la jugada`
  return ''
}
const undoable = computed(() => pending.value.length || events.value.some(e => !e.saving))

// ---- taps ----
const tapAction = (side, action) => {
  assist.value = null
  const player = armed.value && sides.value.find(s => s.key === side).players.includes(armed.value) ? armed.value : null
  armed.value = null
  if (player) return record(side, player, action)
  pending.value.push({ key: ++seq, side, action, quarter: quarter.value })
}

const tapJersey = (side, player) => {
  const first = pendingOf(side)[0]
  if (first) {
    pending.value = pending.value.filter(p => p !== first)
    return record(side, player, first.action, first.quarter)
  }
  if (assist.value?.side === side) {
    assist.value = null
    return record(side, player, OTHERS.find(a => a.type === 'ASSIST'))
  }
  armed.value = armed.value?.id === player.id ? null : player
}

const dropPending = p => (pending.value = pending.value.filter(x => x !== p))

// Optimistic: the play shows at once and is saved in the background
const record = async (side, player, action, q = quarter.value) => {
  const temp = {
    id: `tmp-${++seq}`,
    saving: true,
    eventType: action.type,
    quarter: q,
    player: { id: player.id, jerseyNumber: player.jerseyNumber, user: { fullName: player.fullName }, team: { id: teamIdOf(side), name: sides.value.find(s => s.key === side).team.name } }
  }
  events.value.push(temp)
  if (action.points && action.type !== 'POINT_1') assist.value = { side, scorerId: player.id }
  try {
    const { data } = await api.post('/matches/events', {
      matchId: id,
      playerId: player.id,
      eventType: action.type,
      quarter: q,
      ...(action.points && { points: action.points })
    })
    Object.assign(temp, { id: data?.id ?? temp.id, saving: false })
    events.value = [...events.value] // re-render the row with its real id
    if (match.value.status === 'SCHEDULED') match.value.status = 'IN_PROGRESS'
  } catch (error) {
    events.value = events.value.filter(e => e !== temp)
    if (assist.value?.scorerId === player.id) assist.value = null
    toast.error(handleApiError(error, `No se guardó: ${action.label} de #${player.jerseyNumber}`))
  }
}

const removeEvent = async e => {
  events.value = events.value.filter(x => x !== e)
  if (assist.value) assist.value = null
  try {
    await matchesService.deleteEvent(e.id)
  } catch (error) {
    events.value = [...events.value, e].sort((a, b) => a.quarter - b.quarter)
    toast.error(handleApiError(error, 'No se pudo borrar la jugada'))
  }
}

// Last thing done: an unassigned play first, otherwise the newest saved play
const undoLast = () => {
  if (pending.value.length) return pending.value.pop()
  const last = [...events.value].reverse().find(e => !e.saving)
  if (last) removeEvent(last)
}

// ---- fullscreen for the scorer's tablet ----
const isFullscreen = ref(false)
const onFsChange = () => (isFullscreen.value = Boolean(document.fullscreenElement))
const toggleFullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : root.value?.requestFullscreen?.())

// ---- closing the game ----
const loadEvents = async () => {
  events.value = (await api.get(`/matches/${id}/events`)).data
}

const finish = async () => {
  busy.value = true
  try {
    // Per-period partials from the same events
    const quarterScores = {}
    for (const q of new Set([1, 2, 3, 4, ...events.value.map(e => e.quarter)])) {
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
  document.addEventListener('fullscreenchange', onFsChange)
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
    // Resume on the latest period already played
    quarter.value = Math.max(1, ...events.value.map(e => e.quarter))
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cargar el partido'))
  } finally {
    loading.value = false
  }
})
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFsChange))
</script>

<style scoped>
.ls {
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: rgb(var(--c-surface));
  color: rgb(var(--c-on-surface));
}

.ls:fullscreen {
  overflow-y: auto;
  padding: 16px;
}

.ls__muted {
  margin: 0;
  color: rgb(var(--c-on-surface-variant));
}

.ls__warn {
  margin: 0;
  padding: 10px 14px;
  border: 2px solid rgb(var(--c-secondary));
  color: rgb(var(--c-secondary));
  font-size: 14px;
}

.ls__warn--bad {
  border-color: rgb(var(--c-error));
  color: rgb(var(--c-error));
}

/* Scoreboard */
.board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid rgb(var(--c-outline-variant) / 0.6);
  border-top: 6px solid rgb(var(--c-primary-container));
  background: rgb(var(--c-surface-container));
}

.board__team {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.board__team--away {
  align-items: flex-end;
  text-align: right;
}

.board__name {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  font-family: var(--f-display);
  font-size: 24px;
  line-height: 1;
  text-transform: uppercase;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board__swatch {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 1px solid rgb(var(--c-outline-variant));
}

.board__score {
  font-family: var(--f-mono);
  font-size: clamp(56px, 8vw, 96px);
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.board__mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.board__label {
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--c-secondary));
}

.board__periods {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 4px;
}

.board__period {
  min-height: 40px;
  padding: 6px 10px;
}

.board__fs {
  font-size: 12px;
}

/* Entry pad */
.pad {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.pad__side {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgb(var(--c-outline-variant) / 0.6);
  background: rgb(var(--c-surface-container));
}

.pad__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.pad__team {
  font-family: var(--f-display);
  font-size: 22px;
  line-height: 1;
  text-transform: uppercase;
}

.pad__prompt {
  font-family: var(--f-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--c-on-surface-variant));
}

.pad__prompt.is-on {
  padding: 3px 8px;
  background: rgb(var(--c-secondary));
  color: rgb(var(--c-on-secondary));
}

.pad__points {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.pad__pts,
.pad__act,
.pad__jersey,
.pad__skip,
.pad__chip-x,
.log__del {
  border: 0;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation; /* no double-tap zoom delay */
  -webkit-tap-highlight-color: transparent;
}

.pad__pts {
  min-height: 84px;
  background: rgb(var(--c-primary-container));
  color: rgb(var(--c-on-primary-container));
  font-family: var(--f-mono);
  font-size: 36px;
  font-weight: 700;
}

.pad__pts:active,
.pad__act:active,
.pad__jersey:active {
  transform: scale(0.96);
}

.pad__others {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.pad__act {
  min-height: 52px;
  padding: 0 2px;
  border: 2px solid rgb(var(--c-outline-variant));
  background: transparent;
  color: rgb(var(--c-on-surface));
  font-family: var(--f-mono);
  font-size: 12px;
  font-weight: 700;
}

.pad__act:hover {
  border-color: rgb(var(--c-on-surface));
}

.pad__queue {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pad__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 10px;
  background: rgb(var(--c-secondary));
  color: rgb(var(--c-on-secondary));
  font-family: var(--f-mono);
  font-size: 14px;
  font-weight: 700;
}

.pad__chip-x {
  width: 28px;
  height: 28px;
  background: rgb(0 0 0 / 0.2);
  color: inherit;
}

.pad__skip {
  align-self: flex-start;
  min-height: 40px;
  padding: 0 14px;
  border: 2px solid rgb(var(--c-secondary));
  background: transparent;
  color: rgb(var(--c-secondary));
  font-family: var(--f-mono);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.pad__jerseys {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 6px;
}

.pad__jersey {
  position: relative;
  display: flex;
  min-height: 72px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  border: 2px solid rgb(var(--c-outline-variant));
  background: rgb(var(--c-surface));
  color: rgb(var(--c-on-surface));
}

.pad__jersey:hover:not(:disabled) {
  border-color: rgb(var(--c-on-surface));
}

.pad__jersey.is-armed {
  border-color: rgb(var(--c-primary-container));
  background: rgb(var(--c-primary-container) / 0.18);
}

.pad__jersey:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pad__num {
  font-family: var(--f-mono);
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}

.pad__pname {
  max-width: 100%;
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--c-on-surface-variant));
}

.pad__ppts {
  position: absolute;
  top: 3px;
  right: 4px;
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--c-primary-container));
}

.ls__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ls__finish {
  flex: 1;
}

/* Log */
.log {
  display: flex;
  flex-direction: column;
}

.log__title {
  margin: 0 0 8px;
  font-family: var(--f-display);
  font-size: 24px;
  font-weight: 400;
  text-transform: uppercase;
}

.log__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  border-bottom: 1px solid rgb(var(--c-outline-variant) / 0.5);
}

.log__row.is-saving {
  opacity: 0.6;
}

.log__q,
.log__state {
  width: 36px;
  font-family: var(--f-mono);
  font-size: 11px;
  color: rgb(var(--c-on-surface-variant));
}

.log__state {
  width: auto;
}

.log__what {
  width: 52px;
  font-family: var(--f-mono);
  font-size: 13px;
  font-weight: 700;
}

.log__what.is-pts {
  color: rgb(var(--c-primary-container));
}

.log__num {
  font-family: var(--f-mono);
  font-weight: 700;
}

.log__who {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log__del {
  width: 44px;
  height: 44px;
  background: transparent;
  color: rgb(var(--c-on-surface-variant));
}

.log__del:hover {
  color: rgb(var(--c-error));
}

@media (max-width: 900px) {
  .pad {
    grid-template-columns: minmax(0, 1fr);
  }

  .pad__others {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  /* Phones: both scores on top, periods on their own row */
  .board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 12px;
  }

  .board__mid {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .board__periods {
    grid-template-columns: repeat(6, auto);
  }

  .board__name {
    font-size: 16px;
  }
}
</style>
