<template>
  <!-- Where a match is played: address, a small OSM map when the venue has coordinates, and a Google Maps link -->
  <div class="vl">
    <div class="vl__text">
      <span class="vl__name">{{ name || 'Cancha por definir' }}</span>
      <span v-if="address" class="vl__addr">{{ address }}</span>
    </div>
    <div v-if="hasCoords" ref="mapEl" class="vl__map" role="img" :aria-label="`Mapa de ${name}`"></div>
    <a v-if="name" :href="mapsUrl" target="_blank" rel="noopener" class="btn-secondary vl__link">
      <span class="icon">directions</span> Cómo llegar en Google Maps
    </a>
  </div>
</template>

<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useVenues } from '@/composables/useVenues'

// name: Match.venue, which is the venue's name (matches don't store a venue id)
const props = defineProps({ name: { type: String, default: '' } })

const { findByName } = useVenues()
const venue = computed(() => findByName(props.name))
const address = computed(() => [venue.value?.address?.trim(), venue.value?.city].filter(Boolean).join(', '))
const hasCoords = computed(() => venue.value?.latitude != null && venue.value?.longitude != null)
// Google Maps URLs API: free, no key. Coordinates when known, otherwise a text search
const mapsUrl = computed(() => {
  const query = hasCoords.value ? `${venue.value.latitude},${venue.value.longitude}` : [props.name, address.value].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
})

const mapEl = ref(null)
let map = null

const drawMap = async () => {
  map?.remove()
  map = null
  await nextTick()
  if (!hasCoords.value || !mapEl.value) return
  const at = [Number(venue.value.latitude), Number(venue.value.longitude)]
  map = L.map(mapEl.value, { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, keyboard: false, attributionControl: false }).setView(at, 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
  L.circleMarker(at, { radius: 9, color: '#EDE8DC', weight: 3, fillColor: '#FF4F12', fillOpacity: 1 }).addTo(map)
}

watch(venue, drawMap, { immediate: true })
onBeforeUnmount(() => map?.remove())
</script>

<style scoped>
.vl {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vl__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl__name {
  font-weight: 700;
}

.vl__addr {
  font-size: 13px;
  color: rgb(var(--c-on-surface-variant));
}

.vl__map {
  height: 150px;
  border: 1px solid rgb(var(--c-outline-variant) / 0.6);
  background: rgb(var(--c-surface-container-high));
}

.vl__link {
  align-self: flex-start;
}
</style>
