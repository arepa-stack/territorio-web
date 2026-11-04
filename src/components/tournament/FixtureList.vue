<template>
  <div class="flex flex-col gap-space-md">
    <p v-if="!rounds.length" class="m-0 text-body-md text-on-surface-variant">El fixture todavía no se generó.</p>
    <div v-for="r in rounds" :key="r.round" class="flex flex-col gap-space-xs">
      <h3 class="label-tactical m-0 text-on-surface-variant">{{ r.label }}</h3>
      <div v-for="m in r.matches" :key="m.id" class="flex items-stretch gap-space-xs">
      <component
        :is="linkFor ? 'router-link' : 'div'"
        :to="linkFor ? linkFor(m) : undefined"
        class="card flex min-w-0 flex-1 items-center justify-between gap-space-sm p-space-md text-on-surface no-underline"
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
      <button
        v-if="editable && ['SCHEDULED', 'SUSPENDED', 'CANCELLED'].includes(m.status)"
        type="button"
        class="btn-ghost shrink-0 px-space-sm"
        :aria-label="`Editar ${m.homeTeam.name} vs ${m.awayTeam.name}`"
        @click="emit('edit', m)"
      ><span class="icon">edit_calendar</span></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, PHASE_LABEL } from '@/utils/labels'
import { computed } from 'vue'
import StatusChip from '@/components/ui/StatusChip.vue'

// linkFor(match) -> route: when given, each match opens that route (the organizer's match sheet)
const props = defineProps({
  matches: { type: Array, default: () => [] },
  linkFor: { type: Function, default: null },
  // Shows an edit button per unplayed match (organizer: date, time, venue, suspend/cancel)
  editable: { type: Boolean, default: false }
})
const emit = defineEmits(['edit'])


const rounds = computed(() => {
  const byRound = {}
  for (const m of props.matches) (byRound[m.round] ||= []).push(m)
  return Object.keys(byRound)
    .sort((a, b) => a - b)
    .map(r => ({ round: r, label: PHASE_LABEL[byRound[r][0].phase] || `Jornada ${r}`, matches: byRound[r] }))
})
</script>
