<template>
  <div class="flex flex-col gap-space-md">
    <div class="flex flex-wrap items-end justify-between gap-space-sm">
      <div>
        <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">
          {{ canEdit ? 'Zonas y canchas' : 'Mapa de zonas' }}
        </h1>
        <p v-if="!canEdit" class="m-0 mt-1 text-body-md text-on-surface-variant">Selecciona una zona o una cancha para ver sus torneos.</p>
      </div>
      <div v-if="canEdit" class="flex gap-space-xs">
        <button type="button" class="filter-chip" :aria-pressed="mode === 'zone'" @click="setMode('zone')">
          <span class="icon align-middle text-[18px]">add_circle</span> Nueva zona
        </button>
        <button type="button" class="filter-chip" :aria-pressed="mode === 'venue'" @click="setMode('venue')">
          <span class="icon align-middle text-[18px]">sports_basketball</span> Nueva cancha
        </button>
      </div>
    </div>

    <p v-if="hint" class="m-0 flex items-center gap-space-sm rounded border border-solid border-secondary/40 bg-secondary/10 p-space-sm text-body-sm text-on-surface">
      <span class="icon text-secondary">touch_app</span>{{ hint }}
    </p>

    <div class="grid gap-space-md lg:grid-cols-[1fr_22rem]">
      <div class="flex flex-col gap-space-xs">
        <div class="card overflow-hidden">
          <div ref="mapEl" class="map" :class="{ picking: canEdit && (mode || selectedZone) }"></div>
        </div>
        <div class="flex flex-wrap gap-space-md text-body-sm text-on-surface-variant">
          <span class="flex items-center gap-space-xs"><span class="pin solid" /> Cancha con torneo activo</span>
          <span class="flex items-center gap-space-xs"><span class="pin hollow" /> Cancha sin torneo activo</span>
        </div>
      </div>

      <aside class="flex min-w-0 flex-col gap-space-md">
        <!-- Zone form (admin) -->
        <form v-if="zoneForm && canEdit" class="card flex flex-col gap-space-md p-space-md" novalidate @submit.prevent="saveZone">
          <h2 class="m-0 font-headline-md text-headline-md uppercase">{{ zoneForm.id ? 'Editar zona' : 'Nueva zona' }}</h2>
          <div>
            <label class="field-label" for="zone-name">Nombre *</label>
            <input id="zone-name" v-model.trim="zoneForm.name" class="input" />
          </div>
          <div>
            <label class="field-label" for="zone-desc">Descripción *</label>
            <textarea id="zone-desc" v-model.trim="zoneForm.description" class="input" rows="2" />
          </div>
          <div>
            <div class="flex justify-between">
              <label class="field-label" for="zone-radius">Radio</label>
              <span class="font-stat-mono text-stat-mono text-primary">{{ formatRadius(zoneForm.radius) }}</span>
            </div>
            <input id="zone-radius" v-model.number="zoneForm.radius" type="range" :min="MIN_RADIUS" :max="MAX_RADIUS" step="50" class="w-full accent-[#ff5500]" />
          </div>
          <div>
            <span class="field-label">Color</span>
            <div class="flex flex-wrap gap-space-xs">
              <button
                v-for="c in colors"
                :key="c"
                type="button"
                class="h-8 w-8 cursor-pointer rounded-full border-2 border-solid"
                :class="zoneForm.color === c ? 'border-on-surface' : 'border-transparent'"
                :style="{ background: c }"
                :aria-label="`Color ${c}`"
                :aria-pressed="zoneForm.color === c"
                @click="zoneForm.color = c"
              />
            </div>
          </div>
          <p class="m-0 text-body-sm text-on-surface-variant">Haz clic en el mapa para mover el centro. El deslizador afina el radio.</p>
          <p v-if="formError" role="alert" class="m-0 text-body-sm text-error">{{ formError }}</p>
          <div class="flex flex-wrap gap-space-sm">
            <button type="submit" class="btn-primary flex-1" :disabled="saving">Guardar</button>
            <button type="button" class="btn-ghost" @click="cancel">Cancelar</button>
            <button v-if="zoneForm.id" type="button" class="btn-danger" :disabled="saving" @click="deactivateZone">Desactivar</button>
          </div>
        </form>

        <!-- Zone detail (read only) -->
        <section v-else-if="zoneForm" class="card flex flex-col gap-space-md p-space-md">
          <div class="flex items-center gap-space-sm">
            <span class="h-3.5 w-3.5 shrink-0 rounded-full" :style="{ background: zoneForm.color }" />
            <h2 class="m-0 font-headline-md text-headline-md uppercase">{{ zoneForm.name }}</h2>
          </div>
          <p class="m-0 text-body-md">{{ zoneForm.description }}</p>
          <p class="m-0 font-stat-mono text-stat-mono text-on-surface-variant">Radio {{ formatRadius(zoneForm.radius) }}</p>
          <h3 class="label-tactical m-0 text-on-surface-variant">Canchas ({{ zoneForm.venues.length }})</h3>
          <p v-if="!zoneForm.venues.length" class="m-0 text-body-sm text-on-surface-variant">Esta zona aún no tiene canchas.</p>
          <button
            v-for="venue in zoneForm.venues"
            :key="venue.id"
            type="button"
            class="flex w-full cursor-pointer items-center gap-space-sm rounded border-0 bg-surface-container-low p-space-sm text-left text-on-surface hover:bg-surface-container-high"
            @click="editVenue(venue)"
          >
            <span class="icon text-primary">sports_basketball</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-body-md">{{ venue.name }}</span>
              <span class="block truncate text-body-sm text-on-surface-variant">{{ venue.address || 'Sin dirección' }}</span>
            </span>
            <span v-if="activeCount(venue.tournaments)" class="label-tactical text-tertiary">{{ activeCount(venue.tournaments) }} activo(s)</span>
            <span v-else class="text-body-sm text-on-surface-variant">Libre</span>
          </button>
          <button type="button" class="btn-ghost self-start" @click="cancel"><span class="icon">arrow_back</span> Todas las zonas</button>
        </section>

        <!-- Venue: form (admin) or detail (read only), plus its tournaments -->
        <section v-else-if="venueForm" class="card flex flex-col gap-space-md p-space-md">
          <form v-if="canEdit" class="flex flex-col gap-space-md" novalidate @submit.prevent="saveVenue">
            <h2 class="m-0 font-headline-md text-headline-md uppercase">{{ venueForm.id ? 'Editar cancha' : 'Nueva cancha' }}</h2>
            <div>
              <label class="field-label" for="venue-name">Nombre *</label>
              <input id="venue-name" v-model.trim="venueForm.name" class="input" />
            </div>
            <div>
              <label class="field-label" for="venue-address">Dirección</label>
              <input id="venue-address" v-model.trim="venueForm.address" class="input" />
            </div>
            <div>
              <label class="field-label" for="venue-capacity">Capacidad</label>
              <input id="venue-capacity" v-model.number="venueForm.capacity" class="input" type="number" min="0" />
            </div>
            <div>
              <label class="field-label" for="venue-desc">Descripción</label>
              <textarea id="venue-desc" v-model.trim="venueForm.description" class="input" rows="2" />
            </div>
            <div>
              <label class="field-label" for="venue-photos">Fotos (una URL por línea, máx. 10)</label>
              <textarea id="venue-photos" v-model="venueForm.photosText" class="input" rows="3" placeholder="https://…/cancha-1.jpg" />
            </div>
            <p class="m-0 text-body-sm text-on-surface-variant">Haz clic en el mapa para moverla. Debe quedar dentro de una zona; la zona se asigna sola.</p>
            <p v-if="formError" role="alert" class="m-0 text-body-sm text-error">{{ formError }}</p>
            <div class="flex flex-wrap gap-space-sm">
              <button type="submit" class="btn-primary flex-1" :disabled="saving">Guardar</button>
              <button type="button" class="btn-ghost" @click="cancel">Cancelar</button>
              <button v-if="venueForm.id" type="button" class="btn-danger" :disabled="saving" @click="deactivateVenue">Desactivar</button>
            </div>
          </form>
          <template v-else>
            <div>
              <h2 class="m-0 font-headline-md text-headline-md uppercase">{{ venueForm.name }}</h2>
              <p v-if="venueZone" class="m-0 flex items-center gap-space-xs text-body-sm text-on-surface-variant">
                <span class="h-2.5 w-2.5 rounded-full" :style="{ background: venueZone.color }" /> {{ venueZone.name }}
              </p>
            </div>
            <div class="flex flex-col gap-1 text-body-sm text-on-surface-variant">
              <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ venueForm.address || 'Sin dirección' }}</span>
              <span v-if="venueForm.capacity" class="flex items-center gap-space-xs"><span class="icon text-[18px]">groups</span>Capacidad: {{ venueForm.capacity }} personas</span>
            </div>
            <p v-if="venueForm.description" class="m-0 text-body-md">{{ venueForm.description }}</p>
            <div v-if="venueForm.photos?.length" class="grid grid-cols-2 gap-space-xs">
              <img v-for="(src, i) in venueForm.photos" :key="i" :src="src" :alt="`Foto ${i + 1} de ${venueForm.name}`" loading="lazy" class="aspect-video w-full rounded object-cover" />
            </div>
          </template>

          <template v-if="venueForm.id">
            <div class="flex items-center justify-between gap-space-sm border-0 border-t border-solid border-outline-variant/40 pt-space-md">
              <h3 class="label-tactical m-0 text-on-surface-variant">Torneos en esta cancha</h3>
              <span class="label-tactical" :class="activeCount(venueTournaments) ? 'text-tertiary' : 'text-on-surface-variant'">
                {{ activeCount(venueTournaments) }} activo(s)
              </span>
            </div>
            <p v-if="loadingTournaments" class="m-0 text-body-sm text-on-surface-variant">Cargando…</p>
            <p v-else-if="!venueTournaments.length" class="m-0 text-body-sm text-on-surface-variant">Sin torneos en esta cancha.</p>
            <div v-for="t in venueTournaments" :key="t.id" class="flex items-center justify-between gap-space-sm">
              <span class="min-w-0">
                <span class="block truncate text-body-md">{{ t.name }}</span>
                <span class="block text-body-sm text-on-surface-variant">{{ formatDate(t.startDate) }} – {{ formatDate(t.endDate) }}</span>
              </span>
              <StatusChip :status="t.status" />
            </div>
          </template>

          <div v-if="!canEdit" class="flex flex-wrap gap-space-sm">
            <button type="button" class="btn-ghost" @click="cancel"><span class="icon">arrow_back</span> Todas las zonas</button>
            <router-link
              v-if="isOrganizer"
              class="btn-primary flex-1"
              :to="{ path: '/app/organizer', query: { venueId: venueForm.id, zoneId: venueForm.zoneId } }"
            >
              <span class="icon">emoji_events</span> Crear torneo aquí
            </router-link>
          </div>
        </section>

        <!-- List -->
        <section v-else class="card flex flex-col gap-space-xs p-space-md">
          <h2 class="label-tactical m-0 mb-space-xs text-on-surface-variant">Zonas activas ({{ zones.length }})</h2>
          <p v-if="!zones.length" class="m-0 text-body-md text-on-surface-variant">
            {{ canEdit ? 'Aún no hay zonas. Pulsa "Nueva zona" y haz clic en el mapa.' : 'El administrador aún no ha creado zonas.' }}
          </p>
          <template v-for="zone in zones" :key="zone.id">
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-space-sm rounded border-0 bg-transparent p-space-sm text-left text-on-surface hover:bg-surface-container-high"
              @click="editZone(zone)"
            >
              <span class="h-3.5 w-3.5 shrink-0 rounded-full" :style="{ background: zone.color }" />
              <span class="min-w-0 flex-1">
                <span class="block truncate font-title-sm text-title-sm">{{ zone.name }}</span>
                <span class="block font-stat-mono text-[12px] text-on-surface-variant">{{ formatRadius(zone.radius) }} · {{ zone.venues.length }} cancha(s)</span>
              </span>
            </button>
            <button
              v-for="venue in zone.venues"
              :key="venue.id"
              type="button"
              class="ml-space-lg flex cursor-pointer items-center gap-space-sm rounded border-0 bg-transparent p-space-sm text-left text-on-surface hover:bg-surface-container-high"
              @click="editVenue(venue)"
            >
              <span class="icon text-[18px] text-primary">sports_basketball</span>
              <span class="min-w-0 flex-1 truncate text-body-sm">{{ venue.name }}</span>
              <span v-if="activeCount(venue.tournaments)" class="label-tactical text-tertiary">{{ activeCount(venue.tournaments) }} activo(s)</span>
              <span v-else class="text-[12px] text-on-surface-variant">Sin torneo activo</span>
            </button>
          </template>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import zonesService from '@/services/zones'
