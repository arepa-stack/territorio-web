<template>
  <div class="flex flex-col gap-space-lg">
    <div class="flex flex-wrap items-center justify-between gap-space-sm">
      <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Mi calendario</h1>
      <button v-if="upcoming.length" type="button" class="btn-ghost" @click="exportCalendar">
        <span class="icon">event</span> Añadir a mi calendario
      </button>
    </div>

    <div v-if="teams.length > 1" class="-mx-gutter flex gap-space-xs overflow-x-auto px-gutter pb-1 md:mx-0 md:px-0">
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

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando…</p>
    <p v-else-if="!days.length" class="text-body-md text-on-surface-variant">
      No hay partidos. Aparecen cuando se genera el fixture de un torneo donde juega tu equipo.
    </p>

    <section v-for="d in days" :key="d.key" class="flex flex-col gap-space-xs">
      <h2 class="label-tactical m-0 capitalize text-on-surface-variant">{{ formatDay(d.date) }}</h2>
      <div v-for="m in d.matches" :key="m.id" class="flex flex-col gap-1">
        <router-link :to="`/app/matches/${m.id}`" class="block text-inherit no-underline">
          <MatchCard :match="m" :mine="myTeamIn(m)?.team.id" />
        </router-link>
        <div
          v-if="m.status === 'SCHEDULED'"
          class="card flex flex-wrap items-center justify-between gap-space-xs bg-surface-container-low px-space-md py-space-xs"
        >
          <span class="label-tactical text-on-surface-variant">Tu asistencia:</span>
          <div class="flex gap-space-xs">
            <button
              v-for="opt in attendanceOptions"
              :key="opt.value"
              type="button"
              class="rounded px-space-sm py-1 text-body-sm transition-colors"
              :class="
                m.myAttendance === opt.value
                  ? 'bg-primary-container font-semibold text-white'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              "
              :disabled="savingMatchId === m.id"
              @click="markAttendance(m, opt.value)"
            >{{ opt.label }}</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import { formatDay } from '@/utils/labels'
import matchesService from '@/services/matches'
import { handleApiError } from '@/services/api'
import MatchCard from '@/components/tournament/MatchCard.vue'
import { downloadIcs } from '@/utils/ics'

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

const days = computed(() => {
  const list = matches.value.filter(
    m => teamFilter.value === 'ALL' || m.homeTeamId === teamFilter.value || m.awayTeamId === teamFilter.value
  )
  const byDay = new Map()
  for (const m of list) {
    const key = m.matchDate.slice(0, 10)
    if (!byDay.has(key)) byDay.set(key, { key, date: m.matchDate, matches: [] })
    byDay.get(key).matches.push(m)
  }
  return [...byDay.values()]
})

onMounted(() => load())
</script>
