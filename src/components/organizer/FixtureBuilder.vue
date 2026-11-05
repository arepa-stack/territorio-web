<template>
  <div class="flex flex-col gap-space-md">
    <p class="m-0 text-body-sm text-on-surface-variant">
      Arrastra un equipo a <strong>Local</strong> y otro a <strong>Visitante</strong>, pon fecha y hora y programa el partido.
      En el teléfono: toca un equipo y luego toca el lugar.
    </p>

    <!-- ---------- Groups board (groups tournament) ---------- -->
    <section v-if="isGroups" class="card flex flex-col gap-space-sm p-space-md">
      <div class="flex flex-wrap items-center justify-between gap-space-sm">
        <h2 class="label-tactical m-0 flex items-center gap-space-xs text-on-surface">
          <span class="icon text-[18px] text-secondary">grid_view</span> Grupos
        </h2>
        <div class="flex gap-space-xs">
          <button type="button" class="btn-ghost" :disabled="groupNames.length >= 8" @click="addGroup">
            <span class="icon">add</span> Grupo
          </button>
          <button type="button" class="btn-primary" :disabled="busy || !groupsDirty" @click="saveGroups">
            <span class="icon">save</span> Guardar grupos
          </button>
        </div>
      </div>
      <div class="grid gap-space-sm sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="col in [null, ...groupNames]"
          :key="col ?? 'none'"
          class="drop flex min-h-[96px] flex-col gap-space-xs p-space-sm"
          :class="{ 'drop--hot': hot === `g:${col}` }"
          @dragover.prevent="hot = `g:${col}`"
          @dragleave="hot = ''"
          @drop.prevent="dropOnGroup(col, $event)"
          @click="selected && moveToGroup(selected, col)"
        >
          <span class="label-tactical text-on-surface-variant">{{ col ? `Grupo ${col}` : 'Sin grupo' }}</span>
          <button
            v-for="r in teamsInGroup(col)"
            :key="r.team.id"
            type="button"
            class="chip"
            :class="{ 'chip--on': selected === r.team.id, 'chip--locked': hasGames(r.team.id) }"
            :draggable="!hasGames(r.team.id)"
            :title="hasGames(r.team.id) ? 'Ya tiene partidos: no se puede mover' : 'Arrástralo a otro grupo'"
            @dragstart="drag(r.team.id, $event)"
            @click.stop="!hasGames(r.team.id) && toggle(r.team.id)"
          >
            <TeamBadge :name="r.team.name" :logo-url="r.team.logoUrl || ''" :size="22" />
            <span class="truncate">{{ r.team.name }}</span>
            <span v-if="hasGames(r.team.id)" class="icon text-[14px]">lock</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ---------- Round builder ---------- -->
    <section class="card flex flex-col gap-space-md p-space-md">
      <div class="flex flex-wrap items-center gap-space-xs" role="tablist" aria-label="Jornadas">
        <button
          v-for="r in roundList"
          :key="r"
          type="button"
          role="tab"
          :aria-selected="round === r"
          class="round"
          :class="{ 'round--on': round === r }"
          @click="round = r"
        >J{{ r }}</button>
        <button type="button" class="btn-ghost px-space-sm" @click="round = roundList.length + 1">
          <span class="icon">add</span> Jornada
        </button>
        <span class="ml-auto font-stat-mono text-body-sm text-on-surface-variant">
          {{ pendingPairs }} {{ pendingPairs === 1 ? 'cruce pendiente' : 'cruces pendientes' }}
        </span>
      </div>

      <div v-if="isGroups" class="flex flex-wrap gap-space-xs">
        <button
          v-for="g in savedGroupNames"
          :key="g"
          type="button"
          class="round"
          :class="{ 'round--on': poolGroup === g }"
          @click="poolGroup = g"
        >Grupo {{ g }}</button>
        <span v-if="!savedGroupNames.length" class="text-body-sm text-error">Arma y guarda los grupos para empezar a cruzar equipos.</span>
      </div>

      <!-- Team pool -->
      <div class="flex flex-wrap gap-space-xs">
        <button
          v-for="r in pool"
          :key="r.team.id"
          type="button"
          class="chip"
          :class="{ 'chip--on': selected === r.team.id, 'chip--locked': busyInRound(r.team.id) }"
          :draggable="!busyInRound(r.team.id)"
          :disabled="busyInRound(r.team.id)"
          :title="busyInRound(r.team.id) ? `Ya juega en la jornada ${round}` : 'Arrástralo a Local o Visitante'"
          @dragstart="drag(r.team.id, $event)"
          @click="pick(r.team.id)"
        >
          <TeamBadge :name="r.team.name" :logo-url="r.team.logoUrl || ''" :size="22" />
          <span class="truncate">{{ r.team.name }}</span>
          <span v-if="busyInRound(r.team.id)" class="font-stat-mono text-[11px]">J{{ round }}</span>
        </button>
        <span v-if="!pool.length" class="text-body-sm text-on-surface-variant">No hay equipos aprobados{{ isGroups ? ' en este grupo' : '' }}.</span>
      </div>

      <!-- Slots -->
      <div class="grid items-center gap-space-sm md:grid-cols-[1fr_auto_1fr]">
        <div
          v-for="side in ['home', 'away']"
          :key="side"
          class="drop flex min-h-[72px] items-center justify-center gap-space-sm p-space-sm"
          :class="[{ 'drop--hot': hot === side }, side === 'away' ? 'md:order-3' : '']"
          @dragover.prevent="hot = side"
          @dragleave="hot = ''"
          @drop.prevent="dropOnSlot(side, $event)"
          @click="selected && place(side, selected)"
        >
          <template v-if="slot[side]">
            <TeamBadge :name="teamOf(slot[side]).name" :logo-url="teamOf(slot[side]).logoUrl || ''" :size="32" />
            <span class="font-title-sm text-title-sm">{{ teamOf(slot[side]).name }}</span>
            <button type="button" class="btn-ghost px-1" :aria-label="`Quitar ${teamOf(slot[side]).name}`" @click.stop="slot[side] = ''">
              <span class="icon text-[18px]">close</span>
            </button>
          </template>
          <span v-else class="label-tactical text-on-surface-variant">{{ side === 'home' ? 'Local' : 'Visitante' }}</span>
        </div>
        <span class="vs md:order-2">VS</span>
      </div>

      <form class="grid gap-space-sm md:grid-cols-[1fr_1fr_2fr_auto] md:items-end" @submit.prevent="schedule">
        <div>
          <label class="field-label" for="fb-date">Fecha</label>
          <input id="fb-date" v-model="when.matchDate" type="date" class="input" required />
        </div>
        <div>
          <label class="field-label" for="fb-time">Hora</label>
          <input id="fb-time" v-model="when.matchTime" type="time" class="input" required />
        </div>
        <div>
          <label class="field-label" for="fb-venue">Cancha</label>
          <input id="fb-venue" v-model.trim="when.venue" class="input" list="fb-venues" placeholder="Por definir" />
          <datalist id="fb-venues"><option v-for="v in venueNames" :key="v" :value="v" /></datalist>
        </div>
        <button type="submit" class="btn-primary" :disabled="busy || !!slotProblem">
          <span class="icon">event_available</span> Programar
        </button>
      </form>
      <p v-if="slot.home && slot.away && slotProblem" class="m-0 flex items-center gap-space-xs text-body-sm text-error">
        <span class="icon text-[18px]">warning</span>{{ slotProblem }}
      </p>

      <!-- Games of this round -->
      <div class="flex flex-col gap-space-xs">
        <h3 class="label-tactical m-0 text-on-surface-variant">Jornada {{ round }} · {{ roundGames.length }} {{ roundGames.length === 1 ? 'partido' : 'partidos' }}</h3>
        <p v-if="!roundGames.length" class="m-0 text-body-sm text-on-surface-variant">Todavía no hay partidos en esta jornada.</p>
        <div v-for="m in roundGames" :key="m.id" class="flex items-center gap-space-sm rounded bg-surface-container-low px-space-sm py-space-xs">
          <span v-if="isGroups" class="font-stat-mono text-[12px] text-secondary">{{ groupOf(m.homeTeam.id) }}</span>
          <span class="min-w-0 flex-1 truncate">{{ m.homeTeam.name }} <span class="text-on-surface-variant">vs</span> {{ m.awayTeam.name }}</span>
          <span class="font-stat-mono text-body-sm text-on-surface-variant">{{ formatDate(m.matchDate) }} · {{ m.matchTime }}</span>
          <button
            v-if="m.status === 'SCHEDULED'"
            type="button"
            class="btn-ghost px-1"
            :disabled="busy"
            :aria-label="`Borrar ${m.homeTeam.name} vs ${m.awayTeam.name}`"
            @click="removeGame(m)"
          ><span class="icon text-[18px]">delete</span></button>
        </div>
      </div>
    </section>

    <button v-if="tournament.status === 'REGISTRATION'" type="button" class="btn-primary self-start" :disabled="busy || !regular.length" @click="start">
      <span class="icon">sports_basketball</span> Iniciar torneo con estos partidos
    </button>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import TeamBadge from '@/components/TeamBadge.vue'
