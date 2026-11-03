<template>
  <!-- Admin shell in the "cartel de cancha" look: wordmark, admin nav and the signed-in user -->
  <div class="poster">
    <header class="a-head">
      <div class="wrap a-head__bar">
        <router-link to="/" class="a-head__brand">
          <span class="display a-head__mark">Basketball<span class="a-head__mvp">MVP</span></span>
          <span class="mono a-head__tag">Admin</span>
        </router-link>
        <nav class="a-head__nav" aria-label="Administración">
          <router-link v-for="item in NAV" :key="item.to" :to="item.to" class="a-head__link" active-class="is-active">{{ item.label }}</router-link>
        </nav>
        <div class="a-head__user">
          <span class="a-head__name">{{ authStore.userName }}</span>
          <button type="button" class="link-under a-head__out" @click="logout">Salir</button>
        </div>
      </div>
    </header>
    <main class="wrap a-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import '@/styles/poster.css'
import { useAuthStore } from '@/stores/auth'

const NAV = [
  { label: 'Usuarios', to: '/app/admin/users' },
  { label: 'Zonas', to: '/app/admin/zones' },
  { label: 'Torneos', to: '/app/admin/tournaments' }
]

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const logout = async () => {
  await authStore.logout()
  toast.success('Sesión cerrada')
  router.push('/auth/login')
}
</script>

<style scoped>
.a-head {
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--line);
  background: var(--asphalt);
}

.a-head__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 32px;
  min-height: 72px;
}

.poster .a-head__brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
  text-decoration: none;
}

.a-head__mark {
  font-size: 28px;
  color: var(--chalk);
}

.a-head__mvp {
  color: var(--blaze);
}

.a-head__tag {
  padding: 3px 8px;
  background: var(--gold);
  color: var(--asphalt);
  font-size: 11px;
  font-weight: 700;
}

.a-head__nav {
  display: flex;
  gap: 28px;
}

.poster .a-head__link {
  padding: 12px 0;
  border-bottom: 3px solid transparent;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

.poster .a-head__link.is-active {
  border-bottom-color: var(--blaze);
  color: var(--blaze);
}

.a-head__user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.a-head__name {
  font-size: 14px;
  color: var(--muted);
}

.a-head__out {
  border: 0;
  background: none;
  color: var(--chalk);
  font-family: inherit;
  cursor: pointer;
}

.a-head__out:hover {
  color: var(--blaze);
}

.a-main {
  padding-top: 48px;
  padding-bottom: 72px;
}

@media (max-width: 700px) {
  .a-head__nav {
    order: 3;
    width: 100%;
    gap: 20px;
    overflow-x: auto;
  }

  .a-head__name {
    display: none;
  }

  .a-main {
    padding-top: 32px;
  }
}
</style>
