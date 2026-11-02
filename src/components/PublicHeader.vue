<template>
  <header class="sticky top-0 z-30 border-0 border-b border-solid border-outline-variant/40 bg-surface/90 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-gutter md:px-margin-md">
      <router-link to="/" class="flex items-center gap-space-sm no-underline">
        <span class="icon icon-fill text-[28px] text-primary-container">sports_basketball</span>
        <span class="flex flex-col leading-none">
          <span class="whitespace-nowrap font-headline-md text-[20px] uppercase text-on-surface md:text-headline-md">Basketball MVP</span>
          <span class="label-tactical mt-0.5 text-on-surface-variant">CCS Streetball</span>
        </span>
      </router-link>
      <div class="flex items-center gap-space-xs">
        <nav class="hidden items-center gap-space-md sm:flex" aria-label="Explorar">
          <router-link to="/torneos" class="label-tactical text-on-surface-variant no-underline hover:text-primary">Torneos</router-link>
          <router-link to="/equipos" class="label-tactical text-on-surface-variant no-underline hover:text-primary">Equipos</router-link>
        </nav>
        <button
          type="button"
          class="flex h-11 w-11 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-on-surface-variant hover:text-primary"
          :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          @click="toggle"
        >
          <span class="icon">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
        </button>
        <router-link :to="authStore.isAuthenticated ? homeRoute : '/auth/login'" class="btn-secondary">
          {{ authStore.isAuthenticated ? 'Mi panel' : 'Entrar' }}
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useColorMode } from '@/composables/useColorMode'
import { HOME_BY_ROLE } from '@/router/navigation'

const authStore = useAuthStore()
const { isDark, toggle } = useColorMode()
const homeRoute = computed(() => HOME_BY_ROLE[authStore.userRole] || '/app/tournaments')
</script>
