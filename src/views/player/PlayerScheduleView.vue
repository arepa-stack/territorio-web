<template>
  <div class="sched">
    <div class="sched__head">
      <h1 class="sched__title">Mi calendario</h1>
      <button v-if="upcoming.length" type="button" class="btn-ghost" @click="exportCalendar">
        <span class="icon">event</span> Añadir a mi calendario
      </button>
    </div>

    <div v-if="teams.length > 1" class="sched__chips" role="group" aria-label="Equipo">
      <button type="button" class="filter-chip" :aria-pressed="teamFilter === 'ALL'" @click="teamFilter = 'ALL'">Todos</button>
      <button
        v-for="t in teams"
        :key="t.team.id"
        type="button"
        class="filter-chip"
        :aria-pressed="teamFilter === t.team.id"
        @click="teamFilter = t.team.id"
      >{{ t.team.name }}</button>
    </div>

    <p v-if="loading" class="sched__muted">Cargando…</p>
    <p v-else-if="!list.length" class="sched__muted">No hay partidos. Aparecen cuando se genera el fixture de un torneo donde juega tu equipo.</p>

    <div v-else class="sched__layout">
      <!-- Month grid -->
      <section class="cal" aria-labelledby="cal-month">
        <div class="cal__bar">
          <h2 id="cal-month" class="cal__month">{{ monthLabel }}</h2>
          <div class="cal__nav">
            <button type="button" class="filter-chip" @click="goToday">Hoy</button>
            <button v-if="nextMatch" type="button" class="filter-chip" @click="goTo(nextMatch.matchDate)">Próximo partido</button>
            <button type="button" class="cal__arrow" aria-label="Mes anterior" @click="shiftMonth(-1)">‹</button>
            <button type="button" class="cal__arrow" aria-label="Mes siguiente" @click="shiftMonth(1)">›</button>
          </div>
        </div>

        <div class="cal__grid" role="grid" :aria-label="monthLabel">
          <div v-for="w in WEEKDAYS" :key="w" class="cal__wd" role="columnheader">{{ w }}</div>
          <button
            v-for="c in cells"
            :key="c.key"
            type="button"
            role="gridcell"
            class="cal__cell"
            :class="{ 'is-out': !c.inMonth, 'is-today': c.key === todayKey, 'is-selected': c.key === selectedKey, 'has-games': c.matches.length }"
            :aria-label="`${c.day}${c.matches.length ? `, ${c.matches.length} partido${c.matches.length > 1 ? 's' : ''}` : ''}`"
            :aria-pressed="c.key === selectedKey"
            @click="selectedKey = c.key"
          >
            <span class="cal__day">{{ c.day }}</span>
            <span
              v-for="m in c.matches"
              :key="m.id"
              class="cal__ev"
              :class="m.status === 'SCHEDULED' ? 'is-next' : 'is-played'"
            >
              <span class="cal__time">{{ m.matchTime }}</span>
              <span class="cal__vs">vs {{ rivalOf(m) }}</span>
            </span>
          </button>
        </div>
      </section>

      <!-- Selected day -->
      <aside class="day" aria-live="polite">
        <h2 class="day__title">{{ selectedLabel }}</h2>
        <p v-if="!selectedMatches.length" class="sched__muted">No juegas este día.</p>
        <div v-for="m in selectedMatches" :key="m.id" class="day__match">
          <router-link :to="`/app/matches/${m.id}`" class="day__card">
            <span class="day__row">
              <span class="day__time">{{ m.matchTime }}</span>
              <span v-if="m.status === 'FINISHED' || m.status === 'FORFEIT'" class="day__score">{{ m.homeScore }}–{{ m.awayScore }}</span>
              <StatusChip v-else :status="m.status" />
            </span>
            <span class="day__team" :class="{ 'is-mine': m.homeTeamId === myTeamIn(m)?.team.id }">{{ m.homeTeam.name }}</span>
            <span class="day__team" :class="{ 'is-mine': m.awayTeamId === myTeamIn(m)?.team.id }"><span class="day__vs">vs</span> {{ m.awayTeam.name }}</span>
            <span class="day__meta">{{ m.tournament.name }} · Jornada {{ m.round }}</span>
            <span class="day__meta">{{ m.venue || 'Cancha por definir' }}</span>
          </router-link>
          <div v-if="m.status === 'SCHEDULED'" class="day__att">
            <span class="label-tactical text-on-surface-variant">Tu asistencia</span>
            <div class="flex gap-space-xs">
              <button
                v-for="opt in attendanceOptions"
                :key="opt.value"
                type="button"
                class="filter-chip"
                :aria-pressed="m.myAttendance === opt.value"
                :disabled="savingMatchId === m.id"
                @click="markAttendance(m, opt.value)"
              >{{ opt.label }}</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import { formatDay } from '@/utils/labels'
