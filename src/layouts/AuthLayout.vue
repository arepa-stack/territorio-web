<template>
  <!-- Sign-in / sign-up shell in the "cartel de cancha" look: poster on the left, form on the right -->
  <div class="auth">
    <aside class="auth__poster" aria-hidden="true">
      <svg class="auth__court" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
        <rect x="40" y="40" width="520" height="720" />
        <line x1="40" y1="400" x2="560" y2="400" />
        <circle cx="300" cy="400" r="70" />
        <rect x="220" y="40" width="160" height="190" />
        <circle cx="300" cy="230" r="80" />
        <path d="M80 40 V120 A220 220 0 0 0 520 120 V40" />
        <rect x="220" y="570" width="160" height="190" />
        <path d="M80 760 V680 A220 220 0 0 1 520 680 V760" />
      </svg>
      <div class="auth__copy">
        <span class="auth__kicker">Temporada 2026 · Caracas</span>
        <p class="auth__slogan">Tu barrio.<br />Tu cancha.<br /><span class="auth__blaze">Tu corona.</span></p>
      </div>
    </aside>

    <div class="auth__side">
      <header class="auth__head">
        <router-link to="/" class="auth__brand">Turf<span class="auth__blaze">.</span></router-link>
        <router-link to="/" class="auth__back">← Volver al inicio</router-link>
      </header>
      <main class="auth__main">
        <div class="auth__card">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useCourtTheme } from '@/composables/useCourtTheme'

// Same "cancha" theme as the app: forms, buttons and toasts take it from <html>
useCourtTheme()
</script>

<style scoped>
.auth {
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  background: #0d0d0b;
  color: #ede8dc;
  font-family: 'Archivo', sans-serif;
}

.auth__poster {
  position: relative;
  display: flex;
  overflow: hidden;
  align-items: flex-end;
  padding: 56px;
  border-right: 1px solid #2a2924;
  background: repeating-linear-gradient(135deg, #141411 0 18px, #0f0f0d 18px 36px);
}

.auth__court {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: #ede8dc;
  stroke-opacity: 0.12;
  stroke-width: 3;
}

.auth__copy {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth__kicker {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f5b21b;
}

.auth__slogan {
  margin: 0;
  font-family: 'Anton', sans-serif;
  font-size: clamp(64px, 7.5vw, 128px);
  line-height: 0.92;
  text-transform: uppercase;
}

.auth__blaze {
  color: #ff4f12;
}

.auth__side {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.auth__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 40px;
}

.auth__brand {
  font-family: 'Anton', sans-serif;
  font-size: 28px;
  text-transform: uppercase;
  color: #ede8dc;
  text-decoration: none;
}

.auth__back {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #a8a397;
  text-decoration: none;
}

.auth__back:hover {
  color: #ff4f12;
}

.auth__main {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 8px 40px 32px;
}

.auth__card {
  width: 100%;
  max-width: 440px;
  padding: 28px 32px;
  border: 1px solid #2a2924;
  border-top: 6px solid #ff4f12;
  background: #141411;
}

/* Titles inside the auth views read as poster headlines */
.auth__card :deep(h1) {
  font-size: 44px;
  line-height: 0.95;
}

/* Short laptop screens (768px): tighter header and card so sign-up fits without scrolling */
@media (max-height: 820px) and (min-width: 901px) {
  .auth__head {
    padding: 14px 40px;
  }

  .auth__card {
    padding: 20px 28px;
  }

  .auth__card :deep(h1) {
    font-size: 36px;
  }
}

@media (max-width: 900px) {
  .auth {
    grid-template-columns: minmax(0, 1fr);
  }

  .auth__poster {
    display: none;
  }

  .auth__head {
    padding: 16px;
  }

  .auth__main {
    align-items: flex-start;
    padding: 8px 16px 48px;
  }

  .auth__card {
    padding: 24px 20px;
  }
}
</style>
