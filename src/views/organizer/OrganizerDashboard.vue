<template>
    <div class="flex flex-col gap-space-xl">
        <!-- Header -->
        <div class="flex flex-col gap-space-md md:flex-row md:items-end md:justify-between">
            <div>
                <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase text-on-surface md:font-headline-lg md:text-headline-lg">
                    Panel del organizador
                </h1>
                <p class="m-0 mt-1 text-body-md text-on-surface-variant">Tus torneos, inscripciones por revisar y cupos.</p>
            </div>
            <button type="button" class="btn-primary w-full md:w-auto" @click="createTournament()">
                <span class="icon">add</span> Crear torneo
            </button>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-3 gap-space-sm md:gap-space-md">
            <StatTile label="Torneos activos" :value="activeCount" hint="Inscripciones o en curso" />
            <StatTile label="Por revisar" :value="pendingTotal" hint="Inscripciones pendientes" :accent="pendingTotal > 0" />
            <StatTile label="Equipos inscritos" :value="teamsTotal" hint="En todos tus torneos" />
        </div>

        <!-- Pending registrations -->
        <section v-if="pending.length">
            <SectionHeader title="Pendientes de revisar" icon="pending_actions">
                <span class="label-tactical rounded bg-secondary-container px-space-sm py-1 text-on-secondary-container">
                    {{ pending.length }} por aprobar
                </span>
            </SectionHeader>
            <div class="grid gap-space-sm md:grid-cols-2">
                <article v-for="reg in pending" :key="reg.id" class="card flex flex-col gap-space-sm p-space-md">
                    <div class="flex items-start justify-between gap-space-sm">
                        <div class="min-w-0">
                            <h3 class="m-0 truncate font-title-sm text-title-sm text-on-surface">{{ reg.team.name }}</h3>
                            <p class="m-0 text-body-sm text-on-surface-variant">
                                Capitán: {{ reg.captain.fullName }} · {{ reg.tournamentName }}
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-space-xs">
                        <StatusChip :status="reg.status" />
                        <RosterChip v-if="reg.roster" :roster="reg.roster" />
                    </div>
                    <div class="flex gap-space-sm">
                        <button type="button" class="btn-danger flex-1" :disabled="reviewing === reg.id" @click="review(reg, 'REJECTED')">
                            Rechazar
                        </button>
                        <button type="button" class="btn-primary flex-1" :disabled="reviewing === reg.id" @click="review(reg, 'APPROVED')">
                            Aprobar
                        </button>
                    </div>
                </article>
            </div>
        </section>

        <!-- My tournaments -->
        <section>
            <SectionHeader title="Mis torneos" icon="emoji_events" />
            <div class="-mx-gutter mb-space-md flex gap-space-xs overflow-x-auto px-gutter pb-1 md:mx-0 md:px-0">
                <button
                    v-for="f in filters"
                    :key="f.value"
                    type="button"
                    class="filter-chip"
                    :aria-pressed="filterStatus === f.value"
                    @click="filterStatus = f.value"
                >{{ f.label }} ({{ countByStatus(f.value) }})</button>
            </div>

            <p v-if="isLoading" class="text-body-md text-on-surface-variant">Cargando torneos…</p>

            <div v-else-if="filteredTournaments.length === 0" class="card flex flex-col items-center gap-space-sm p-space-xl text-center">
                <span class="icon text-[40px] text-on-surface-variant">emoji_events</span>
                <p class="m-0 font-title-sm text-title-sm">
                    {{ myTournaments.length ? 'No hay torneos con este estado' : 'Todavía no creaste torneos' }}
                </p>
                <button v-if="!myTournaments.length" type="button" class="btn-primary" @click="createTournament()">
                    Crear el primero
                </button>
                <button v-else type="button" class="btn-ghost" @click="filterStatus = 'ALL'">Ver todos</button>
            </div>

            <div v-else class="grid gap-space-md md:grid-cols-2 xl:grid-cols-3">
                <article v-for="t in filteredTournaments" :key="t.id" class="card flex flex-col gap-space-md p-space-md">
                    <div class="flex items-start justify-between gap-space-sm">
                        <h3 class="m-0 min-w-0 font-headline-md text-headline-md uppercase text-on-surface">{{ t.name }}</h3>
                        <StatusChip :status="t.status" />
                    </div>
                    <div class="flex flex-col gap-1 text-body-sm text-on-surface-variant">
                        <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ t.location }}</span>
                        <span class="flex items-center gap-space-xs">
                            <span class="icon text-[18px]">calendar_month</span>
                            {{ formatDate(t.startDate) }} – {{ formatDate(t.endDate) }}
                        </span>
                    </div>
                    <div>
                        <div class="mb-1 flex justify-between">
                            <span class="label-tactical text-on-surface-variant">Cupos</span>
                            <span class="font-stat-mono text-stat-mono tabular">{{ t.registeredTeams }}/{{ t.maxTeams }}</span>
                        </div>
                        <div class="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                            <div class="h-full bg-secondary-container" :style="{ width: Math.min(100, (t.registeredTeams / t.maxTeams) * 100) + '%' }" />
                        </div>
                    </div>
                    <span
                        v-if="t.pendingTeams"
                        class="label-tactical self-start rounded bg-primary-container/15 px-space-sm py-1 text-primary"
                    >{{ t.pendingTeams }} pendiente(s)</span>
                    <div class="mt-auto flex gap-space-sm">
                        <button type="button" class="btn-primary flex-1" @click="manageTournament(t)">Gestionar</button>
                        <TournamentInfoButton :tournament="t" />
                        <button type="button" class="btn-secondary" aria-label="Eliminar torneo" @click="deleteTournament(t)">
                            <span class="icon">delete</span>
                        </button>
                    </div>
                </article>
            </div>
        </section>
        <!-- Create tournament (the 4 steps of the Stitch wizard as sections of one form) -->
        <div
            v-if="showDialog"
            class="fixed inset-0 z-50 flex items-stretch justify-center bg-[rgba(11,15,23,0.8)] md:items-center md:p-margin-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
            @keydown.esc="showDialog = false"
        >
            <form
                class="flex max-h-full w-full max-w-3xl flex-col overflow-hidden border-t-2 border-solid border-x-0 border-b-0 border-primary-container bg-surface-container md:rounded-lg"
                novalidate
                @submit.prevent="saveTournament"
            >
                <header class="flex items-center justify-between gap-space-sm border-0 border-b border-solid border-outline-variant/40 px-space-lg py-space-md">
                    <h2 id="create-title" class="m-0 font-headline-md text-headline-md uppercase">Nuevo torneo</h2>
                    <button type="button" class="btn-ghost" aria-label="Cerrar" @click="showDialog = false"><span class="icon">close</span></button>
                </header>

                <div class="flex flex-col gap-space-xl overflow-y-auto px-space-lg py-space-lg">
                    <!-- 1. Datos -->
                    <section class="flex flex-col gap-space-md">
                        <h3 class="label-tactical m-0 text-secondary">1 · Datos</h3>
                        <div>
                            <label class="field-label" for="t-name">Nombre del torneo *</label>
                            <input id="t-name" v-model.trim="formData.name" class="input" placeholder="Liga Nocturna La Paz" />
                        </div>
                        <div>
                            <span class="field-label">Categoría *</span>
                            <div class="flex flex-wrap gap-space-xs">
                                <button
                                    v-for="c in categoryOptions"
                                    :key="c.value"
                                    type="button"
                                    class="filter-chip"
                                    :aria-pressed="formData.category === c.value"
                                    @click="formData.category = c.value"
                                >{{ c.title }}</button>
                            </div>
                        </div>
                        <div>
                            <label class="field-label" for="t-desc">Descripción</label>
                            <textarea id="t-desc" v-model.trim="formData.description" class="input" rows="2" />
                        </div>
                    </section>

                    <!-- 2. Fecha y lugar -->
                    <section class="flex flex-col gap-space-md">
                        <h3 class="label-tactical m-0 text-secondary">2 · Fecha y lugar</h3>
                        <div class="grid gap-space-md sm:grid-cols-2">
                            <div>
                                <label class="field-label" for="t-start">Inicio *</label>
                                <input id="t-start" v-model="formData.startDate" class="input" type="date" />
                            </div>
                            <div>
                                <label class="field-label" for="t-end">Fin *</label>
                                <input id="t-end" v-model="formData.endDate" class="input" type="date" />
                            </div>
                        </div>
                        <ChipSelect
                            v-model="formData.zoneIds"
                            label="Zonas"
                            :options="zones.map(z => ({ value: z.id, label: z.name }))"
                            empty="El administrador aún no creó zonas."
                        />
                        <ChipSelect
                            v-model="formData.venueIds"
                            label="Canchas"
                            :options="availableVenues.map(v => ({ value: v.id, label: v.name }))"
                            :empty="formData.zoneIds.length ? 'No hay canchas en las zonas elegidas.' : 'No hay canchas.'"
                        />
                        <div class="flex flex-col gap-space-xs">
                            <span class="field-label">Foto de portada {{ venueCover ? '(opcional)' : '*' }}</span>
                            <img v-if="bannerPreview" :src="bannerPreview" alt="Portada del torneo" class="aspect-video w-full rounded object-cover" />
                            <p class="m-0 text-body-sm text-on-surface-variant">
                                {{ venueCover ? 'Usaremos la foto de la cancha elegida; sube otra si prefieres.' : 'Sube una foto de la cancha: es lo primero que ven los jugadores.' }}
                            </p>
                            <input id="t-banner" type="file" accept="image/jpeg,image/png,image/webp" class="input" @change="onBannerSelected" />
                        </div>
                        <div>
                            <label class="field-label" for="t-location">Ubicación general *</label>
                            <input id="t-location" v-model.trim="formData.location" class="input" placeholder="Cancha La Paz, Caracas" />
                        </div>
                    </section>

                    <!-- 3. Reglas -->
                    <section class="flex flex-col gap-space-md">
                        <h3 class="label-tactical m-0 text-secondary">3 · Reglas</h3>
                        <div class="grid grid-cols-2 gap-space-md md:grid-cols-5">
                            <div>
                                <label class="field-label" for="t-min">Mín. equipos</label>
                                <input id="t-min" v-model.number="formData.minTeams" class="input font-mono" type="number" min="4" max="16" />
                            </div>
                            <div>
                                <label class="field-label" for="t-max">Máx. equipos</label>
                                <input id="t-max" v-model.number="formData.maxTeams" class="input font-mono" type="number" min="4" max="32" />
                            </div>
                            <div>
                                <label class="field-label" for="t-players">Jug. / equipo</label>
                                <input id="t-players" v-model.number="formData.playersPerTeam" class="input font-mono" type="number" min="5" max="15" />
                            </div>
                            <div>
                                <label class="field-label" for="t-quarter">Min. / cuarto</label>
                                <input id="t-quarter" v-model.number="formData.quarterDuration" class="input font-mono" type="number" min="8" max="12" />
                            </div>
                            <div>
                                <label class="field-label" for="t-fee">Costo ($)</label>
                                <input id="t-fee" v-model.number="formData.entryFee" class="input font-mono" type="number" min="0" />
                            </div>
                        </div>
                        <p class="m-0 flex items-center gap-space-xs text-body-sm text-on-surface-variant">
                            <span class="icon text-[18px] text-secondary">info</span>
                            Un equipo necesita 5 jugadores activos para validar su inscripción.
                        </p>
                        <label class="flex cursor-pointer items-center gap-space-sm rounded bg-surface-container-low p-space-sm text-body-sm">
                            <input v-model="formData.requireIdVerification" type="checkbox" class="h-4 w-4 accent-primary" />
                            <span>Exigir verificación de documento de identidad (cédula) a todos los jugadores</span>
                        </label>
                        <div>
                            <label class="field-label" for="t-rules">Reglas del torneo (una por línea)</label>
                            <textarea
                                id="t-rules"
                                v-model="formData.rulesText"
                                class="input"
                                rows="5"
                                placeholder="Presentarse 15 minutos antes del partido&#10;Uniforme completo obligatorio&#10;W.O. a los 10 minutos de la hora pactada"
                            />
                        </div>
                        <div>
                            <label class="field-label" for="t-prizes">Premiación (un premio por línea)</label>
                            <textarea
                                id="t-prizes"
                                v-model="formData.prizesText"
                                class="input"
                                rows="3"
                                placeholder="1er lugar: trofeo + $500&#10;2do lugar: medallas&#10;MVP: balón oficial"
                            />
                        </div>
                    </section>

                    <!-- Datos de cobro de la inscripción -->
                    <section v-if="Number(formData.entryFee) > 0" class="flex flex-col gap-space-md">
                        <h3 class="label-tactical m-0 text-secondary">Datos de pago de la inscripción</h3>
                        <p class="m-0 text-body-sm text-on-surface-variant">
                            Los capitanes verán estos datos para pagar y reportar su pago. Llena al menos un método.
                        </p>
                        <PaymentInfoFields v-model="formData.paymentInfo" id-prefix="t-pay" />
                    </section>

                    <!-- 4. Árbitros -->
                    <section class="flex flex-col gap-space-md">
                        <h3 class="label-tactical m-0 text-secondary">4 · Árbitros</h3>
                        <ChipSelect
                            v-model="formData.refereeIds"
                            label="Árbitros designados"
                            :options="referees.map(r => ({ value: r.id, label: r.fullName }))"
                            empty="No hay árbitros. El admin asigna ese rol desde Usuarios."
                        />
                    </section>

                    <p v-if="formError" role="alert" class="m-0 flex items-center gap-space-sm rounded border border-solid border-error/50 bg-error/10 p-space-sm text-body-sm text-error">
                        <span class="icon">error</span>{{ formError }}
                    </p>
                </div>

                <footer class="flex gap-space-sm border-0 border-t border-solid border-outline-variant/40 px-space-lg py-space-md">
                    <button type="button" class="btn-ghost" :disabled="isSaving" @click="showDialog = false">Cancelar</button>
                    <button type="submit" class="btn-primary flex-1" :disabled="isSaving || isLoadingOptions">
                        <span class="icon">check</span> {{ isSaving ? 'Creando…' : 'Crear torneo' }}
                    </button>
                </footer>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import zonesService from '@/services/zones'
