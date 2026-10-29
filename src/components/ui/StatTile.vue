<template>
  <div class="card flex flex-col gap-1 p-space-md">
    <span class="label-tactical text-on-surface-variant">{{ label }}</span>
    <span class="font-scoreboard-num text-scoreboard-num tabular" :class="accent ? 'text-primary-container' : 'text-on-surface'">
      {{ value }}
    </span>
    <span v-if="hint" class="text-body-sm text-on-surface-variant">{{ hint }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  accent: { type: Boolean, default: false }
})
</script>
