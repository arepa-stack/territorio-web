<template>
    <div class="player-stats">
        <!-- Filters -->
        <v-card class="mb-6" elevation="1">
            <v-card-text>
                <v-row align="center">
                    <v-col cols="12" sm="4">
                        <v-select v-model="selectedSeason" :items="seasons" label="Temporada" hide-details
                            density="compact" variant="outlined" prepend-inner-icon="mdi-calendar-range" />
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-select v-model="selectedTournament" :items="tournaments" label="Torneo" hide-details
                            density="compact" variant="outlined" prepend-inner-icon="mdi-trophy" />
                    </v-col>
                    <v-col cols="12" sm="4" class="text-end">
                        <v-btn color="primary" variant="tonal" prepend-icon="mdi-download" @click="exportStats">
                            Exportar
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Key Metrics -->
        <v-row class="mb-6">
            <v-col cols="12" sm="6" md="3" v-for="stat in keyStats" :key="stat.label">
                <v-card elevation="2" class="h-100">
                    <v-card-text class="text-center">
                        <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-2">
                            {{ stat.label }}
                        </div>
                        <div class="text-h3 font-weight-bold text-primary mb-1">
                            {{ stat.value }}
                        </div>
                        <div class="d-flex align-center justify-center">
                            <v-icon :color="stat.trend === 'up' ? 'success' : 'error'" size="small" class="mr-1">
                                {{ stat.trend === 'up' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                            </v-icon>
                            <span :class="`text-${stat.trend === 'up' ? 'success' : 'error'} text-caption`">
                                {{ stat.trendValue }} vs media
                            </span>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Charts Section -->
        <v-row>
            <!-- Points History -->
            <v-col cols="12" lg="8">
                <v-card elevation="2" class="mb-6">
                    <v-card-title>Historial de Puntos</v-card-title>
                    <v-card-text>
                        <div class="chart-container" style="height: 300px; position: relative;">
                            <!-- Placeholder for Chart.js -->
                            <div class="d-flex align-center justify-center h-100 bg-surface-variant rounded">
                                <span class="text-medium-emphasis">Gráfico de Puntos por Partido</span>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Shot Accuracy -->
            <v-col cols="12" lg="4">
                <v-card elevation="2" class="mb-6 h-100">
                    <v-card-title>Efectividad de Tiro</v-card-title>
                    <v-card-text>
                        <div class="d-flex flex-column gap-4">
                            <div v-for="shot in shotStats" :key="shot.type">
                                <div class="d-flex justify-space-between mb-1">
                                    <span class="text-body-2">{{ shot.type }}</span>
                                    <span class="text-body-2 font-weight-bold">{{ shot.percentage }}%</span>
                                </div>
                                <v-progress-linear :model-value="shot.percentage" :color="shot.color" height="8"
                                    rounded />
                                <div class="text-caption text-medium-emphasis mt-1">
                                    {{ shot.made }}/{{ shot.attempted }} anotados
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Detailed Table -->
        <v-card elevation="2">
            <v-card-title class="d-flex align-center">
                Desglose por Partido
                <v-spacer />
                <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Buscar partido" single-line
                    hide-details density="compact" variant="outlined" style="max-width: 300px" />
            </v-card-title>

            <v-data-table :headers="headers" :items="matchStats" :search="search" hover>
                <template #item.result="{ item }">
                    <v-chip :color="item.result === 'W' ? 'success' : 'error'" size="small" variant="flat">
                        {{ item.result }}
                    </v-chip>
                </template>

                <template #item.points="{ item }">
                    <span class="font-weight-bold">{{ item.points }}</span>
                </template>
            </v-data-table>
        </v-card>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

// Filters
const selectedSeason = ref('2025')
const selectedTournament = ref('all')
const search = ref('')

const seasons = ['2025', '2024', '2023']
const tournaments = [
    { title: 'Todos los torneos', value: 'all' },
    { title: 'Copa de Verano', value: 'summer' },
    { title: 'Liga Regional', value: 'regional' }
]

// Mock Data
const keyStats = [
    { label: 'PPG', value: '18.5', trend: 'up', trendValue: '+2.1' },
    { label: 'RPG', value: '7.2', trend: 'up', trendValue: '+0.5' },
    { label: 'APG', value: '4.8', trend: 'down', trendValue: '-0.2' },
    { label: 'EFF', value: '21.4', trend: 'up', trendValue: '+1.8' }
]

const shotStats = [
    { type: 'Tiros de Campo (FG)', percentage: 48, made: 145, attempted: 302, color: 'primary' },
    { type: 'Triples (3PT)', percentage: 35, made: 42, attempted: 120, color: 'secondary' },
    { type: 'Tiros Libres (FT)', percentage: 82, made: 58, attempted: 71, color: 'success' }
]

const headers = [
    { title: 'Fecha', key: 'date', align: 'start' },
    { title: 'Oponente', key: 'opponent' },
    { title: 'Resultado', key: 'result' },
    { title: 'MIN', key: 'minutes' },
    { title: 'PTS', key: 'points' },
    { title: 'REB', key: 'rebounds' },
    { title: 'AST', key: 'assists' },
    { title: 'STL', key: 'steals' },
    { title: 'BLK', key: 'blocks' }
]

const matchStats = [
    {
        id: 1,
        date: '2025-11-20',
        opponent: 'Águilas Doradas',
        result: 'W',
        minutes: 32,
        points: 24,
        rebounds: 8,
        assists: 5,
        steals: 2,
        blocks: 1
    },
    {
        id: 2,
        date: '2025-11-15',
        opponent: 'Los Rayos',
        result: 'L',
        minutes: 28,
        points: 16,
        rebounds: 6,
        assists: 3,
        steals: 1,
        blocks: 0
    },
    // Add more mock data as needed
]

const exportStats = () => {
    toast.success('Descargando reporte PDF...')
}
</script>

<style scoped>
.gap-4 {
    gap: 16px;
}
</style>
