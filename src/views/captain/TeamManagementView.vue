<template>
    <div class="team-management">
        <!-- Team Header -->
        <div class="team-header mb-6">
            <v-row align="center">
                <v-col cols="12" md="8">
                    <div class="d-flex align-center">
                        <v-avatar size="64" color="secondary" class="mr-4">
                            <v-icon color="white" size="32">mdi-shield-star</v-icon>
                        </v-avatar>
                        <div>
                            <h1 class="text-h4 font-weight-bold">{{ team.name }}</h1>
                            <p class="text-body-1 text-medium-emphasis">
                                {{ team.tournament || 'Sin torneo asignado' }}
                            </p>
                        </div>
                    </div>
                </v-col>
                <v-col cols="12" md="4" class="text-md-end">
                    <v-btn-group variant="outlined">
                        <v-btn prepend-icon="mdi-pencil" @click="editTeam">Editar</v-btn>
                        <v-btn prepend-icon="mdi-cog" @click="showSettings = true">Config</v-btn>
                    </v-btn-group>
                </v-col>
            </v-row>
        </div>

        <!-- Tabs -->
        <v-tabs v-model="activeTab" color="secondary" class="mb-6">
            <v-tab value="roster">
                <v-icon start>mdi-account-group</v-icon>
                Plantilla
            </v-tab>
            <v-tab value="stats">
                <v-icon start>mdi-chart-bar</v-icon>
                Estadísticas
            </v-tab>
            <v-tab value="matches">
                <v-icon start>mdi-calendar</v-icon>
                Partidos
            </v-tab>
            <v-tab value="docs">
                <v-icon start>mdi-file-document</v-icon>
                Documentos
            </v-tab>
        </v-tabs>

        <!-- Tab Content -->
        <v-window v-model="activeTab">
            <!-- Roster Tab -->
            <v-window-item value="roster">
                <v-row>
                    <v-col cols="12">
                        <v-card elevation="2">
                            <v-card-title class="d-flex align-center">
                                Jugadores Inscritos ({{ players.length }}/{{ team.maxPlayers }})
                                <v-spacer />
                                <v-btn color="secondary" prepend-icon="mdi-account-plus" @click="addPlayer">
                                    Agregar Jugador
                                </v-btn>
                            </v-card-title>

                            <v-card-text>
                                <v-data-table :headers="playerHeaders" :items="players" :items-per-page="10" hover>
                                    <template #item.player="{ item }">
                                        <div class="d-flex align-center py-2">
                                            <v-avatar size="32" color="primary" class="mr-3">
                                                <span class="text-caption">{{ getInitials(item.name) }}</span>
                                            </v-avatar>
                                            <div>
                                                <div class="font-weight-medium">{{ item.name }}</div>
                                                <div class="text-caption text-medium-emphasis">{{ item.ci }}</div>
                                            </div>
                                        </div>
                                    </template>

                                    <template #item.position="{ item }">
                                        <v-chip size="small" variant="tonal">
                                            {{ item.position }}
                                        </v-chip>
                                    </template>

                                    <template #item.status="{ item }">
                                        <v-chip size="small" :color="getPlayerStatusColor(item.status)">
                                            {{ item.status }}
                                        </v-chip>
                                    </template>

                                    <template #item.actions="{ item }">
                                        <v-btn icon="mdi-pencil" size="small" variant="text"
                                            @click="editPlayer(item)" />
                                        <v-btn icon="mdi-delete" size="small" variant="text" color="error"
                                            @click="removePlayer(item)" />
                                    </template>
                                </v-data-table>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-window-item>

            <!-- Stats Tab -->
            <v-window-item value="stats">
                <v-row>
                    <v-col cols="12" md="6" lg="3" v-for="stat in teamStats" :key="stat.label">
                        <v-card elevation="2">
                            <v-card-text class="text-center">
                                <v-icon :color="stat.color" size="32" class="mb-2">
                                    {{ stat.icon }}
                                </v-icon>
                                <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
                                <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <v-col cols="12">
                        <v-card elevation="2">
                            <v-card-title>Rendimiento por Jugador</v-card-title>
                            <v-card-text>
                                <v-table>
                                    <thead>
                                        <tr>
                                            <th>Jugador</th>
                                            <th>PJ</th>
                                            <th>PTS</th>
                                            <th>REB</th>
                                            <th>AST</th>
                                            <th>EFF</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="player in playerStats" :key="player.id">
                                            <td>{{ player.name }}</td>
                                            <td>{{ player.gamesPlayed }}</td>
                                            <td class="font-weight-bold">{{ player.points }}</td>
                                            <td>{{ player.rebounds }}</td>
                                            <td>{{ player.assists }}</td>
                                            <td>{{ player.efficiency }}</td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-window-item>

            <!-- Matches Tab -->
            <v-window-item value="matches">
                <v-row>
                    <v-col cols="12">
                        <v-card elevation="2">
                            <v-card-title>Próximos Partidos</v-card-title>
                            <v-list>
                                <v-list-item v-for="match in upcomingMatches" :key="match.id"
                                    :prepend-icon="'mdi-basketball'">
                                    <v-list-item-title>
                                        {{ team.name }} vs {{ match.opponent }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ match.date }} • {{ match.venue }}
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </v-col>
                </v-row>
            </v-window-item>

            <!-- Documents Tab -->
            <v-window-item value="docs">
                <v-row>
                    <v-col cols="12">
                        <v-card elevation="2">
                            <v-card-title class="d-flex align-center">
                                Documentos del Equipo
                                <v-spacer />
                                <v-btn prepend-icon="mdi-upload" variant="outlined">
                                    Subir Documento
                                </v-btn>
                            </v-card-title>
                            <v-list>
                                <v-list-item v-for="doc in documents" :key="doc.id" :prepend-icon="'mdi-file-document'">
                                    <v-list-item-title>{{ doc.name }}</v-list-item-title>
                                    <v-list-item-subtitle>{{ doc.date }}</v-list-item-subtitle>
                                    <template #append>
                                        <v-btn icon="mdi-download" variant="text" size="small" />
                                    </template>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </v-col>
                </v-row>
            </v-window-item>
        </v-window>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()