import venuesService from '@/services/venues'
import usersService from '@/services/users'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import StatusChip from '@/components/ui/StatusChip.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'
import ChipSelect from '@/components/ui/ChipSelect.vue'
import TournamentInfoButton from '@/components/ui/TournamentInfoButton.vue'
import PaymentInfoFields from '@/components/tournament/PaymentInfoFields.vue'
import { useConfirm } from '@/composables/useConfirm'
import { emptyPaymentInfo, paymentInfoPayload } from '@/utils/labels'

const authStore = useAuthStore()

const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()

// State
const tournaments = ref([])
const isLoading = ref(false)
const filterStatus = ref('ALL')
const showDialog = ref(false)
const isSaving = ref(false)
const bannerFile = ref(null)
const bannerFilePreview = ref('')
const isLoadingOptions = ref(false)
const formError = ref('')

const zones = ref([])
const venues = ref([])
const referees = ref([])

const categoryOptions = [
    { title: 'Libre / Abierta (OPEN)', value: 'OPEN' },
    { title: 'Sub-13', value: 'SUB_13' },
    { title: 'Sub-15', value: 'SUB_15' },
    { title: 'Sub-17', value: 'SUB_17' },
    { title: 'Sub-19', value: 'SUB_19' },
    { title: 'Veteranos (+35)', value: 'VETERANS' },
    { title: 'Femenina', value: 'FEMALE' },
    { title: 'Mixta', value: 'MIXED' }
]

