<template>
  <!-- Dynamic classes live on a wrapper: Vue would overwrite the classes Leaflet adds to its container -->
  <div class="zone-map" :class="{ flying }"><div ref="mapEl" class="zone-map__canvas"></div></div>
</template>

<script setup>
// OpenStreetMap with the "cartel de cancha" look: dark tiles, zone circles and a fixed champion label per zone
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  zones: { type: Array, default: () => [] }, // GET /zones (with venues)
  standings: { type: Object, default: () => ({}) }, // zoneId -> GET /tournaments/zone-standings row
  selectedId: { type: String, default: null },
  interactive: { type: Boolean, default: true }
})
const emit = defineEmits(['select'])

const ACTIVE = ['REGISTRATION', 'IN_PROGRESS']
const mapEl = ref(null)
const flying = ref(false)
let map = null
let layers = null

const text = (value, className) => {
  const el = document.createElement('span')
  el.textContent = value
  if (className) el.className = className
  return el
}

const zoneLabel = zone => {
  const s = props.standings[zone.id]
  const el = document.createElement('span')
  el.append(text(zone.name, 'zl-name'))
  el.append(text(s?.champion ? s.champion.teamName : 'Trono vacío', s?.champion ? 'zl-champ' : 'zl-empty'))
  el.append(text(s?.ownerTeamId ? `Dueño: ${s.ranking[0].teamName}` : 'En disputa', s?.ownerTeamId ? 'zl-owner' : 'zl-contested'))
  return el
}

const draw = () => {
  layers.clearLayers()
  props.zones.forEach(zone => {
    const selected = zone.id === props.selectedId
    L.circle([Number(zone.latitude), Number(zone.longitude)], {
      radius: zone.radius,
      color: zone.color || '#FF4F12',
      fillColor: zone.color || '#FF4F12',
      fillOpacity: selected ? 0.32 : 0.18,
      weight: selected ? 5 : 3
    })
      .bindTooltip(zoneLabel(zone), { permanent: true, direction: 'center', className: 'zone-label', interactive: props.interactive })
      .on('click', () => emit('select', zone.id))
      .addTo(layers)
    zone.venues.forEach(venue => {
      if (venue.latitude == null || venue.longitude == null) return // old venues without a location
      const active = venue.tournaments.some(t => ACTIVE.includes(t.status))
      L.circleMarker([Number(venue.latitude), Number(venue.longitude)], {
        radius: 7,
        color: active ? '#EDE8DC' : '#FF4F12',
        weight: 3,
        fillColor: active ? '#FF4F12' : '#EDE8DC',
        fillOpacity: 1
      })
        .bindTooltip(text(venue.name), { className: 'venue-label' })
        .addTo(layers)
    })
  })
}

const fitAll = () => {
  if (layers.getLayers().length) map.fitBounds(L.featureGroup(layers.getLayers()).getBounds(), { padding: [24, 24] })
}

// During a flight Leaflet scales circles as a bitmap and only redraws on landing: hide them until the move ends
const flyToZone = id => {
  const zone = props.zones.find(z => z.id === id)
  if (!zone) return
  flying.value = true
  map.once('moveend', () => (flying.value = false))
  map.flyToBounds(L.latLng(Number(zone.latitude), Number(zone.longitude)).toBounds(zone.radius * 2.4), { duration: 1.2 })
}

watch(() => [props.zones, props.standings], () => {
  if (!map) return
  draw()
  if (props.selectedId) flyToZone(props.selectedId)
  else fitAll()
})
watch(() => props.selectedId, id => {
  draw()
  if (id) flyToZone(id)
})

onMounted(() => {
  map = L.map(mapEl.value, {
    preferCanvas: true,
    scrollWheelZoom: props.interactive,
    dragging: props.interactive,
    zoomControl: props.interactive,
    doubleClickZoom: props.interactive,
    touchZoom: props.interactive
  }).setView([10.4806, -66.9036], 12) // Caracas until zones load
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)
  layers = L.layerGroup().addTo(map)
  draw()
  if (props.selectedId) flyToZone(props.selectedId)
  else fitAll()
})

onBeforeUnmount(() => map?.remove())
</script>

<style scoped>
.zone-map,
.zone-map__canvas {
  height: 100%;
  width: 100%;
}

.zone-map__canvas {
  background: #141411;
}

/* Dark, low-saturation streets so the zones carry the color */
.zone-map :deep(.leaflet-tile-pane) {
  filter: grayscale(1) invert(1) brightness(0.62) contrast(1.15);
}

.zone-map :deep(.leaflet-overlay-pane),
.zone-map :deep(.leaflet-tooltip-pane) {
  transition: opacity 0.2s;
}

.flying :deep(.leaflet-overlay-pane),
.flying :deep(.leaflet-tooltip-pane) {
  opacity: 0;
  transition: none;
}

.zone-map :deep(.zone-label) {
  padding: 8px 14px;
  border: 2px solid #f5b21b;
  border-radius: 0;
  background: #0d0d0b;
  box-shadow: none;
  color: #ede8dc;
  text-align: center;
  text-transform: uppercase;
  line-height: 1.1;
  cursor: pointer;
}

.zone-map :deep(.zone-label)::before,
.zone-map :deep(.venue-label)::before {
  display: none;
}

.zone-map :deep(.zone-label span) {
  display: block;
}

.zone-map :deep(.zl-name) {
  font-family: 'Anton', sans-serif;
  font-size: 20px;
}

.zone-map :deep(.zl-champ) {
  font-family: 'Anton', sans-serif;
  font-size: 17px;
  color: #f5b21b;
}

.zone-map :deep(.zl-empty) {
  font-family: 'Anton', sans-serif;
  font-size: 15px;
  color: #a8a397;
}

.zone-map :deep(.zl-owner),
.zone-map :deep(.zl-contested) {
  margin-top: 2px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
}

.zone-map :deep(.zl-owner) {
  color: #f5b21b;
}

.zone-map :deep(.zl-contested) {
  color: #ff7a45;
}

.zone-map :deep(.venue-label) {
  border: 1px solid #2a2924;
  border-radius: 0;
  background: #0d0d0b;
  color: #ede8dc;
  font-family: 'Archivo', sans-serif;
  font-weight: 700;
}

.zone-map :deep(.leaflet-control-attribution) {
  background: rgb(13 13 11 / 0.8);
  color: #a8a397;
}

.zone-map :deep(.leaflet-control-attribution a) {
  color: #ede8dc;
}
</style>
