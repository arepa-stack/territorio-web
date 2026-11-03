<template>
  <div class="poster">
    <PosterHeader />
    <main class="wrap page">
      <div class="page__head">
        <div class="page__title">
          <router-link to="/" class="mono page__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
            Volver al inicio
          </router-link>
          <h1 class="display page__h1">Equipos que<br />buscan jugadores</h1>
        </div>
        <p class="page__lead">¿No tienes equipo? Elige uno, crea tu cuenta de jugador y postúlate. El capitán revisa tu solicitud.</p>
      </div>

      <div class="p-filters">
        <div class="p-field p-filters__city">
          <label class="p-label" for="pr-city">Ciudad</label>
          <input id="pr-city" v-model.trim="city" class="p-input" placeholder="Ej. Caracas" />
        </div>
        <div class="p-field p-filters__category">
          <label class="p-label" for="pr-category">Categoría</label>
          <select id="pr-category" v-model="category" class="p-input">
            <option value="">Todas</option>
            <option v-for="(label, value) in CATEGORIES" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
      </div>

      <p v-if="loading" class="page__lead">Cargando equipos…</p>
      <div v-else-if="!teams.length" class="page__empty">
        Ningún equipo está buscando jugadores con estos filtros. Crea tu cuenta igual: un capitán te puede fichar con tu cédula.
        <router-link :to="ctaLink(authStore.isAuthenticated, 'PLAYER', '/app/player')" class="btn-blaze">
          {{ authStore.isAuthenticated ? 'Ir a mi panel' : 'Crear cuenta de jugador' }}
        </router-link>
      </div>
      <div v-else class="grid">
        <RecruitingTeamCard v-for="t in teams" :key="t.id" :team="t" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import teamsService from '@/services/teams'
import { useAuthStore } from '@/stores/auth'
import { ctaLink } from '@/router/navigation'
import { CATEGORIES } from '@/utils/labels'
import '@/styles/poster.css'
import PosterHeader from '@/components/PosterHeader.vue'
import RecruitingTeamCard from '@/components/tournament/RecruitingTeamCard.vue'

const authStore = useAuthStore()
const teams = ref([])
const loading = ref(true)
const city = ref('')
const category = ref('')

let timer
const load = async () => {
  loading.value = true
  try {
    const res = await teamsService.getRecruitingTeams({ ...(city.value && { city: city.value }), ...(category.value && { category: category.value }) })
    teams.value = res.data || []
  } catch {
    teams.value = []
  } finally {
    loading.value = false
  }
}
watch([city, category], () => {
  clearTimeout(timer)
  timer = setTimeout(load, 300)
})

onMounted(load)
</script>

<style scoped>
.p-filters__city {
  flex: 1 1 320px;
}

.p-filters__category {
  flex: 0 1 240px;
}

.page__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
