<template>
  <article class="card flex items-center gap-space-md p-space-md" :class="{ 'border-l-4 border-l-primary-container': highlight }">
    <div class="flex w-14 shrink-0 flex-col items-center">
      <span class="font-scoreboard-num text-[22px] leading-none tabular">{{ match.matchTime }}</span>
      <span class="label-tactical text-on-surface-variant">J{{ match.round }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="m-0 flex flex-wrap items-center gap-1.5 truncate font-title-sm text-title-sm">
        <span
          v-if="match.homeTeam?.homeColor"
          class="inline-block h-3 w-3 shrink-0 rounded-full border border-solid border-outline-variant"
          :style="{ backgroundColor: match.homeTeam.homeColor }"
          :title="`Uniforme local ${match.homeTeam.name}: ${match.homeTeam.homeColor}`"
        />
        <span :class="{ 'text-primary': mine === match.homeTeamId }">{{ match.homeTeam.name }}</span>
        <span class="text-on-surface-variant"> vs </span>
        <span
          v-if="awaySwatch"
          class="inline-block h-3 w-3 shrink-0 rounded-full border border-solid border-outline-variant"
          :style="{ backgroundColor: awaySwatch }"
          :title="`Uniforme ${clash ? 'alterno' : 'principal'} ${match.awayTeam.name}: ${awaySwatch}`"
        />
        <span :class="{ 'text-primary': mine === match.awayTeamId }">{{ match.awayTeam.name }}</span>
      </p>
      <p class="m-0 truncate text-body-sm text-on-surface-variant">{{ match.tournament.name }} · {{ match.venue || 'Cancha por definir' }}</p>
      <p v-if="clash && match.status === 'SCHEDULED'" class="m-0 mt-0.5 flex items-center gap-1 text-body-sm text-secondary">
        <span class="icon text-[16px]">checkroom</span>
        Coincidencia de color local: {{ match.awayTeam.name }} usa uniforme alterno{{ match.awayTeam.awayColor ? ` (${match.awayTeam.awayColor})` : '' }}
      </p>
    </div>
    <div v-if="match.status === 'FINISHED' || match.status === 'FORFEIT'" class="flex flex-col items-end gap-0.5">
      <span class="font-scoreboard-num text-[22px] tabular">{{ match.homeScore }}–{{ match.awayScore }}</span>
      <StatusChip v-if="match.status === 'FORFEIT'" status="FORFEIT" />
    </div>
    <StatusChip v-else :status="match.status" />
  </article>
</template>

<script setup>
import { computed } from 'vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { hasUniformClash } from '@/utils/labels'

// mine: id of the viewer's team in this match, highlighted in orange
const props = defineProps({
  match: { type: Object, required: true },
  mine: { type: String, default: '' },
  highlight: { type: Boolean, default: false }
})

const clash = computed(() => hasUniformClash(props.match.homeTeam, props.match.awayTeam))
const awaySwatch = computed(() =>
  clash.value ? props.match.awayTeam?.awayColor || props.match.awayTeam?.homeColor : props.match.awayTeam?.homeColor || props.match.awayTeam?.awayColor
)
</script>
