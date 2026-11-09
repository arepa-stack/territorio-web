<template>
  <!-- Every tournament in the league, paged by the API -->
  <div class="admin">
    <div class="page__head">
      <h1 class="display page__h1">Torneos</h1>
      <p class="page__lead">Todos los torneos de la liga, con su organizador, cupos y estado.</p>
    </div>

    <div class="p-chips" role="group" aria-label="Estado">
      <button
        v-for="f in STATUS_FILTERS"
        :key="f.value"
        type="button"
        class="p-chip"
        :aria-pressed="status === f.value"
        @click="status = f.value"
      >{{ f.label }}</button>
    </div>

    <TurfLoader v-if="loading" label="Cargando torneos" />
    <p v-else-if="!tournaments.length" class="page__empty">No hay torneos con este estado.</p>

    <div v-else class="table-box">
      <table class="t-table">
        <thead>
          <tr class="mono">
            <th scope="col">Torneo</th>
            <th scope="col">Organizador</th>
            <th scope="col">Fechas</th>
            <th scope="col">Equipos</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tournaments" :key="t.id">
            <td>
              <router-link :to="`/torneo/${t.id}`" class="display t-table__name">{{ t.name }}</router-link>
              <span class="t-table__sub">{{ t.location || 'Sin cancha' }} · {{ CATEGORIES[t.category] || t.category }}</span>
            </td>
            <td class="t-table__org">{{ t.organizerName }}</td>
            <td class="mono t-table__dates">{{ formatDate(t.startDate) }}<br />{{ formatDate(t.endDate) }}</td>
            <td class="mono">
              <span class="t-table__teams">{{ t.approvedTeams }}/{{ t.maxTeams }}</span>
              <span v-if="t.pendingTeams" class="t-table__pending">{{ t.pendingTeams }} pendiente{{ t.pendingTeams > 1 ? 's' : '' }}</span>
            </td>
            <td>
              <span class="mono t-table__status" :style="{ color: statusOf(t).color, borderColor: statusOf(t).color }">{{ statusOf(t).label }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PosterPager v-model:page="page" :per-page="PER_PAGE" :total="total" noun="torneos" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import { handleApiError } from '@/services/api'
import { CATEGORIES, POSTER_STATUS, formatDate } from '@/utils/labels'
import PosterPager from '@/components/poster/PosterPager.vue'
import { country } from '@/composables/useCountry'

const PER_PAGE = 15
const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'REGISTRATION', label: 'Inscripciones' },
  { value: 'IN_PROGRESS', label: 'En juego' },
  { value: 'FINISHED', label: 'Finalizados' },
  { value: 'CANCELLED', label: 'Cancelados' }
]

const toast = useToast()
const tournaments = ref([])
const total = ref(0)
const page = ref(1)
const status = ref('')
const loading = ref(true)

const statusOf = t => POSTER_STATUS[t.status] || { label: t.status, color: '#8C877C' }

const load = async () => {
  loading.value = true
  try {
    const { data } = await tournamentsService.getAll({ page: page.value, limit: PER_PAGE, ...(status.value && { status: status.value }) })
    tournaments.value = data.tournaments || []
    total.value = data.total || 0
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron cargar los torneos'))
  } finally {
    loading.value = false
  }
}

watch(status, () => {
  if (page.value === 1) load()
  else page.value = 1 // the page watcher reloads
})
watch(page, load, { immediate: true })
watch(country, () => (page.value === 1 ? load() : (page.value = 1)))
</script>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.table-box {
  overflow-x: auto;
  border-top: 3px solid var(--chalk);
}

.t-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.t-table th {
  padding: 14px 12px 14px 0;
  border-bottom: 1px solid var(--line);
  font-size: 11px;
  font-weight: 400;
  color: var(--muted);
}

.t-table td {
  padding: 18px 12px 18px 0;
  border-bottom: 1px solid var(--line-soft);
  vertical-align: middle;
}

.poster .t-table__name {
  display: block;
  font-size: 26px;
  line-height: 1;
  text-decoration: none;
}

.t-table__sub {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--muted);
}

.t-table__org {
  font-size: 15px;
  white-space: nowrap;
}

.t-table__dates {
  font-size: 12px;
  line-height: 1.6;
  white-space: nowrap;
}

.t-table__teams {
  display: block;
  font-size: 16px;
  font-weight: 700;
}

.t-table__pending {
  display: block;
  font-size: 11px;
  color: var(--gold);
  white-space: nowrap;
}

.t-table__status {
  padding: 6px 10px;
  border: 2px solid;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