import venuesService from '@/services/venues'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import StatusChip from '@/components/ui/StatusChip.vue'
import { formatDate } from '@/utils/labels'

const DEFAULT_CENTER = [10.4806, -66.9036] // Caracas; solo se usa si no hay zonas
const MIN_RADIUS = 100 // mismos límites que CreateZoneDto
const MAX_RADIUS = 10000
const colors = ['#FF5F1F', '#007BFF', '#28A745', '#FFC107', '#9C27B0', '#E91E63', '#00BCD4', '#795548']

const toast = useToast()
const authStore = useAuthStore()
// Only the admin edits; every other role gets the same map read-only
const canEdit = computed(() => authStore.userRole === 'ADMIN')
const isOrganizer = computed(() => authStore.userRole === 'ORGANIZER') // POST /tournaments is ORGANIZER-only

const mapEl = ref(null)
const zones = ref([])
const mode = ref(null) // 'zone' | 'venue' | null
const zoneForm = ref(null) // selected/edited zone
const venueForm = ref(null) // selected/edited venue
const formError = ref('')
const saving = ref(false)
const drawing = ref(false) // true between the center click and the click that fixes the radius
const venueTournaments = ref([])
const loadingTournaments = ref(false)

// A tournament is active while it takes registrations or is being played
const ACTIVE_STATUSES = ['REGISTRATION', 'IN_PROGRESS']
const isActive = t => ACTIVE_STATUSES.includes(t.status)
const activeCount = (tournaments = []) => tournaments.filter(isActive).length

