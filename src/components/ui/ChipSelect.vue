<template>
  <div>
    <span class="field-label">{{ label }}</span>
    <p v-if="!options.length" class="m-0 text-body-sm text-on-surface-variant">{{ empty }}</p>
    <div class="flex flex-wrap gap-space-xs">
      <button
        v-for="o in options"
        :key="o.value"
        type="button"
        class="filter-chip"
        :aria-pressed="modelValue.includes(o.value)"
        @click="toggle(o.value)"
      >{{ o.label }}</button>
    </div>
  </div>
</template>

<script setup>
// Multi-select as toggle chips: fine for the short lists of zones, venues and referees
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  label: { type: String, required: true },
  empty: { type: String, default: 'No hay opciones.' }
})
const emit = defineEmits(['update:modelValue'])

const toggle = value =>
  emit(
    'update:modelValue',
    props.modelValue.includes(value) ? props.modelValue.filter(v => v !== value) : [...props.modelValue, value]
  )
</script>
