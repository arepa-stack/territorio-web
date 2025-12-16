<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent class="elevation-1">
      <!-- Logo Section -->
      <div class="pa-4">
        <div class="d-flex align-center">
          <v-avatar size="40" color="primary" class="mr-3">
            <v-icon color="white">mdi-basketball</v-icon>
          </v-avatar>

          <div v-if="!rail">
            <h3 class="text-h6 font-weight-bold">Basketball</h3>
            <p class="text-caption text-medium-emphasis">Tournament System</p>
          </div>
        </div>
      </div>

      <v-divider />

      <!-- User Profile Section -->
      <div v-if="authStore.user && !rail" class="pa-4">
        <v-card color="surface" class="pa-3" variant="outlined">
          <div class="d-flex align-center">
            <v-avatar size="32" color="primary" class="mr-3">
              <v-icon color="white" size="18">
                {{ getRoleIcon(authStore.user.role) }}
              </v-icon>
            </v-avatar>

            <div class="flex-grow-1">
              <p class="text-body-2 font-weight-medium">
                {{ authStore.user.fullName }}
              </p>
              <p class="text-caption text-medium-emphasis">
                {{ getRoleName(authStore.user.role) }}
              </p>
            </div>

            <v-btn icon variant="text" size="small" @click="navigateToProfile">
              <v-icon>mdi-account-edit</v-icon>
            </v-btn>
          </div>
        </v-card>
      </div>

      <v-divider v-if="authStore.user && !rail" />

      <!-- Navigation Menu -->
      <v-list nav>
        <v-list-item v-for="item in navigationItems" :key="item.name" :prepend-icon="item.icon" :title="item.title"
          :to="item.to" :value="item.name" color="primary" rounded="xl" class="mb-1" />
      </v-list>

      <!-- Quick Actions -->
      <template #append>
        <div class="pa-4">
          <v-btn v-if="!rail" block variant="outlined" prepend-icon="mdi-brightness-6" @click="toggleTheme">
            {{ theme.global.current.value.dark ? 'Modo Claro' : 'Modo Oscuro' }}
          </v-btn>

          <v-btn v-else icon variant="outlined" @click="toggleTheme" class="mb-2">
            <v-icon>mdi-brightness-6</v-icon>
          </v-btn>

          <v-btn block variant="outlined" color="error" prepend-icon="mdi-logout" @click="handleLogout" class="mt-2">
            Cerrar Sesión
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar elevation="0" class="app-bar" :order="0">
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-toolbar-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-basketball</v-icon>
        {{ getPageTitle() }}
      </v-toolbar-title>

      <v-spacer />

      <!-- Theme Toggle (Mobile) -->
      <v-btn v-if="$vuetify.display.smAndDown" icon variant="text" @click="toggleTheme">
        <v-icon>{{ theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <!-- User Menu -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text">
            <v-avatar size="32" color="primary">
              <v-icon color="white" size="18">
                {{ getRoleIcon(authStore.user?.role) }}
              </v-icon>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <v-list-item prepend-icon="mdi-account" title="Mi Perfil" @click="navigateToProfile" />
          <v-list-item prepend-icon="mdi-cog" title="Configuración" @click="navigateToSettings" />
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" title="Cerrar Sesión" @click="handleLogout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <!-- Breadcrumbs -->
        <v-breadcrumbs v-if="breadcrumbs.length > 1" :items="breadcrumbs" class="pa-0 mb-4">
          <template #divider>
            <v-icon icon="mdi-chevron-right" />
          </template>
        </v-breadcrumbs>

        <!-- Router View with Transition -->
        <router-view v-slot="{ Component, route }">
          <transition :name="route.meta.transition || 'fade'" mode="out-in">
            <div :key="route.path">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Global Loading Overlay -->
    <v-overlay v-model="isGlobalLoading" class="align-center justify-center" persistent>
      <v-progress-circular indeterminate size="64" color="primary" />
    </v-overlay>
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

// Composables
const router = useRouter()
const route = useRoute()
const theme = useTheme()
const toast = useToast()
const authStore = useAuthStore()

// Reactive state
const drawer = ref(true)
const rail = ref(false)

// Computed
const isGlobalLoading = computed(() => {
  // Check any loading states from stores
  return false // You can extend this to check multiple stores
})

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  const items = matched.map(item => ({
    title: item.meta.title,
    to: item.path,
    disabled: route.path === item.path
  }))

  return items
})

