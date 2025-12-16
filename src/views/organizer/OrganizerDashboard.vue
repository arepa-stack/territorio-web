<template>
    <div class="organizer-dashboard">
        <!-- Welcome Header -->
        <div class="welcome-section mb-6">
            <v-row align="center">
                <v-col cols="12" md="8">
                    <div class="d-flex align-center">
                        <v-avatar size="80" color="primary" class="mr-4 elevation-4">
                            <v-icon color="white" size="40">mdi-trophy-award</v-icon>
                        </v-avatar>
                        <div>
                            <h1 class="text-h3 font-weight-bold mb-1">
                                Panel de Organizador
                            </h1>
                            <p class="text-h6 text-medium-emphasis">
                                Gestiona tus torneos y competiciones
                            </p>
                        </div>
                    </div>
                </v-col>
                <v-col cols="12" md="4" class="text-md-end">
                    <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="createTournament">
                        Crear Nuevo Torneo
                    </v-btn>
                </v-col>
            </v-row>
        </div>

        <!-- Stats Overview -->
        <v-row class="mb-6">
            <v-col cols="12" sm="6" md="3" v-for="stat in stats" :key="stat.label">
                <v-card elevation="2" class="h-100">
                    <v-card-text class="d-flex align-center">
                        <v-avatar :color="stat.color" variant="tonal" size="48" class="mr-4">
                            <v-icon size="24">{{ stat.icon }}</v-icon>
                        </v-avatar>
                        <div>
                            <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
                            <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Tournaments List -->
        <v-row>
            <v-col cols="12">
                <div class="d-flex align-center justify-space-between mb-4">
                    <h2 class="text-h5 font-weight-bold">Mis Torneos</h2>
                    <v-btn-toggle v-model="filterStatus" density="compact" color="primary" variant="outlined" mandatory>
                        <v-btn value="ALL">Todos</v-btn>
                        <v-btn value="REGISTRATION">Inscripción</v-btn>
                        <v-btn value="IN_PROGRESS">En Curso</v-btn>
                        <v-btn value="COMPLETED">Finalizados</v-btn>
                    </v-btn-toggle>
                </div>
            </v-col>

            <v-col v-if="isLoading" cols="12" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" size="64" />
                <p class="mt-4 text-medium-emphasis">Cargando torneos...</p>
            </v-col>

            <v-col v-else-if="filteredTournaments.length === 0" cols="12">
                <v-card class="text-center pa-8" variant="outlined" border>
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-trophy-outline</v-icon>
                    <h3 class="text-h6 mb-2">No se encontraron torneos</h3>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                        No hay torneos que coincidan con los filtros seleccionados
                    </p>
                    <v-btn color="primary" variant="text" @click="filterStatus = 'ALL'">
                        Ver todos los torneos
                    </v-btn>
                </v-card>
            </v-col>

            <v-col v-for="tournament in filteredTournaments" :key="tournament.id" cols="12" md="6" lg="4">
                <v-card elevation="2" class="h-100 d-flex flex-column">
                    <v-img :src="tournament.bannerUrl || 'https://cdn.vuetifyjs.com/images/cards/sunshine.jpg'"
                        height="160" cover class="align-end">
                        <v-card-title class="text-white bg-black-opacity">
                            {{ tournament.name }}
                        </v-card-title>
                    </v-img>

                    <v-card-text class="flex-grow-1 pt-4">
                        <div class="d-flex align-center mb-3">
                            <v-chip size="small" :color="getStatusColor(tournament.status)" class="mr-2">
                                {{ getStatusText(tournament.status) }}
                            </v-chip>
                            <v-chip size="small" variant="outlined">
                                {{ tournament.category }}
                            </v-chip>
                        </div>

                        <v-list density="compact" class="bg-transparent">
                            <v-list-item density="compact" prepend-icon="mdi-calendar">
                                <v-list-item-title class="text-caption">
                                    {{ formatDate(tournament.startDate) }} - {{ formatDate(tournament.endDate) }}
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item density="compact" prepend-icon="mdi-account-group">
                                <v-list-item-title class="text-caption">
                                    {{ tournament.registeredTeams }}/{{ tournament.maxTeams }} Equipos Inscritos
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item density="compact" prepend-icon="mdi-map-marker">
                                <v-list-item-title class="text-caption">
                                    {{ tournament.location }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card-text>

                    <v-divider />

                    <v-card-actions>
                        <v-btn variant="text" color="primary" @click="manageTournament(tournament)">
                            Gestionar
                        </v-btn>
                        <v-spacer />
                        <v-btn icon="mdi-pencil" variant="text" size="small" @click="editTournament(tournament)" />
                        <v-btn icon="mdi-delete" variant="text" color="error" size="small"
                            @click="deleteTournament(tournament)" />
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <!-- Create/Edit Dialog -->
        <v-dialog v-model="showDialog" max-width="800px">
            <v-card>
                <v-card-title>
                    <span class="text-h5">Crear Nuevo Torneo</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="formData.name" label="Nombre del Torneo" required></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-select v-model="formData.category" :items="['OPEN', 'MASCULINO', 'FEMENINO', 'MIXTO']" label="Categoría"></v-select>
                            </v-col>
                            <v-col cols="12">
                                <v-textarea v-model="formData.description" label="Descripción" rows="3"></v-textarea>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="formData.startDate" label="Fecha Inicio" type="date"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="formData.endDate" label="Fecha Fin" type="date"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="formData.location" label="Ubicación General"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="formData.entryFee" label="Costo Inscripción" type="number" prefix="$"></v-text-field>
                            </v-col>
                            
                            <!-- Multi-selects -->
                            <v-col cols="12">
                                <v-autocomplete
                                    v-model="formData.zoneIds"
                                    :items="zones"
                                    item-title="name"
                                    item-value="id"
                                    label="Zonas"
                                    multiple
                                    chips
                                    closable-chips
                                ></v-autocomplete>
                            </v-col>
                            <v-col cols="12">
                                <v-autocomplete
                                    v-model="formData.venueIds"
                                    :items="venues"
                                    item-title="name"
                                    item-value="id"
                                    label="Sedes (Venues)"
                                    multiple
                                    chips
                                    closable-chips
                                ></v-autocomplete>
                            </v-col>
                            <v-col cols="12">
                                <v-autocomplete
                                    v-model="formData.refereeIds"
                                    :items="referees"
                                    item-title="fullName"
                                    item-value="id"
                                    label="Árbitros Asignados"
                                    multiple
                                    chips
                                    closable-chips
                                ></v-autocomplete>
                            </v-col>

                            <v-col cols="6" sm="3">
                                <v-text-field v-model="formData.maxTeams" label="Max Equipos" type="number"></v-text-field>
                            </v-col>
                            <v-col cols="6" sm="3">
                                <v-text-field v-model="formData.minTeams" label="Min Equipos" type="number"></v-text-field>
                            </v-col>
                            <v-col cols="6" sm="3">
                                <v-text-field v-model="formData.playersPerTeam" label="Jugadores/Equipo" type="number"></v-text-field>
                            </v-col>
                            <v-col cols="6" sm="3">
                                <v-text-field v-model="formData.quarterDuration" label="Duración Cuarto (min)" type="number"></v-text-field>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue-darken-1" variant="text" @click="showDialog = false">Cancelar</v-btn>
                    <v-btn color="blue-darken-1" variant="text" @click="saveTournament" :loading="isSaving">Guardar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import zonesService from '@/services/zones'
import venuesService from '@/services/venues'
import usersService from '@/services/users'

const router = useRouter()
const toast = useToast()

// State
const tournaments = ref([])
const isLoading = ref(false)
const filterStatus = ref('ALL')
const showDialog = ref(false)
const isSaving = ref(false)
const zones = ref([])
const venues = ref([])
const referees = ref([])

const formData = ref({
    name: '',
    description: '',
    category: 'OPEN',
    startDate: '',
    endDate: '',
    location: '',
    maxTeams: 16,
    minTeams: 4,
    entryFee: 0,
    playersPerTeam: 12,
    quarterDuration: 10,
    zoneIds: [],
    venueIds: [],
    refereeIds: []
})

// Computed
const stats = computed(() => {
    const total = tournaments.value.length
    const active = tournaments.value.filter(t => t.status === 'IN_PROGRESS').length
    const upcoming = tournaments.value.filter(t => t.status === 'REGISTRATION').length
    const completed = tournaments.value.filter(t => t.status === 'COMPLETED').length

    return [
        { label: 'Total Torneos', value: total.toString(), icon: 'mdi-trophy', color: 'primary' },
        { label: 'En Curso', value: active.toString(), icon: 'mdi-play-circle', color: 'success' },
        { label: 'Inscripciones', value: upcoming.toString(), icon: 'mdi-clipboard-text', color: 'info' },
        { label: 'Finalizados', value: completed.toString(), icon: 'mdi-flag-checkered', color: 'grey' }
    ]
})

const filteredTournaments = computed(() => {
    if (filterStatus.value === 'ALL') return tournaments.value
    return tournaments.value.filter(t => t.status === filterStatus.value)
})

// Methods
const fetchTournaments = async () => {
    try {
        isLoading.value = true
        const response = await tournamentsService.getAll()
        // Assuming response.data.tournaments is the array based on controller
        tournaments.value = response.data.tournaments || []
    } catch (error) {
        console.error('Error fetching tournaments:', error)
        toast.error('Error al cargar torneos')
    } finally {
        isLoading.value = false
    }
}

const getStatusColor = (status) => {
    const colors = {
        'DRAFT': 'grey',
        'REGISTRATION': 'info',
        'IN_PROGRESS': 'success',
        'COMPLETED': 'secondary',
        'CANCELLED': 'error'
    }
    return colors[status] || 'grey'
}

const getStatusText = (status) => {
    const texts = {
        'DRAFT': 'Borrador',
        'REGISTRATION': 'Inscripción Abierta',
        'IN_PROGRESS': 'En Curso',
        'COMPLETED': 'Finalizado',
        'CANCELLED': 'Cancelado'
    }
    return texts[status] || status
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
}

const createTournament = async () => {
    formData.value = {
        name: '',
        description: '',
        category: 'OPEN',
        startDate: '',
        endDate: '',
        location: '',
        maxTeams: 16,
        minTeams: 4,
        entryFee: 0,
        playersPerTeam: 12,
        quarterDuration: 10,
        zoneIds: [],
        venueIds: [],
        refereeIds: []
    }
    showDialog.value = true
    await fetchOptions()
}

const fetchOptions = async () => {
    try {
        const [zonesRes, venuesRes, refereesRes] = await Promise.all([
            zonesService.getAll(),
            venuesService.getAll(),
            usersService.getReferees()
        ])
        zones.value = zonesRes.data || []
        venues.value = venuesRes.data || []
        referees.value = refereesRes.data || []
    } catch (error) {
        console.error('Error loading options:', error)
        toast.error('Error al cargar opciones')
    }
}

const saveTournament = async () => {
    try {
        isSaving.value = true
        await tournamentsService.create(formData.value)
        toast.success('Torneo creado exitosamente')
        showDialog.value = false
        fetchTournaments()
    } catch (error) {
        console.error('Error creating tournament:', error)
        toast.error('Error al crear torneo')
    } finally {
        isSaving.value = false
    }
}

const manageTournament = (tournament) => {
    // router.push(`/app/organizer/tournament/${tournament.id}`)
    toast.info(`Gestionar torneo: ${tournament.name}`)
}

const editTournament = (tournament) => {
    toast.info(`Editar torneo: ${tournament.name}`)
}

const deleteTournament = async (tournament) => {
    if (!confirm(`¿Estás seguro de eliminar el torneo "${tournament.name}"?`)) return

    try {
        await tournamentsService.delete(tournament.id)
        toast.success('Torneo eliminado')
        fetchTournaments()
    } catch (error) {
        console.error('Error deleting tournament:', error)
        toast.error('Error al eliminar torneo')
    }
}

onMounted(() => {
    fetchTournaments()
})
</script>

<style scoped>
.organizer-dashboard {
    animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.welcome-section {
    background: linear-gradient(135deg,
            rgba(var(--v-theme-primary), 0.1) 0%,
            rgba(var(--v-theme-secondary), 0.1) 100%);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(var(--v-theme-divider), 0.2);
}

.bg-black-opacity {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
}
</style>
