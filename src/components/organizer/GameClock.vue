<template>
  <div class="clock" :class="{ 'clock--run': running, 'clock--end': left === 0 }">
    <div class="clock__row">
      <span class="clock__time" role="timer" :aria-label="`Tiempo restante ${display}`">{{ display }}</span>
      <button
        type="button"
        class="clock__shot"
        :class="{ 'clock__shot--end': shotLeft === 0, 'clock__shot--off': shotOff }"
        role="timer"
        :aria-label="`Posesión ${possession === 'home' ? 'local' : 'visitante'} ${shotDisplay}. Tocar para cambiar de equipo`"
        @click="newPossession(possession === 'home' ? 'away' : 'home', false)"
      >
        <span class="icon clock__arrow" :class="{ 'is-hidden': possession !== 'home' }">arrow_left</span>
        {{ shotOff ? '--' : shotDisplay }}
        <span class="icon clock__arrow" :class="{ 'is-hidden': possession !== 'away' }">arrow_right</span>
      </button>
    </div>
    <div class="clock__ctrl">
      <button type="button" class="clock__btn" aria-label="Restar un segundo" :disabled="running" @click="nudge(-1000)">−1s</button>
      <button type="button" class="clock__btn clock__btn--main" :aria-label="running ? 'Pausar' : 'Arrancar'" :disabled="!running && left === 0" @click="toggle">
        <span class="icon">{{ running ? 'pause' : 'play_arrow' }}</span>
      </button>
      <button type="button" class="clock__btn" aria-label="Sumar un segundo" :disabled="running" @click="nudge(1000)">+1s</button>
      <button type="button" class="clock__btn clock__btn--shot" aria-label="Posesión a 24" @click="shotReset(24)">24</button>
      <button type="button" class="clock__btn clock__btn--shot" aria-label="Posesión a 14" @click="shotReset(14)">14</button>
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
// Shot clock: runs only while the game clock runs. shotBase = ms left when it last stopped,
// shotAt = Date.now() when it started counting (null = stopped)
const shotBase = ref(saved.shotBase ?? 24000)
const shotAt = ref(saved.shotAt ?? null)
const possession = ref(saved.possession || 'home') // arrow points to the team with the ball (home = left)
const now = ref(Date.now())

const save = () => {
  try {
    localStorage.setItem(key, JSON.stringify({ remaining: remaining.value, startedAt: startedAt.value, runningQ: runningQ.value, shotBase: shotBase.value, shotAt: shotAt.value, possession: possession.value }))
  } catch {
    /* private mode: the clock still works, it just won't survive a reload */
  }
}

const base = q => remaining.value[q] ?? fullOf(q)
const running = computed(() => startedAt.value !== null && runningQ.value === props.quarter)
const left = computed(() => Math.max(0, running.value ? base(props.quarter) - (now.value - startedAt.value) : base(props.quarter)))

const shotLeft = computed(() => Math.max(0, shotAt.value === null ? shotBase.value : shotBase.value - (now.value - shotAt.value)))
// whole seconds, tenths in the last 5 (FIBA)
const shotDisplay = computed(() => (shotLeft.value > 0 && shotLeft.value < 5000 ? (Math.floor(shotLeft.value / 100) / 10).toFixed(1) : Math.ceil(shotLeft.value / 1000)))
// FIBA: shot clock switches off when less game time is left than possession time
const shotOff = computed(() => left.value < shotLeft.value)
const shotStop = () => {
  shotBase.value = shotLeft.value
  shotAt.value = null
}
const shotReset = secs => {
  shotBase.value = secs * 1000
  shotAt.value = running.value ? Date.now() : null // a reset doesn't stop or start anything
  save()
}

// Ball goes to a team: after a basket the match sheet calls this with the other team and a fresh 24.
// Tapping the shot clock only switches the arrow (fixing a mistake), it keeps the time
const newPossession = (side, reset = true) => {
  possession.value = side
  if (reset) shotReset(24)
  else save()
}
defineExpose({ newPossession })

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
  now.value = Date.now()
  if (shotAt.value !== null) shotStop()
  save()
}
const toggle = () => {
  if (running.value) return pause()
  pause() // another period running: stop it first
  startedAt.value = Date.now()
  runningQ.value = props.quarter
  if (shotBase.value > 0) shotAt.value = startedAt.value
  save()
}
const nudge = ms => {
  remaining.value = { ...remaining.value, [props.quarter]: Math.min(fullOf(props.quarter), Math.max(0, base(props.quarter) + ms)) }
  save()
}
const reset = () => {
  const { [props.quarter]: _, ...rest } = remaining.value
  remaining.value = rest
  shotReset(24)
}

// Changing period pauses the clock (the time of each period stays where it was)
// and the new period starts with a fresh 24
watch(
  () => props.quarter,
  () => {
    pause()
    shotReset(24)
  }
)

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
  } else if (shotAt.value !== null && shotLeft.value === 0) {
    // shot clock violation: buzz and hold 0, stopping the game is the referee's call
    shotStop()
    save()
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

.clock__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clock__shot {
  min-width: 2.6ch;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgb(var(--c-surface-container-lowest));
  color: rgb(var(--c-on-surface-variant));
  font-family: var(--f-mono);
  font-size: clamp(24px, 3.4vw, 36px);
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.clock--run .clock__shot {
  color: rgb(var(--c-secondary));
}

.clock__shot {
  display: inline-flex;
  align-items: center;
  border: 0;
  cursor: pointer;
}

.clock__arrow {
  font-size: 1em;
  color: rgb(var(--c-primary));
}

.clock__arrow.is-hidden {
  visibility: hidden;
}

.clock__shot--end,
.clock--run .clock__shot--end {
  color: rgb(var(--c-error));
}

.clock__shot--off {
  opacity: 0.4;
}

.clock__btn--shot {
  font-weight: 700;
  font-size: 14px;
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
