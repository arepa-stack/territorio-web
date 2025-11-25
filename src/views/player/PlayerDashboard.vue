<template>
  <div class="player-dashboard">
    <!-- Welcome Header -->
    <div class="welcome-section mb-6">
      <v-row>
        <v-col cols="12" md="8">
          <div class="d-flex align-center">
            <v-avatar size="80" color="primary" class="mr-4 elevation-4">
              <v-icon color="white" size="40">
                mdi-basketball
              </v-icon>
            </v-avatar>

            <div>
              <h1 class="text-h3 font-weight-bold mb-1">
                ¡Hola, {{ authStore.userName }}! 🏀
              </h1>
              <p class="text-h6 text-medium-emphasis">
                Bienvenido a tu dashboard de jugador
              </p>
              <v-chip :color="getZoneStatusColor()" variant="tonal" size="small" class="mt-2">
                <v-icon start>mdi-map-marker</v-icon>
                {{ getZoneStatusText() }}
              </v-chip>
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="4" class="text-md-end">
          <div class="d-flex flex-column align-md-end gap-2">
            <v-btn variant="outlined" prepend-icon="mdi-account-edit" @click="navigateToProfile">
              Editar Perfil
            </v-btn>
            <v-btn color="primary" prepend-icon="mdi-calendar" @click="navigateToSchedule">
              Mi Calendario
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Quick Stats Cards -->
    <v-row class="stats-section mb-6">
      <v-col v-for="stat in playerStats" :key="stat.label" cols="12" sm="6" lg="3">
        <StatsCard :title="stat.label" :value="stat.value" :trend="stat.trend" :icon="stat.icon" :color="stat.color" />
      </v-col>
    </v-row>

    <!-- Main Content Grid -->
    <v-row>
      <!-- Current Teams -->
      <v-col cols="12" lg="6">
        <v-card class="h-100" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-account-group</v-icon>
            Mis Equipos Actuales
            <v-spacer />
            <v-btn variant="text" size="small" @click="navigateToTeams">
              Ver todos
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <div v-if="currentTeams.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">
                mdi-account-group-outline
              </v-icon>
              <p class="text-body-1 text-medium-emphasis">
                No estás registrado en ningún equipo actualmente
              </p>
              <v-btn color="primary" variant="outlined" @click="navigateToTeams" class="mt-2">
                Explorar Equipos
              </v-btn>
            </div>

            <div v-else class="teams-grid">
              <v-card v-for="team in currentTeams" :key="team.id" variant="outlined" class="mb-3"
                @click="navigateToTeam(team)">
                <v-card-text class="d-flex align-center">
                  <v-avatar size="40" :color="getTeamColor(team.id)" class="mr-3">
                    <v-icon color="white">{{ getTeamIcon(team) }}</v-icon>
                  </v-avatar>

                  <div class="flex-grow-1">
                    <h4 class="text-h6 font-weight-medium">
                      {{ team.name }}
                    </h4>
                    <p class="text-body-2 text-medium-emphasis">
                      {{ team.tournament?.name }}
                    </p>
                    <div class="d-flex align-center mt-1">
                      <v-chip size="x-small" :color="getZoneColor(team.tournament?.zone)" variant="tonal" class="mr-2">
                        {{ team.tournament?.zone?.name }}
                      </v-chip>
                      <v-chip size="x-small" :color="getStatusColor(team.status)" variant="tonal">
                        {{ getStatusText(team.status) }}
                      </v-chip>
                    </div>
                  </div>

                  <v-icon color="primary">mdi-chevron-right</v-icon>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Upcoming Matches -->
      <v-col cols="12" lg="6">
        <v-card class="h-100" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="success">mdi-calendar-clock</v-icon>
            Próximos Partidos
            <v-spacer />
            <v-btn variant="text" size="small" @click="navigateToSchedule">
              Ver calendario
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <div v-if="upcomingMatches.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">
                mdi-calendar-blank
              </v-icon>
              <p class="text-body-1 text-medium-emphasis">
                No tienes partidos programados
              </p>
            </div>

            <div v-else class="matches-list">
              <v-card v-for="match in upcomingMatches.slice(0, 4)" :key="match.id" variant="outlined" class="mb-3"
                @click="navigateToMatch(match)">
                <v-card-text>
                  <div class="d-flex align-center">
                    <div class="flex-grow-1">
                      <h4 class="text-subtitle-1 font-weight-medium">
                        {{ match.homeTeam.name }} vs {{ match.awayTeam.name }}
                      </h4>
                      <p class="text-body-2 text-medium-emphasis">
                        {{ formatMatchDate(match.date) }}
                      </p>
                      <div class="d-flex align-center mt-2">
                        <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                        <span class="text-caption">
                          {{ match.venue?.name }}
                        </span>
                      </div>
                    </div>

                    <div class="text-center">
                      <div class="text-h6 font-weight-bold text-primary">
                        {{ formatMatchTime(match.date) }}
                      </div>
                      <v-chip size="small" :color="getMatchStatusColor(match.status)" variant="tonal">
                        {{ getMatchStatusText(match.status) }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Zone Map Section -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="warning">mdi-map</v-icon>
            Zonas donde Participas
            <v-spacer />
            <v-btn variant="text" size="small" @click="navigateToZones">
              Ver mapa completo
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <div v-if="playerZones.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">
                mdi-map-outline
              </v-icon>
              <p class="text-body-1 text-medium-emphasis">
                No participates en ninguna zona actualmente
              </p>
            </div>

            <div v-else>
              <div class="zone-map-container mb-4">
                <!-- Simplified Zone Map Component -->
                <ZoneMap :zones="playerZones" :interactive="false" :show-controls="false" :height="200" />
              </div>

              <div class="d-flex flex-wrap gap-3">
                <v-chip v-for="zone in playerZones" :key="zone.id" :color="getZoneColor(zone)" variant="tonal"
                  prepend-icon="mdi-map-marker">
                  {{ zone.name }} ({{ zone.teamCount }} equipos)
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Performance Chart Section -->
    <v-row class="mt-6">
      <v-col cols="12" lg="8">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="info">mdi-chart-line</v-icon>
            Rendimiento en la Temporada
          </v-card-title>

          <v-card-text>
            <PerformanceChart :stats="performanceStats" :height="220" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="success">mdi-trophy</v-icon>
            Logros Recientes
          </v-card-title>

          <v-card-text>
            <div v-if="recentAchievements.length === 0" class="text-center py-8">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">
                mdi-trophy-outline
              </v-icon>
              <p class="text-body-2 text-medium-emphasis">
                Aún no tienes logros
              </p>
            </div>

            <div v-else>
              <v-list density="compact">
                <v-list-item v-for="achievement in recentAchievements" :key="achievement.id" class="px-0">
                  <template #prepend>
                    <v-icon :color="achievement.color" size="20">
                      {{ achievement.icon }}
                    </v-icon>
                  </template>

                  <v-list-item-title class="text-body-2">
                    {{ achievement.title }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="text-caption">
                    {{ achievement.date }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card elevation="1" class="text-center pa-4">
          <h3 class="text-h6 mb-3">Acciones Rápidas</h3>

          <div class="d-flex flex-wrap justify-center gap-3">
            <v-btn variant="outlined" prepend-icon="mdi-account-search" @click="navigateToSearchTeams">
              Buscar Equipos
            </v-btn>

            <v-btn variant="outlined" prepend-icon="mdi-chart-bar" @click="navigateToStats">
              Ver Estadísticas
            </v-btn>

            <v-btn variant="outlined" prepend-icon="mdi-bell" @click="navigateToNotifications">
              Notificaciones
            </v-btn>

            <v-btn variant="outlined" prepend-icon="mdi-help-circle" @click="navigateToHelp">
              Ayuda
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Components
import StatsCard from '@/components/common/StatsCard.vue'
import ZoneMap from '@/components/zones/ZoneMap.vue'
import PerformanceChart from '@/components/charts/PerformanceChart.vue'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()
const toast = useToast()

// Reactive state
const currentTeams = ref([])
const upcomingMatches = ref([])
const playerZones = ref([])
const performanceStats = ref({})
const recentAchievements = ref([])

// Computed
const playerStats = computed(() => {
  return [
    {
      label: 'Puntos Promedio',
      value: '18.5',
      trend: 'up',
      icon: 'mdi-basketball',
      color: 'primary'
    },
    {
      label: 'Rebotes',
      value: '7.2',
      trend: 'up',
      icon: 'mdi-circle',
      color: 'secondary'
    },
    {
      label: 'Asistencias',
      value: '4.8',
      trend: 'neutral',
      icon: 'mdi-hand-extended',
      color: 'success'
    },
    {
      label: 'Equipos Activos',
      value: currentTeams.value.length.toString(),
      trend: 'up',
      icon: 'mdi-account-group',
      color: 'warning'
    }
  ]
})

// Methods
const fetchDashboardData = async () => {
  try {
    // Fetch player profile and stats
    const profileResult = await playerStore.getPlayerStats()
    if (profileResult.success) {
      // Process player stats
      performanceStats.value = profileResult.data
    }

    // Mock data for now - in real implementation, fetch from API
    currentTeams.value = [
      {
        id: '1',
        name: 'Los Tigres',
        tournament: {
          name: 'Copa de Verano 2025',
          zone: { id: '1', name: 'Zona Norte' }
        },
        status: 'ACTIVE'
      },
      {
        id: '2',
        name: 'Águilas Doradas',
        tournament: {
          name: 'Torneo de Campeones',
          zone: { id: '2', name: 'Zona Sur' }
        },
        status: 'ACTIVE'
      }
    ]

    upcomingMatches.value = [
      {
        id: '1',
        homeTeam: { name: 'Los Tigres' },
        awayTeam: { name: 'Águilas' },
        date: new Date('2025-11-20T15:00:00'),
        venue: { name: 'Cancha Central' },
        status: 'SCHEDULED'
      }
    ]

    playerZones.value = [
      {
        id: 'zone-1',
        name: 'Zona Norte',
        path: 'M 100 100 L 300 100 L 300 250 L 100 250 Z',
        center: { x: 200, y: 175 },
        dominance: 85,
        teamCount: 2
      },
      {
        id: 'zone-2',
        name: 'Zona Sur',
        path: 'M 100 300 L 300 300 L 300 450 L 100 450 Z',
        center: { x: 200, y: 375 },
        dominance: 60,
        teamCount: 1
      }
    ]

    recentAchievements.value = [
      {
        id: '1',
        title: '20 puntos en un partido',
        date: '18 Nov 2025',
        icon: 'mdi-star',
        color: 'warning'
      }
    ]

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    toast.error('Error al cargar los datos del dashboard')
  }
}

// Navigation methods
const navigateToProfile = () => {
  router.push('/app/player/profile')
}

const navigateToTeams = () => {
  router.push('/app/player/teams')
}

const navigateToSchedule = () => {
  router.push('/app/player/schedule')
}

const navigateToZones = () => {
  router.push('/app/organizer/zones') // Assuming zones management
}

const navigateToStats = () => {
  router.push('/app/player/stats')
}

const navigateToSearchTeams = () => {
  router.push('/tournaments')
}

const navigateToNotifications = () => {
  router.push('/app/profile') // Notifications section
}

const navigateToHelp = () => {
  toast.info('Centro de ayuda próximamente')
}

const navigateToTeam = (team) => {
  router.push(`/app/captain/team/${team.id}`)
}

const navigateToMatch = (match) => {
  router.push(`/matches/${match.id}`)
}

// Helper methods
const getZoneStatusColor = () => {
  return playerZones.value.length > 0 ? 'success' : 'warning'
}

const getZoneStatusText = () => {
  return playerZones.value.length > 0
    ? `${playerZones.value.length} zona(s) activa(s)`
    : 'Sin zonas activas'
}

const getTeamColor = (teamId) => {
  const colors = ['primary', 'secondary', 'success', 'warning', 'error']
  return colors[teamId % colors.length]
}

const getTeamIcon = (team) => {
  return 'mdi-account-group'
}

const getZoneColor = (zone) => {
  return 'primary'
}

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

const getMatchStatusColor = (status) => {
  const colors = {
    'SCHEDULED': 'info',
    'IN_PROGRESS': 'warning',
    'FINISHED': 'success'
  }
  return colors[status] || 'grey'
}

const getMatchStatusText = (status) => {
  const texts = {
    'SCHEDULED': 'Programado',
    'IN_PROGRESS': 'En Progreso',
    'FINISHED': 'Finalizado'
  }
  return texts[status] || status
}

const formatMatchDate = (date) => {
  return format(new Date(date), "EEEE d 'de' MMMM", { locale: es })
}

// Lifecycle
onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.player-dashboard {
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

.stats-section {
  margin-bottom: 32px;
}

.teams-grid {
  max-height: 400px;
  overflow-y: auto;
}

.matches-list {
  max-height: 350px;
  overflow-y: auto;
}

.zone-map-container {
  border-radius: 8px;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 0.5);
}

/* Card hover effects */
:deep(.v-card) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-card:hover) {
  transform: translateY(-2px);
}

/* List styling */
:deep(.v-list-item) {
  padding: 8px 0;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .welcome-section {
    text-align: center;
  }

  .d-flex.align-md-end {
    align-items: center;
  }

  .d-flex.flex-column.align-md-end {
    flex-direction: row;
    justify-content: center;
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .player-dashboard {
    padding: 0;
  }

  .d-flex.flex-wrap.justify-center {
    gap: 8px;
  }

  .d-flex.flex-column.align-md-end {
    flex-direction: column;
  }
}
</style>