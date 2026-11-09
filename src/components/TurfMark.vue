<template>
  <!-- Turf avatar: a ball whose seams make the T, gold side seams and the orange dot of "Turf." (Stitch "Ball-T & the dot") -->
  <svg class="turf-mark" viewBox="0 0 64 64" :width="size" :height="size" role="img" aria-label="Turf">
    <circle cx="32" cy="32" r="22" fill="none" stroke="var(--chalk, #ede8dc)" stroke-width="4.5" />
    <rect x="11" y="18" width="42" height="7" rx="1" fill="var(--chalk, #ede8dc)" />
    <rect x="28.5" y="18" width="7" height="34" fill="var(--chalk, #ede8dc)" />
    <path d="M21.5 28.5c3.5 5 3.6 11.5-.6 17.5M42.5 28.5c-3 4.2-3.3 8.8-1.3 12.6" fill="none" stroke="var(--gold, #f5b21b)" stroke-width="2.6" stroke-linecap="round" />
    <circle cx="43.5" cy="44.5" r="5" fill="var(--blaze, #ff4f12)" />
  </svg>
</template>

<script setup>
defineProps({ size: { type: [Number, String], default: 40 } })
</script>

<style scoped>
.turf-mark {
  display: block;
  flex: none;
}
</style>
