<template>
  <div class="zone-map" :style="{ height: height + 'px' }">
    <!-- Map Container -->
    <svg :width="width" :height="height" viewBox="0 0 800 600" class="zone-map-svg">
      <!-- Background -->
      <rect width="800" height="600" fill="rgb(var(--v-theme-background))" />

      <!-- Grid Pattern -->
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(var(--v-theme-divider))" stroke-width="0.5"
            opacity="0.3" />
        </pattern>
      </defs>

      <rect width="800" height="600" fill="url(#grid)" opacity="0.5" />

      <!-- Zone Polygons -->
      <g v-for="zone in zones" :key="zone.id">
        <!-- Zone boundary -->
        <path :d="zone.path" :fill="getZoneFillColor(zone)" :stroke="getZoneStrokeColor(zone)" stroke-width="2"
          class="zone-polygon" :class="{ 'zone-hovered': hoveredZone === zone.id }" @mouseenter="onZoneHover(zone.id)"
          @mouseleave="onZoneLeave" @click="onZoneClick(zone)" />

        <!-- Zone label -->
        <text :x="zone.center.x" :y="zone.center.y" text-anchor="middle" dominant-baseline="middle" class="zone-label"
          :class="{ 'zone-label--hovered': hoveredZone === zone.id }">
          {{ zone.name }}
        </text>

        <!-- Zone stats (if interactive) -->
        <text v-if="interactive && zone.stats" :x="zone.center.x" :y="zone.center.y + 15" text-anchor="middle"
          dominant-baseline="middle" class="zone-stats" :class="{ 'zone-stats--hovered': hoveredZone === zone.id }">
          {{ zone.stats }}
        </text>
      </g>

      <!-- Dominance indicators (if showing dominance) -->
      <g v-if="showDominance">
        <circle v-for="indicator in dominanceIndicators" :key="indicator.id" :cx="indicator.x" :cy="indicator.y"
          :r="indicator.radius" :fill="indicator.color" :opacity="indicator.opacity" class="dominance-indicator" />
      </g>

      <!-- Challenge indicators -->
      <g v-if="showChallenges">
        <g v-for="challenge in challengeIndicators" :key="challenge.id"
          :transform="`translate(${challenge.x}, ${challenge.y})`">
          <circle r="8" fill="rgb(var(--v-theme-warning))" class="challenge-indicator" />
          <text text-anchor="middle" dominant-baseline="middle" fill="white" font-size="10" font-weight="bold">
            !
          </text>
        </g>
      </g>
    </svg>

    <!-- Map Controls (if interactive) -->
    <div v-if="interactive && showControls" class="map-controls">
      <v-btn-group variant="outlined" density="compact">
        <v-btn v-for="view in viewModes" :key="view.value"
          :color="currentViewMode === view.value ? 'primary' : undefined" @click="setViewMode(view.value)" size="small">
          <v-icon size="16">{{ view.icon }}</v-icon>
          {{ view.label }}
        </v-btn>
      </v-btn-group>

      <v-btn variant="outlined" size="small" @click="resetView" class="ml-2">
        <v-icon size="16">mdi-refresh</v-icon>
        Reset
      </v-btn>
    </div>

    <!-- Tooltip -->
    <div v-if="tooltip.visible" class="zone-tooltip" :style="{
      left: tooltip.x + 'px',
      top: tooltip.y + 'px'
    }">
      <h4 class="text-subtitle-2 font-weight-bold mb-1">
        {{ tooltip.zone?.name }}
      </h4>

      <div v-if="tooltip.zone?.stats" class="mb-2">
        <p class="text-body-2 mb-1">{{ tooltip.zone.stats }}</p>
      </div>

      <div v-if="tooltip.zone?.dominance">
        <p class="text-caption">
          Dominancia: {{ tooltip.zone.dominance }}%
        </p>
      </div>

      <div v-if="tooltip.zone?.teamCount">
        <p class="text-caption">
          Equipos: {{ tooltip.zone.teamCount }}
        </p>
      </div>

      <v-btn v-if="interactive" variant="outlined" size="x-small" @click="tooltip.visible = false" class="mt-2">
        Cerrar
      </v-btn>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="map-loading">
      <v-progress-circular indeterminate color="primary" size="32" />
      <p class="text-body-2 mt-2">Cargando mapa...</p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && zones.length === 0" class="map-empty">
      <v-icon size="48" color="grey-lighten-1">mdi-map-outline</v-icon>
      <p class="text-body-2 text-medium-emphasis mt-2">
        No hay zonas para mostrar
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// Props
const props = defineProps({
  zones: {
    type: Array,
    default: () => []
  },
  interactive: {
    type: Boolean,
    default: true
  },
  showControls: {
    type: Boolean,
    default: true
  },
  showDominance: {
    type: Boolean,
    default: true
  },
  showChallenges: {
    type: Boolean,
    default: false
  },
  height: {
    type: Number,
    default: 300
  },
  width: {
    type: Number,
    default: 800
  },
  viewMode: {
    type: String,
    default: 'default'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['zone-click', 'zone-hover', 'view-mode-change'])

// Reactive state
const hoveredZone = ref(null)
const currentViewMode = ref(props.viewMode)
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  zone: null
})

