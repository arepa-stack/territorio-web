<template>
    <div class="player-registration">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-h4 font-weight-bold mb-2">Registrar Jugador</h1>
            <p class="text-body-1 text-medium-emphasis">
                Busca y agrega jugadores a tu equipo
            </p>
        </div>

        <!-- Search Section -->
        <v-card elevation="2" class="mb-6">
            <v-card-title>Buscar Jugador</v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="searchCi" label="Cédula de Identidad"
                            prepend-inner-icon="mdi-card-account-details" variant="outlined"
                            hint="Ingresa la CI del jugador" persistent-hint @keyup.enter="searchPlayer" />
                    </v-col>
                    <v-col cols="12" md="6" class="d-flex align-center">
                        <v-btn color="primary" prepend-icon="mdi-magnify" :loading="searching" @click="searchPlayer"
                            class="mr-2">
                            Buscar
                        </v-btn>
                        <v-btn variant="outlined" prepend-icon="mdi-account-plus" @click="showNewPlayerForm = true">
                            Nuevo Jugador
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Search Result -->
        <v-card v-if="foundPlayer" elevation="2" class="mb-6">
            <v-card-title class="d-flex align-center bg-success-lighten">
                <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
                Jugador Encontrado
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-list>
                            <v-list-item>
                                <v-list-item-title class="font-weight-bold">{{ foundPlayer.name }}</v-list-item-title>
                                <v-list-item-subtitle>Nombre Completo</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title>{{ foundPlayer.ci }}</v-list-item-title>
                                <v-list-item-subtitle>CI</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title>{{ foundPlayer.position }}</v-list-item-title>
                                <v-list-item-subtitle>Posición</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-list>
                            <v-list-item>
                                <v-list-item-title>{{ foundPlayer.height }} cm</v-list-item-title>
                                <v-list-item-subtitle>Altura</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title>{{ foundPlayer.age }} años</v-list-item-title>
                                <v-list-item-subtitle>Edad</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title>{{ foundPlayer.currentTeams || 0 }} equipos</v-list-item-title>
                                <v-list-item-subtitle>Equipos Activos</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-col>
                </v-row>

                <!-- Zone Conflict Warning -->
                <v-alert v-if="zoneConflict" type="warning" variant="tonal" class="mt-4" prominent>
                    <v-alert-title>Conflicto de Zona Detectado</v-alert-title>
                    Este jugador ya está registrado en un equipo de la misma zona.
                    <ul class="mt-2">
                        <li>Zona actual: {{ zoneConflict.zone }}</li>
                        <li>Equipo conflictivo: {{ zoneConflict.team }}</li>
                    </ul>
                </v-alert>

                <!-- Registration Form -->
                <v-divider class="my-4" />

                <h3 class="text-h6 mb-3">Datos para el Equipo</h3>
                <v-form ref="registrationForm" v-model="isFormValid">
                    <v-row>
                        <v-col cols="12" md="4">
                            <v-text-field v-model="registration.jerseyNumber" label="Número de Dorsal" type="number"
                                variant="outlined"
                                :rules="[v => !!v || 'Requerido', v => v > 0 && v <= 99 || 'Entre 1-99']" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-select v-model="registration.position" :items="positions" label="Posición en el Equipo"
                                variant="outlined" :rules="[v => !!v || 'Requerido']" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-select v-model="registration.category" :items="['Titular', 'Suplente']" label="Categoría"
                                variant="outlined" />
                        </v-col>
                        <v-col cols="12">
                            <v-textarea v-model="registration.notes" label="Notas (Opcional)" variant="outlined"
                                rows="2" />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="clearSearch">Cancelar</v-btn>
                <v-btn color="success" :disabled="!isFormValid || zoneConflict" :loading="registering"
                    @click="registerPlayer">
                    Registrar en Equipo
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- New Player Dialog -->
        <v-dialog v-model="showNewPlayerForm" max-width="700">
            <v-card>
                <v-card-title>Crear Nuevo Jugador</v-card-title>
                <v-card-text>
                    <v-form ref="newPlayerForm" v-model="isNewPlayerFormValid">
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="newPlayer.ci" label="Cédula de Identidad" variant="outlined"
                                    :rules="[v => !!v || 'Requerido']" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="newPlayer.fullName" label="Nombre Completo" variant="outlined"
                                    :rules="[v => !!v || 'Requerido']" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="newPlayer.birthDate" label="Fecha de Nacimiento" type="date"
                                    variant="outlined" :rules="[v => !!v || 'Requerido']" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-select v-model="newPlayer.position" :items="positions" label="Posición Principal"
                                    variant="outlined" :rules="[v => !!v || 'Requerido']" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="newPlayer.height" label="Altura (cm)" type="number"
                                    variant="outlined" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field v-model="newPlayer.weight" label="Peso (kg)" type="number"
                                    variant="outlined" />
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showNewPlayerForm = false">Cancelar</v-btn>
                    <v-btn color="primary" :disabled="!isNewPlayerFormValid" :loading="creatingPlayer"
                        @click="createNewPlayer">
                        Crear y Registrar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import playersService from '@/services/players'
