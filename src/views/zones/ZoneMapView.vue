<template>
  <!-- "Cartel de cancha" look; inside the Material shell (organizer, captain…) it renders as a dark panel -->
  <div class="poster zm" :class="{ 'zm--embed': !canEdit }">
    <div class="page__head">
      <div>
        <h1 class="display page__h1">{{ canEdit ? 'Zonas y canchas' : 'Mapa de zonas' }}</h1>
        <p v-if="!canEdit" class="page__lead">Selecciona una zona o una cancha para ver sus torneos.</p>
      </div>
      <div v-if="canEdit" class="p-chips">
        <button type="button" class="p-chip" :aria-pressed="mode === 'zone'" @click="setMode('zone')">+ Nueva zona</button>
        <button type="button" class="p-chip" :aria-pressed="mode === 'venue'" @click="setMode('venue')">+ Nueva cancha</button>
      </div>
    </div>

    <p v-if="hint" class="mono zm__hint" role="status">{{ hint }}</p>

    <div class="zm__layout">
      <div class="zm__map">
        <div class="zm__box">
          <!-- Dynamic classes live on a wrapper: Vue would overwrite the classes Leaflet adds to its container -->
          <div :class="{ picking: canEdit && (mode || selectedZone), flying }"><div ref="mapEl" class="map"></div></div>
        </div>
        <div class="mono legend">
          <span class="legend__item"><span class="pin solid" />Cancha con torneo activo</span>
          <span class="legend__item"><span class="pin hollow" />Cancha sin torneo activo</span>
        </div>
      </div>

      <aside class="zm__side">
        <!-- Zone form (admin) -->
        <form v-if="zoneForm && canEdit" class="zm__card" novalidate @submit.prevent="saveZone">
          <h2 class="display zm__title">{{ zoneForm.id ? 'Editar zona' : 'Nueva zona' }}</h2>
          <div class="p-field">
            <label class="p-label" for="zone-name">Nombre *</label>
            <input id="zone-name" v-model.trim="zoneForm.name" class="p-input" />
          </div>
          <div class="p-field">
            <label class="p-label" for="zone-desc">Descripción *</label>
            <textarea id="zone-desc" v-model.trim="zoneForm.description" class="p-input" rows="2" />
          </div>
          <div class="p-field">
            <span class="zm__row">
              <label class="p-label" for="zone-radius">Radio</label>
              <span class="mono zm__value">{{ formatRadius(zoneForm.radius) }}</span>
            </span>
            <input id="zone-radius" v-model.number="zoneForm.radius" type="range" :min="MIN_RADIUS" :max="MAX_RADIUS" step="50" class="zm__range" />
          </div>
          <div class="p-field">
            <span class="p-label">Color</span>
            <div class="zm__colors">
              <button
                v-for="c in colors"
                :key="c"
                type="button"
                class="zm__color"
                :class="{ 'is-on': zoneForm.color === c }"
                :style="{ background: c }"
                :aria-label="`Color ${c}`"
                :aria-pressed="zoneForm.color === c"
                @click="zoneForm.color = c"
              />
            </div>
          </div>
          <p class="zm__note">Haz clic en el mapa para mover el centro. El deslizador afina el radio.</p>
          <p v-if="formError" role="alert" class="zm__error">{{ formError }}</p>
          <div class="zm__actions">
            <button type="submit" class="btn-blaze" :disabled="saving">Guardar</button>
            <button type="button" class="btn-line" @click="cancel">Cancelar</button>
            <button v-if="zoneForm.id" type="button" class="link-under zm__danger" :disabled="saving" @click="deactivateZone">Desactivar</button>
          </div>
        </form>

        <!-- Zone detail (read only): champion and participants, plus its venues -->
        <template v-else-if="zoneForm">
          <ZonePanel v-if="standingOf(zoneForm)" :zone="standingOf(zoneForm)" heading-tag="h2">
            <div class="venues">
              <div class="mono venues__head">Canchas · {{ zoneForm.venues.length }}</div>
              <p v-if="!zoneForm.venues.length" class="zm__note">Esta zona aún no tiene canchas.</p>
              <button v-for="venue in zoneForm.venues" :key="venue.id" type="button" class="venues__item" @click="editVenue(venue)">
                <span class="venues__text">
                  <span class="venues__name">{{ venue.name }}</span>
                  <span class="venues__addr">{{ venue.address || 'Sin dirección' }}</span>
                </span>
                <span class="mono" :class="activeCount(venue.tournaments) ? 'is-live' : 'is-idle'">
                  {{ activeCount(venue.tournaments) ? `${activeCount(venue.tournaments)} activo(s)` : 'Libre' }}
                </span>
              </button>
            </div>

            <!-- Captain: challenge the team that rules (or last won) this zone -->
            <form v-if="challengeTarget" class="zm__form challenge" novalidate @submit.prevent="sendChallenge">
              <div class="mono venues__head">Retar a {{ challengeTarget.name }}</div>
              <div class="p-field">
                <label class="p-label" for="ch-venue">Cancha *</label>
                <select id="ch-venue" v-model="challengeForm.venueId" class="p-input">
                  <option value="" disabled>Elige una cancha de la zona</option>
                  <option v-for="venue in zoneForm.venues" :key="venue.id" :value="venue.id">{{ venue.name }}</option>
                </select>
              </div>
              <div class="p-field">
                <label class="p-label" for="ch-date">Fecha y hora *</label>
                <input id="ch-date" v-model="challengeForm.when" type="datetime-local" class="p-input" :min="nowLocal" />
              </div>
              <div class="p-field">
                <label class="p-label" for="ch-reason">Mensaje *</label>
                <input id="ch-reason" v-model.trim="challengeForm.reason" class="p-input" maxlength="200" placeholder="Venimos por la corona del barrio" />
              </div>
              <p v-if="challengeError" role="alert" class="zm__error">{{ challengeError }}</p>
              <button type="submit" class="btn-blaze" :disabled="saving">Enviar reto</button>
            </form>
          </ZonePanel>
          <section v-else class="zm__card">
            <h2 class="display zm__title">{{ zoneForm.name }}</h2>
            <p class="zm__note">{{ zoneForm.description }} · Radio {{ formatRadius(zoneForm.radius) }}</p>
          </section>
          <button type="button" class="link-under zm__back" @click="cancel">← Todas las zonas</button>
        </template>

        <!-- Venue: form (admin) or detail (read only), plus its tournaments -->
        <section v-else-if="venueForm" class="zm__card">
          <form v-if="canEdit" class="zm__form" novalidate @submit.prevent="saveVenue">
            <h2 class="display zm__title">{{ venueForm.id ? 'Editar cancha' : 'Nueva cancha' }}</h2>
            <div class="p-field">
              <label class="p-label" for="venue-name">Nombre *</label>
              <input id="venue-name" v-model.trim="venueForm.name" class="p-input" />
            </div>
            <div class="p-field">
              <label class="p-label" for="venue-address">Dirección</label>
              <input id="venue-address" v-model.trim="venueForm.address" class="p-input" />
            </div>
            <div class="p-field">
              <label class="p-label" for="venue-capacity">Capacidad</label>
              <input id="venue-capacity" v-model.number="venueForm.capacity" class="p-input" type="number" min="0" />
            </div>
            <div class="p-field">
              <label class="p-label" for="venue-desc">Descripción</label>
              <textarea id="venue-desc" v-model.trim="venueForm.description" class="p-input" rows="2" />
            </div>
            <div class="p-field">
              <label class="p-label" for="venue-photos">Fotos (una URL por línea, máx. 10)</label>
              <textarea id="venue-photos" v-model="venueForm.photosText" class="p-input" rows="3" placeholder="https://…/cancha-1.jpg" />
            </div>
            <p class="zm__note">Haz clic en el mapa para moverla. Debe quedar dentro de una zona; la zona se asigna sola.</p>
            <p v-if="formError" role="alert" class="zm__error">{{ formError }}</p>
            <div class="zm__actions">
              <button type="submit" class="btn-blaze" :disabled="saving">Guardar</button>
              <button type="button" class="btn-line" @click="cancel">Cancelar</button>
              <button v-if="venueForm.id" type="button" class="link-under zm__danger" :disabled="saving" @click="deactivateVenue">Desactivar</button>
            </div>
          </form>
          <template v-else>
            <div>
              <h2 class="display zm__title">{{ venueForm.name }}</h2>
              <p v-if="venueZone" class="mono zm__zone"><span class="zm__dot" :style="{ background: venueZone.color }" />{{ venueZone.name }}</p>
            </div>
            <p class="zm__note">
              {{ venueForm.address || 'Sin dirección' }}<template v-if="venueForm.capacity"> · Capacidad {{ venueForm.capacity }} personas</template>
            </p>
            <p v-if="venueForm.description" class="zm__desc">{{ venueForm.description }}</p>
            <div v-if="venueForm.photos?.length" class="zm__photos">
              <img v-for="(src, i) in venueForm.photos" :key="i" :src="src" :alt="`Foto ${i + 1} de ${venueForm.name}`" loading="lazy" />
            </div>
          </template>

          <template v-if="venueForm.id">
            <div class="mono venues__head zm__row">
              <span>Torneos en esta cancha</span>
              <span :class="activeCount(venueTournaments) ? 'is-live' : 'is-idle'">{{ activeCount(venueTournaments) }} activo(s)</span>
            </div>
            <TurfLoader v-if="loadingTournaments" label="Cargando" size="sm" />
            <p v-else-if="!venueTournaments.length" class="zm__note">Sin torneos en esta cancha.</p>
            <router-link v-for="t in venueTournaments" :key="t.id" :to="`/torneo/${t.id}`" class="zm__t">
              <span class="venues__text">
                <span class="venues__name">{{ t.name }}</span>
                <span class="mono venues__addr">{{ formatDate(t.startDate) }} – {{ formatDate(t.endDate) }}</span>
              </span>
              <span class="mono zm__chip" :style="{ color: POSTER_STATUS[t.status]?.color, borderColor: POSTER_STATUS[t.status]?.color }">
                {{ POSTER_STATUS[t.status]?.label || t.status }}
              </span>
            </router-link>
          </template>

          <div v-if="!canEdit" class="zm__actions">
            <button type="button" class="btn-line" @click="cancel">← Todas las zonas</button>
            <router-link
              v-if="isOrganizer"
              class="btn-blaze"
              :to="{ path: '/app/organizer', query: { venueId: venueForm.id, zoneId: venueForm.zoneId } }"
            >Crear torneo aquí</router-link>
          </div>
        </section>

        <!-- List -->
        <section v-else class="zone-list">
          <h2 class="mono zone-list__head">Zonas activas · {{ zones.length }}</h2>
          <p v-if="!zones.length" class="zm__note">
            {{ canEdit ? 'Aún no hay zonas. Pulsa "Nueva zona" y haz clic en el mapa.' : 'El administrador aún no ha creado zonas.' }}
          </p>
          <template v-for="zone in zones" :key="zone.id">
            <button type="button" class="zone-list__item" @click="editZone(zone)">
              <span class="zm__dot zm__dot--big" :style="{ background: zone.color }" />
              <span class="zone-list__text">
                <span class="display zone-list__name">{{ zone.name }}</span>
                <span class="mono zone-list__meta">{{ formatRadius(zone.radius) }} · {{ zone.venues.length }} cancha(s)</span>
                <span class="zone-list__champ">{{ standingOf(zone)?.champion?.teamName || 'Trono vacío' }}</span>
              </span>
            </button>
            <button v-for="venue in zone.venues" :key="venue.id" type="button" class="zone-list__venue" @click="editVenue(venue)">
              <span class="venues__name">{{ venue.name }}</span>
              <span class="mono" :class="activeCount(venue.tournaments) ? 'is-live' : 'is-idle'">
                {{ activeCount(venue.tournaments) ? `${activeCount(venue.tournaments)} activo(s)` : 'Sin torneo activo' }}
              </span>
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
import tournamentsService from '@/services/tournaments'
import venuesService from '@/services/venues'
import teamsService from '@/services/teams'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import '@/styles/poster.css'
import ZonePanel from '@/components/zone/ZonePanel.vue'
import { POSTER_STATUS, formatDate } from '@/utils/labels'