const navigationItems = computed(() => {
  const baseItems = [
    {
      name: 'dashboard',
      title: 'Dashboard',
      icon: 'mdi-view-dashboard',
      to: getDashboardRoute(),
      roles: ['PLAYER', 'TEAM_CAPTAIN', 'ORGANIZER', 'ADMIN']
    }
  ]

  const roleSpecificItems = {
    PLAYER: [
      { name: 'profile', title: 'Mi Perfil', icon: 'mdi-account', to: '/app/player/profile' },
      { name: 'stats', title: 'Estadísticas', icon: 'mdi-chart-line', to: '/app/player/stats' },
      { name: 'teams', title: 'Mis Equipos', icon: 'mdi-account-group', to: '/app/player/teams' },
      { name: 'schedule', title: 'Calendario', icon: 'mdi-calendar', to: '/app/player/schedule' }
    ],
    TEAM_CAPTAIN: [
      // 'Mis Equipos' is covered by Dashboard
      { name: 'register', title: 'Registrar Jugador', icon: 'mdi-account-plus', to: '/app/captain/register-player' }
    ],
    ORGANIZER: [
      { name: 'dashboard', title: 'Panel Principal', icon: 'mdi-view-dashboard', to: '/app/organizer' },
      // { name: 'tournaments', title: 'Torneos', icon: 'mdi-trophy', to: '/app/organizer/tournaments' },
      // { name: 'zones', title: 'Zonas', icon: 'mdi-map', to: '/app/organizer/zones' },
      // { name: 'venues', title: 'Canchas', icon: 'mdi-stadium', to: '/app/organizer/venues' },
      // { name: 'analytics', title: 'Analíticas', icon: 'mdi-chart-pie', to: '/app/organizer/analytics' }
    ],
    ADMIN: [
      { name: 'users', title: 'Usuarios', icon: 'mdi-account-multiple', to: '/app/admin/users' },
      { name: 'reports', title: 'Reportes', icon: 'mdi-file-chart', to: '/app/admin/reports' },
      { name: 'settings', title: 'Configuración', icon: 'mdi-cog', to: '/app/admin/settings' }
    ]
  }

  const userRole = authStore.userRole
  const specificItems = roleSpecificItems[userRole] || []

  return [...baseItems, ...specificItems]
})

// Methods
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const getDashboardRoute = () => {
  const role = authStore.userRole
  const routes = {
    PLAYER: '/app/player',
    TEAM_CAPTAIN: '/app/captain',
    ORGANIZER: '/app/organizer',
    ADMIN: '/app/admin'
  }
  return routes[role] || '/app/player'
}

const getRoleIcon = (role) => {
  const icons = {
    PLAYER: 'mdi-basketball',
    TEAM_CAPTAIN: 'mdi-account-group',
    ORGANIZER: 'mdi-trophy',
    ADMIN: 'mdi-shield-account'
  }
  return icons[role] || 'mdi-account'
}

const getRoleName = (role) => {
  const names = {
    PLAYER: 'Jugador',
    TEAM_CAPTAIN: 'Capitán',
    ORGANIZER: 'Organizador',
    ADMIN: 'Administrador'
  }
  return names[role] || 'Usuario'
}

const getPageTitle = () => {
  const routeMeta = route.meta
  if (routeMeta.title) {
    return routeMeta.title
  }
  return 'Basketball Tournament System'
}

const navigateToProfile = () => {
  router.push('/app/profile')
}

const navigateToSettings = () => {
  router.push('/app/profile')
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    toast.success('Sesión cerrada correctamente')
  } catch (error) {
    console.error('Error during logout:', error)
    toast.error('Error al cerrar sesión')
  }
}

// Watch for rail mode changes
watch(
  () => rail.value,
  (newVal) => {
    // Auto-close drawer in mobile when rail is enabled
    if (newVal && window.innerWidth < 1280) {
      drawer.value = false
    }
  }
)

// Auto-close drawer on mobile
watch(
  () => window.innerWidth,
  (width) => {
    if (width < 1280 && !rail.value) {
      drawer.value = false
    } else if (width >= 1280) {
      drawer.value = true
    }
  }
)
</script>

<style scoped>
.app-bar {
  border-bottom: 1px solid rgb(var(--v-theme-divider)) !important;
  backdrop-filter: blur(12px);
  background-color: rgb(var(--v-theme-surface)) !important;
}

.main-content {
  background: linear-gradient(135deg,
      rgb(var(--v-theme-background)) 0%,
      rgb(var(--v-theme-surface)) 100%);
  min-height: 100vh;
}

/* Breadcrumbs styling */
:deep(.v-breadcrumbs-item) {
  color: rgb(var(--v-theme-text-secondary));
}

:deep(.v-breadcrumbs-item--disabled) {
  color: rgb(var(--v-theme-text-primary));
}

/* Navigation styling */
:deep(.v-navigation-drawer) {
  border-right: 1px solid rgb(var(--v-theme-divider)) !important;
}

:deep(.v-list-item) {
  margin: 0 8px;
  border-radius: 12px !important;
}

:deep(.v-list-item--active) {
  background: rgba(var(--v-theme-primary), 0.1) !important;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

/* Custom scrollbar for navigation */
:deep(.v-navigation-drawer__content) {
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--v-theme-divider)) transparent;
}

:deep(.v-navigation-drawer__content)::-webkit-scrollbar {
  width: 6px;
}

:deep(.v-navigation-drawer__content)::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.v-navigation-drawer__content)::-webkit-scrollbar-thumb {
  background-color: rgb(var(--v-theme-divider));
  border-radius: 3px;
}
</style>