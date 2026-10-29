<template>
  <div class="flex flex-col gap-space-md">
    <p v-if="!rounds.length" class="m-0 text-body-md text-on-surface-variant">El fixture todavía no se generó.</p>
    <div v-for="r in rounds" :key="r.round" class="flex flex-col gap-space-xs">
      <h3 class="label-tactical m-0 text-on-surface-variant">Jornada {{ r.round }}</h3>
      <component
        :is="linkFor ? 'router-link' : 'div'"
        v-for="m in r.matches"
        :key="m.id"
        :to="linkFor ? linkFor(m) : undefined"
        class="card flex items-center justify-between gap-space-sm p-space-md text-on-surface no-underline"
        :class="{ 'hover:border-primary-container': linkFor }"
      >
        <div class="min-w-0 flex-1">
          <p class="m-0 truncate font-title-sm text-title-sm">
            {{ m.homeTeam.name }} <span class="text-on-surface-variant">vs</span> {{ m.awayTeam.name }}
          </p>
          <p class="m-0 text-body-sm text-on-surface-variant">{{ formatDate(m.matchDate) }} · {{ m.matchTime }} · {{ m.venue }}</p>
        </div>
        <span v-if="m.status === 'FINISHED'" class="font-scoreboard-num text-[22px] tabular">{{ m.homeScore }}–{{ m.awayScore }}</span>
        <StatusChip v-else :status="m.status" />
      </component>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatusChip from '@/components/ui/StatusChip.vue'

// linkFor(match) -> route: when given, each match opens that route (the organizer's match sheet)
const props = defineProps({
  matches: { type: Array, default: () => [] },
  linkFor: { type: Function, default: null }
})

const formatDate = d => (d ? new Date(d).toLocaleDateString() : '-')

const rounds = computed(() => {
  const byRound = {}
  for (const m of props.matches) (byRound[m.round] ||= []).push(m)
  return Object.keys(byRound)
    .sort((a, b) => a - b)
    .map(r => ({ round: r, matches: byRound[r] }))
})
</script>