import tournamentsService from '@/services/tournaments'
import matchesService from '@/services/matches'
import { handleApiError } from '@/services/api'
import { useConfirm } from '@/composables/useConfirm'
import { formatDate } from '@/utils/labels'

const props = defineProps({
  tournament: { type: Object, required: true },
  registrations: { type: Array, default: () => [] },
  matches: { type: Array, default: () => [] }
})
const emit = defineEmits(['changed'])
const toast = useToast()
const confirm = useConfirm()
const busy = ref(false)

const isGroups = computed(() => props.tournament.format === 'GROUPS')
const approved = computed(() => props.registrations.filter(r => r.status === 'APPROVED'))
const regular = computed(() => props.matches.filter(m => !m.phase && m.status !== 'CANCELLED'))
const venueNames = computed(() => props.tournament.venues?.map(v => v.name) || props.tournament.venueNames || [])
const teamOf = id => approved.value.find(r => r.team.id === id)?.team || { name: '?' }
const hasGames = id => regular.value.some(m => m.homeTeam.id === id || m.awayTeam.id === id)

// ---------- Drag & tap ----------
const selected = ref('')
const hot = ref('')
const toggle = id => (selected.value = selected.value === id ? '' : id)
const drag = (id, e) => {
  e.dataTransfer.setData('text/plain', id)
  e.dataTransfer.effectAllowed = 'move'
}
const dropped = e => {
  hot.value = ''
  return e.dataTransfer.getData('text/plain')
}

