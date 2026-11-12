<template>
  <div class="poster">
    <PosterHeader />
    <main class="wrap page">
      <div class="page__head">
        <div class="page__title">
          <router-link to="/" class="mono page__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
            Volver al inicio
          </router-link>
          <h1 class="display page__h1">1vs1 al aro<span v-if="is3d" class="ar-badge">3D</span></h1>
        </div>
        <p class="page__lead">Calienta mientras empieza tu partido. Gana el primero en llegar a {{ TARGET }} canastas: el triple vale 2.
          <!-- ponytail: plain link on purpose, both routes share this component and Vue Router would reuse it without re-mounting -->
          <a :href="is3d ? '/jugar' : '/jugar-v2'" class="link-under ar-switch">{{ is3d ? 'Volver a la versión clásica 2D' : 'Prueba la versión 3D (beta)' }}</a>
        </p>
      </div>

      <p v-if="!authStore.isAuthenticated" class="ar-notice">
        <span class="icon" aria-hidden="true">info</span>
        <span>
          Puedes jugar sin cuenta, pero <strong>para guardar tu puntuación en el ranking debes estar registrado.</strong>
          <router-link :to="{ path: '/auth/login', query: { redirect: '/jugar' } }" class="link-under">Inicia sesión</router-link>
          o
          <router-link :to="{ path: '/auth/register', query: { redirect: '/jugar' } }" class="link-under">crea tu cuenta</router-link>.
        </span>
      </p>

      <div class="ar-layout">
        <section class="ar-game" aria-label="Juego 1vs1">
          <div class="ar-board mono" aria-live="polite">
            <span class="ar-side ar-side--you">Tú <b class="display">{{ hud.you }}</b></span>
            <span class="ar-pts">Puntos <b class="display">{{ hud.points }}</b></span>
            <span class="ar-side ar-side--cpu"><b class="display">{{ hud.cpu }}</b> CPU</span>
            <button type="button" class="ar-mute" :aria-pressed="muted" :aria-label="muted ? 'Activar sonido' : 'Silenciar'" @click="toggleMute">
              <span class="icon">{{ muted ? 'volume_off' : 'volume_up' }}</span>
            </button>
          </div>

          <div class="ar-stage">
            <canvas ref="canvas" class="ar-canvas" />

            <div v-if="screen !== 'playing'" class="ar-overlay">
              <template v-if="screen === 'intro'">
                <h2 class="display ar-overlay__h">Tú contra la CPU</h2>
                <p class="ar-overlay__p">Media cancha, primero a {{ TARGET }} canastas.</p>
              </template>
              <template v-else>
                <h2 class="display ar-overlay__h" :class="result.won ? 'is-win' : 'is-lose'">{{ result.won ? '¡Ganaste!' : 'Ganó la CPU' }}</h2>
                <p class="ar-overlay__p">{{ result.you }} – {{ result.cpu }} · <strong>{{ result.score }} puntos</strong></p>
                <p class="ar-overlay__p ar-overlay__save">
                  <template v-if="saveState === 'saving'">Guardando en el ranking…</template>
                  <template v-else-if="saveState === 'saved'">Guardado en el ranking.</template>
                  <template v-else-if="saveState === 'error'">No se pudo guardar la puntuación.</template>
                  <template v-else>
                    Para guardar tu puntuación debes estar registrado.
                    <router-link :to="{ path: '/auth/login', query: { redirect: '/jugar' } }" class="link-under">Inicia sesión</router-link>
                    o
                    <router-link :to="{ path: '/auth/register', query: { redirect: '/jugar' } }" class="link-under">regístrate</router-link>
                    y la guardamos.
                  </template>
                </p>
              </template>
              <button type="button" class="btn-blaze" @click="play">{{ screen === 'intro' ? 'Jugar' : 'Revancha' }}</button>
            </div>
          </div>

          <div class="ar-pad" aria-label="Controles táctiles">
            <div class="ar-pad__group">
              <button v-for="b in ['left', 'right']" :key="b" type="button" class="ar-btn" :aria-label="b === 'left' ? 'Izquierda' : 'Derecha'" v-bind="pad(b)">
                <span class="icon">{{ b === 'left' ? 'arrow_back' : 'arrow_forward' }}</span>
              </button>
            </div>
            <div class="ar-pad__group">
              <button type="button" class="ar-btn ar-btn--alt mono" v-bind="pad('cross')">Cross / Robo</button>
              <button type="button" class="ar-btn ar-btn--main mono" v-bind="pad('shoot')">Tiro / Salto</button>
            </div>
          </div>

          <p class="ar-keys mono">← → moverse · Espacio tirar (mantén y suelta en la zona verde) / saltar a tapar · X crossover / robar</p>
        </section>

        <aside class="ar-side-col">
          <section class="ar-card">
            <h2 class="display ar-card__h">Ranking</h2>
            <TurfLoader v-if="loadingBoard" label="Cargando ranking" />
            <p v-else-if="!leaders.length" class="ar-muted">Nadie ha guardado una puntuación todavía. Sé el primero.</p>
            <ol v-else class="ar-rank">
              <li v-for="(l, i) in leaders" :key="l.userId" :class="{ 'is-me': l.userId === authStore.user?.id }">
                <span class="mono ar-rank__pos">{{ i + 1 }}</span>
                <span class="ar-rank__name">{{ l.fullName }}</span>
                <span class="display ar-rank__score">{{ l.score }}</span>
              </li>
            </ol>
          </section>

          <section class="ar-card">
            <h2 class="display ar-card__h">Jugadas</h2>
            <ul class="ar-plays">
              <li v-for="p in playList" :key="p.label">
                <span>{{ p.label }}</span>
                <span class="mono">+{{ p.pts }} pts{{ p.buckets === 2 ? ' · 2 canastas' : '' }}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import '@/styles/poster.css'
