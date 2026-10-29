<template>
  <span
    class="inline-flex items-center gap-1 whitespace-nowrap rounded border border-solid px-space-sm py-1 font-stat-mono text-[12px] font-semibold"
    :class="validated ? 'border-tertiary bg-tertiary/15 text-tertiary' : 'border-error/70 bg-surface-container-high text-error'"
  >
    <span class="icon text-[16px]">{{ validated ? 'check' : 'warning' }}</span>
    <template v-if="validated">VALIDADO [{{ count }}/{{ min }} JUG.]</template>
    <template v-else>NO VALIDADO [{{ count }}/{{ min }} FALTAN {{ min - count }}]</template>
  </span>
</template>

<script setup>
import { computed } from 'vue'

// Roster status from the API: { playerCount, minPlayers, status: 'VALIDATED' | 'NOT_VALIDATED' }
const props = defineProps({ roster: { type: Object, required: true } })

const count = computed(() => props.roster.playerCount)
const min = computed(() => props.roster.minPlayers)
const validated = computed(() => props.roster.status === 'VALIDATED')
</script>
