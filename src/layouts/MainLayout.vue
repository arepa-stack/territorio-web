<template>
  <div class="min-h-screen bg-surface text-on-surface font-body">
    <!-- Top bar -->
    <header
      class="fixed inset-x-0 top-0 z-40 border-b border-outline-variant/40 bg-surface/90 backdrop-blur"
      style="padding-top: env(safe-area-inset-top, 0px)"
    >
      <div class="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-space-sm px-gutter md:px-margin-md">
        <router-link :to="homeRoute" class="flex min-w-0 items-center gap-space-sm no-underline">
          <span class="icon icon-fill text-[28px] text-primary-container">sports_basketball</span>
          <span class="flex flex-col leading-none">
            <span class="whitespace-nowrap font-headline-md text-[20px] uppercase text-on-surface md:text-headline-md">Basketball MVP</span>
            <span class="label-tactical mt-0.5 text-on-surface-variant">CCS Streetball</span>
          </span>
        </router-link>

        <div class="flex items-center gap-space-xs">
          <span
            v-if="roleLabel"
            class="label-tactical rounded bg-surface-container-high px-space-sm py-1 text-secondary"
          >{{ roleLabel }}</span>

          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded text-on-surface-variant hover:text-primary"
            :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            @click="toggleTheme"
          >
            <span class="icon">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
          </button>

          <!-- Campana de notificaciones -->
          <details v-if="authStore.isAuthenticated" ref="notifDetails" class="relative">
            <summary
              class="relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded text-on-surface-variant hover:text-primary [&::-webkit-details-marker]:hidden"
              aria-label="Notificaciones"
            >
              <span class="icon">notifications</span>
              <span
                v-if="unreadCount > 0"
                class="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-container px-1 font-stat-mono text-[10px] font-bold text-white"
              >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </summary>

            <div
              class="absolute right-0 top-12 z-50 w-80 max-w-[90vw] rounded-lg border border-outline-variant/50 bg-surface-container-high p-space-sm shadow-xl"
            >
              <div class="mb-space-xs flex items-center justify-between gap-space-xs px-space-xs">
                <span class="label-tactical text-on-surface">Notificaciones</span>
                <button
                  v-if="unreadCount > 0"
                  type="button"
                  class="btn-ghost px-space-xs py-0.5 text-[11px]"
                  @click="markAllNotificationsRead"
                >Marcar todas leídas</button>
              </div>

              <p v-if="!notifications.length" class="m-0 px-space-xs py-space-md text-center text-body-sm text-on-surface-variant">
                No tienes notificaciones.
              </p>

              <div v-else class="flex max-h-80 flex-col gap-1 overflow-y-auto">
                <button
                  v-for="n in notifications"
                  :key="n.id"
                  type="button"
                  class="flex w-full flex-col gap-0.5 rounded p-space-sm text-left transition-colors hover:bg-surface-container-highest"
                  :class="n.read ? 'opacity-70' : 'border-l-2 border-l-primary-container bg-surface-container'"
                  @click="openNotification(n)"
                >
                  <div class="flex items-center justify-between gap-space-xs">
                    <span class="font-title-sm text-[13px] text-on-surface">{{ n.title }}</span>
                    <span v-if="!n.read" class="h-2 w-2 shrink-0 rounded-full bg-primary-container" />
                  </div>
                  <p class="m-0 text-body-sm text-on-surface-variant">{{ n.message }}</p>
                </button>
              </div>
            </div>
          </details>

          <div class="relative">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container font-label-tactical text-label-tactical text-white"
              aria-haspopup="menu"
              :aria-expanded="menuOpen"
              aria-label="Menú de usuario"
              @click="menuOpen = !menuOpen"
            >{{ initials }}</button>

            <div
              v-if="menuOpen"
              role="menu"
              class="absolute right-0 top-12 w-56 rounded-lg border border-outline-variant/50 bg-surface-container-high p-space-xs shadow-xl"
            >
              <p class="truncate px-space-sm py-space-sm text-body-sm text-on-surface-variant">{{ authStore.userName }}</p>
              <router-link
                v-if="profileRoute"
                :to="profileRoute"
                role="menuitem"
                class="flex items-center gap-space-sm rounded px-space-sm py-space-sm text-body-md text-on-surface no-underline hover:bg-surface-container-highest"
                @click="menuOpen = false"
              >
                <span class="icon">person</span> Mi perfil
              </router-link>
              <button
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-space-sm rounded px-space-sm py-space-sm text-left text-body-md text-error hover:bg-surface-container-highest"
                @click="handleLogout"
              >
                <span class="icon">logout</span> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto flex max-w-[1440px] pt-16">
      <!-- Desktop side navigation -->
      <nav
        class="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col gap-space-xs border-r border-outline-variant/40 p-space-md md:flex"
        aria-label="Navegación principal"
      >
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-space-md rounded px-space-md py-space-sm no-underline transition-colors"
          :class="isActive(item) ? 'bg-primary-container/15 text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'"
        >
          <span class="icon" :class="{ 'icon-fill': isActive(item) }">{{ item.icon }}</span>
          <span class="label-tactical text-[14px]">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Page -->
      <main class="min-w-0 flex-1 px-gutter pb-28 pt-space-lg md:px-margin-md md:pb-margin-lg">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>

    <!-- Mobile bottom navigation -->
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface/95 backdrop-blur md:hidden"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
      aria-label="Navegación principal"
    >
      <div class="flex h-16 items-stretch">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-1 flex-col items-center justify-center gap-0.5 no-underline"
          :class="isActive(item) ? 'text-primary' : 'text-on-surface-variant'"
        >
          <span class="icon" :class="{ 'icon-fill': isActive(item) }">{{ item.icon }}</span>
          <span class="label-tactical text-[11px]">{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <!-- Click outside closes the user menu -->
    <div v-if="menuOpen" class="fixed inset-0 z-30" @click="menuOpen = false" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useColorMode } from '@/composables/useColorMode'