// View modes configuration
const viewModes = [
  {
    value: 'default',
    label: 'Mapa',
    icon: 'mdi-map'
  },
  {
    value: 'dominance',
    label: 'Dominación',
    icon: 'mdi-crown'
  },
  {
    value: 'challenges',
    label: 'Desafíos',
    icon: 'mdi-sword-cross'
  }
]

// Computed
const dominanceIndicators = computed(() => {
  return props.zones
    .filter(zone => zone.dominance && zone.dominance > 50)
    .map(zone => ({
      id: zone.id,
      x: zone.center.x,
      y: zone.center.y,
      radius: Math.max(10, zone.dominance / 5),
      color: zone.dominantTeamColor || (zone.controlledByPlayer ? 'rgb(var(--v-theme-primary))' : 'rgb(var(--v-theme-secondary))'),
      opacity: 0.3 + (zone.dominance / 100) * 0.4
    }))
})

const challengeIndicators = computed(() => {
  return props.zones
    .filter(zone => zone.hasActiveChallenge)
    .map(zone => ({
      id: zone.id,
      x: zone.center.x,
      y: zone.center.y - 20
    }))
})

// Methods
const getZoneFillColor = (zone) => {
  // If view mode is dominance, color by the dominant team
  if (currentViewMode.value === 'dominance') {
    if (zone.dominantTeamColor) {
      // Use the team's color with some transparency
      return zone.dominantTeamColor.replace('rgb', 'rgba').replace(')', ', 0.6)')
    }

    if (zone.dominance > 70) return 'rgba(var(--v-theme-primary), 0.7)'
    if (zone.dominance >= 30 && zone.dominance <= 70) {
      return 'rgba(var(--v-theme-warning), 0.5)'
    }
    return 'rgba(var(--v-theme-secondary), 0.4)'
  }

  if (currentViewMode.value === 'challenges') {
    if (zone.hasActiveChallenge) return 'rgba(var(--v-theme-error), 0.6)'
    if (zone.hasPendingChallenge) return 'rgba(var(--v-theme-warning), 0.5)'
  }

  // Default view: color by dominant team if available, otherwise default
  if (zone.dominantTeamColor) {
    return zone.dominantTeamColor.replace('rgb', 'rgba').replace(')', ', 0.4)')
  }

  return 'rgba(var(--v-theme-surface), 0.3)'
}

const getZoneStrokeColor = (zone) => {
  if (hoveredZone.value === zone.id) {
    return 'rgb(var(--v-theme-primary))'
  }
  if (zone.dominantTeamColor) {
    return zone.dominantTeamColor
  }
  return 'rgb(var(--v-theme-divider))'
}

