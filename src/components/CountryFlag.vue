<template>
  <!-- Inline SVG: emoji flags don't render on Windows -->
  <svg class="flag" viewBox="0 0 30 20" :width="size * 1.5" :height="size" role="img" :aria-label="label">
    <template v-if="code === 'CO'">
      <rect width="30" height="10" fill="#FCD116" />
      <rect y="10" width="30" height="5" fill="#003893" />
      <rect y="15" width="30" height="5" fill="#CE1126" />
    </template>
    <template v-else>
      <rect width="30" height="6.67" fill="#FFCC00" />
      <rect y="6.67" width="30" height="6.67" fill="#00247D" />
      <rect y="13.33" width="30" height="6.67" fill="#CF142B" />
      <!-- 8 stars in an arc, drawn as dots at this size -->
      <circle v-for="(s, i) in STARS" :key="i" :cx="s[0]" :cy="s[1]" r="0.75" fill="#fff" />
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { COUNTRIES } from '@/composables/useCountry'

const props = defineProps({
  code: { type: String, required: true },
  size: { type: Number, default: 14 } // height in px
})
const label = computed(() => `Bandera de ${COUNTRIES[props.code]?.name || props.code}`)
const STARS = Array.from({ length: 8 }, (_, i) => {
  const a = Math.PI * (0.85 - (i * 0.7) / 7) // arc from left to right over the blue stripe
  return [15 + 5.2 * Math.cos(a), 13.6 - 4.2 * Math.sin(a)]
})
</script>

<style scoped>
.flag {
  display: block;
  flex: none;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.25);
}
</style>