import { NAV_BY_ROLE, HOME_BY_ROLE, ROLE_LABEL } from '@/router/navigation'
import notificationsService from '@/services/notifications'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const { isDark, toggle: toggleTheme } = useColorMode()

const menuOpen = ref(false)
const notifDetails = ref(null)
const notifications = ref([])
let notifTimer = null

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const loadNotifications = async () => {
  if (!authStore.isAuthenticated) return
  try {
    const { data } = await notificationsService.getMyNotifications()
    notifications.value = Array.isArray(data) ? data : []
  } catch {
    // Silenciar errores de polling en segundo plano
  }
}

const openNotification = async n => {
  if (!n.read) {
    n.read = true
    notificationsService.markAsRead(n.id).catch(() => {})
  }
  if (notifDetails.value) notifDetails.value.open = false
  if (n.link) router.push(n.link)
}

const markAllNotificationsRead = async () => {
  notifications.value.forEach(n => { n.read = true })
  try {
    await notificationsService.markAllAsRead()
  } catch {
    await loadNotifications()
  }
}

onMounted(() => {
  loadNotifications()
  notifTimer = setInterval(loadNotifications, 60000)
})

onUnmounted(() => {
  if (notifTimer) clearInterval(notifTimer)
})

const navItems = computed(() => NAV_BY_ROLE[authStore.userRole] || [])
const homeRoute = computed(() => HOME_BY_ROLE[authStore.userRole] || '/')
const roleLabel = computed(() => ROLE_LABEL[authStore.userRole])
const profileRoute = computed(() => (['PLAYER', 'TEAM_CAPTAIN'].includes(authStore.userRole) ?'/app/player/profile' : null))
const initials = computed(() =>
  (authStore.userName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
)

// A tab stays active on its sub-pages (e.g. /app/organizer/tournament/:id under /app/organizer)
const isActive = item =>
  item.exact ? route.path === item.to : route.path === item.to || route.path.startsWith(item.to + '/')

const handleLogout = async () => {
  menuOpen.value = false
  await authStore.logout()
  toast.success('Sesión cerrada')
  router.push('/auth/login')
}
</script>