const DEFAULT_CENTER = [10.4806, -66.9036] // Caracas; solo se usa si no hay zonas
const MIN_RADIUS = 100 // mismos límites que CreateZoneDto
const MAX_RADIUS = 10000
const colors = ['#FF4F12', '#007BFF', '#28A745', '#FFC107', '#9C27B0', '#E91E63', '#00BCD4', '#795548']

const toast = useToast()
const authStore = useAuthStore()
// Only the admin edits; every other role gets the same map read-only
const canEdit = computed(() => authStore.userRole === 'ADMIN')
const isOrganizer = computed(() => authStore.userRole === 'ORGANIZER') // POST /tournaments is ORGANIZER-only


const mapEl = ref(null)
const flying = ref(false)
const zones = ref([])
const mode = ref(null) // 'zone' | 'venue' | null
const zoneForm = ref(null) // selected/edited zone
const venueForm = ref(null) // selected/edited venue
const formError = ref('')
const saving = ref(false)
const drawing = ref(false) // true between the center click and the click that fixes the radius
const venueTournaments = ref([])
const standings = ref({}) // zoneId -> champion, participants and titles
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
const standingOf = zone => standings.value[zone?.id]
const venueZone = computed(() => zones.value.find(z => z.id === venueForm.value?.zoneId))