import PosterHeader from '@/components/PosterHeader.vue'
import TurfLoader from '@/components/TurfLoader.vue'
import { useAuthStore } from '@/stores/auth'
import arcadeService from '@/services/arcade'
import { createGame, PLAYS, TARGET } from '@/game/oneOnOne'
import { createAudio } from '@/game/audio'

const PENDING = 'turf:pendingGameScore'
const KEYS = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ' ': 'shoot', ArrowUp: 'shoot', w: 'shoot', W: 'shoot', x: 'cross', X: 'cross', k: 'cross', K: 'cross' }

const authStore = useAuthStore()
const is3d = useRoute().meta.engine === '3d' // /jugar-v2: same rules and HUD, Three.js render + ball physics
const canvas = ref(null)
const screen = ref('intro')
const hud = reactive({ you: 0, cpu: 0, points: 0 })
const result = ref(null)
const saveState = ref('')
const leaders = ref([])
const loadingBoard = ref(true)
const playList = Object.values(PLAYS)
let game
const MUTE_KEY = 'turf:arcadeMuted'
const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}
const muted = ref(readMuted())
const audio = createAudio({ physicsImpacts: is3d })
audio.setMuted(muted.value)
const toggleMute = () => {
  muted.value = !muted.value
  audio.setMuted(muted.value)
  try {
    localStorage.setItem(MUTE_KEY, muted.value ? '1' : '0')
  } catch {}
}

const loadBoard = async () => {
  try {
    leaders.value = (await arcadeService.leaderboard()).data || []
  } catch {
    leaders.value = []
  } finally {
    loadingBoard.value = false
  }
}

const save = async ({ score, won }) => {
  saveState.value = 'saving'
  try {
    await arcadeService.save(score, won)
    saveState.value = 'saved'
    loadBoard()
  } catch {
    saveState.value = 'error'
  }
}

const onEnd = r => {
  result.value = r
  audio.stopCrowd()
  audio.play('buzzer')
  if (r.won) audio.play('cheer', 1)
  screen.value = 'over'
  saveState.value = ''
  if (authStore.isAuthenticated) return save(r)
  // A visitor who logs in right after keeps this game: it is saved when they come back to /jugar
  try {
    sessionStorage.setItem(PENDING, JSON.stringify({ score: r.score, won: r.won }))
  } catch {}
}

const play = () => {
  screen.value = 'playing'
  audio.unlock() // inside the click: browsers only allow audio after a user gesture
  audio.startCrowd()
  audio.play('whistle')
  game?.start()
  canvas.value.focus?.()
}

const pad = name => ({
  onPointerdown: e => {
    e.preventDefault()
    game?.input(name, true)
  },
  onPointerup: () => game?.input(name, false),
  onPointerleave: () => game?.input(name, false),
  onPointercancel: () => game?.input(name, false),
  onContextmenu: e => e.preventDefault()
})

const onKey = e => {
  const name = KEYS[e.key]
  if (!name || screen.value !== 'playing' || e.target.closest?.('input, textarea')) return
  e.preventDefault() // space and arrows would scroll the page
  if (!e.repeat) game?.input(name, e.type === 'keydown')
}

const resize = () => {
  const el = canvas.value
  if (!el) return
  el.width = Math.round(el.clientWidth * (window.devicePixelRatio || 1))
  el.height = Math.round((el.width * 9) / 16)
}
let observer