import matchesService from '@/services/matches'
import { handleApiError } from '@/services/api'
import StatusChip from '@/components/ui/StatusChip.vue'
import { downloadIcs } from '@/utils/ics'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const toast = useToast()
const { loading, load, teams, matches, myTeamIn } = usePlayerOverview()
const teamFilter = ref('ALL')
const savingMatchId = ref(null)

const attendanceOptions = [
  { value: 'GOING', label: 'Voy' },
  { value: 'NOT_GOING', label: 'No voy' },
  { value: 'MAYBE', label: 'Quizá' }
]

const markAttendance = async (match, status) => {
  savingMatchId.value = match.id
  try {
    await matchesService.setAttendance(match.id, status)
    match.myAttendance = status
    toast.success('Asistencia actualizada')
  } catch (e) {
    toast.error(handleApiError(e, 'No se pudo guardar tu asistencia'))
  } finally {
    savingMatchId.value = null
  }
}

const upcoming = computed(() => matches.value.filter(m => m.status === 'SCHEDULED'))
const exportCalendar = () => downloadIcs('mis-partidos.ics', upcoming.value)

const list = computed(() =>
  matches.value.filter(m => teamFilter.value === 'ALL' || m.homeTeamId === teamFilter.value || m.awayTeamId === teamFilter.value)
)
// Match dates are UTC calendar days: 'YYYY-MM-DD' keys keep them off the local timezone
const dayKey = d => new Date(d).toISOString().slice(0, 10)
const byDay = computed(() => {
  const map = {}
  for (const m of list.value) (map[dayKey(m.matchDate)] ||= []).push(m)
  for (const k in map) map[k].sort((a, b) => a.matchTime.localeCompare(b.matchTime))
  return map
})

const now = new Date()
const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const nextMatch = computed(() =>
  [...upcoming.value].filter(m => dayKey(m.matchDate) >= todayKey).sort((a, b) => dayKey(a.matchDate).localeCompare(dayKey(b.matchDate)))[0]
)

// Shown month as { y, m } (m 0-11) and the selected day key
const view = ref({ y: now.getFullYear(), m: now.getMonth() })
const selectedKey = ref(todayKey)

const goTo = date => {
  const k = dayKey(date)
  view.value = { y: Number(k.slice(0, 4)), m: Number(k.slice(5, 7)) - 1 }
  selectedKey.value = k
}
const goToday = () => goTo(`${todayKey}T00:00:00Z`)
const shiftMonth = delta => {
  const d = new Date(Date.UTC(view.value.y, view.value.m + delta, 1))
  view.value = { y: d.getUTCFullYear(), m: d.getUTCMonth() }
}

// 6 weeks starting on the Monday on or before the 1st
const cells = computed(() => {
  const first = new Date(Date.UTC(view.value.y, view.value.m, 1))
  const start = new Date(first)
  start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    return { key, day: d.getUTCDate(), inMonth: d.getUTCMonth() === view.value.m, matches: byDay.value[key] || [] }
  })
})

const monthLabel = computed(() =>
  new Date(Date.UTC(view.value.y, view.value.m, 1)).toLocaleDateString('es-VE', { month: 'long', year: 'numeric', timeZone: 'UTC' })
)
const selectedMatches = computed(() => byDay.value[selectedKey.value] || [])
const selectedLabel = computed(() => formatDay(`${selectedKey.value}T00:00:00Z`))

const rivalOf = m => {
  const mine = myTeamIn(m)?.team.id
  return (m.homeTeamId === mine ? m.awayTeam : m.homeTeam)?.name
}

// Open on the next match (or today when there is none) once data arrives
let jumped = false
watch(
  nextMatch,
  m => {
    if (!m || jumped) return
    jumped = true
    goTo(m.matchDate)
  },
  { immediate: true }
)

onMounted(() => load())
</script>

<style scoped>
.sched {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sched__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.sched__title {
  margin: 0;
  font-family: var(--f-display);
  font-size: clamp(44px, 5vw, 72px);
  font-weight: 400;
  line-height: 0.9;
  text-transform: uppercase;
}

.sched__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sched__muted {
  margin: 0;
  font-size: 15px;
  color: rgb(var(--c-on-surface-variant));
}

.sched__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: start;
  gap: 24px;
}

