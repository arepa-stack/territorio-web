<template>
  <!-- Player and captain shell in the "cartel de cancha" look: left sidebar (drawer on mobile) -->
  <div class="court shell">
    <header class="shell__top">
      <router-link :to="homeRoute" class="shell__brand">
        <span class="shell__mark">Territorio<span class="shell__mvp">.</span></span>
      </router-link>
      <div class="shell__top-actions">
        <button type="button" class="shell__bell" :aria-label="`Notificaciones, ${unreadCount} sin leer`" @click="openPanel">
          Avisos<span v-if="unreadCount" class="shell__count">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </button>
        <button type="button" class="shell__menu" :aria-expanded="drawer" aria-controls="court-nav" @click="drawer = !drawer">
          {{ drawer ? 'Cerrar' : 'Menú' }}
        </button>
      </div>
    </header>

    <aside id="court-nav" class="side" :class="{ 'is-open': drawer }">
      <router-link :to="homeRoute" class="shell__brand side__brand">
        <span class="shell__mark">Territorio<span class="shell__mvp">.</span></span>
      </router-link>
      <span class="side__role">{{ roleLabel }}</span>

      <nav class="side__nav" aria-label="Navegación principal">
        <router-link
          v-for="(item, i) in navItems"
          :key="item.to"
          :to="item.to"
          class="side__link"
          :class="{ 'is-active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
          @click="drawer = false"
        >
          <span class="side__num">{{ String(i + 1).padStart(2, '0') }}</span>{{ item.label }}
        </router-link>
      </nav>

      <div class="side__foot">
        <button type="button" class="side__bell" @click="openPanel">
          <span class="icon">notifications</span>
          Notificaciones
          <span v-if="unreadCount" class="shell__count">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </button>
        <div class="side__user">
          <span class="side__initials">{{ initials }}</span>
          <span class="side__who">
            <span class="side__name">{{ authStore.userName }}</span>
            <router-link v-if="showProfileLink" to="/app/player/profile" class="side__small" @click="drawer = false">Mi perfil</router-link>
          </span>
        </div>
        <button type="button" class="side__out" @click="logout">Cerrar sesión</button>
      </div>
    </aside>
    <div v-if="drawer" class="shell__scrim" @click="drawer = false" />

    <main class="shell__main">
      <router-view />
    </main>

    <NotificationsPanel ref="panel" :notifications="notifications" :unread-count="unreadCount" @open="open" @mark-all="markAllRead" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'
import NotificationsPanel from '@/components/NotificationsPanel.vue'
import { useCourtTheme } from '@/composables/useCourtTheme'
import { NAV_BY_ROLE, HOME_BY_ROLE, ROLE_LABEL } from '@/router/navigation'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const { notifications, unreadCount, open, markAllRead } = useNotifications()
const drawer = ref(false)
const panel = ref(null)
const openPanel = () => {
  drawer.value = false
  panel.value?.open()
}

// The "cancha" theme goes on <html> so dialogs and toasts mounted outside the shell take it too
useCourtTheme()

