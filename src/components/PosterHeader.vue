<template>
  <header class="poster-header">
    <div class="wrap poster-header__bar">
      <router-link to="/" class="poster-header__brand">
        <span class="display poster-header__logo">Turf<span class="poster-header__mvp">.</span></span>
        <span class="mono poster-header__tag">Basket de barrio</span>
      </router-link>
      <nav id="poster-nav" class="poster-header__nav" :class="{ 'is-open': open }" aria-label="Explorar">
        <router-link v-for="l in links" :key="l.to" :to="l.to" active-class="is-active">{{ l.label }}</router-link>
        <router-link v-if="!authStore.isAuthenticated" to="/auth/login" class="poster-header__nav-login">Entrar</router-link>
      </nav>
      <div class="poster-header__actions">
        <!-- Mobile menu toggle: a basketball that splits in half when the menu opens -->
        <button type="button" class="ball-toggle" :class="{ 'is-open': open }" :aria-expanded="open" aria-controls="poster-nav"
          :aria-label="open ? 'Cerrar menú' : 'Abrir menú'" @click="open = !open">
          <svg viewBox="-14 -14 28 28" width="34" height="34" aria-hidden="true">
            <defs>
              <clipPath id="ball-l"><rect x="-14" y="-14" width="14" height="28" /></clipPath>
              <clipPath id="ball-r"><rect x="0" y="-14" width="14" height="28" /></clipPath>
              <g id="ball">
                <circle r="12" fill="var(--blaze)" />
                <g fill="none" stroke="#0d0d0b" stroke-width="1.4">
                  <circle r="12" />
                  <path d="M0 -12V12M-12 0H12M-8.5 -8.5C-4 -4 -4 4 -8.5 8.5M8.5 -8.5C4 -4 4 4 8.5 8.5" />
                </g>
              </g>
            </defs>
            <use href="#ball" clip-path="url(#ball-l)" class="ball-toggle__half ball-toggle__half--l" />
            <use href="#ball" clip-path="url(#ball-r)" class="ball-toggle__half ball-toggle__half--r" />
          </svg>
        </button>
        <CountrySwitcher />
        <template v-if="authStore.isAuthenticated">
          <router-link :to="homeRoute" class="btn-blaze">Mi panel</router-link>
        </template>
        <template v-else>
          <router-link to="/auth/login" class="poster-header__login">Entrar</router-link>
          <router-link to="/auth/register" class="btn-blaze">Crear cuenta</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { HOME_BY_ROLE } from '@/router/navigation'
import CountrySwitcher from '@/components/CountrySwitcher.vue'

const authStore = useAuthStore()
const homeRoute = computed(() => HOME_BY_ROLE[authStore.userRole] || '/app')
const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { open.value = false })
const links = [
  { label: 'Torneos', to: '/torneos' },
  { label: 'Equipos', to: '/equipos' },
  { label: 'Zonas', to: '/zonas' },
  { label: 'Proveedores', to: '/proveedores' },
  { label: 'Jugar', to: '/jugar' }
]
</script>

<style scoped>
.poster-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--line);
  background: rgb(13 13 11 / 0.94);
  backdrop-filter: blur(6px);
}

.poster-header__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 76px;
}

.poster-header__brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
  text-decoration: none;
}

.poster-header__logo {
  font-size: 28px;
  letter-spacing: 0.01em;
}

.poster-header__mvp {
  color: var(--blaze);
}

.poster-header__tag {
  font-size: 11px;
  color: var(--muted);
}

.poster-header__nav {
  display: flex;
  gap: 32px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.poster-header__nav a {
  padding: 12px 0;
  text-decoration: none;
}

.poster-header__nav a.is-active {
  color: var(--blaze);
}

.poster-header__actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.poster-header__login {
  padding: 12px 4px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

.poster-header__nav-login {
  display: none;
}

.ball-toggle {
  display: none;
  order: 99;
  padding: 4px;
  border: 0;
  background: none;
  cursor: pointer;
}

.ball-toggle svg {
  display: block;
  overflow: visible;
  transition: transform 0.4s cubic-bezier(0.3, 1.4, 0.5, 1);
}

.ball-toggle:hover svg {
  transform: rotate(-25deg);
}

.ball-toggle__half {
  transition: transform 0.35s cubic-bezier(0.3, 1.4, 0.5, 1);
}

.ball-toggle.is-open svg {
  transform: rotate(90deg);
}

.ball-toggle.is-open .ball-toggle__half--l {
  transform: translateX(-4px) rotate(-18deg);
}

.ball-toggle.is-open .ball-toggle__half--r {
  transform: translateX(4px) rotate(18deg);
}

@keyframes nav-drop {
  from { opacity: 0; transform: translateY(-8px); }
}

@media (prefers-reduced-motion: reduce) {
  .ball-toggle svg,
  .ball-toggle__half,
  .poster-header__nav.is-open {
    transition: none;
    animation: none;
  }
}

@media (max-width: 900px) {
  .ball-toggle {
    display: block;
  }

  .poster-header__nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0;
    padding: 8px 16px 16px;
    border-bottom: 1px solid var(--line);
    background: rgb(13 13 11 / 0.98);
  }

  .poster-header__nav.is-open {
    display: flex;
    animation: nav-drop 0.25s ease-out;
  }

  .poster-header__nav a {
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
  }

  .poster-header__tag,
  .poster-header__login {
    display: none;
  }

  .poster-header__nav .poster-header__nav-login {
    display: block;
  }

  .poster-header__logo {
    font-size: 22px;
  }

  .poster-header__actions {
    gap: 10px;
  }

  .poster-header__actions .btn-blaze {
    padding: 12px 14px;
    font-size: 13px;
  }
}
</style>
