<template>
  <div class="min-h-screen bg-surface font-body text-on-surface">
    <PublicHeader />

    <main class="mx-auto flex max-w-[1200px] flex-col gap-space-lg px-gutter py-space-lg md:px-margin-md">
      <div>
        <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Equipos que buscan jugadores</h1>
        <p class="m-0 mt-1 text-body-md text-on-surface-variant">
          ¿No tienes equipo? Elige uno, crea tu cuenta de jugador y postúlate. El capitán revisa tu solicitud.
        </p>
      </div>

      <div class="flex flex-col gap-space-sm md:flex-row md:items-end">
        <div class="flex-1">
          <label class="field-label" for="pr-city">Ciudad</label>
          <input id="pr-city" v-model.trim="city" class="input" placeholder="Ej. Caracas" />
        </div>
        <div class="md:w-56">
          <label class="field-label" for="pr-category">Categoría</label>
          <select id="pr-category" v-model="category" class="input">
            <option value="">Todas</option>
            <option v-for="(label, value) in CATEGORIES" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
      </div>

      <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando equipos…</p>
      <div v-else-if="!teams.length" class="card flex flex-col gap-space-sm p-space-lg">
        <p class="m-0 text-body-md text-on-surface-variant">
          Ningún equipo está buscando jugadores con estos filtros. Crea tu cuenta igual: un capitán te puede fichar con tu cédula.
        </p>
        <router-link :to="ctaLink(authStore.isAuthenticated, 'PLAYER', '/app/player')" class="btn-primary self-start">
          {{ authStore.isAuthenticated ? 'Ir a mi panel' : 'Crear cuenta de jugador' }}
        </router-link>
      </div>
      <div v-else class="grid gap-space-md md:grid-cols-2 lg:grid-cols-3">
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
import PublicHeader from '@/components/PublicHeader.vue'
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
