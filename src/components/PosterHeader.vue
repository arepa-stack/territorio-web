<template>
  <header class="poster-header">
    <div class="wrap poster-header__bar">
      <router-link to="/" class="poster-header__brand">
        <span class="display poster-header__logo">Turf<span class="poster-header__mvp">.</span></span>
        <span class="mono poster-header__tag">Basket de barrio</span>
      </router-link>
      <nav class="poster-header__nav" aria-label="Explorar">
        <router-link v-for="l in links" :key="l.to" :to="l.to" active-class="is-active">{{ l.label }}</router-link>
      </nav>
      <div class="poster-header__actions">
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
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { HOME_BY_ROLE } from '@/router/navigation'
import CountrySwitcher from '@/components/CountrySwitcher.vue'

const authStore = useAuthStore()
const homeRoute = computed(() => HOME_BY_ROLE[authStore.userRole] || '/app')
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

@media (max-width: 900px) {
  .poster-header__nav,
  .poster-header__tag {
    display: none;
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
