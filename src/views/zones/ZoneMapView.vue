<template>
    <div class="zone-map-view">
        <!-- Header -->
        <div class="map-header mb-4">
            <v-row align="center">
                <v-col cols="12" md="8">
                    <h1 class="text-h4 font-weight-bold mb-1">Mapa de Zonas</h1>
                    <p class="text-body-1 text-medium-emphasis">
                        Visualiza las zonas geográficas y los equipos dominantes
                    </p>
                </v-col>
                <v-col cols="12" md="4" class="text-md-end">
                    <v-btn-group variant="outlined">
                        <v-btn @click="viewMode = 'dominance'"
                            :color="viewMode === 'dominance' ? 'primary' : undefined">
                            <v-icon start>mdi-crown</v-icon>
                            Dominancia
                        </v-btn>
                        <v-btn @click="viewMode = 'tournaments'"
                            :color="viewMode === 'tournaments' ? 'primary' : undefined">
                            <v-icon start>mdi-trophy</v-icon>
                            Torneos
                        </v-btn>
                    </v-btn-group>
                </v-col>
            </v-row>
        </div>

        <!-- Map Container -->
        <v-card elevation="2" class="map-container">
            <div id="map" style="height: 600px; width: 100%;"></div>
        </v-card>

        <!-- Legend -->
        <v-card elevation="2" class="mt-4">
            <v-card-title>Leyenda</v-card-title>
            <v-card-text>
                <v-row>
                    <v-col v-for="zone in zones" :key="zone.id" cols="12" sm="6" md="4">
                        <div class="d-flex align-center">
                            <div class="legend-color mr-2" :style="{ backgroundColor: zone.color }"></div>
                            <div>
                                <div class="font-weight-bold">{{ zone.name }}</div>
                                <div class="text-caption text-medium-emphasis">
                                    Dominado por: {{ zone.dominantTeam }}
                                </div>
                            </div>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Zone Details Dialog -->
        <v-dialog v-model="showZoneDialog" max-width="500">
            <v-card v-if="selectedZone">
                <v-card-title class="d-flex align-center">
                    <div class="legend-color mr-2" :style="{ backgroundColor: selectedZone.color }"></div>
                    {{ selectedZone.name }}
                </v-card-title>
                <v-card-text>
                    <v-list>
                        <v-list-item>
                            <v-list-item-title>Equipo Dominante</v-list-item-title>
                            <v-list-item-subtitle>{{ selectedZone.dominantTeam }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-title>Torneos Activos</v-list-item-title>
                            <v-list-item-subtitle>{{ selectedZone.tournaments.length }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-title>Equipos Registrados</v-list-item-title>
                            <v-list-item-subtitle>{{ selectedZone.teamCount }}</v-list-item-subtitle>
                        </v-list-item>
                    </v-list>

                    <v-divider class="my-4" />

                    <h4 class="text-subtitle-1 mb-2">Torneos en esta zona:</h4>
                    <v-chip v-for="tournament in selectedZone.tournaments" :key="tournament" size="small"
                        class="mr-2 mb-2">
                        {{ tournament }}
                    </v-chip>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="showZoneDialog = false">Cerrar</v-btn>
                    <v-btn color="primary" @click="viewTournaments">Ver Torneos</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const viewMode = ref('dominance')
const showZoneDialog = ref(false)
const selectedZone = ref(null)
let map = null
let polygonLayers = []

// Mock zone data with geographic coordinates
const zones = ref([
    {
        id: 1,
        name: 'Zona Norte',
        dominantTeam: 'Los Tigres',
        color: '#FF5F1F', // Orange
        teamCount: 12,
        tournaments: ['Copa de Verano 2025', 'Liga Apertura'],
        coordinates: [
            [18.48, -69.88],
            [18.52, -69.88],
            [18.52, -69.92],
            [18.48, -69.92]
        ]
    },
    {
        id: 2,
        name: 'Zona Sur',
        dominantTeam: 'Águilas Doradas',
        color: '#007BFF', // Blue
        teamCount: 8,
        tournaments: ['Torneo Regional'],
        coordinates: [
            [18.44, -69.88],
            [18.48, -69.88],
            [18.48, -69.92],
            [18.44, -69.92]
        ]
    },
    {
        id: 3,
        name: 'Zona Este',
        dominantTeam: 'Los Rayos',
        color: '#FFC107', // Yellow/Gold
        teamCount: 15,
        tournaments: ['Copa del Este', 'Liga Municipal'],
        coordinates: [
            [18.46, -69.84],
            [18.50, -69.84],
            [18.50, -69.88],
            [18.46, -69.88]
        ]
    },
    {
        id: 4,
        name: 'Zona Oeste',
        dominantTeam: 'Huracanes FC',
        color: '#28A745', // Green
        teamCount: 10,
        tournaments: ['Torneo de Campeones'],
        coordinates: [
            [18.46, -69.92],
            [18.50, -69.92],
            [18.50, -69.96],
            [18.46, -69.96]
        ]
    }
])

onMounted(() => {
    initializeMap()
})

watch(viewMode, () => {
    updatePolygons()
})

const initializeMap = () => {
    // Initialize map centered on Santo Domingo, Dominican Republic
    map = L.map('map').setView([18.4861, -69.9312], 12)

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Draw zone polygons
    drawZones()
}

const drawZones = () => {
    zones.value.forEach(zone => {
        const polygon = L.polygon(zone.coordinates, {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.4,
            weight: 3
        }).addTo(map)

        // Add click event
        polygon.on('click', () => {
            selectedZone.value = zone
            showZoneDialog.value = true
        })

        // Add hover effect
        polygon.on('mouseover', function () {
            this.setStyle({
                fillOpacity: 0.6,
                weight: 4
            })
        })

        polygon.on('mouseout', function () {
            this.setStyle({
                fillOpacity: 0.4,
                weight: 3
            })
        })

        // Add popup with zone info
        polygon.bindPopup(`
      <div style="text-align: center;">
        <h3 style="margin: 0 0 8px 0; color: ${zone.color};">${zone.name}</h3>
        <p style="margin: 4px 0;"><strong>Equipo Dominante:</strong><br/>${zone.dominantTeam}</p>
        <p style="margin: 4px 0;"><strong>Equipos:</strong> ${zone.teamCount}</p>
        <p style="margin: 4px 0;"><strong>Torneos:</strong> ${zone.tournaments.length}</p>
      </div>
    `)

        polygonLayers.push(polygon)
    })
}

const updatePolygons = () => {
    if (viewMode.value === 'tournaments') {
        // Could show tournament markers instead of team dominance
        polygonLayers.forEach((polygon, index) => {
            polygon.setStyle({
                fillOpacity: 0.3
            })
        })
    } else {
        // Show team dominance colors
        polygonLayers.forEach((polygon, index) => {
            polygon.setStyle({
                fillOpacity: 0.4
            })
        })
    }
}

const viewTournaments = () => {
    showZoneDialog.value = false
    router.push('/app/tournaments')
}
</script>

<style scoped>
.zone-map-view {
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

.map-header {
    background: linear-gradient(135deg,
            rgba(var(--v-theme-primary), 0.1) 0%,
            rgba(var(--v-theme-secondary), 0.1) 100%);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(var(--v-theme-divider), 0.2);
}

.map-container {
    overflow: hidden;
    border-radius: 12px;
}

.legend-color {
    width: 30px;
    height: 30px;
    border-radius: 4px;
    border: 2px solid rgba(0, 0, 0, 0.2);
}

#map {
    border-radius: 12px;
}

/* Fix Leaflet default icon paths */
:deep(.leaflet-container) {
    font-family: inherit;
}
</style>
