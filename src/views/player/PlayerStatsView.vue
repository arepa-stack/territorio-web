<template>
  <div class="flex flex-col gap-space-lg">
    <div class="flex flex-col gap-space-sm sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Mis estadísticas</h1>
        <p class="m-0 mt-1 text-body-md text-on-surface-variant">
          Sumadas de todos tus equipos, a partir de la planilla de cada partido.
        </p>
      </div>
    </div>

    <!-- Filters in one row above the numbers and the chart -->
    <div v-if="matchStats.length" class="flex flex-col gap-space-sm sm:flex-row">
      <div class="sm:w-64">
        <label class="field-label" for="stats-tournament-filter">Torneo</label>
        <select id="stats-tournament-filter" v-model="selectedTournament" class="input">
          <option value="ALL">Todos los torneos</option>
          <option v-for="t in tournamentOptions" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <div class="sm:w-64">
        <label class="field-label" for="stats-rival-filter">Contra</label>
        <select id="stats-rival-filter" v-model="selectedRival" class="input">
          <option value="ALL">Todos los rivales</option>
          <option v-for="r in rivalOptions" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <button v-if="isFiltered" type="button" class="btn-ghost self-end" @click="selectedTournament = selectedRival = 'ALL'">Quitar filtros</button>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando…</p>

    <template v-else-if="stats">
      <section>
        <SectionHeader title="Por partido" icon="speed">
          <span class="font-stat-mono text-stat-mono text-on-surface-variant">{{ filteredSummary.gamesPlayed }} PJ</span>
        </SectionHeader>
        <div class="grid grid-cols-3 gap-space-sm md:grid-cols-5">
          <StatTile label="PTS" :value="filteredPerGame('points')" accent />
          <StatTile label="REB" :value="filteredPerGame('rebounds')" />
          <StatTile label="AST" :value="filteredPerGame('assists')" />
          <StatTile label="ROB" :value="filteredPerGame('steals')" />
          <StatTile label="TAP" :value="filteredPerGame('blocks')" />
        </div>
      </section>

      <MatchBarsChart v-if="filteredMatchStats.length" :matches="filteredMatchStats" />

      <section>
        <SectionHeader title="Totales" icon="functions" />
        <div class="card overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="label-tactical text-on-surface-variant">
                <th v-for="c in columns" :key="c.key" class="px-space-md py-space-sm">{{ c.label }}</th>
              </tr>
            </thead>
            <tbody class="font-stat-mono text-stat-mono tabular">
              <tr class="border-0 border-t border-solid border-outline-variant/30">
                <td v-for="c in columns" :key="c.key" class="px-space-md py-space-sm">{{ filteredSummary[c.key] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Match-by-match breakdown (Task 12) -->
      <section>
        <SectionHeader title="Desglose por partido" icon="list_alt">
          <span class="font-stat-mono text-stat-mono text-on-surface-variant">{{ filteredMatchStats.length }} partidos</span>
        </SectionHeader>
        <div v-if="filteredMatchStats.length" class="card overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="label-tactical text-on-surface-variant">
                <th class="px-space-md py-space-sm">Fecha</th>
                <th class="px-space-md py-space-sm">Torneo</th>
                <th class="px-space-md py-space-sm">Rival</th>
                <th class="px-space-md py-space-sm">PTS</th>
                <th class="px-space-md py-space-sm">3P</th>
                <th class="px-space-md py-space-sm">REB</th>
                <th class="px-space-md py-space-sm">AST</th>
                <th class="px-space-md py-space-sm">ROB</th>
                <th class="px-space-md py-space-sm">TAP</th>
                <th class="px-space-md py-space-sm">PER</th>
                <th class="px-space-md py-space-sm">FAL</th>
              </tr>
            </thead>
            <tbody class="text-body-sm">
              <tr
                v-for="m in pageRows"
                :key="m.matchId"
                class="border-0 border-t border-solid border-outline-variant/30"
              >
                <td class="whitespace-nowrap px-space-md py-space-sm font-stat-mono tabular">
                  {{ formatDate(m.matchDate) }}
                </td>
                <td class="px-space-md py-space-sm text-on-surface-variant">{{ m.tournamentName }}</td>
                <td class="px-space-md py-space-sm">
                  <router-link :to="`/app/matches/${m.matchId}`" class="font-bold text-on-surface hover:text-primary">{{ m.opponentName }}</router-link>
                  <span class="ml-1 font-stat-mono text-on-surface-variant">({{ m.score }})</span>
                </td>
                <td class="px-space-md py-space-sm font-stat-mono font-bold text-primary tabular">{{ m.points }}</td>
                <td class="px-space-md py-space-sm font-stat-mono tabular">{{ m.threePointers }}</td>
                <td class="px-space-md py-space-sm font-stat-mono tabular">{{ m.rebounds }}</td>
                <td class="px-space-md py-space-sm font-stat-mono tabular">{{ m.assists }}</td>
                <td class="px-space-md py-space-sm font-stat-mono tabular">{{ m.steals }}</td>
                <td class="px-space-md py-space-sm font-stat-mono tabular">{{ m.blocks }}</td>
                <td class="px-space-md py-space-sm font-stat-mono tabular">{{ m.turnovers }}</td>
                <td class="px-space-md py-space-sm font-stat-mono tabular">{{ m.fouls }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <nav v-if="pages > 1" class="mt-space-sm flex flex-wrap items-center justify-between gap-space-sm" aria-label="Paginación">
          <button type="button" class="filter-chip disabled:cursor-not-allowed disabled:opacity-40" :disabled="page <= 1" @click="page--">Anterior</button>
          <span class="label-tactical text-on-surface-variant">Página {{ page }} de {{ pages }}</span>
          <button type="button" class="filter-chip disabled:cursor-not-allowed disabled:opacity-40" :disabled="page >= pages" @click="page++">Siguiente</button>
        </nav>
        <p v-if="!filteredMatchStats.length && isFiltered" class="m-0 text-body-md text-on-surface-variant">Ningún partido con estos filtros.</p>
        <p v-else-if="!filteredMatchStats.length" class="m-0 text-body-md text-on-surface-variant">
          Todavía no tienes partidos con planilla. Tus números aparecen cuando se cargan los eventos de un partido.
        </p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { formatDate } from '@/utils/labels'
import { computed, onMounted, ref, watch } from 'vue'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'
import MatchBarsChart from '@/components/player/MatchBarsChart.vue'

const { loading, load, stats, matchStats } = usePlayerOverview()
const selectedTournament = ref('ALL')
const selectedRival = ref('ALL')
const isFiltered = computed(() => selectedTournament.value !== 'ALL' || selectedRival.value !== 'ALL')
const PER_PAGE = 10
const page = ref(1)

const columns = [
  { key: 'gamesPlayed', label: 'PJ' },
  { key: 'points', label: 'PTS' },
  { key: 'rebounds', label: 'REB' },
  { key: 'assists', label: 'AST' },
  { key: 'steals', label: 'ROB' },
  { key: 'blocks', label: 'TAP' },
  { key: 'turnovers', label: 'PER' },
  { key: 'fouls', label: 'FAL' }
]

const tournamentOptions = computed(() => {
  const map = new Map()
  for (const m of matchStats.value) {
    if (m.tournamentId && !map.has(m.tournamentId)) {
      map.set(m.tournamentId, { id: m.tournamentId, name: m.tournamentName || 'Torneo' })
    }
  }
  return Array.from(map.values())
})

// Rivals faced in the chosen tournament (or in all of them)
const rivalOptions = computed(() =>
  [...new Set(matchStats.value.filter(m => selectedTournament.value === 'ALL' || m.tournamentId === selectedTournament.value).map(m => m.opponentName).filter(Boolean))].sort()
)

const filteredMatchStats = computed(() =>
  matchStats.value.filter(
    m =>
      (selectedTournament.value === 'ALL' || m.tournamentId === selectedTournament.value) &&
      (selectedRival.value === 'ALL' || m.opponentName === selectedRival.value)
  )
)

const pages = computed(() => Math.max(1, Math.ceil(filteredMatchStats.value.length / PER_PAGE)))
const pageRows = computed(() => filteredMatchStats.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))
watch([selectedTournament, selectedRival], () => (page.value = 1))
// A rival not met in the newly chosen tournament resets to all
watch(rivalOptions, opts => {
  if (selectedRival.value !== 'ALL' && !opts.includes(selectedRival.value)) selectedRival.value = 'ALL'
})

const filteredSummary = computed(() => {
  if (!isFiltered.value && stats.value) {
    return stats.value
  }
  const base = {
    gamesPlayed: filteredMatchStats.value.length,
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0
  }
  for (const m of filteredMatchStats.value) {
    base.points += m.points || 0
    base.rebounds += m.rebounds || 0
    base.assists += m.assists || 0
    base.steals += m.steals || 0
    base.blocks += m.blocks || 0
    base.turnovers += m.turnovers || 0
    base.fouls += m.fouls || 0
  }
  return base
})

const filteredPerGame = key => {
  const s = filteredSummary.value
  if (!s?.gamesPlayed) return '0.0'
  return (s[key] / s.gamesPlayed).toFixed(1)
}


onMounted(() => load())
</script>
