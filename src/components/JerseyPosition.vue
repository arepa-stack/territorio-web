<template>
  <div class="grid gap-space-md sm:grid-cols-[8rem_1fr]">
    <div>
      <label class="field-label" :for="id">Dorsal *</label>
      <input
        :id="id"
        class="input font-mono"
        type="number"
        min="0"
        max="99"
        :value="jersey"
        @input="emit('update:jersey', $event.target.value === '' ? null : Number($event.target.value))"
      />
    </div>
    <div>
      <span class="field-label">Posición *</span>
      <div class="flex flex-wrap gap-space-xs">
        <button
          v-for="p in positions"
          :key="p.value"
          type="button"
          class="filter-chip"
          :aria-pressed="position === p.value"
          @click="emit('update:position', p.value)"
        >{{ p.label }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { POSITIONS, toOptions } from '@/utils/labels'

defineProps({ jersey: { type: Number, default: null }, position: { type: String, default: null } })
const emit = defineEmits(['update:jersey', 'update:position'])

const positions = toOptions(POSITIONS)
const id = `jersey-${Math.random().toString(36).slice(2, 8)}`
</script>