const onZoneHover = (zoneId) => {
  hoveredZone.value = zoneId
  const zone = props.zones.find(z => z.id === zoneId)

  if (zone && props.interactive) {
    tooltip.value = {
      visible: true,
      x: zone.center.x + 20,
      y: zone.center.y - 20,
      zone
    }

    emit('zone-hover', zone)
  }
}

const onZoneLeave = () => {
  hoveredZone.value = null
  tooltip.value.visible = false
}

const onZoneClick = (zone) => {
  if (!props.interactive) return

  emit('zone-click', zone)
}

const setViewMode = (mode) => {
  currentViewMode.value = mode
  emit('view-mode-change', mode)
}

const resetView = () => {
  currentViewMode.value = 'default'
  emit('view-mode-change', 'default')
  tooltip.value.visible = false
}

// Watch for external view mode changes
watch(() => props.viewMode, (newMode) => {
  if (newMode !== currentViewMode.value) {
    currentViewMode.value = newMode
  }
})

// Generate default zones if none provided
onMounted(() => {
  if (props.zones.length === 0) {
    // Create some default zones for demonstration
    const defaultZones = [
      {
        id: 'zone-1',
        name: 'Zona Norte',
        path: 'M 100 100 L 300 100 L 300 250 L 100 250 Z',
        center: { x: 200, y: 175 },
        dominance: 85,
        dominantTeam: 'Los Tigres',
        dominantTeamColor: 'rgb(var(--v-theme-primary))', // Orange
        controlledByPlayer: true,
        stats: 'Dominado por Los Tigres',
        teamCount: 12
      },
      {
        id: 'zone-2',
        name: 'Zona Sur',
        path: 'M 100 300 L 300 300 L 300 450 L 100 450 Z',
        center: { x: 200, y: 375 },
        dominance: 60,
        dominantTeam: 'Águilas Doradas',
        dominantTeamColor: 'rgb(var(--v-theme-secondary))', // Blue
        controlledByPlayer: false,
        stats: 'Dominado por Águilas',
        teamCount: 8
      },
      {
        id: 'zone-3',
        name: 'Zona Este',
        path: 'M 350 100 L 550 100 L 550 450 L 350 450 Z',
        center: { x: 450, y: 275 },
        dominance: 40,
        dominantTeam: 'Los Rayos',
        dominantTeamColor: 'rgb(var(--v-theme-warning))', // Yellow
        controlledByPlayer: false,
        stats: 'Disputado',
        teamCount: 15
      }
    ]

    // Note: In a real implementation, you'd emit an event to update the zones
    console.log('Default zones generated:', defaultZones)
  }
})
</script>

<style scoped>
.zone-map {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.zone-map-svg {
  width: 100%;
  height: 100%;
}

.zone-polygon {
  transition: all 0.3s ease;
  cursor: pointer;
}

.zone-polygon:hover {
  filter: brightness(1.2);
}

.zone-polygon.zone-hovered {
  filter: brightness(1.3);
  stroke-width: 3;
}

.zone-label {
  fill: rgb(var(--v-theme-text-primary));
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.zone-label.zone-label--hovered {
  fill: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.zone-stats {
  fill: rgb(var(--v-theme-text-secondary));
  font-size: 11px;
  pointer-events: none;
}

.zone-stats--hovered {
  fill: rgb(var(--v-theme-primary));
}

.dominance-indicator {
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.challenge-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(var(--v-theme-surface), 0.95);
  padding: 8px;
  border-radius: 8px;
  backdrop-filter: blur(8px);
}

.zone-tooltip {
  position: absolute;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-divider));
  border-radius: 8px;
  padding: 12px;
  min-width: 150px;
  max-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  pointer-events: none;
}

.map-loading,
.map-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgb(var(--v-theme-text-secondary));
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .zone-label {
    font-size: 12px;
  }

  .zone-stats {
    font-size: 10px;
  }

  .map-controls {
    position: relative;
    margin-top: 16px;
    justify-content: center;
  }
}
</style>