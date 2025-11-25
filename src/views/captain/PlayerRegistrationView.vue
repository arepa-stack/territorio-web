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
import { ref, reactive } from 'vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

// State
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
    'Base',
    'Escolta',
    'Alero',
    'Ala-Pívot',
    'Pívot'
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

    searching.value = true
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock result
    foundPlayer.value = {
        id: 1,
        name: 'Juan Pérez García',
        ci: searchCi.value,
        position: 'Escolta',
        height: 185,
        age: 24,
        currentTeams: 0
    }

    // Check for zone conflicts (mock)
    if (Math.random() > 0.7) {
        zoneConflict.value = {
            zone: 'Zona Norte',
            team: 'Águilas Doradas'
        }
    } else {
        zoneConflict.value = null
    }

    searching.value = false
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
    registering.value = true
    await new Promise(resolve => setTimeout(resolve, 1500))

    toast.success(`${foundPlayer.value.name} registrado exitosamente`)
    clearSearch()
    registering.value = false
}

const createNewPlayer = async () => {
    creatingPlayer.value = true
    await new Promise(resolve => setTimeout(resolve, 1500))

    toast.success(`Jugador ${newPlayer.fullName} creado y registrado`)
    showNewPlayerForm.value = false
    creatingPlayer.value = false

    // Reset form
    Object.keys(newPlayer).forEach(key => newPlayer[key] = null)
}
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
