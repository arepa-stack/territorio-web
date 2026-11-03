<template>
  <!-- Player and captain get the "cancha" shell; organizer, referee and moderator keep the classic one -->
  <CourtLayout v-if="isCourt" />
  <MainLayout v-else />
</template>

<script setup>
import { computed, onUnmounted, watchEffect } from 'vue'
import { useAuthStore } from '@/stores/auth'
import CourtLayout from '@/layouts/CourtLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'

const COURT_ROLES = ['PLAYER', 'TEAM_CAPTAIN']
const authStore = useAuthStore()
const isCourt = computed(() => COURT_ROLES.includes(authStore.userRole))

// The theme goes on <html> so dialogs and toasts mounted outside the shell take it too
watchEffect(() => document.documentElement.classList.toggle('court', isCourt.value))
onUnmounted(() => document.documentElement.classList.remove('court'))
</script>
