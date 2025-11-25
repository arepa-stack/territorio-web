<template>
    <div class="captain-dashboard">
        <!-- Welcome Header -->
        <div class="welcome-section mb-6">
            <v-row>
                <v-col cols="12" md="8">
                    <div class="d-flex align-center">
                        <v-avatar size="80" color="secondary" class="mr-4 elevation-4">
                            <v-icon color="white" size="40">mdi-shield-account</v-icon>
                        </v-avatar>

                        <div>
                            <h1 class="text-h3 font-weight-bold mb-1">
                                ¡Bienvenido, Capitán {{ authStore.userName }}! ⚡
                            </h1>
                            <p class="text-h6 text-medium-emphasis">
                                Panel de gestión de equipos
                            </p>
                            <v-chip color="secondary" variant="tonal" size="small" class="mt-2">
                                <v-icon start>mdi-account-group</v-icon>
                                {{ myTeams.length }} equipo(s) bajo tu mando
                            </v-chip>
                        </div>
                    </div>
                </v-col>

                <v-col cols="12" md="4" class="text-md-end">
                    <div class="d-flex flex-column align-md-end gap-2">
                        <v-btn variant="outlined" prepend-icon="mdi-plus" @click="createNewTeam">
                            Crear Equipo
                        </v-btn>
                        <v-btn color="secondary" prepend-icon="mdi-account-multiple-plus"
                            @click="navigateToRegistration">
                            Registrar Jugadores
                        </v-btn>
                    </div>
                </v-col>
            </v-row>
        </div>

        <!-- Quick Stats -->
        <v-row class="mb-6">
            <v-col v-for="stat in captainStats" :key="stat.label" cols="12" sm="6" md="3">
                <StatsCard :title="stat.label" :value="stat.value" :trend="stat.trend" :icon="stat.icon"
                    :color="stat.color" />
            </v-col>
        </v-row>

        <!-- My Teams Grid -->
        <v-row>
            <v-col cols="12">
                <h2 class="text-h5 font-weight-bold mb-4">Mis Equipos</h2>
            </v-col>

            <v-col v-for="team in myTeams" :key="team.id" cols="12" md="6" lg="4">
                <v-card elevation="2" class="h-100">
                    <v-img :src="team.image || 'https://cdn.vuetifyjs.com/images/cards/basketball.jpg'" height="160"
                        cover class="align-end">
                        <v-card-title class="text-white bg-black-opacity">
                            {{ team.name }}
                        </v-card-title>
                    </v-img>

                    <v-card-text>
                        <div class="d-flex align-center mb-3">
                            <v-chip size="small" :color="getStatusColor(team.status)" class="mr-2">
                                {{ getStatusText(team.status) }}
                            </v-chip>
                            <v-chip size="small" variant="outlined">
                                {{ team.category }}
                            </v-chip>
                        </div>

                        <v-list density="compact" class="bg-transparent">
                            <v-list-item density="compact" prepend-icon="mdi-trophy">
                                <v-list-item-title class="text-caption">
                                    {{ team.tournament || 'Sin torneo asignado' }}
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item density="compact" prepend-icon="mdi-account-group">
                                <v-list-item-title class="text-caption">
                                    {{ team.playerCount }}/{{ team.maxPlayers }} Jugadores
                                </v-list-item-title>
                            </v-list-item>
                            <v-list-item density="compact" prepend-icon="mdi-calendar">
                                <v-list-item-title class="text-caption">
                                    {{ team.nextMatch || 'Sin partidos programados' }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>

                        <!-- Team Progress -->
                        <div class="mt-3">
                            <div class="d-flex justify-space-between text-caption mb-1">
                                <span>Progreso del equipo</span>
                                <span>{{ team.completionPercentage }}%</span>
                            </div>
                            <v-progress-linear :model-value="team.completionPercentage" color="secondary" height="6"
                                rounded />
                        </div>
                    </v-card-text>

                    <v-divider />

                    <v-card-actions>
                        <v-btn variant="text" color="secondary" @click="viewTeamDetails(team)">
                            Ver Detalles
                        </v-btn>
                        <v-spacer />
                        <v-btn icon="mdi-cog" variant="text" @click="manageTeam(team)" />
                    </v-card-actions>
                </v-card>
            </v-col>

            <!-- Empty State -->
            <v-col v-if="myTeams.length === 0" cols="12">
                <v-card elevation="1" class="text-center pa-8">
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">
                        mdi-account-group-outline
                    </v-icon>
                    <h3 class="text-h6 mb-2">No tienes equipos creados</h3>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                        Crea tu primer equipo para empezar a competir
                    </p>
                    <v-btn color="secondary" prepend-icon="mdi-plus" @click="createNewTeam">
                        Crear Mi Primer Equipo
                    </v-btn>
                </v-card>
            </v-col>
        </v-row>

        <!-- Recent Activity -->
        <v-row class="mt-6" v-if="recentActivity.length > 0">
            <v-col cols="12">
                <v-card elevation="2">
                    <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2" color="info">mdi-clock-outline</v-icon>
                        Actividad Reciente
                    </v-card-title>

                    <v-list>
                        <v-list-item v-for="activity in recentActivity" :key="activity.id"
                            :prepend-icon="activity.icon">
                            <v-list-item-title>{{ activity.title }}</v-list-item-title>
                            <v-list-item-subtitle>
                                {{ activity.team }} • {{ activity.date }}
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Components
import StatsCard from '@/components/common/StatsCard.vue'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Mock Data
const myTeams = ref([
    {
        id: 1,
        name: 'Los Tigres',
        category: 'Masculino',
        status: 'ACTIVE',
        tournament: 'Copa de Verano 2025',
        playerCount: 8,
        maxPlayers: 12,
        nextMatch: '20 Nov - vs Águilas',
        completionPercentage: 67,
        image: 'https://cdn.vuetifyjs.com/images/cards/sunshine.jpg'
    },
    {
        id: 2,
        name: 'Dragones Rojos',
        category: 'Mixto',
        status: 'PENDING',
        tournament: null,
        playerCount: 5,
        maxPlayers: 12,
        nextMatch: null,
        completionPercentage: 42,
        image: 'https://cdn.vuetifyjs.com/images/cards/road.jpg'
    }
])

const recentActivity = ref([
    {
        id: 1,
        icon: 'mdi-account-plus',
        title: 'Juan Pérez se unió al equipo',
        team: 'Los Tigres',
        date: '23 Nov 2025'
    },
    {
        id: 2,
        icon: 'mdi-trophy',
        title: 'Victoria 85-72',
        team: 'Los Tigres',
        date: '20 Nov 2025'
    }
])

// Computed
const captainStats = computed(() => [
    {
        label: 'Equipos Activos',
        value: myTeams.value.filter(t => t.status === 'ACTIVE').length.toString(),
        trend: 'up',
        icon: 'mdi-account-group',
        color: 'secondary'
    },
    {
        label: 'Total Jugadores',
        value: myTeams.value.reduce((sum, t) => sum + t.playerCount, 0).toString(),
        trend: 'up',
        icon: 'mdi-account-multiple',
        color: 'primary'
    },
    {
        label: 'Partidos Programados',
        value: '3',
        trend: 'neutral',
        icon: 'mdi-calendar-check',
        color: 'success'
    },
    {
        label: 'Victorias',
        value: '12',
        trend: 'up',
        icon: 'mdi-trophy',
        color: 'warning'
    }
])

// Methods
const getStatusColor = (status) => {
    const colors = {
        'ACTIVE': 'success',
        'PENDING': 'warning',
        'INACTIVE': 'error'
    }
    return colors[status] || 'grey'
}

const getStatusText = (status) => {
    const texts = {
        'ACTIVE': 'Activo',
        'PENDING': 'Pendiente',
        'INACTIVE': 'Inactivo'
    }
    return texts[status] || status
}

const createNewTeam = () => {
    router.push('/app/tournaments')
}

const viewTeamDetails = (team) => {
    router.push(`/app/captain/team/${team.id}`)
}

const manageTeam = (team) => {
    router.push(`/app/captain/team/${team.id}`)
}

const navigateToRegistration = () => {
    router.push('/app/captain/register-player')
}
</script>

<style scoped>
.captain-dashboard {
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
            rgba(var(--v-theme-secondary), 0.1) 0%,
            rgba(var(--v-theme-primary), 0.1) 100%);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(var(--v-theme-divider), 0.2);
}

.bg-black-opacity {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
}

:deep(.v-card) {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-card:hover) {
    transform: translateY(-2px);
}
</style>
