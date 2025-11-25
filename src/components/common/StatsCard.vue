<template>
  <v-card
    :elevation="elevation"
    class="stats-card"
    :class="{ 'stats-card--hover': hoverable }"
  >
    <v-card-text class="pa-4">
      <div class="d-flex align-center">
        <div class="flex-grow-1">
          <p class="text-caption text-medium-emphasis font-weight-medium mb-1">
            {{ title }}
          </p>
          <h3 class="text-h4 font-weight-bold mb-1">
            {{ formattedValue }}
          </h3>
          
          <!-- Trend Indicator -->
          <div v-if="trend && trend !== 'neutral'" class="d-flex align-center">
            <v-icon
              :color="getTrendColor()"
              size="16"
              class="mr-1"
            >
              {{ getTrendIcon() }}
            </v-icon>
            <span
              :class="`text-${getTrendColor()}`"
              class="text-caption font-weight-medium"
            >
              {{ getTrendText() }}
            </span>
          </div>
          
          <!-- Subtitle -->
          <p v-if="subtitle" class="text-caption text-medium-emphasis mt-1">
            {{ subtitle }}
          </p>
        </div>
        
        <!-- Icon -->
        <div
          class="stats-icon"
          :class="[`stats-icon--${color}`, { 'stats-icon--large': size === 'large' }]"
        >
          <v-icon
            :color="color === 'white' ? 'primary' : color"
            :size="size === 'large' ? 32 : 24"
          >
            {{ icon }}
          </v-icon>
        </div>
      </div>
      
      <!-- Progress Bar (optional) -->
      <div v-if="progress !== undefined" class="mt-3">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-medium-emphasis">Progreso</span>
          <span class="text-caption font-weight-medium">
            {{ progress }}%
          </span>
        </div>
        <v-progress-linear
          :model-value="progress"
          :color="color"
          height="6"
          rounded
        />
      </div>
    </v-card-text>
    
    <!-- Action Button (optional) -->
    <v-card-actions v-if="actionText" class="pa-4 pt-0">
      <v-btn
        variant="text"
        size="small"
        :color="color"
        @click="$emit('click-action')"
      >
        {{ actionText }}
        <v-icon end size="16">{{ actionIcon || 'mdi-arrow-right' }}</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'primary'
  },
  trend: {
    type: String,
    validator: (value) => ['up', 'down', 'neutral', null, undefined].includes(value),
    default: null
  },
  trendValue: {
    type: [String, Number],
    default: null
  },
  subtitle: {
    type: String,
    default: null
  },
  progress: {
    type: Number,
    default: null
  },
  actionText: {
    type: String,
    default: null
  },
  actionIcon: {
    type: String,
    default: null
  },
  elevation: {
    type: Number,
    default: 2
  },
  size: {
    type: String,
    validator: (value) => ['normal', 'large'].includes(value),
    default: 'normal'
  },
  hoverable: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['click-action'])

// Computed
const formattedValue = computed(() => {
  if (props.loading) return '...'
  
  if (typeof props.value === 'number') {
    // Format numbers with thousands separators
    return new Intl.NumberFormat('es-ES').format(props.value)
  }
  
  return props.value
})

const getTrendColor = () => {
  if (props.trend === 'up') return 'success'
  if (props.trend === 'down') return 'error'
  return 'grey'
}

const getTrendIcon = () => {
  if (props.trend === 'up') return 'mdi-trending-up'
  if (props.trend === 'down') return 'mdi-trending-down'
  return 'mdi-minus'
}

const getTrendText = () => {
  if (!props.trendValue) {
    return props.trend === 'up' ? 'En alza' : 
           props.trend === 'down' ? 'A la baja' : 'Sin cambios'
  }
  
  const prefix = props.trend === 'up' ? '+' : 
                props.trend === 'down' ? '-' : ''
  
  return `${prefix}${props.trendValue}`
}
</script>

<style scoped>
.stats-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.stats-card--hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  transition: all 0.3s ease;
}

.stats-icon--large {
  width: 64px;
  height: 64px;
}

.stats-icon--primary {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.stats-icon--secondary {
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
}

.stats-icon--success {
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
}

.stats-icon--warning {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
}

.stats-icon--error {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}

.stats-icon--info {
  background: rgba(var(--v-theme-info), 0.1);
  color: rgb(var(--v-theme-info));
}

.stats-icon--white {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Hover effects */
.stats-card:hover .stats-icon {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Progress bar styling */
:deep(.v-progress-linear) {
  border-radius: 4px;
}

:deep(.v-progress-linear__determinate) {
  border-radius: 4px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .stats-card {
    margin-bottom: 16px;
  }
  
  .d-flex.align-center {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .stats-icon {
    margin-top: 16px;
    align-self: flex-end;
  }
  
  .text-h4 {
    font-size: 1.75rem !important;
  }
}
</style>