// ---------- Groups ----------
// Local draft until "Guardar grupos"; saved groups come from the registrations
const draft = ref({})
const savedGroupOf = id => approved.value.find(r => r.team.id === id)?.groupName || null
watch(approved, regs => (draft.value = Object.fromEntries(regs.map(r => [r.team.id, r.groupName || null]))), { immediate: true })
const extraGroups = ref([])
const groupNames = computed(() => {
  const used = Object.values(draft.value).filter(Boolean)
  const all = [...new Set([...used, ...extraGroups.value])].sort()
  return all.length ? all : ['A', 'B']
})
const savedGroupNames = computed(() => [...new Set(approved.value.map(r => r.groupName).filter(Boolean))].sort())
const groupsDirty = computed(() => approved.value.some(r => (r.groupName || null) !== draft.value[r.team.id]))
const groupOf = id => savedGroupOf(id) || ''
const teamsInGroup = g => approved.value.filter(r => (draft.value[r.team.id] || null) === g)
const addGroup = () => extraGroups.value.push(String.fromCharCode(65 + groupNames.value.length))
const moveToGroup = (id, g) => {
  if (hasGames(id)) return toast.error('Ese equipo ya tiene partidos: bórralos para cambiarlo de grupo')
  draft.value = { ...draft.value, [id]: g }
  selected.value = ''
}
const dropOnGroup = (g, e) => moveToGroup(dropped(e), g)
const saveGroups = () => act(() => tournamentsService.setGroups(props.tournament.id, draft.value), 'Grupos guardados')

const poolGroup = ref('')
watch(savedGroupNames, names => {
  if (!names.includes(poolGroup.value)) poolGroup.value = names[0] || ''
}, { immediate: true })

// ---------- Rounds ----------
const roundList = computed(() => {
  const max = Math.max(1, ...regular.value.map(m => m.round))
  return Array.from({ length: Math.max(max, round.value || 1) }, (_, i) => i + 1)
})
const round = ref(1)
const roundGames = computed(() => regular.value.filter(m => m.round === round.value))
const busyInRound = id => roundGames.value.some(m => m.homeTeam.id === id || m.awayTeam.id === id)
const pool = computed(() => (isGroups.value ? approved.value.filter(r => r.groupName && r.groupName === poolGroup.value) : approved.value))

// Pairs of the round robin (inside each group) still without a game
const pendingPairs = computed(() => {
  const played = new Set(regular.value.map(m => [m.homeTeam.id, m.awayTeam.id].sort().join()))
  const teams = approved.value.filter(r => !isGroups.value || r.groupName)
  let n = 0
  teams.forEach((a, i) =>
    teams.slice(i + 1).forEach(b => {
      if ((!isGroups.value || a.groupName === b.groupName) && !played.has([a.team.id, b.team.id].sort().join())) n++
    })
  )
  return n
})

