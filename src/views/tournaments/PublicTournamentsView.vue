<template>
  <div class="min-h-screen bg-surface font-body text-on-surface">
    <PublicHeader />

    <main class="mx-auto flex max-w-[1200px] flex-col gap-space-lg px-gutter py-space-lg md:px-margin-md">
      <div>
        <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Torneos</h1>
        <p class="m-0 mt-1 text-body-md text-on-surface-variant">Busca por nombre, cancha o zona. No necesitas cuenta para mirar.</p>
      </div>

      <div class="flex flex-col gap-space-sm md:flex-row md:items-end">
        <div class="relative flex-1">
          <label class="sr-only" for="pt-search">Buscar torneo</label>
          <span class="icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input id="pt-search" v-model="search" class="input pl-10" placeholder="Nombre, cancha o zona" />
        </div>
        <div class="md:w-56">
          <label class="field-label" for="pt-category">Categoría</label>
          <select id="pt-category" v-model="category" class="input">
            <option value="">Todas</option>
            <option v-for="(label, value) in CATEGORIES" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
      </div>

      <div class="-mx-gutter flex gap-space-xs overflow-x-auto px-gutter pb-1 md:mx-0 md:px-0">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          type="button"
          class="filter-chip"
          :aria-pressed="status === f.value"
          @click="status = f.value"
        >{{ f.label }} ({{ countStatus(f.value) }})</button>
      </div>

      <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando torneos…</p>
      <div v-else-if="!filtered.length" class="card flex flex-col gap-space-sm p-space-lg">
        <p class="m-0 text-body-md text-on-surface-variant">No hay torneos con estos filtros.</p>
        <router-link to="/equipos" class="btn-secondary self-start">Ver equipos que buscan jugadores</router-link>
      </div>
      <div v-else class="grid gap-space-md md:grid-cols-2 lg:grid-cols-3">
        <TournamentCard v-for="t in filtered" :key="t.id" :tournament="t" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import tournamentsService from '@/services/tournaments'
import { CATEGORIES } from '@/utils/labels'
import PublicHeader from '@/components/PublicHeader.vue'
import TournamentCard from '@/components/tournament/TournamentCard.vue'

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

onMounted(async () => {
  try {
    // ponytail: client-side filtering over the first 200; move filters to the API when there are more tournaments
    const res = await tournamentsService.getAll({ limit: 200 })
    tournaments.value = (res.data.tournaments || []).filter(t => t.status !== 'CANCELLED')
  } catch {
    tournaments.value = []
  } finally {
    loading.value = false
  }
})
</script>
