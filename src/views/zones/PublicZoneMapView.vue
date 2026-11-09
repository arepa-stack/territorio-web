<template>
  <!-- Public zone map: zones, champions, participants and venues. Design: Claude Design canvas "Mapa de zonas" -->
  <div class="poster">
    <PosterHeader />
    <main class="wrap page">
      <div class="page__head">
        <div class="page__title">
          <router-link to="/" class="mono page__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
            Volver al inicio
          </router-link>
          <h1 class="display page__h1">Mapa de zonas</h1>
        </div>
        <p class="page__lead">Toca una zona para ver quién manda, los equipos que pelean por ella y sus canchas.</p>
      </div>

      <TurfLoader v-if="loading" label="Cargando zonas" />
      <p v-else-if="!zones.length" class="page__empty">Todavía no hay zonas activas.</p>
      <div v-else class="layout">
        <div class="layout__map">
          <div class="map-box">
            <ZoneLeafletMap :zones="zones" :standings="standings" :selected-id="selectedId" @select="select" />
          </div>
          <div class="mono legend">
            <span class="legend__item"><span class="legend__champ" />Campeón actual</span>
            <span class="legend__item"><span class="legend__dot legend__dot--active" />Cancha con torneo activo</span>
            <span class="legend__item"><span class="legend__dot" />Cancha libre</span>
          </div>
        </div>

        <aside class="layout__side" aria-label="Zonas">
          <div class="zone-list">
            <button
              v-for="z in zones"
              :key="z.id"
              type="button"
              class="zone-list__item"
              :class="{ 'is-on': z.id === selectedId }"
              :aria-pressed="z.id === selectedId"
              @click="select(z.id)"
            >
              <span class="zone-list__dot" :style="{ background: z.color }" />
              <span class="zone-list__text">
                <span class="display zone-list__name">{{ z.name }}</span>
                <span class="zone-list__champ">{{ standings[z.id]?.champion?.teamName || 'Trono vacío' }}</span>
              </span>
              <span class="mono zone-list__status" :class="standings[z.id]?.ownerTeamId ? 'is-owned' : 'is-contested'">
                {{ standings[z.id]?.ownerTeamId ? 'Con dueño' : 'En disputa' }}
              </span>
            </button>
          </div>

          <ZonePanel v-if="selectedStanding" :zone="selectedStanding" heading-tag="h2">
            <div class="venues">
              <div class="mono venues__head">Canchas · {{ selectedZone.venues.length }}</div>
              <p v-if="!selectedZone.venues.length" class="venues__none">Esta zona aún no tiene canchas.</p>
              <div v-for="v in selectedZone.venues" :key="v.id" class="venues__item">
                <span class="venues__name">{{ v.name }}</span>
                <span v-if="!v.tournaments.length" class="venues__none">Sin torneos todavía.</span>
                <router-link v-for="t in v.tournaments.slice(0, 4)" :key="t.id" :to="`/torneo/${t.id}`" class="venues__t">
                  <span>{{ t.name }}</span>
                  <span class="mono venues__chip" :style="{ color: POSTER_STATUS[t.status]?.color, borderColor: POSTER_STATUS[t.status]?.color }">
                    {{ POSTER_STATUS[t.status]?.label || t.status }}
                  </span>
                </router-link>
              </div>
            </div>
          </ZonePanel>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@/styles/poster.css'
import tournamentsService from '@/services/tournaments'
import zonesService from '@/services/zones'
import PosterHeader from '@/components/PosterHeader.vue'
import ZoneLeafletMap from '@/components/zone/ZoneLeafletMap.vue'
import ZonePanel from '@/components/zone/ZonePanel.vue'
import { POSTER_STATUS } from '@/utils/labels'

const route = useRoute()
const router = useRouter()
const zones = ref([])
const standings = ref({})
const loading = ref(true)
// ?zona=<id> keeps the selection shareable
const selectedId = computed(() => route.query.zona || zones.value[0]?.id || null)
const selectedZone = computed(() => zones.value.find(z => z.id === selectedId.value))
const selectedStanding = computed(() => standings.value[selectedId.value])

const select = id => router.replace({ query: { ...route.query, zona: id } })

onMounted(async () => {
  const [z, s] = await Promise.allSettled([zonesService.getAll(), tournamentsService.getZoneStandings()])
  zones.value = z.status === 'fulfilled' ? (z.value.data?.data || []).filter(zone => zone.isActive) : []
  standings.value = s.status === 'fulfilled' ? Object.fromEntries((s.value.data || []).map(row => [row.id, row])) : {}
  loading.value = false
})
</script>

<style scoped>
.layout {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 24px;
}

.layout__map {
  display: flex;
  min-width: 0;
  flex: 999 1 600px;
  flex-direction: column;
  gap: 12px;
}

.map-box {
  height: min(680px, 72vh);
  border: 1px solid var(--line);
}

.layout__side {
  display: flex;
  min-width: 0;
  flex: 1 1 380px;
  flex-direction: column;
  gap: 16px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  font-size: 11px;
  color: var(--muted);
}

.legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend__champ {
  width: 12px;
  height: 12px;
  border: 2px solid var(--gold);
}

.legend__dot {
  width: 12px;
  height: 12px;
  border: 3px solid var(--blaze);
  border-radius: 50%;
  background: var(--chalk);
}

.legend__dot--active {
  border-color: var(--chalk);
  background: var(--blaze);
}

.zone-list {
  display: flex;
  flex-direction: column;
  border-top: 3px solid var(--chalk);
}

.zone-list__item {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 44px;
  padding: 16px 12px;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  color: var(--chalk);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.zone-list__item:hover,
.zone-list__item.is-on {
  background: #1c1b17;
}

.zone-list__item:focus-visible {
  outline: 3px solid var(--chalk);
  outline-offset: -3px;
}

.zone-list__dot {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 50%;
}

.zone-list__text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.zone-list__name {
  font-size: 24px;
  line-height: 1;
}

.zone-list__champ {
  font-size: 14px;
  color: var(--gold);
}

.zone-list__status {
  font-size: 11px;
}

.zone-list__status.is-owned {
  color: var(--gold);
}

.zone-list__status.is-contested {
  color: var(--hot);
}

.venues {
  display: flex;
  flex-direction: column;
}

.venues__head {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  font-size: 11px;
  color: var(--muted);
}

.venues__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line-soft);
}

.venues__name {
  font-size: 16px;
  font-weight: 700;
}

.venues__none {
  padding-top: 8px;
  font-size: 13px;
  color: var(--muted);
}

.poster .venues__t {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  color: var(--chalk-dim);
  text-decoration: none;
}

.venues__chip {
  padding: 4px 8px;
  border: 1px solid;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