.cal__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.cal__month {
  margin: 0;
  font-family: var(--f-display);
  font-size: 34px;
  font-weight: 400;
  line-height: 1;
  text-transform: uppercase;
}

.cal__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cal__arrow {
  width: 44px;
  height: 44px;
  border: 2px solid rgb(var(--c-outline-variant));
  background: transparent;
  color: rgb(var(--c-on-surface));
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.cal__arrow:hover {
  border-color: rgb(var(--c-on-surface));
}

.cal__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-top: 3px solid rgb(var(--c-on-surface));
  border-left: 1px solid rgb(var(--c-outline-variant) / 0.6);
}

.cal__wd {
  padding: 8px;
  border-right: 1px solid rgb(var(--c-outline-variant) / 0.6);
  border-bottom: 1px solid rgb(var(--c-outline-variant) / 0.6);
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--c-on-surface-variant));
}

.cal__cell {
  display: flex;
  min-width: 0;
  min-height: 104px;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 6px;
  border: 0;
  border-right: 1px solid rgb(var(--c-outline-variant) / 0.6);
  border-bottom: 1px solid rgb(var(--c-outline-variant) / 0.6);
  background: transparent;
  color: rgb(var(--c-on-surface));
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.cal__cell:hover {
  background: rgb(var(--c-surface-container));
}

.cal__cell:focus-visible {
  outline: 3px solid rgb(var(--c-on-surface));
  outline-offset: -3px;
}

.cal__cell.is-out {
  color: rgb(var(--c-on-surface-variant) / 0.5);
}

.cal__cell.is-selected {
  background: rgb(var(--c-surface-container-high));
  box-shadow: inset 0 0 0 2px rgb(var(--c-primary-container));
}

.cal__day {
  align-self: flex-start;
  min-width: 26px;
  padding: 2px 4px;
  font-family: var(--f-mono);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.cal__cell.is-today .cal__day {
  background: rgb(var(--c-on-surface));
  color: rgb(var(--c-surface));
}

.cal__ev {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 3px 5px;
  border-left: 3px solid;
  font-size: 12px;
  line-height: 1.25;
}

.cal__ev.is-next {
  border-color: rgb(var(--c-primary-container));
  background: rgb(var(--c-primary-container) / 0.16);
}

.cal__ev.is-played {
  border-color: rgb(var(--c-on-surface-variant));
  background: rgb(var(--c-surface-container-highest) / 0.6);
  color: rgb(var(--c-on-surface-variant));
}

.cal__time {
  font-family: var(--f-mono);
  font-weight: 700;
}

.cal__vs {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid rgb(var(--c-outline-variant) / 0.6);
  border-top: 6px solid rgb(var(--c-primary-container));
  background: rgb(var(--c-surface-container));
}

.day__title {
  margin: 0;
  font-family: var(--f-display);
  font-size: 26px;
  font-weight: 400;
  line-height: 1;
  text-transform: uppercase;
}

.day__match {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border: 1px solid rgb(var(--c-outline-variant) / 0.6);
  background: rgb(var(--c-surface));
  color: rgb(var(--c-on-surface));
  text-decoration: none;
}

.day__card:hover {
  border-color: rgb(var(--c-primary-container));
}

.day__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.day__time,
.day__score {
  font-family: var(--f-mono);
  font-size: 22px;
  font-weight: 700;
}

.day__team {
  font-family: var(--f-display);
  font-size: 24px;
  line-height: 1.05;
  text-transform: uppercase;
}

.day__team.is-mine {
  color: rgb(var(--c-primary-container));
}

.day__vs {
  font-size: 16px;
  color: rgb(var(--c-on-surface-variant));
}

.day__meta {
  font-size: 13px;
  color: rgb(var(--c-on-surface-variant));
}

.day__att {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

@media (max-width: 1100px) {
  .sched__layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .day {
    position: static;
  }
}

/* Phones: cells shrink to the day number plus a dot and time per game */
@media (max-width: 640px) {
  .cal__month {
    font-size: 26px;
  }

  .cal__cell {
    min-height: 58px;
    padding: 4px 2px;
  }

  .cal__day {
    align-self: center;
    font-size: 12px;
  }

  .cal__wd {
    padding: 6px 2px;
    font-size: 10px;
    text-align: center;
  }

  .cal__ev {
    padding: 2px;
    border-left-width: 0;
    border-top: 3px solid;
    text-align: center;
  }

  .cal__time {
    font-size: 10px;
  }

  .cal__vs {
    display: none;
  }
}
</style>
