<template>
  <div class="flex flex-col gap-space-lg">
    <div class="flex flex-col gap-space-sm sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Mis estadísticas</h1>
        <p class="m-0 mt-1 text-body-md text-on-surface-variant">
          Sumadas de todos tus equipos, a partir de la planilla de cada partido.
        </p>
      </div>
      <div v-if="tournamentOptions.length > 1" class="sm:w-64">
        <label class="field-label" for="stats-tournament-filter">Filtrar por torneo</label>
        <select id="stats-tournament-filter" v-model="selectedTournament" class="input">
          <option value="ALL">Todos los torneos</option>
          <option v-for="t in tournamentOptions" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
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
        <SectionHeader title="Desglose por partido" icon="list_alt" />
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
                v-for="m in filteredMatchStats"
                :key="m.matchId"
                class="border-0 border-t border-solid border-outline-variant/30"
              >
                <td class="whitespace-nowrap px-space-md py-space-sm font-stat-mono tabular">
                  {{ formatDate(m.matchDate) }}
                </td>
                <td class="px-space-md py-space-sm text-on-surface-variant">{{ m.tournamentName }}</td>
                <td class="px-space-md py-space-sm">
                  <span class="font-bold">{{ m.opponentName }}</span>
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
        <p v-else class="m-0 text-body-md text-on-surface-variant">
          Todavía no tienes partidos con planilla. Tus números aparecen cuando se cargan los eventos de un partido.
        </p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'

const { loading, load, stats, matchStats } = usePlayerOverview()
const selectedTournament = ref('ALL')

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

const filteredMatchStats = computed(() => {
  if (selectedTournament.value === 'ALL') return matchStats.value
  return matchStats.value.filter(m => m.tournamentId === selectedTournament.value)
})

const filteredSummary = computed(() => {
  if (selectedTournament.value === 'ALL' && stats.value) {
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

const formatDate = d => (d ? new Date(d).toLocaleDateString() : '-')

onMounted(() => load())
</script>