// ---------- Territorial challenge (captain) ----------
const myTeam = ref(null)
const challengeForm = ref({ venueId: '', when: '', reason: '' })
const challengeError = ref('')
const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
// Target: the zone owner (most titles) or, if contested, its current champion; never your own team
const challengeTarget = computed(() => {
    const zone = standingOf(zoneForm.value)
    if (!myTeam.value || !zone || !zoneForm.value?.venues?.length) return null
    const target = zone.ownerTeamId
        ? { id: zone.ownerTeamId, name: zone.ranking[0].teamName }
        : zone.champion && { id: zone.champion.teamId, name: zone.champion.teamName }
    return target && target.id !== myTeam.value.id ? target : null
})
watch(() => zoneForm.value?.id, () => {
    challengeForm.value = { venueId: '', when: '', reason: '' }
    challengeError.value = ''
})
const sendChallenge = async () => {
    const f = challengeForm.value
    if (!f.venueId || !f.when || !f.reason) {
        challengeError.value = 'Elige cancha, fecha y escribe un mensaje.'
        return
    }
    challengeError.value = ''
    saving.value = true
    try {
        const zone = standingOf(zoneForm.value)
        await zonesService.createChallenge({
            challengingTeamId: myTeam.value.id,
            challengedTeamId: challengeTarget.value.id,
            zoneId: zoneForm.value.id,
            venueId: f.venueId,
            scheduledDate: new Date(f.when).toISOString(),
            challengeType: zone.ownerTeamId === challengeTarget.value.id ? 'TERRITORY_CONQUEST' : 'TERRITORY_DEFENSE',
            reason: f.reason
        })
        toast.success(`Reto enviado a ${challengeTarget.value.name}`)
        challengeForm.value = { venueId: '', when: '', reason: '' }
    } catch (error) {
        challengeError.value = handleApiError(error, 'No se pudo enviar el reto')
    } finally {
        saving.value = false
    }
}
onMounted(async () => {
    if (authStore.userRole !== 'TEAM_CAPTAIN') return
    myTeam.value = (await teamsService.getMyTeams().catch(() => ({ data: [] }))).data[0] || null
})

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