const navItems = computed(() => NAV_BY_ROLE[authStore.userRole] || [])
const homeRoute = computed(() => HOME_BY_ROLE[authStore.userRole] || '/')
const roleLabel = computed(() => ROLE_LABEL[authStore.userRole])
// The player nav already has "Perfil"; the captain reaches it from here (other roles have no profile screen yet)
const showProfileLink = computed(() => authStore.userRole === 'TEAM_CAPTAIN')
const initials = computed(() =>
  (authStore.userName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
)

// A link stays active on its sub-pages (e.g. /app/player/teams/… under /app/player/teams)
const isActive = item => (item.exact ? route.path === item.to : route.path === item.to || route.path.startsWith(item.to + '/'))

const logout = async () => {
  await authStore.logout()
  toast.success('Sesión cerrada')
  router.push('/auth/login')
}
</script>

<style scoped>
.shell {
  --side-w: 264px;
  min-height: 100vh;
  background: rgb(13 13 11);
  color: rgb(237 232 220);
  font-family: 'Archivo', sans-serif;
}

.shell a {
  color: inherit;
  text-decoration: none;
}

.shell__top {
  display: none;
}

.shell__brand {
  display: inline-flex;
}

.shell__mark {
  font-family: 'Anton', sans-serif;
  font-size: 28px;
  line-height: 1;
  text-transform: uppercase;
}

.shell__mvp {
  color: rgb(255 79 18);
}

.shell__count {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  padding: 0 5px;
  background: rgb(255 79 18);
  color: rgb(13 13 11);
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
}

.side {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 1001;
  display: flex;
  width: var(--side-w);
  box-sizing: border-box;
  flex-direction: column;
  gap: 8px;
  padding: 28px 0 24px;
  overflow-y: auto;
  border-right: 1px solid rgb(42 41 36);
  background: rgb(13 13 11);
}

.side__brand {
  padding: 0 24px;
}

.side__role {
  align-self: flex-start;
  margin: 4px 24px 20px;
  padding: 3px 8px;
  background: rgb(245 178 27);
  color: rgb(13 13 11);
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.side__nav {
  display: flex;
  flex-direction: column;
  border-top: 3px solid rgb(237 232 220);
  margin: 0 24px;
}

.side__link {
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid rgb(42 41 36);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(214 209 196);
}

.side__link:hover {
  color: rgb(255 79 18);
}

.side__link.is-active {
  color: rgb(255 79 18);
  box-shadow: inset 4px 0 0 rgb(255 79 18);
  padding-left: 14px;
}

.side__num {
  width: 22px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 400;
  color: rgb(119 115 106);
}

.side__link.is-active .side__num {
  color: rgb(255 79 18);
}

.side__foot {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
  padding: 24px 24px 0;
}

.side__bell {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.side__bell:hover,
.side__small:hover {
  color: rgb(255 79 18);
}

.side__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgb(42 41 36);
}

.side__initials {
  display: flex;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  background: rgb(255 79 18);
  color: rgb(13 13 11);
  font-family: 'Anton', sans-serif;
  font-size: 18px;
}

.side__who {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.side__name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side__small {
  font-size: 12px;
  color: rgb(168 163 151);
}

.side__out {
  align-self: flex-start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: rgb(168 163 151);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-decoration: underline;
  text-underline-offset: 5px;
  text-transform: uppercase;
  cursor: pointer;
}

.side__out:hover {
  color: rgb(255 79 18);
}

.shell__main {
  box-sizing: border-box;
  min-width: 0;
  max-width: calc(1280px + var(--side-w));
  margin-left: var(--side-w);
  padding: 40px 48px 72px;
}

.shell__scrim {
  display: none;
}

@media (max-width: 900px) {
  .shell__top {
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    min-height: 60px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 16px;
    border-bottom: 1px solid rgb(42 41 36);
    background: rgb(13 13 11);
  }

  .shell__top .shell__mark {
    font-size: 24px;
  }

  .shell__top-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .shell__bell {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font-family: inherit;
    cursor: pointer;
  }

  .shell__bell,
  .shell__menu {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .shell__menu {
    padding: 0 14px;
    border: 2px solid rgb(237 232 220);
    background: none;
    color: rgb(237 232 220);
    font-family: inherit;
    cursor: pointer;
  }

  .side {
    top: 60px;
    transform: translateX(-100%);
    transition: transform 0.2s;
  }

  .side.is-open {
    transform: none;
  }

  .side__brand {
    display: none;
  }

  .shell__scrim {
    position: fixed;
    inset: 60px 0 0;
    z-index: 1000;
    display: block;
    background: rgb(0 0 0 / 0.6);
  }

  .shell__main {
    margin-left: 0;
    padding: 24px 16px 56px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .side {
    transition: none;
  }
}
</style>
