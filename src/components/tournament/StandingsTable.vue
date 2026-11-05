<template>
  <div class="flex flex-col gap-space-md">
    <!-- Groups tournament: one table per group (position is inside the group) -->
    <div v-for="sec in sections" :key="sec.group || 'all'" class="card overflow-x-auto">
      <h3 v-if="sec.group" class="label-tactical m-0 px-space-md pt-space-sm text-secondary">Grupo {{ sec.group }}</h3>
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="label-tactical text-on-surface-variant">
            <th v-for="h in headers" :key="h" class="px-space-md py-space-sm">{{ h }}</th>
          </tr>
        </thead>
        <tbody class="font-stat-mono text-stat-mono tabular">
          <tr v-for="s in sec.rows" :key="s.teamId" class="border-0 border-t border-solid border-outline-variant/30">
            <td class="px-space-md py-space-sm">{{ s.position }}</td>
            <td class="whitespace-nowrap px-space-md py-space-sm font-body text-body-md">
              <span class="inline-flex items-center gap-space-sm"><TeamBadge :name="s.teamName" :logo-url="s.logoUrl || ''" :size="24" />{{ s.teamName }}</span>
            </td>
            <td class="px-space-md py-space-sm">{{ s.gamesPlayed }}</td>
            <td class="px-space-md py-space-sm">{{ s.wins }}</td>
            <td class="px-space-md py-space-sm">{{ s.losses }}</td>
            <td class="px-space-md py-space-sm">{{ s.pointsFor }}</td>
            <td class="px-space-md py-space-sm">{{ s.pointsAgainst }}</td>
            <td class="px-space-md py-space-sm">{{ s.pointDifferential > 0 ? '+' : '' }}{{ s.pointDifferential }}</td>
            <td class="px-space-md py-space-sm text-primary">{{ s.points }}</td>
          </tr>
          <tr v-if="!sec.rows.length">
            <td :colspan="headers.length" class="px-space-md py-space-lg font-body text-body-md text-on-surface-variant">
              La tabla aparece cuando hay equipos aprobados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TeamBadge from '@/components/TeamBadge.vue'

const props = defineProps({ standings: { type: Array, default: () => [] } })

const headers = ['Pos', 'Equipo', 'PJ', 'PG', 'PP', 'PF', 'PC', 'DIF', 'PTS']

// The API sends groups in seed order (1A, 1B, 2A...); split them back into one table per group
const sections = computed(() => {
  if (!props.standings.some(s => s.group)) return [{ group: null, rows: props.standings }]
  const groups = [...new Set(props.standings.map(s => s.group || '?'))].sort()
  return groups.map(group => ({ group, rows: props.standings.filter(s => (s.group || '?') === group) }))
})
</script>