// Zone name plus its current champion, always visible on the map
const zoneLabel = zone => {
    const el = document.createElement('span')
    el.append(label(zone.name))
    const champion = standingOf(zone)?.champion
    const sub = label(champion ? `👑 ${champion.teamName}` : 'En disputa')
    sub.className = champion ? 'champion' : 'contested'
    el.append(sub)
    return el
}

// During a flight Leaflet scales the circles as a bitmap and only redraws when it lands,
// so a big zoom jump shows a pixelated blob: hide circles and labels until the move ends
const fly = move => {
    flying.value = true
    map.once('moveend', () => (flying.value = false))
    move()
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
            .bindTooltip(zoneLabel(zone), { permanent: true, direction: 'center', className: 'zone-label' })
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
                color: active ? '#EDE8DC' : zone.color,
                weight: active ? 2 : 3,
                fillColor: active ? zone.color : '#EDE8DC',
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
            fillColor: '#FF4F12',
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
    fly(() => map.flyToBounds(L.latLng(zoneForm.value.lat, zoneForm.value.lng).toBounds(zone.radius * 2), { padding: [40, 40], duration: 1.2 }))
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
    fly(() => map.flyTo([venueForm.value.latitude, venueForm.value.longitude], Math.max(map.getZoom(), 16), { duration: 1.2 }))
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
        const [res, standingsRes] = await Promise.all([
            zonesService.getAll(),
            tournamentsService.getZoneStandings().catch(() => ({ data: [] })) // the map still works without it
        ])
        standings.value = Object.fromEntries((standingsRes.data || []).map(s => [s.id, s]))
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
    // Canvas keeps circles crisp at rest; during flights they are hidden (see fly)
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
.zm {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 24px;
}

/* Inside the Material shell the poster is a dark panel with its own padding */
.zm--embed {
  padding: 32px;
}

.zm__hint {
  padding: 14px 16px;
  border: 2px solid var(--gold);
  font-size: 12px;
  color: var(--gold);
}

.zm__layout {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 24px;
}

.zm__map {
  display: flex;
  min-width: 0;
  flex: 999 1 560px;
  flex-direction: column;
  gap: 12px;
}

.zm__box {
  border: 1px solid var(--line);
}

.zm__side {
  display: flex;
  min-width: 0;
  flex: 1 1 360px;
  flex-direction: column;
  gap: 16px;
}

.zm__card,
.zm__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.zm__card {
  padding: 24px;
  border: 1px solid var(--line);
  border-top: 6px solid var(--blaze);
  background: var(--asphalt-2);
}

.zm__title {
  font-size: 36px;
}

.zm__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.zm__value {
  font-size: 14px;
  font-weight: 700;
  color: var(--blaze);
}

.zm__range {
  width: 100%;
  accent-color: #ff4f12;
}

.zm__colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.zm__color {
  width: 36px;
  height: 36px;
  border: 3px solid transparent;
  cursor: pointer;
}

.zm__color.is-on {
  border-color: var(--chalk);
}

.zm__note {
  font-size: 14px;
  line-height: 1.5;
  color: var(--muted);
}

.zm__desc {
  font-size: 15px;
  line-height: 1.5;
  color: var(--chalk-dim);
}

.zm__error {
  font-size: 14px;
  color: var(--hot);
}

.zm__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.zm__actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zm__danger,
.zm__back {
  align-self: flex-start;
  border: 0;
  background: none;
  color: var(--hot);
  font-family: inherit;
  cursor: pointer;
}

.zm__back {
  color: var(--chalk);
}

.zm__back:hover {
  color: var(--blaze);
}

.zm__zone {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}

.zm__dot {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 50%;
}

.zm__dot--big {
  width: 14px;
  height: 14px;
}

.zm__photos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.zm__photos img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  filter: grayscale(1) contrast(1.1);
}

