<template>
  <!-- Team logo, or a colored square with the team's initials when it has none -->
  <span class="tb" :style="{ '--size': `${size}px`, '--bg': color }" :title="name">
    <img v-if="logoUrl && !broken" :src="logoUrl" :alt="`Logo de ${name}`" class="tb__img" loading="lazy" @error="broken = true" />
    <span v-else class="tb__initials" aria-hidden="true">{{ initials }}</span>
  </span>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  size: { type: Number, default: 28 }
})

const broken = ref(false)
const SKIP = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y'])
// "Halcones de La Paz" -> "HP"
const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(w => w && !SKIP.has(w.toLowerCase()))
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?'
)
// Same team, same color, everywhere
const PALETTE = ['#ff4f12', '#f5b21b', '#4fd18b', '#3d8bff', '#b45cff', '#ff3d7f', '#2ec4d6', '#d6d1c4']
const color = computed(() => PALETTE[[...props.name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % PALETTE.length])
</script>

<style scoped>
.tb {
  display: inline-flex;
  width: var(--size);
  height: var(--size);
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg);
  vertical-align: middle;
}

.tb:has(.tb__img) {
  background: transparent;
}

.tb__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tb__initials {
  font-family: 'Anton', 'Arial Narrow', sans-serif;
  font-size: calc(var(--size) * 0.48);
  line-height: 1;
  letter-spacing: 0.02em;
  color: #0d0d0b;
}
</style>