const formData = ref({
    name: '',
    description: '',
    category: 'OPEN',
    startDate: '',
    endDate: '',
    location: '',
    maxTeams: 16,
    minTeams: 4,
    entryFee: 10,
    playersPerTeam: 12,
    quarterDuration: 10,
    rulesText: '',
    prizesText: '',
    paymentInfo: emptyPaymentInfo(),
    zoneIds: [],
    venueIds: [],
    refereeIds: []
})

// Computed
const filters = [
    { value: 'ALL', label: 'Todos' },
    { value: 'REGISTRATION', label: 'Inscripciones' },
    { value: 'IN_PROGRESS', label: 'En curso' },
    { value: 'FINISHED', label: 'Finalizados' },
    { value: 'CANCELLED', label: 'Cancelados' }
]

// GET /tournaments lists everyone's tournaments; the panel only shows this organizer's
const myTournaments = computed(() => tournaments.value.filter(t => t.organizerId === authStore.user?.id))
const countByStatus = s => (s === 'ALL' ? myTournaments.value.length : myTournaments.value.filter(t => t.status === s).length)
const filteredTournaments = computed(() =>
    filterStatus.value === 'ALL' ? myTournaments.value : myTournaments.value.filter(t => t.status === filterStatus.value)
)
const activeCount = computed(() => myTournaments.value.filter(t => ['REGISTRATION', 'IN_PROGRESS'].includes(t.status)).length)
const pendingTotal = computed(() => myTournaments.value.reduce((n, t) => n + (t.pendingTeams || 0), 0))
const teamsTotal = computed(() => myTournaments.value.reduce((n, t) => n + (t.registeredTeams || 0), 0))

