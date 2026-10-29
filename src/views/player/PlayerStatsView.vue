<template>
  <div class="flex flex-col gap-space-lg">
    <div>
      <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Mis estadísticas</h1>
      <p class="m-0 mt-1 text-body-md text-on-surface-variant">
        Sumadas de todos tus equipos, a partir de la planilla de cada partido.
      </p>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando…</p>

    <template v-else-if="stats">
      <section>
        <SectionHeader title="Por partido" icon="speed">
          <span class="font-stat-mono text-stat-mono text-on-surface-variant">{{ stats.gamesPlayed }} PJ</span>
        </SectionHeader>
        <div class="grid grid-cols-3 gap-space-sm md:grid-cols-5">
          <StatTile label="PTS" :value="perGame('points')" accent />
          <StatTile label="REB" :value="perGame('rebounds')" />
          <StatTile label="AST" :value="perGame('assists')" />
          <StatTile label="ROB" :value="perGame('steals')" />
          <StatTile label="TAP" :value="perGame('blocks')" />
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
                <td v-for="c in columns" :key="c.key" class="px-space-md py-space-sm">{{ stats[c.key] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p v-if="!stats.gamesPlayed" class="m-0 text-body-md text-on-surface-variant">
        Todavía no tienes partidos con planilla. Tus números aparecen cuando se cargan los eventos de un partido.
      </p>
    </template>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'

const { loading, load, stats, perGame } = usePlayerOverview()

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

onMounted(() => load())
</script>
