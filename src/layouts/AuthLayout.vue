<template>
  <div class="flex min-h-screen flex-col bg-surface font-body text-on-surface">
    <header class="flex h-16 items-center justify-between px-gutter md:px-margin-md">
      <router-link to="/" class="flex items-center gap-space-sm no-underline">
        <span class="icon icon-fill text-[28px] text-primary-container">sports_basketball</span>
        <span class="flex flex-col leading-none">
          <span class="whitespace-nowrap font-headline-md text-[20px] uppercase text-on-surface md:text-headline-md">Basketball MVP</span>
          <span class="label-tactical mt-0.5 text-on-surface-variant">CCS Streetball</span>
        </span>
      </router-link>
      <button
        type="button"
        class="flex h-11 w-11 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-on-surface-variant hover:text-primary"
        :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        @click="toggle"
      >
        <span class="icon">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>
    </header>

    <main class="flex flex-1 items-start justify-center px-gutter pb-margin-lg pt-space-lg md:items-center">
      <div class="card w-full max-w-md border-t-2 border-t-primary-container p-space-lg md:p-space-xl">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { useColorMode } from '@/composables/useColorMode'

const { isDark, toggle } = useColorMode()
</script>