onMounted(async () => {
  // three.js only downloads on /jugar-v2
  const engine3d = is3d ? (await import('@/game/render3d')).create3D(canvas.value, { onImpact: audio.impact }) : {}
  game = createGame(canvas.value, { onHud: h => Object.assign(hud, h), onEnd, onEvent: audio.event, ...engine3d })
  if (!is3d) observer = new ResizeObserver(resize) // the 3D renderer sizes its own canvas
  observer?.observe(canvas.value)
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKey)
  let pending = null
  try {
    pending = JSON.parse(sessionStorage.getItem(PENDING) || 'null')
    sessionStorage.removeItem(PENDING)
  } catch {}
  if (pending && authStore.isAuthenticated) {
    result.value = { ...pending, you: '–', cpu: '–' }
    screen.value = 'over'
    await save(pending)
  } else loadBoard()
})

onBeforeUnmount(() => {
  game?.destroy()
  audio.destroy()
  observer?.disconnect()
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKey)
})
</script>

<style scoped>
.ar-badge {
  margin-left: 0.25em;
  padding: 0 0.15em;
  font-size: 0.45em;
  vertical-align: top;
  background: var(--blaze);
  color: #fff;
}
.ar-switch {
  display: block;
  margin-top: 8px;
  font-weight: 700;
}
.ar-notice {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 18px;
  border: 1px solid var(--gold);
  background: rgb(245 178 27 / 0.08);
  color: var(--chalk-dim);
  line-height: 1.5;
}
.ar-notice .icon {
  color: var(--gold);
}
.ar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 28px;
  align-items: start;
}
.ar-game {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.ar-board {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border: 1px solid var(--line);
  background: var(--asphalt-2);
  font-size: 13px;
}
.ar-board b {
  font-size: 32px;
  margin: 0 8px;
}
.ar-side--you b {
  color: var(--blaze);
}
.ar-side--cpu b {
  color: #7fa6f0;
}
.ar-mute {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--chalk);
  cursor: pointer;
}
.ar-mute[aria-pressed='true'] {
  color: var(--muted);
}
.ar-pts b {
  color: var(--gold);
}
.ar-stage {
  position: relative;
  border: 1px solid var(--line);
}
.ar-canvas {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0b0d14;
  touch-action: none;
}
.ar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 16px;
  text-align: center;
  background: rgb(13 13 11 / 0.78);
}
.ar-overlay__h {
  font-size: clamp(36px, 6vw, 72px);
}
.ar-overlay__h.is-win {
  color: var(--gold);
}
.ar-overlay__h.is-lose {
  color: #7fa6f0;
}
.ar-overlay__p {
  max-width: 460px;
  color: var(--chalk-dim);
  line-height: 1.5;
}
.ar-overlay__save {
  font-size: 14px;
}
.ar-pad {
  display: none;
  justify-content: space-between;
  gap: 12px;
  user-select: none;
  -webkit-user-select: none;
}
.ar-pad__group {
  display: flex;
  gap: 10px;
}
.ar-btn {
  min-width: 64px;
  min-height: 64px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--asphalt-2);
  color: var(--chalk);
  font-size: 12px;
  touch-action: none;
}
.ar-btn:active {
  background: var(--line);
}
.ar-btn--main {
  background: var(--blaze);
  border-color: var(--blaze);
  color: #fff;
}
.ar-btn--alt {
  border-color: var(--gold);
}
.ar-keys {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.6;
}
@media (pointer: coarse) {
  .ar-pad {
    display: flex;
  }
  .ar-keys {
    display: none;
  }
}
.ar-side-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.ar-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--line);
  background: var(--asphalt-2);
}
.ar-card__h {
  font-size: 28px;
}
.ar-muted {
  color: var(--muted);
  font-size: 14px;
}
.ar-rank,
.ar-plays {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ar-rank li {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line-soft);
}
.ar-rank li.is-me .ar-rank__name {
  color: var(--blaze);
}
.ar-rank li:first-child .ar-rank__score {
  color: var(--gold);
}
.ar-rank__pos {
  color: var(--muted);
  font-size: 12px;
}
.ar-rank__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ar-rank__score {
  font-size: 24px;
}
.ar-plays li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
}
.ar-plays .mono {
  font-size: 11px;
  color: var(--gold);
}
@media (max-width: 900px) {
  .ar-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .wrap.page {
    padding-left: 16px;
    padding-right: 16px;
  }
  .ar-board b {
    font-size: 24px;
  }
}
</style>
