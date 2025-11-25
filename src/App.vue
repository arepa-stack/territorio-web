<template>
  <v-app>
    <!-- Loading overlay -->
    <v-overlay
      v-model="isLoading"
      class="align-center justify-center"
      persistent
    >
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      />
      <div class="mt-4 text-center">
        <p class="text-h6">Cargando Sistema de Torneos...</p>
      </div>
    </v-overlay>

    <!-- Main Application -->
    <v-main>
      <router-view v-slot="{ Component }">
        <transition
          name="page"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <!-- Global Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
      multi-line
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'

// Stores
const authStore = useAuthStore()
const theme = useTheme()

// Reactive state
const state = reactive({
  isLoading: false
})

// Computed properties
const isLoading = computed(() => state.isLoading)

const snackbar = reactive({
  show: false,
  message: '',
  color: 'primary',
  timeout: 5000
})

// Theme management
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

// Global methods (expose to window for debugging)
window.toggleTheme = toggleTheme
window.showSnackbar = (message, color = 'primary', timeout = 5000) => {
  snackbar.message = message
  snackbar.color = color
  snackbar.timeout = timeout
  snackbar.show = true
}

window.setLoading = (loading) => {
  state.isLoading = loading
}
</script>

<style scoped>
/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Global styles */
.v-application {
  font-family: 'Inter', 'Roboto', sans-serif !important;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgb(var(--v-theme-surface));
}

::-webkit-scrollbar-thumb {
  background: rgb(var(--v-theme-divider));
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--v-theme-text-secondary));
}

/* Focus styles */
.v-btn:focus-visible,
.v-text-field:focus-within {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* Loading animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>