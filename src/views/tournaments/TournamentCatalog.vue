<template>
    <div class="tournament-catalog">
        <!-- Header -->
        <div class="d-flex align-center justify-space-between mb-6">
            <div>
                <h1 class="text-h4 font-weight-bold mb-1">Torneos Disponibles</h1>
                <p class="text-body-1 text-medium-emphasis">
                    Explora torneos e inscribe a tu equipo para competir
                </p>
            </div>

            <v-btn color="primary" prepend-icon="mdi-plus" @click="showCreateTeamDialog = true">
                Crear Nuevo Equipo
            </v-btn>
        </div>

        <!-- Filters -->
        <v-card class="mb-6" elevation="1">
            <v-card-text>
                <v-row>
                    <v-col cols="12" sm="4">
                        <v-text-field v-model="filters.search" prepend-inner-icon="mdi-magnify" label="Buscar torneo"
                            hide-details density="compact" variant="outlined" />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-select v-model="filters.zone" :items="zones" label="Zona" hide-details density="compact"
                            variant="outlined" prepend-inner-icon="mdi-map-marker" />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-select v-model="filters.status" :items="statusOptions" label="Estado" hide-details
                            density="compact" variant="outlined" />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Tournaments Grid -->
        <v-row>
            <v-col v-for="tournament in filteredTournaments" :key="tournament.id" cols="12" md="6" lg="4">
                <v-card elevation="2" class="h-100 d-flex flex-column">
                    <v-img :src="tournament.image || 'https://cdn.vuetifyjs.com/images/cards/sunshine.jpg'" height="200"
                        cover class="align-end">
                        <v-card-title class="text-white bg-black-opacity">
                            {{ tournament.name }}
                        </v-card-title>
                    </v-img>

                    <v-card-text class="flex-grow-1 pt-4">
                        <div class="d-flex align-center mb-2">
                            <v-chip size="small" :color="getStatusColor(tournament.status)" class="mr-2">
                                {{ getStatusText(tournament.status) }}
                            </v-chip>
                            <v-chip size="small" variant="outlined">
                                {{ tournament.zone }}
                            </v-chip>
                        </div>

                        <p class="text-body-2 mb-4 line-clamp-3">
                            {{ tournament.description }}
                        </p>

                        <v-list density="compact" class="bg-transparent">
                            <v-list-item density="compact" prepend-icon="mdi-calendar">
                                <v-list-item-title class="text-caption">
                                    {{ tournament.startDate }} - {{ tournament.endDate }}
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item density="compact" prepend-icon="mdi-account-group">
                                <v-list-item-title class="text-caption">
                                    {{ tournament.registeredTeams }}/{{ tournament.maxTeams }} Equipos
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card-text>

                    <v-divider />

                    <v-card-actions>
                        <v-btn variant="text" color="primary" @click="viewDetails(tournament)">
                            Ver Detalles
                        </v-btn>
                        <v-spacer />
                        <v-btn variant="flat" color="primary" :disabled="!canRegister(tournament)"
                            @click="openRegistration(tournament)">
                            Inscribir Equipo
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <!-- Create Team Dialog -->
        <v-dialog v-model="showCreateTeamDialog" max-width="600">
            <v-card>
                <v-card-title>Crear Nuevo Equipo</v-card-title>
                <v-card-text>
                    <v-form ref="teamForm" v-model="isTeamFormValid">
                        <v-text-field v-model="newTeam.name" label="Nombre del Equipo"
                            :rules="[v => !!v || 'El nombre es requerido']" required variant="outlined" class="mb-2" />

                        <v-select v-model="newTeam.category" :items="['Masculino', 'Femenino', 'Mixto']"
                            label="Categoría" variant="outlined" class="mb-2" />

                        <v-textarea v-model="newTeam.description" label="Descripción (Opcional)" variant="outlined"
                            rows="3" />

                        <v-alert type="info" variant="tonal" class="mt-2 text-caption">
                            Al crear un equipo, te convertirás automáticamente en su <strong>Capitán</strong>.
                        </v-alert>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showCreateTeamDialog = false">Cancelar</v-btn>
                    <v-btn color="primary" :loading="creatingTeam" :disabled="!isTeamFormValid" @click="createTeam">
                        Crear Equipo
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Registration Dialog -->
        <v-dialog v-model="showRegistrationDialog" max-width="500">
            <v-card>
                <v-card-title>Inscribir Equipo</v-card-title>
                <v-card-subtitle>
                    {{ selectedTournament?.name }}
                </v-card-subtitle>

                <v-card-text class="pt-4">
                    <p class="mb-4">Selecciona el equipo que deseas inscribir:</p>

                    <v-select v-model="selectedTeamId" :items="myTeams" item-title="name" item-value="id"
                        label="Mis Equipos" variant="outlined" :rules="[v => !!v || 'Debes seleccionar un equipo']" />

                    <div v-if="myTeams.length === 0" class="text-center mt-2">
                        <p class="text-caption text-warning mb-2">
                            No tienes equipos creados.
                        </p>
                        <v-btn size="small" variant="outlined" color="primary" @click="switchToCreateTeam">
                            Crear Equipo Ahora
                        </v-btn>
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showRegistrationDialog = false">Cancelar</v-btn>
                    <v-btn color="success" :disabled="!selectedTeamId" @click="confirmRegistration">
                        Confirmar Inscripción
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import teamsService from '@/services/teams'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const authStore = useAuthStore()

