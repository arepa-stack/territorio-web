<template>
  <div class="card overflow-x-auto">
    <table class="w-full border-collapse text-left">
      <thead>
        <tr class="label-tactical text-on-surface-variant">
          <th v-for="h in headers" :key="h" class="px-space-md py-space-sm">{{ h }}</th>
        </tr>
      </thead>
      <tbody class="font-stat-mono text-stat-mono tabular">
        <tr v-for="s in standings" :key="s.teamId" class="border-0 border-t border-solid border-outline-variant/30">
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
        <tr v-if="!standings.length">
          <td :colspan="headers.length" class="px-space-md py-space-lg font-body text-body-md text-on-surface-variant">
            La tabla aparece cuando hay equipos aprobados.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import TeamBadge from '@/components/TeamBadge.vue'

defineProps({ standings: { type: Array, default: () => [] } })

const headers = ['Pos', 'Equipo', 'PJ', 'PG', 'PP', 'PF', 'PC', 'DIF', 'PTS']
</script>
