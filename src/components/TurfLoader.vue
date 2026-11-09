<template>
  <!-- Loading state: the Turf avatar with an orange seam arc spinning around it (gold tracer the other way) -->
  <div class="tl" :class="`tl--${size}`" role="status">
    <div class="tl__ring">
      <svg class="tl__arcs" viewBox="0 0 100 100" aria-hidden="true">
        <circle class="tl__track" cx="50" cy="50" r="45" />
        <circle class="tl__arc tl__arc--blaze" cx="50" cy="50" r="45" />
        <circle class="tl__arc tl__arc--gold" cx="50" cy="50" r="45" />
      </svg>
      <TurfMark class="tl__mark" :size="size === 'sm' ? 20 : 54" />
    </div>
    <span class="tl__sr">{{ label }}</span>
  </div>
</template>

<script setup>
import TurfMark from '@/components/TurfMark.vue'

defineProps({
  label: { type: String, default: 'Cargando' }, // screen readers only
  size: { type: String, default: 'md' } // md: page block, sm: inline in a card
})
</script>

<style scoped>
.tl {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.tl--sm {
  justify-content: flex-start;
  padding: 4px 0;
}

.tl__ring {
  position: relative;
  display: grid;
  width: 88px;
  height: 88px;
  place-items: center;
  animation: tl-in 0.3s ease both;
}

.tl--sm .tl__ring {
  width: 32px;
  height: 32px;
}

.tl__arcs {
  position: absolute;
  inset: 0;
  overflow: visible;
}

.tl__track,
.tl__arc {
  fill: none;
  stroke-width: 4;
}

.tl--sm .tl__track,
.tl--sm .tl__arc {
  stroke-width: 7;
}

.tl__track {
  stroke: var(--line, #2a2924);
}

.tl__arc {
  stroke-linecap: round;
  transform-origin: 50% 50%;
}

/* 283 = circumference of r=45 */
.tl__arc--blaze {
  stroke: var(--blaze, #ff4f12);
  stroke-dasharray: 80 283;
  filter: drop-shadow(0 0 4px rgb(255 79 18 / 0.6));
  animation: tl-spin 1.2s linear infinite;
}

.tl__arc--gold {
  stroke: var(--gold, #f5b21b);
  stroke-dasharray: 30 283;
  opacity: 0.85;
  animation: tl-spin 2.4s linear infinite reverse;
}

.tl__mark {
  animation: tl-bounce 1.2s ease-in-out infinite;
}

.tl__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@keyframes tl-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes tl-bounce {
  50% {
    transform: scale(0.92);
  }
}

@keyframes tl-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tl__arc,
  .tl__mark {
    animation-duration: 4s;
  }

  .tl__mark {
    animation: none;
  }
}
</style>
