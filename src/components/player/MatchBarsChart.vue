<template>
  <!-- One bar per match (oldest → newest) for the chosen metric; dashed line = average, gold bar = best game -->
  <figure class="mbc">
    <div class="mbc__head">
      <figcaption class="mbc__title">
        {{ METRICS[metric].label }} por partido
        <span class="mbc__sub">Promedio {{ avg.toFixed(1) }} · Mejor {{ best?.[metric] ?? 0 }}</span>
      </figcaption>
      <div class="mbc__metrics" role="group" aria-label="Métrica">
        <button v-for="(m, key) in METRICS" :key="key" type="button" class="filter-chip" :aria-pressed="metric === key" @click="metric = key">{{ m.short }}</button>
      </div>
    </div>

    <div class="mbc__plot" @mouseleave="hover = null">
      <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="mbc__svg" role="img" :aria-label="ariaLabel">
        <!-- recessive grid -->
        <line v-for="t in ticks" :key="t" :x1="PAD_L" :x2="W" :y1="y(t)" :y2="y(t)" class="mbc__grid" />
        <rect
          v-for="(m, i) in series"
          :key="m.matchId"
          :x="x(i) + GAP / 2"
          :y="y(m[metric])"
          :width="Math.max(1, barW - GAP)"
          :height="Math.max(0, y(0) - y(m[metric]))"
          :class="['mbc__bar', { 'is-best': m === best, 'is-hover': hover === i }]"
        />
        <line :x1="PAD_L" :x2="W" :y1="y(avg)" :y2="y(avg)" class="mbc__avg" />
        <!-- hit targets wider than the bars -->
        <rect v-for="(m, i) in series" :key="`hit-${m.matchId}`" :x="x(i)" y="0" :width="barW" :height="H" class="mbc__hit" @mouseenter="hover = i" @click="hover = i" />
      </svg>
      <!-- axis labels live in HTML so they don't stretch with the SVG -->
      <span v-for="t in ticks" :key="`l-${t}`" class="mbc__tick" :style="{ top: `${(y(t) / H) * 100}%` }">{{ t }}</span>
      <span class="mbc__avg-label" :style="{ top: `${(y(avg) / H) * 100}%` }">Prom. {{ avg.toFixed(1) }}</span>

      <div v-if="hover !== null" class="mbc__tip" :style="tipStyle" role="status">
        <span class="mbc__tip-date">{{ formatDate(series[hover].matchDate) }} · vs {{ series[hover].opponentName }}</span>
        <span class="mbc__tip-main">{{ series[hover][metric] }} {{ METRICS[metric].short }}</span>
        <span class="mbc__tip-rest">{{ series[hover].points }} PTS · {{ series[hover].rebounds }} REB · {{ series[hover].assists }} AST</span>
      </div>
    </div>
    <div class="mbc__axis"><span>{{ series.length ? formatDate(series[0].matchDate) : '' }}</span><span>{{ series.length ? formatDate(series[series.length - 1].matchDate) : '' }}</span></div>
  </figure>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatDate } from '@/utils/labels'

// matches: rows from the player overview (newest first, as the API sends them)
const props = defineProps({ matches: { type: Array, default: () => [] } })

const METRICS = {
  points: { label: 'Puntos', short: 'PTS' },
  rebounds: { label: 'Rebotes', short: 'REB' },
  assists: { label: 'Asistencias', short: 'AST' }
}
const W = 1000
const H = 280
const PAD_L = 0 // the y labels sit outside the SVG, in the plot margin
const GAP = 4 // surface gap between adjacent bars

const metric = ref('points')
const hover = ref(null)

