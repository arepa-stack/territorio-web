<template>
  <div class="flex items-center justify-between gap-space-sm">
    <span class="text-body-sm text-on-surface-variant">{{ label }}</span>
    <div class="flex" role="radiogroup" :aria-label="label">
      <button
        v-for="n in 5"
        :key="n"
        type="button"
        role="radio"
        class="icon p-0.5 text-[22px] transition-colors"
        :class="n <= modelValue ? 'text-primary-container' : 'text-outline-variant hover:text-on-surface-variant'"
        :style="n <= modelValue ? { fontVariationSettings: `'FILL' 1` } : null"
        :aria-checked="n === modelValue"
        :aria-label="`${n} de 5`"
        @click="$emit('update:modelValue', n)"
      >star</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: Number, default: 0 }
})
defineEmits(['update:modelValue'])
</script>