.poster .zm__t {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line-soft);
  text-decoration: none;
}

.zm__chip {
  padding: 4px 8px;
  border: 1px solid;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
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

.venues__item,
.zone-list__item,
.zone-list__venue {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  gap: 14px;
  border: 0;
  background: transparent;
  color: var(--chalk);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.venues__item {
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--line-soft);
}

.venues__item:hover .venues__name,
.zone-list__venue:hover .venues__name {
  color: var(--blaze);
}

.venues__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.venues__name {
  font-size: 15px;
  font-weight: 700;
}

.venues__addr {
  font-size: 12px;
  color: var(--muted);
}

.is-live,
.is-idle {
  font-size: 11px;
  white-space: nowrap;
}

.is-live {
  color: #4fd18b;
}

.is-idle {
  color: var(--muted);
}

.zone-list {
  display: flex;
  flex-direction: column;
  border-top: 3px solid var(--chalk);
}

.zone-list__head {
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  font-size: 11px;
  font-weight: 400;
  color: var(--muted);
}

.zone-list__item {
  padding: 16px 8px;
  border-bottom: 1px solid var(--line);
}

.zone-list__item:hover {
  background: #1c1b17;
}

.zone-list__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.zone-list__name {
  font-size: 24px;
  line-height: 1;
}

.zone-list__meta {
  font-size: 11px;
  color: var(--muted);
}

.zone-list__champ {
  font-size: 14px;
  color: var(--gold);
}

.zone-list__venue {
  justify-content: space-between;
  padding: 10px 8px 10px 36px;
  border-bottom: 1px solid var(--line-soft);
}

.map {
  height: min(620px, 70vh);
  width: 100%;
  background: #141411;
}

/* Dark, low-saturation streets so the zones carry the color (same as the public map) */
.map :deep(.leaflet-tile-pane) {
  filter: grayscale(1) invert(1) brightness(0.62) contrast(1.15);
}

.map :deep(.leaflet-overlay-pane),
.map :deep(.leaflet-tooltip-pane) {
  transition: opacity 0.2s;
}

.flying .map :deep(.leaflet-overlay-pane),
.flying .map :deep(.leaflet-tooltip-pane) {
  opacity: 0;
  transition: none;
}

.picking .map {
  cursor: crosshair;
}

.map :deep(.leaflet-control-attribution) {
  background: rgb(13 13 11 / 0.8);
  color: #a8a397;
}

.map :deep(.leaflet-control-attribution a) {
  color: #ede8dc;
}

:deep(.zone-label) {
  padding: 8px 14px;
  border: 2px solid #f5b21b;
  border-radius: 0;
  background: #0d0d0b;
  box-shadow: none;
  color: #ede8dc;
  font-family: 'Anton', sans-serif;
  font-size: 18px;
  text-align: center;
  text-transform: uppercase;
  line-height: 1.1;
}

:deep(.zone-label)::before {
  display: none;
}

:deep(.zone-label .champion),
:deep(.zone-label .contested) {
  display: block;
}

:deep(.zone-label .champion) {
  color: #f5b21b;
  font-size: 15px;
}

:deep(.zone-label .contested) {
  color: #ff7a45;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
}

.pin {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 3px solid var(--blaze);
  border-radius: 50%;
}

.pin.solid {
  border-color: var(--chalk);
  background: var(--blaze);
}

.pin.hollow {
  background: var(--chalk);
}

@media (max-width: 600px) {
  .zm--embed {
    padding: 20px 16px;
  }

  .map {
    height: 380px;
  }
}
</style>