// Pending registrations of my tournaments, with the roster status the API computes
const pending = ref([])
const reviewing = ref(null)

const loadPending = async () => {
    const withPending = myTournaments.value.filter(t => t.pendingTeams > 0)
    const lists = await Promise.all(
        withPending.map(t =>
            tournamentsService
                .getRegistrations(t.id)
                .then(r => r.data.filter(reg => reg.status === 'PENDING').map(reg => ({ ...reg, tournamentId: t.id, tournamentName: t.name })))
                .catch(() => [])
        )
    )
    pending.value = lists.flat()
}

const review = async (reg, decision) => {
    reviewing.value = reg.id
    try {
        await tournamentsService.processRegistration(reg.tournamentId, { registrationId: reg.id, decision })
        toast.success(`${reg.team.name}: inscripción ${decision === 'APPROVED' ? 'aprobada' : 'rechazada'}`)
        await fetchTournaments()
    } catch (error) {
        toast.error(handleApiError(error, 'No se pudo procesar la inscripción'))
    } finally {
        reviewing.value = null
    }
}

// Methods
const fetchTournaments = async () => {
    try {
        isLoading.value = true
        const response = await tournamentsService.getAll({ limit: 100 })
        tournaments.value = response.data?.tournaments || response.data || []
        await loadPending()
    } catch (error) {
        console.error('Error fetching tournaments:', error)
        toast.error(handleApiError(error, 'Error al cargar torneos'))
    } finally {
        isLoading.value = false
    }
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
}

