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
          <h1 class="display page__h1">Torneos</h1>
        </div>
        <p class="page__lead">Busca por nombre, cancha o zona. No necesitas cuenta para mirar.</p>
      </div>

      <div class="p-filters">
        <div class="p-field p-filters__search">
          <label class="p-label" for="pt-search">Buscar</label>
          <input id="pt-search" v-model="search" class="p-input" placeholder="Nombre, cancha o zona" />
        </div>
        <div class="p-field p-filters__category">
          <label class="p-label" for="pt-category">Categoría</label>
          <select id="pt-category" v-model="category" class="p-input">
            <option value="">Todas</option>
            <option v-for="(label, value) in CATEGORIES" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
      </div>

      <div class="p-chips" role="group" aria-label="Estado">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          type="button"
          class="p-chip"
          :aria-pressed="status === f.value"
          @click="status = f.value"
        >{{ f.label }} · {{ countStatus(f.value) }}</button>
      </div>

      <p v-if="loading" class="page__lead">Cargando torneos…</p>
      <div v-else-if="!filtered.length" class="page__empty">
        No hay torneos con estos filtros.
        <router-link to="/equipos" class="link-under">Ver equipos que buscan jugadores</router-link>
      </div>
      <div v-else class="t-list">
        <PosterTournamentRow v-for="t in filtered" :key="t.id" :tournament="t" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { watch as watchCountry } from 'vue'
import { country } from '@/composables/useCountry'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import tournamentsService from '@/services/tournaments'
import { CATEGORIES } from '@/utils/labels'
import '@/styles/poster.css'
import PosterHeader from '@/components/PosterHeader.vue'
import PosterTournamentRow from '@/components/poster/PosterTournamentRow.vue'

const route = useRoute()
const router = useRouter()

const statusFilters = [
  { value: 'REGISTRATION', label: 'Inscripciones abiertas' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'FINISHED', label: 'Finalizados' },
  { value: 'ALL', label: 'Todos' }
]

const tournaments = ref([])
const loading = ref(true)
const search = ref(route.query.q || '')
const category = ref(route.query.categoria || '')
const status = ref(statusFilters.some(f => f.value === route.query.estado) ? route.query.estado : 'REGISTRATION')

// Keep filters in the URL so a search can be shared
watch([search, category, status], () => {
  router.replace({ query: { ...(search.value && { q: search.value }), ...(category.value && { categoria: category.value }), estado: status.value } })
})

const placeText = t => [...(t.zones || []).map(z => z.name), ...(t.venueNames || [])].join(' ')
const matchesFilters = t => {
  const q = search.value.trim().toLowerCase()
  return (
    (!category.value || t.category === category.value) &&
    (!q || [t.name, t.location, placeText(t)].some(v => (v || '').toLowerCase().includes(q)))
  )
}
const countStatus = s => tournaments.value.filter(t => matchesFilters(t) && (s === 'ALL' || t.status === s)).length
const filtered = computed(() =>
  tournaments.value.filter(t => matchesFilters(t) && (status.value === 'ALL' || t.status === status.value))
)

const load = async () => {
  loading.value = true
  try {
    // ponytail: client-side filtering over the first 200; move filters to the API when there are more tournaments
    const res = await tournamentsService.getAll({ limit: 200 })
    tournaments.value = (res.data.tournaments || []).filter(t => t.status !== 'CANCELLED')
    // No open registrations: land on the tournaments being played instead of an empty list
    if (!route.query.estado && status.value === 'REGISTRATION' && !countStatus('REGISTRATION')) {
      status.value = countStatus('IN_PROGRESS') ? 'IN_PROGRESS' : 'ALL'
    }
  } catch {
    tournaments.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)
watchCountry(country, load)
</script>

<style scoped>
.p-filters__search {
  flex: 1 1 320px;
}

.p-filters__category {
  flex: 0 1 240px;
}

.page__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
</style>