// Leaflet objects stay out of Vue reactivity
let map = null
let layers = null
let draft = null

const formatRadius = m => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`)
const selectedZone = computed(() => zoneForm.value || venueForm.value)
const venueZone = computed(() => zones.value.find(z => z.id === venueForm.value?.zoneId))

const hint = computed(() => {
    if (!canEdit.value) return ''
    if (drawing.value) return 'Mueve el mouse para agrandar la zona y haz clic para fijar el tamaño.'
    if (zoneForm.value || venueForm.value) return ''
    if (mode.value === 'zone') return 'Haz clic en el mapa donde quieres el centro de la zona.'
    if (mode.value === 'venue') return 'Haz clic dentro de una zona para ubicar la cancha.'
    return ''
})

const label = text => {
    const el = document.createElement('span')
    el.textContent = text
    return el
}

const draw = () => {
    layers.clearLayers()
    zones.value.forEach(zone => {
        const selected = zoneForm.value?.id === zone.id
        if (selected && canEdit.value) return // its editable draft is drawn instead
        L.circle([Number(zone.latitude), Number(zone.longitude)], {
            radius: zone.radius,
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: selected ? 0.35 : 0.2,
            weight: selected ? 4 : 2
        })
            .bindTooltip(label(zone.name))
            .on('click', e => {
                // While placing or editing, let the click bubble to the map to set the point
                if (canEdit.value && (mode.value || zoneForm.value || venueForm.value)) return
                L.DomEvent.stopPropagation(e)
                editZone(zone)
            })
            .addTo(layers)
        zone.venues.forEach(venue => {
            const venueSelected = venueForm.value?.id === venue.id
            if (venueSelected && canEdit.value) return
            // Old venues may have no location; Number(null) would pin them at 0,0
            if (venue.latitude == null || venue.longitude == null) return
            // Solid dot = has an active tournament; hollow dot = idle venue
            const active = activeCount(venue.tournaments) > 0
            L.circleMarker([Number(venue.latitude), Number(venue.longitude)], {
                radius: venueSelected ? 10 : 7,
                color: active ? '#fff' : zone.color,
                weight: active ? 2 : 3,
                fillColor: active ? zone.color : '#fff',
                fillOpacity: 1
            })
                .bindTooltip(label(`${venue.name} · ${active ? 'torneo activo' : 'sin torneo activo'}`))
                .on('click', e => {
                    L.DomEvent.stopPropagation(e)
                    editVenue(venue)
                })
                .addTo(layers)
        })
    })
    drawDraft()
}

const drawDraft = () => {
    const z = canEdit.value ? zoneForm.value : null
    // Update the zone draft in place so it follows the mouse smoothly
    if (z?.lat != null && draft instanceof L.Circle) {
        draft.setLatLng([z.lat, z.lng]).setRadius(z.radius).setStyle({ color: z.color })
        draft.setTooltipContent(formatRadius(z.radius))
        return
    }
    draft?.remove()
    draft = null
    if (!canEdit.value) return
    if (z?.lat != null) {
        draft = L.circle([z.lat, z.lng], {
            radius: z.radius,
            color: z.color,
            dashArray: '6 6',
            fillOpacity: 0.25
        })
            .bindTooltip(formatRadius(z.radius), { permanent: true, direction: 'center' })
            .addTo(map)
    } else if (venueForm.value?.latitude != null) {
        draft = L.circleMarker([venueForm.value.latitude, venueForm.value.longitude], {
            radius: 9,
            color: '#000',
            weight: 2,
            dashArray: '3 3',
            fillColor: '#FF5F1F',
            fillOpacity: 1
        }).addTo(map)
    }
}

const onMapClick = e => {
    if (!canEdit.value) return
    const { lat, lng } = e.latlng
    if (drawing.value) {
        drawing.value = false // second click fixes the radius
    } else if (zoneForm.value) {
        Object.assign(zoneForm.value, { lat, lng })
    } else if (venueForm.value) {
        Object.assign(venueForm.value, { latitude: lat, longitude: lng })
    } else if (mode.value === 'zone') {
        zoneForm.value = { name: '', description: '', radius: MIN_RADIUS, color: colors[zones.value.length % colors.length], lat, lng }
        drawing.value = true
    } else if (mode.value === 'venue') {
        venueForm.value = { name: '', address: '', capacity: null, description: '', photosText: '', latitude: lat, longitude: lng }
    }
    drawDraft()
}

const editZone = zone => {
    venueForm.value = null
    zoneForm.value = {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        radius: zone.radius,
        color: zone.color,
        lat: Number(zone.latitude),
        lng: Number(zone.longitude),
        venues: zone.venues
    }
    draw()
    map.flyToBounds(L.latLng(zoneForm.value.lat, zoneForm.value.lng).toBounds(zone.radius * 2), { padding: [40, 40] })
}

const editVenue = venue => {
    zoneForm.value = null
    venueForm.value = {
        id: venue.id,
        zoneId: venue.zoneId,
        name: venue.name,
        address: venue.address || '',
        capacity: venue.capacity,
        description: venue.description || '',
        photos: venue.photos || [],
        photosText: (venue.photos || []).join('\n'),
        latitude: Number(venue.latitude),
        longitude: Number(venue.longitude)
    }
    draw()
    map.flyTo([venueForm.value.latitude, venueForm.value.longitude], Math.max(map.getZoom(), 16))
    loadVenueTournaments(venue.id)
}

const loadVenueTournaments = async id => {
    venueTournaments.value = []
    loadingTournaments.value = true
    try {
        const res = await venuesService.getById(id)
        if (venueForm.value?.id === id) venueTournaments.value = res.data.tournaments || []
    } catch (error) {
        toast.error(handleApiError(error, 'No se pudieron cargar los torneos de la cancha'))
    } finally {
        loadingTournaments.value = false
    }
}

// Clicking the active mode again turns it off
const setMode = m => {
    mode.value = mode.value === m ? null : m
    cancel()
}

const cancel = () => {
    formError.value = ''
    drawing.value = false
    zoneForm.value = null
    venueForm.value = null
    if (layers) draw()
}

const load = async () => {
    try {
        const res = await zonesService.getAll()
        zones.value = (res.data?.data || []).filter(z => z.isActive)
        draw()
    } catch (error) {
        toast.error(handleApiError(error, 'No se pudieron cargar las zonas'))
    }
}

const run = async (action, okMessage) => {
    saving.value = true
    try {
        await action()
        toast.success(okMessage)
        mode.value = null
        cancel()
        await load()
    } catch (error) {
        toast.error(handleApiError(error, 'No se pudo guardar'))
    } finally {
        saving.value = false
    }
}

const saveZone = async () => {
    formError.value = zoneForm.value.name && zoneForm.value.description ? '' : 'Nombre y descripción son obligatorios.'
    if (formError.value) return
    const { id, lat, lng, venues, ...rest } = zoneForm.value
    const payload = { ...rest, coordinates: { lat, lng } }
    await run(
        () => (id ? zonesService.update(id, payload) : zonesService.create(payload)),
        id ? 'Zona actualizada' : 'Zona creada'
    )
}

const deactivateZone = () => run(() => zonesService.delete(zoneForm.value.id), 'Zona desactivada')

const saveVenue = async () => {
    formError.value = venueForm.value.name ? '' : 'El nombre es obligatorio.'
    if (formError.value) return
    const { id, zoneId, capacity, photos, photosText, ...rest } = venueForm.value
    const payload = {
        ...rest,
        photos: photosText.split('\n').map(u => u.trim()).filter(Boolean),
        ...(capacity !== null && capacity !== '' && { capacity: Number(capacity) })
    }
    await run(
        () => (id ? venuesService.update(id, payload) : venuesService.create(payload)),
        id ? 'Cancha actualizada' : 'Cancha creada'
    )
}

const deactivateVenue = () => run(() => venuesService.delete(venueForm.value.id), 'Cancha desactivada')

// Live preview while editing radius/color
watch(() => zoneForm.value && [zoneForm.value.radius, zoneForm.value.color], drawDraft)

onMounted(async () => {
    // Canvas redraws every animation frame; the default SVG renderer stretches big circles
    // during flyTo and paints the whole map with the zone color until the move ends
    map = L.map(mapEl.value, { preferCanvas: true }).setView(DEFAULT_CENTER, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)
    layers = L.layerGroup().addTo(map)
    map.on('click', onMapClick)
    map.on('mousemove', e => {
        if (!drawing.value) return
        const z = zoneForm.value
        const meters = Math.round(map.distance([z.lat, z.lng], e.latlng) / 10) * 10
        z.radius = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, meters))
    })
    await load()
    if (zones.value.length) {
        map.fitBounds(L.featureGroup(layers.getLayers()).getBounds(), { padding: [24, 24] })
    }
})

onBeforeUnmount(() => map?.remove())
</script>

<style scoped>
.map {
    height: min(600px, 70vh);
    width: 100%;
}

.map.picking,
.map.picking :deep(.leaflet-container) {
    cursor: crosshair;
}

.pin {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
    border: 3px solid rgb(var(--c-primary-container));
}

.pin.solid {
    background: rgb(var(--c-primary-container));
    border-color: #fff;
    box-shadow: 0 0 0 1px rgb(var(--c-primary-container));
}

.pin.hollow {
    background: #fff;
}
</style>
