<template>
  <div class="clock" :class="{ 'clock--run': running, 'clock--end': left === 0 }">
    <span class="clock__time" role="timer" :aria-label="`Tiempo restante ${display}`">{{ display }}</span>
    <div class="clock__ctrl">
      <button type="button" class="clock__btn" aria-label="Restar un segundo" :disabled="running" @click="nudge(-1000)">−1s</button>
      <button type="button" class="clock__btn clock__btn--main" :aria-label="running ? 'Pausar' : 'Arrancar'" :disabled="!running && left === 0" @click="toggle">
        <span class="icon">{{ running ? 'pause' : 'play_arrow' }}</span>
      </button>
      <button type="button" class="clock__btn" aria-label="Sumar un segundo" :disabled="running" @click="nudge(1000)">+1s</button>
      <button type="button" class="clock__btn" aria-label="Reiniciar el periodo" :disabled="running" @click="reset">
        <span class="icon text-[18px]">restart_alt</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

// Game clock of the scoring table. Each period keeps its own remaining time, so jumping between periods
// to fix a play doesn't lose it. Saved per match in this browser, so a reload keeps the time (and keeps
// counting if it was running).
const props = defineProps({
  matchId: { type: String, required: true },
  quarter: { type: Number, required: true },
  minutes: { type: Number, default: 10 } // per quarter; overtime is 5 (FIBA)
})

const fullOf = q => (q > 4 ? 5 : props.minutes) * 60000
const key = `clock:${props.matchId}`
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}
const saved = load()
const remaining = ref(saved.remaining || {}) // { [quarter]: ms left when last paused }
const startedAt = ref(saved.startedAt || null) // Date.now() when it was started; null = paused
const runningQ = ref(saved.runningQ || null)
const now = ref(Date.now())

const save = () => {
  try {
    localStorage.setItem(key, JSON.stringify({ remaining: remaining.value, startedAt: startedAt.value, runningQ: runningQ.value }))
  } catch {
    /* private mode: the clock still works, it just won't survive a reload */
  }
}

const base = q => remaining.value[q] ?? fullOf(q)
const running = computed(() => startedAt.value !== null && runningQ.value === props.quarter)
const left = computed(() => Math.max(0, running.value ? base(props.quarter) - (now.value - startedAt.value) : base(props.quarter)))

// FIBA style: mm:ss, and ss.d in the last minute
const display = computed(() => {
  const ms = left.value
  if (ms < 60000) return (Math.floor(ms / 100) / 10).toFixed(1)
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

const pause = () => {
  if (startedAt.value === null) return
  remaining.value = { ...remaining.value, [runningQ.value]: Math.max(0, base(runningQ.value) - (Date.now() - startedAt.value)) }
  startedAt.value = runningQ.value = null
  save()
}
const toggle = () => {
  if (running.value) return pause()
  pause() // another period running: stop it first
  startedAt.value = Date.now()
  runningQ.value = props.quarter
  save()
}
const nudge = ms => {
  remaining.value = { ...remaining.value, [props.quarter]: Math.min(fullOf(props.quarter), Math.max(0, base(props.quarter) + ms)) }
  save()
}
const reset = () => {
  const { [props.quarter]: _, ...rest } = remaining.value
  remaining.value = rest
  save()
}

// Changing period pauses the clock (the time of each period stays where it was)
watch(() => props.quarter, pause)

// Buzzer: short beep + vibration when the period ends
const buzz = () => {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.frequency.value = 440
    osc.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 1.2)
  } catch {
    /* no audio: the red 0.0 is enough */
  }
  navigator.vibrate?.([300, 100, 300])
}

const timer = setInterval(() => {
  now.value = Date.now()
  if (running.value && left.value === 0) {
    pause()
    buzz()
  }
}, 100)
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.clock__time {
  min-width: 4.2ch;
  padding: 2px 12px;
  border-radius: 6px;
  background: rgb(var(--c-surface-container-lowest));
  color: rgb(var(--c-on-surface-variant));
  font-family: var(--f-mono);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.clock--run .clock__time {
  color: rgb(var(--c-secondary));
}

.clock--end .clock__time {
  color: rgb(var(--c-error));
}

.clock__ctrl {
  display: flex;
  gap: 4px;
}

.clock__btn {
  min-width: 40px;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(var(--c-outline-variant));
  border-radius: 6px;
  background: transparent;
  color: rgb(var(--c-on-surface));
  font-family: var(--f-mono);
  font-size: 12px;
  cursor: pointer;
}

.clock__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.clock__btn--main {
  min-width: 56px;
  border-color: rgb(var(--c-primary));
  background: rgb(var(--c-primary-container));
  color: rgb(var(--c-on-primary-container));
}
</style>