// With zones chosen, only their venues are offered
const availableVenues = computed(() => {
    const zoneIds = formData.value.zoneIds
    return zoneIds.length ? venues.value.filter(v => zoneIds.includes(v.zoneId)) : venues.value
})

// Drop venues that no longer belong to the chosen zones
watch(() => formData.value.zoneIds, () => {
    const allowed = new Set(availableVenues.value.map(v => v.id))
    formData.value.venueIds = formData.value.venueIds.filter(id => allowed.has(id))
})

// First photo of a selected venue; a tournament needs it or an uploaded cover
const venueCover = computed(() =>
    venues.value.filter(v => formData.value.venueIds?.includes(v.id)).flatMap(v => v.photos || [])[0] || ''
)
const bannerPreview = computed(() => bannerFilePreview.value || venueCover.value)
const onBannerSelected = e => {
    const file = e.target.files?.[0] || null
    if (bannerFilePreview.value) URL.revokeObjectURL(bannerFilePreview.value)
    bannerFile.value = file
    bannerFilePreview.value = file ? URL.createObjectURL(file) : ''
}

const validateForm = () => {
    const f = formData.value
    if (!bannerFile.value && !venueCover.value) return 'Sube una foto de portada o elige una cancha que tenga fotos.'
    if (!f.name) return 'Escribe el nombre del torneo.'
    if (!f.startDate || !f.endDate) return 'Elige las fechas de inicio y fin.'
    if (new Date(f.endDate) <= new Date(f.startDate)) return 'La fecha de fin debe ser posterior a la de inicio.'
    if (!f.location) return 'Escribe la ubicación general.'
    // Same limits as CreateTournamentDto
    if (f.minTeams < 4 || f.minTeams > 16) return 'El mínimo de equipos va de 4 a 16.'
    if (f.maxTeams < 4 || f.maxTeams > 32) return 'El máximo de equipos va de 4 a 32.'
    if (f.minTeams > f.maxTeams) return 'El mínimo de equipos no puede superar el máximo.'
    if (f.playersPerTeam < 5 || f.playersPerTeam > 15) return 'Los jugadores por equipo van de 5 a 15.'
    if (f.entryFee === '' || f.entryFee == null || Number(f.entryFee) < 0) return 'El costo de inscripción no puede ser negativo.'
    if (f.quarterDuration < 8 || f.quarterDuration > 12) return 'Los cuartos duran entre 8 y 12 minutos.'
    return ''
}

const createTournament = async (prefill = {}) => {
    formError.value = ''
    formData.value = {
        name: '',
        description: '',
        category: 'OPEN',
        startDate: '',
        endDate: '',
        location: '',
        maxTeams: 16,
        minTeams: 4,
        entryFee: 10,
        playersPerTeam: 12,
        quarterDuration: 10,
        rulesText: '',
        prizesText: '',
        paymentInfo: emptyPaymentInfo(),
        zoneIds: [],
        venueIds: [],
        refereeIds: []
    }
    onBannerSelected({ target: {} })
    showDialog.value = true
    await fetchOptions()
    // Set after options load so the zone watcher doesn't discard the prefilled venue
    Object.assign(formData.value, prefill)
}

