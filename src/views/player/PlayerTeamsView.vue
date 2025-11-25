<template>
    <div class="player-teams">
        <!-- Active Teams Section -->
        <div class="mb-8">
            <h2 class="text-h5 font-weight-bold mb-4 d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-shield-check</v-icon>
                Equipos Activos
            </h2>

            <v-row v-if="activeTeams.length > 0">
                <v-col v-for="team in activeTeams" :key="team.id" cols="12" md="6" lg="4">
                    <v-card elevation="2" class="h-100 team-card">
                        <v-img height="140" src="https://cdn.vuetifyjs.com/images/cards/server-room.jpg" cover
                            class="align-end">
                            <v-card-title class="text-white bg-black-opacity">
                                {{ team.name }}
                            </v-card-title>
                        </v-img>

                        <v-card-text class="pt-4">
                            <div class="d-flex align-center mb-2">
                                <v-icon size="small" class="mr-2">mdi-trophy</v-icon>
                                <span class="text-body-2">{{ team.tournament }}</span>
                            </div>
                            <div class="d-flex align-center mb-4">
                                <v-icon size="small" class="mr-2">mdi-tshirt-crew</v-icon>
                                <span class="text-body-2">Dorsal #{{ team.jerseyNumber }}</span>
                            </div>

                            <v-divider class="mb-3" />

                            <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                                <span>Partidos: {{ team.stats.matches }}</span>
                                <span>PTS: {{ team.stats.points }}</span>
                                <span>AST: {{ team.stats.assists }}</span>
                            </div>
                        </v-card-text>

                        <v-card-actions>
                            <v-btn variant="text" color="primary" block @click="viewTeamDetails(team.id)">
                                Ver Detalles
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>

            <v-alert v-else type="info" variant="tonal" class="mb-4">
                No estás inscrito en ningún equipo activo actualmente.
                <template #append>
                    <v-btn variant="text" color="info" @click="findTeams">
                        Buscar Equipos
                    </v-btn>
                </template>
            </v-alert>
        </div>

        <!-- Pending Requests -->
        <div class="mb-8" v-if="pendingRequests.length > 0">
            <h2 class="text-h6 font-weight-bold mb-3 text-medium-emphasis">
                Solicitudes Pendientes
            </h2>

            <v-list elevation="1" rounded="lg">
                <v-list-item v-for="req in pendingRequests" :key="req.id" :title="req.teamName"
                    :subtitle="`Enviada el ${req.date}`">
                    <template #prepend>
                        <v-avatar color="warning" variant="tonal">
                            <v-icon>mdi-clock-outline</v-icon>
                        </v-avatar>
                    </template>

                    <template #append>
                        <v-chip size="small" color="warning" variant="flat">
                            Pendiente
                        </v-chip>
                        <v-btn icon="mdi-close" variant="text" size="small" color="error" class="ml-2"
                            @click="cancelRequest(req.id)" />
                    </template>
                </v-list-item>
            </v-list>
        </div>

        <!-- Past Teams -->
        <div>
            <h2 class="text-h6 font-weight-bold mb-3 text-medium-emphasis">
                Historial de Equipos
            </h2>

            <v-table>
                <thead>
                    <tr>
                        <th class="text-left">Equipo</th>
                        <th class="text-left">Torneo</th>
                        <th class="text-left">Temporada</th>
                        <th class="text-center">Estadísticas</th>
                    </tr>
                </thead>
                <tbody>
                    <v-tr v-for="team in pastTeams" :key="team.id">
                        <td>{{ team.name }}</td>
                        <td>{{ team.tournament }}</td>
                        <td>{{ team.season }}</td>
                        <td class="text-center">
                            <v-btn size="small" variant="text" icon="mdi-chart-bar" color="primary"
                                @click="viewSeasonStats(team.id)" />
                        </td>
                    </v-tr>
                </tbody>
            </v-table>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()

// Mock Data
const activeTeams = ref([
    {
        id: 1,
        name: 'Los Tigres',
        tournament: 'Copa de Verano 2025',
        jerseyNumber: 23,
        stats: { matches: 12, points: 220, assists: 58 }
    }
])

const pendingRequests = ref([
    {
        id: 101,
        teamName: 'Dragones Rojos',
        date: '24 Nov 2025'
    }
])

const pastTeams = ref([
    {
        id: 2,
        name: 'Halcones',
        tournament: 'Liga Regional 2024',
        season: '2024'
    },
    {
        id: 3,
        name: 'Los Tigres',
        tournament: 'Torneo Apertura 2024',
        season: '2024'
    }
])

// Methods
const viewTeamDetails = (teamId) => {
    router.push(`/app/team/${teamId}`)
}

const findTeams = () => {
    router.push('/tournaments')
}

const cancelRequest = (reqId) => {
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== reqId)
    toast.info('Solicitud cancelada')
}

const viewSeasonStats = (teamId) => {
    router.push('/app/player/stats')
}
</script>

<style scoped>
.bg-black-opacity {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
}

.team-card {
    transition: transform 0.2s;
}

.team-card:hover {
    transform: translateY(-4px);
}
</style>