// State
const activeTab = ref('roster')
const showSettings = ref(false)

// Mock Data
const team = ref({
    id: 1,
    name: 'Los Tigres',
    tournament: 'Copa de Verano 2025',
    maxPlayers: 12
})

const playerHeaders = [
    { title: 'Jugador', key: 'player', sortable: true },
    { title: 'Posición', key: 'position' },
    { title: 'Dorsal', key: 'jerseyNumber', align: 'center' },
    { title: 'Estado', key: 'status' },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'end' }
]

const players = ref([
    {
        id: 1,
        name: 'Juan Pérez',
        ci: '12345678',
        position: 'Escolta',
        jerseyNumber: 23,
        status: 'Activo'
    },
    {
        id: 2,
        name: 'Carlos Gómez',
        ci: '87654321',
        position: 'Base',
        jerseyNumber: 10,
        status: 'Activo'
    }
])

const teamStats = [
    { label: 'Partidos Jugados', value: '8', icon: 'mdi-basketball', color: 'primary' },
    { label: 'Victorias', value: '6', icon: 'mdi-trophy', color: 'success' },
    { label: 'Derrotas', value: '2', icon: 'mdi-close-circle', color: 'error' },
    { label: 'Racha Actual', value: '3W', icon: 'mdi-fire', color: 'warning' }
]

const playerStats = [
    { id: 1, name: 'Juan Pérez', gamesPlayed: 8, points: 18.5, rebounds: 5.2, assists: 3.1, efficiency: 21.4 }
]

const upcomingMatches = [
    { id: 1, opponent: 'Águilas Doradas', date: '20 Nov 2025', venue: 'Cancha Central' }
]

const documents = [
    { id: 1, name: 'Acta de Inscripción.pdf', date: '10 Nov 2025' }
]

// Methods
const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getPlayerStatusColor = (status) => {
    return status === 'Activo' ? 'success' : 'warning'
}

const editTeam = () => {
    toast.info('Editar equipo')
}

const addPlayer = () => {
    router.push('/app/captain/register-player')
}

const editPlayer = (player) => {
    toast.info(`Editar ${player.name}`)
}

const removePlayer = (player) => {
    toast.warning(`Eliminar ${player.name}`)
}
</script>

<style scoped>
.team-management {
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

.team-header {
    background: linear-gradient(135deg,
            rgba(var(--v-theme-secondary), 0.1) 0%,
            rgba(var(--v-theme-primary), 0.1) 100%);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(var(--v-theme-divider), 0.2);
}
</style>
