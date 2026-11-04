<template>
  <!-- Public shell for read-only pages (match, team, player) reused from the logged-in app -->
  <div class="poster">
    <PosterHeader />
    <main class="court wrap public-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import PosterHeader from '@/components/PosterHeader.vue'
import '@/styles/poster.css'
</script>

<style scoped>
.public-main {
  padding-top: 32px;
  padding-bottom: 72px;
}
@media (max-width: 720px) {
  .public-main {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