// ---------- Slots and schedule ----------
const slot = reactive({ home: '', away: '' })
const place = (side, id) => {
  if (busyInRound(id)) return toast.error(`${teamOf(id).name} ya juega en la jornada ${round.value}`)
  const other = side === 'home' ? 'away' : 'home'
  if (slot[other] === id) slot[other] = ''
  slot[side] = id
  selected.value = ''
}
const dropOnSlot = (side, e) => place(side, dropped(e))
// Tap a team: fills the first empty slot (or selects it if both are full)
const pick = id => {
  if (!slot.home) return place('home', id)
  if (!slot.away && slot.home !== id) return place('away', id)
  toggle(id)
}

// Same rules the backend enforces, shown before the click
const slotProblem = computed(() => {
  if (!slot.home || !slot.away) return 'Elige local y visitante'
  const key = [slot.home, slot.away].sort().join()
  const prev = regular.value.find(m => [m.homeTeam.id, m.awayTeam.id].sort().join() === key)
  if (prev) return `Ya se enfrentan en la jornada ${prev.round}`
  if (isGroups.value && savedGroupOf(slot.home) !== savedGroupOf(slot.away)) return 'Son de grupos distintos'
  if (busyInRound(slot.home) || busyInRound(slot.away)) return `Uno de los equipos ya juega en la jornada ${round.value}`
  return ''
})

const isoDay = d => new Date(d).toISOString().slice(0, 10)
// Default date: one week per round from the start; time and venue repeat the last game scheduled
const when = reactive({ matchDate: '', matchTime: '19:00', venue: '' })
watch(
  round,
  r => {
    const sameRound = regular.value.find(m => m.round === r)
    when.matchDate = sameRound ? isoDay(sameRound.matchDate) : isoDay(new Date(props.tournament.startDate).getTime() + (r - 1) * 7 * 86400000)
  },
  { immediate: true }
)

const act = async (fn, ok) => {
  busy.value = true
  try {
    await fn()
    toast.success(ok)
    emit('changed')
    return true
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo completar la acción'))
    return false
  } finally {
    busy.value = false
  }
}

const schedule = async () => {
  const [home, away] = [teamOf(slot.home).name, teamOf(slot.away).name]
  const done = await act(
    () =>
      matchesService.create({
        tournamentId: props.tournament.id,
        homeTeamId: slot.home,
        awayTeamId: slot.away,
        matchDate: `${when.matchDate}T12:00:00.000Z`,
        matchTime: when.matchTime,
        venue: when.venue || 'Por definir',
        round: round.value
      }),
    `${home} vs ${away} programado`
  )
  if (done) slot.home = slot.away = ''
}

const removeGame = async m => {
  const ok = await confirm({ title: 'Borrar partido', message: `${m.homeTeam.name} vs ${m.awayTeam.name} (J${m.round}) se borra del fixture.`, confirmText: 'Borrar', danger: true })
  if (ok) act(() => matchesService.remove(m.id), 'Partido borrado')
}

const start = async () => {
  const ok = await confirm({
    title: 'Iniciar torneo',
    message: `Se cierran las inscripciones y se avisa a los equipos con ${regular.value.length} partidos programados. Puedes seguir armando jornadas después.`,
    confirmText: 'Iniciar torneo'
  })
  if (ok) act(() => tournamentsService.start(props.tournament.id), 'Torneo iniciado')
}
</script>

<style scoped>
.drop {
  border: 2px dashed rgb(var(--c-outline-variant));
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.drop--hot {
  border-color: rgb(var(--c-primary));
  background: rgb(var(--c-primary) / 0.08);
}

.chip {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 4px;
  border: 1px solid rgb(var(--c-outline-variant));
  border-radius: 999px;
  background: rgb(var(--c-surface-container));
  color: rgb(var(--c-on-surface));
  font: inherit;
  font-size: 14px;
  cursor: grab;
}

.chip--on {
  border-color: rgb(var(--c-primary));
  box-shadow: 0 0 0 2px rgb(var(--c-primary) / 0.35);
}

.chip--locked,
.chip:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.round {
  padding: 4px 12px;
  border: 1px solid rgb(var(--c-outline-variant));
  border-radius: 6px;
  background: transparent;
  color: rgb(var(--c-on-surface-variant));
  font-family: var(--f-mono);
  font-size: 13px;
  cursor: pointer;
}

.round--on {
  border-color: rgb(var(--c-primary));
  background: rgb(var(--c-primary) / 0.12);
  color: rgb(var(--c-on-surface));
}

.vs {
  text-align: center;
  font-family: var(--f-display);
  font-size: 28px;
  color: rgb(var(--c-secondary));
}
</style>