import teamsService from '@/services/teams'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// State
const teamId = ref(null)
const searchCi = ref('')
const searching = ref(false)
const registering = ref(false)
const foundPlayer = ref(null)
const zoneConflict = ref(null)
const isFormValid = ref(false)
const showNewPlayerForm = ref(false)
const isNewPlayerFormValid = ref(false)
const creatingPlayer = ref(false)

const positions = [
    'BASE',
    'ESCOLTA',
    'ALERO',
    'ALA_PIVOT',
    'PIVOT'
]

const registration = reactive({
    jerseyNumber: null,
    position: null,
    category: 'Titular',
    notes: ''
})

const newPlayer = reactive({
    ci: '',
    fullName: '',
    birthDate: '',
    position: null,
    height: null,
    weight: null
})

// Methods
const searchPlayer = async () => {
    if (!searchCi.value) {
        toast.warning('Ingresa una CI para buscar')
        return
    }

    try {
        searching.value = true
        zoneConflict.value = null
        foundPlayer.value = null

        // Use the captain specific search endpoint
        const response = await playersService.captainSearchPlayer(teamId.value, searchCi.value)

        if (response.data.isInThisTeam) {
            toast.info('El jugador ya está en tu equipo')
            return
        }

        const player = response.data.player
        foundPlayer.value = {
            id: player.id,
            name: player.fullName,
            ci: player.ci, // Assuming backend returns CI
            position: player.player?.position || 'Sin posición',
            height: player.player?.height || '-',
            age: calculateAge(player.player?.birthDate),
            currentTeams: 0 // Backend doesn't provide this yet
        }

        // Check for zone conflicts (if implemented in backend)
        // const conflicts = await playersService.checkZoneConflicts(player.id, currentZoneId)
        // if (conflicts.hasConflicts) ...

    } catch (error) {
        console.error('Error searching player:', error)
        if (error.response?.status === 404) {
            toast.info('Jugador no encontrado. Puedes crearlo.')
        } else {
            toast.error('Error al buscar jugador')
        }
    } finally {
        searching.value = false
    }
}

const calculateAge = (birthDate) => {
    if (!birthDate) return '-'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return age
}

const clearSearch = () => {
    foundPlayer.value = null
    searchCi.value = ''
    zoneConflict.value = null
    registration.jerseyNumber = null
    registration.position = null
    registration.notes = ''
}

const registerPlayer = async () => {
    if (!teamId.value) {
        toast.error('No se ha seleccionado un equipo')
        return
    }

    try {
        registering.value = true

        await teamsService.addPlayer(teamId.value, {
            userId: foundPlayer.value.id,
            jerseyNumber: parseInt(registration.jerseyNumber),
            position: registration.position
        })

        toast.success(`${foundPlayer.value.name} registrado exitosamente`)
        clearSearch()

        // Go back to team management
        router.push(`/app/captain/team/${teamId.value}`)
    } catch (error) {
        console.error('Error registering player:', error)
        toast.error(error.response?.data?.message || 'Error al registrar jugador')
    } finally {
        registering.value = false
    }
}

const createNewPlayer = async () => {
    // This flow might need backend support for "Captain creates Player User"
    // Currently backend supports creating player profile for existing user or admin creating user
    // Assuming we have an endpoint or using the generic create

    try {
        creatingPlayer.value = true

        // For now, we might need to use a specific endpoint if it exists, 
        // or this feature might be limited to Admins/Organizers.
        // Let's assume we use the captainAddPlayer endpoint which takes CI and creates if not exists?
        // Actually, looking at backend, captainAddPlayer takes CI but expects player to exist?
        // Let's check players.controller.ts again.
        // It says: "Primero buscar el jugador... si no existe throw Error"
        // So Captains CANNOT create new users/players currently in the backend logic shown.

        toast.warning('La creación de nuevos jugadores está reservada para Administradores por ahora.')
        showNewPlayerForm.value = false

        /* 
        // If backend supported it:
        await playersService.create({ ...newPlayer, teamId: teamId.value })
        toast.success(`Jugador ${newPlayer.fullName} creado y registrado`)
        showNewPlayerForm.value = false
        router.push(`/app/captain/team/${teamId.value}`)
        */

    } catch (error) {
        console.error('Error creating player:', error)
        toast.error('Error al crear jugador')
    } finally {
        creatingPlayer.value = false
    }
}

onMounted(async () => {
    teamId.value = route.query.teamId

    if (!teamId.value) {
        // Fetch teams to auto-select or prompt
        try {
            const response = await teamsService.getMyTeams()
            const teams = response.data

            if (teams.length === 0) {
                toast.warning('Debes crear un equipo primero')
                router.push('/app/captain')
            } else if (teams.length === 1) {
                teamId.value = teams[0].id
                // Update URL without reload
                router.replace({ query: { ...route.query, teamId: teamId.value } })
            } else {
                // Multiple teams: For now, just pick the first one. 
                // Ideally show a dialog, but this is an MVP fix.
                teamId.value = teams[0].id
                toast.info(`Seleccionado equipo: ${teams[0].name}`)
                router.replace({ query: { ...route.query, teamId: teamId.value } })
            }
        } catch (error) {
            console.error('Error fetching teams:', error)
            toast.error('Error al cargar equipos')
            router.push('/app/captain')
        }
    }
})
</script>

<style scoped>
.player-registration {
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

.bg-success-lighten {
    background: rgba(var(--v-theme-success), 0.1);
}
</style>
