<template>
  <article class="card flex items-center gap-space-md p-space-md" :class="{ 'border-l-4 border-l-primary-container': highlight }">
    <div class="flex w-14 shrink-0 flex-col items-center">
      <span class="font-scoreboard-num text-[22px] leading-none tabular">{{ match.matchTime }}</span>
      <span class="label-tactical text-on-surface-variant">J{{ match.round }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="m-0 truncate font-title-sm text-title-sm">
        <span :class="{ 'text-primary': mine === match.homeTeamId }">{{ match.homeTeam.name }}</span>
        <span class="text-on-surface-variant"> vs </span>
        <span :class="{ 'text-primary': mine === match.awayTeamId }">{{ match.awayTeam.name }}</span>
      </p>
      <p class="m-0 truncate text-body-sm text-on-surface-variant">{{ match.tournament.name }} · {{ match.venue || 'Cancha por definir' }}</p>
    </div>
    <span v-if="match.status === 'FINISHED'" class="font-scoreboard-num text-[22px] tabular">{{ match.homeScore }}–{{ match.awayScore }}</span>
    <StatusChip v-else :status="match.status" />
  </article>
</template>

<script setup>
import StatusChip from '@/components/ui/StatusChip.vue'

// mine: id of the viewer's team in this match, highlighted in orange
defineProps({
  match: { type: Object, required: true },
  mine: { type: String, default: '' },
  highlight: { type: Boolean, default: false }
})
</script>