const series = computed(() => [...props.matches].sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate)))
const values = computed(() => series.value.map(m => m[metric.value] || 0))
const avg = computed(() => (values.value.length ? values.value.reduce((s, v) => s + v, 0) / values.value.length : 0))
const best = computed(() => series.value.reduce((b, m) => (!b || (m[metric.value] || 0) > (b[metric.value] || 0) ? m : b), null))
// Round the top of the scale up to a clean step
const step = computed(() => (Math.max(...values.value, 1) > 20 ? 10 : 5))
const max = computed(() => Math.ceil(Math.max(...values.value, 1) / step.value) * step.value)
const ticks = computed(() => Array.from({ length: max.value / step.value + 1 }, (_, i) => i * step.value))

const barW = computed(() => (W - PAD_L) / Math.max(series.value.length, 1))
const x = i => PAD_L + i * barW.value
const y = v => 8 + (H - 16) * (1 - v / max.value)

const tipStyle = computed(() => {
  const left = ((x(hover.value) + barW.value / 2) / W) * 100
  return { left: `${left}%`, transform: `translateX(${left > 70 ? '-100%' : left < 30 ? '0' : '-50%'})` }
})
const ariaLabel = computed(
  () => `${METRICS[metric.value].label} en ${series.value.length} partidos: promedio ${avg.value.toFixed(1)}, mejor ${best.value?.[metric.value] ?? 0}. El detalle está en la tabla de abajo.`
)
</script>

<style scoped>
.mbc {
  margin: 0;
  padding: 20px;
  border: 1px solid rgb(var(--c-outline-variant) / 0.6);
  background: rgb(var(--c-surface-container));
}

.mbc__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.mbc__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--f-display);
  font-size: 28px;
  line-height: 1;
  text-transform: uppercase;
}

.mbc__sub {
  font-family: var(--f-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgb(var(--c-on-surface-variant));
}

.mbc__metrics {
  display: flex;
  gap: 6px;
}

.mbc__plot {
  position: relative;
  height: 280px;
  margin-left: 32px;
}

.mbc__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.mbc__grid {
  stroke: rgb(var(--c-outline-variant) / 0.45);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.mbc__bar {
  fill: rgb(var(--c-primary-container));
  transition: opacity 0.15s;
}

.mbc__bar.is-best {
  fill: rgb(var(--c-secondary));
}

.mbc__plot:hover .mbc__bar:not(.is-hover) {
  opacity: 0.45;
}

.mbc__avg {
  stroke: rgb(var(--c-on-surface));
  stroke-width: 2;
  stroke-dasharray: 6 5;
  vector-effect: non-scaling-stroke;
}

.mbc__hit {
  fill: transparent;
  cursor: crosshair;
}

.mbc__tick,
.mbc__avg-label {
  position: absolute;
  transform: translateY(-50%);
  font-family: var(--f-mono);
  font-size: 11px;
  pointer-events: none;
}

.mbc__tick {
  left: -32px;
  color: rgb(var(--c-on-surface-variant));
}

.mbc__avg-label {
  right: 0;
  padding: 2px 6px;
  background: rgb(var(--c-on-surface));
  color: rgb(var(--c-surface));
  font-weight: 700;
  transform: translateY(-120%);
}

.mbc__tip {
  position: absolute;
  top: 0;
  z-index: 2;
  display: flex;
  min-width: 190px;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 2px solid rgb(var(--c-on-surface));
  background: rgb(var(--c-surface));
  pointer-events: none;
}

.mbc__tip-date,
.mbc__tip-rest {
  font-family: var(--f-mono);
  font-size: 11px;
  color: rgb(var(--c-on-surface-variant));
}

.mbc__tip-main {
  font-family: var(--f-display);
  font-size: 30px;
  line-height: 1;
}

.mbc__axis {
  display: flex;
  justify-content: space-between;
  padding: 8px 0 0 32px;
  font-family: var(--f-mono);
  font-size: 11px;
  color: rgb(var(--c-on-surface-variant));
}

@media (max-width: 640px) {
  .mbc {
    padding: 16px 12px;
  }

  .mbc__plot {
    height: 200px;
  }
}
</style>