// State
const filters = reactive({
    search: '',
    zone: null,
    status: 'OPEN'
})

const showCreateTeamDialog = ref(false)
const showRegistrationDialog = ref(false)
const selectedTournament = ref(null)
const selectedTeamId = ref(null)
const creatingTeam = ref(false)
const isTeamFormValid = ref(false)
const isLoading = ref(false)
const isRegistering = ref(false)

const newTeam = reactive({
    name: '',
    category: 'Masculino',
    description: ''
})

// Data
const tournaments = ref([])
const myTeams = ref([])
const zones = ['Todas', 'Zona Norte', 'Zona Sur', 'Zona Este', 'Zona Oeste'] // TODO: Fetch from API if dynamic
const statusOptions = [
    { title: 'Todos', value: null },
    { title: 'Inscripciones Abiertas', value: 'OPEN' },
    { title: 'En Progreso', value: 'IN_PROGRESS' },
    { title: 'Finalizado', value: 'FINISHED' }
]

// Computed
const filteredTournaments = computed(() => {
    return tournaments.value.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(filters.search.toLowerCase())
        const matchesZone = !filters.zone || filters.zone === 'Todas' || t.zone === filters.zone // Note: Backend might return zone object or ID
        const matchesStatus = !filters.status || t.status === filters.status
        return matchesSearch && matchesZone && matchesStatus
    })
})

const isCaptain = computed(() => authStore.user?.role === 'TEAM_CAPTAIN')

// Methods
const fetchTournaments = async () => {
    try {
        isLoading.value = true
        const response = await tournamentsService.getAll({
            status: filters.status || undefined,
            // Add other filters as needed by backend
        })
        // Handle response structure { tournaments: [], total: 0 }
        tournaments.value = response.data.tournaments || []
    } catch (error) {
        console.error('Error fetching tournaments:', error)
        toast.error('Error al cargar los torneos')
    } finally {
        isLoading.value = false
    }
}

const fetchMyTeams = async () => {
    if (!isCaptain.value) return
    
    try {
        const response = await teamsService.getMyTeams()
        myTeams.value = response.data || []
    } catch (error) {
        console.error('Error fetching teams:', error)
        // Don't show error if just empty or not authorized yet
    }
}

const getStatusColor = (status) => {
    const colors = {
        'OPEN': 'success',
        'IN_PROGRESS': 'warning',
        'FINISHED': 'grey'
    }
    return colors[status] || 'grey'
}

const getStatusText = (status) => {
    const texts = {
        'OPEN': 'Abierto',
        'IN_PROGRESS': 'En Curso',
        'FINISHED': 'Finalizado'
    }
    return texts[status] || status
}

const canRegister = (tournament) => {
    return tournament.status === 'OPEN' && 
           tournament.registeredTeams < tournament.maxTeams &&
           isCaptain.value
}

const viewDetails = (tournament) => {
    // Navigate to detail view (to be implemented)
    toast.info(`Ver detalles de ${tournament.name}`)
}

const openRegistration = (tournament) => {
    if (!isCaptain.value) {
        toast.warning('Solo los capitanes pueden inscribir equipos')
        return
    }
    selectedTournament.value = tournament
    showRegistrationDialog.value = true
    fetchMyTeams() // Refresh teams list
}

const switchToCreateTeam = () => {
    showRegistrationDialog.value = false
    showCreateTeamDialog.value = true
}

const createTeam = async () => {
    try {
        creatingTeam.value = true
        const response = await teamsService.create({
            name: newTeam.name,
            category: newTeam.category.toUpperCase(), // Backend expects uppercase enum
            description: newTeam.description,
            city: 'Default City', // Required by backend DTO, add field to form later
            foundedYear: new Date().getFullYear() // Required by backend DTO
        })

        const createdTeam = response.data
        myTeams.value.push(createdTeam)
        toast.success(`Equipo "${createdTeam.name}" creado exitosamente`)

        showCreateTeamDialog.value = false
        
        // Reset form
        newTeam.name = ''
        newTeam.description = ''

        // If we came from registration, go back to it
        if (selectedTournament.value) {
            selectedTeamId.value = createdTeam.id
            showRegistrationDialog.value = true
        }
    } catch (error) {
        console.error('Error creating team:', error)
        toast.error(error.response?.data?.message || 'Error al crear el equipo')
    } finally {
        creatingTeam.value = false
    }
}

const confirmRegistration = async () => {
    if (!selectedTeamId.value || !selectedTournament.value) return

    try {
        isRegistering.value = true
        await tournamentsService.registerTeam({
            tournamentId: selectedTournament.value.id,
            teamId: selectedTeamId.value
        })

        toast.success(`Inscripción exitosa en ${selectedTournament.value.name}`)
        showRegistrationDialog.value = false
        selectedTournament.value = null
        selectedTeamId.value = null
        
        // Refresh list to update counts
        fetchTournaments()
    } catch (error) {
        console.error('Error registering team:', error)
        toast.error(error.response?.data?.message || 'Error al inscribir el equipo')
    } finally {
        isRegistering.value = false
    }
}

// Lifecycle
onMounted(() => {
    fetchTournaments()
    if (isCaptain.value) {
        fetchMyTeams()
    }
})
</script>

<style scoped>
.bg-black-opacity {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