// Coming from the zone map: open the form with that zone and venue already chosen
const openFromMap = async () => {
    const { venueId, zoneId } = route.query
    if (!venueId) return
    router.replace({ query: {} })
    await createTournament({ zoneIds: zoneId ? [zoneId] : [], venueIds: [venueId] })
    await nextTick()
    const venue = venues.value.find(v => v.id === venueId)
    if (venue) formData.value.location = [venue.name, venue.address].filter(Boolean).join(', ')
}

const fetchOptions = async () => {
    try {
        isLoadingOptions.value = true
        const [zonesRes, venuesRes, refereesRes] = await Promise.allSettled([
            zonesService.getAll(),
            venuesService.getAll(),
            usersService.getReferees()
        ])

        if (zonesRes.status === 'fulfilled') {
            zones.value = (zonesRes.value.data?.data || []).filter(z => z.isActive)
        }
        if (venuesRes.status === 'fulfilled') {
            venues.value = venuesRes.value.data?.venues || venuesRes.value.data || []
        }
        if (refereesRes.status === 'fulfilled') {
            referees.value = refereesRes.value.data?.referees || refereesRes.value.data || []
        }
    } catch (error) {
        console.warn('Error loading options:', error)
    } finally {
        isLoadingOptions.value = false
    }
}

const saveTournament = async () => {
    formError.value = validateForm()
    if (formError.value) return

    try {
        isSaving.value = true

        // Formatear fechas en formato ISO para el backend
        const startIso = new Date(formData.value.startDate).toISOString()
        const endIso = new Date(formData.value.endDate).toISOString()

        if (new Date(endIso) <= new Date(startIso)) {
            toast.error('La fecha de fin debe ser posterior a la de inicio')
            return
        }

        const payload = {
            name: formData.value.name.trim(),
            description: formData.value.description ? formData.value.description.trim() : undefined,
            category: formData.value.category,
            startDate: startIso,
            endDate: endIso,
            location: formData.value.location.trim(),
            maxTeams: Number(formData.value.maxTeams),
            minTeams: Number(formData.value.minTeams),
            entryFee: Number(formData.value.entryFee),
            playersPerTeam: Number(formData.value.playersPerTeam),
            quarterDuration: Number(formData.value.quarterDuration),
            requireIdVerification: Boolean(formData.value.requireIdVerification),
            rules: (formData.value.rulesText || '').split('\n').map(r => r.trim()).filter(Boolean),
            prizes: (formData.value.prizesText || '').split('\n').map(p => p.trim()).filter(Boolean),
            paymentInfo: Number(formData.value.entryFee) > 0 ? paymentInfoPayload(formData.value.paymentInfo) : undefined,
            zoneIds: formData.value.zoneIds && formData.value.zoneIds.length > 0 ? formData.value.zoneIds : undefined,
            venueIds: formData.value.venueIds && formData.value.venueIds.length > 0 ? formData.value.venueIds : undefined,
            refereeIds: formData.value.refereeIds && formData.value.refereeIds.length > 0 ? formData.value.refereeIds : undefined,
        }
        if (bannerFile.value) {
            payload.bannerUrl = (await tournamentsService.uploadBanner(bannerFile.value)).data.url
        }

        await tournamentsService.create(payload)
        toast.success('¡Torneo creado exitosamente!')
        showDialog.value = false
        await fetchTournaments()
    } catch (error) {
        console.error('Error creating tournament:', error)
        toast.error(handleApiError(error, 'Error al crear torneo'))
    } finally {
        isSaving.value = false
    }
}

const manageTournament = (tournament) => {
    router.push(`/app/organizer/tournament/${tournament.id}`)
}

const deleteTournament = async (tournament) => {
    const ok = await confirm({
        title: 'Eliminar torneo',
        message: `¿Seguro que quieres eliminar "${tournament.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        danger: true
    })
    if (!ok) return

    try {
        await tournamentsService.delete(tournament.id)
        toast.success('Torneo eliminado')
        fetchTournaments()
    } catch (error) {
        console.error('Error deleting tournament:', error)
        toast.error(handleApiError(error, 'Error al eliminar torneo'))
    }
}

onMounted(() => {
    fetchTournaments()
    openFromMap()
})
</script>

