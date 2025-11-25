<template>
  <div class="performance-chart">
    <div class="chart-container" :style="{ height: `${height}px` }">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <!-- Chart Legend -->
    <div v-if="showLegend" class="chart-legend mt-3">
      <div class="d-flex flex-wrap justify-center gap-4">
        <div v-for="dataset in chartData.datasets" :key="dataset.label" class="d-flex align-center">
          <div class="legend-color mr-2" :style="{ backgroundColor: dataset.borderColor }"></div>
          <span class="text-caption">{{ dataset.label }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="chart-loading">
      <v-progress-circular indeterminate color="primary" size="32" />
      <p class="text-body-2 mt-2">Cargando estadísticas...</p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !hasData" class="chart-empty">
      <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
      <p class="text-body-2 text-medium-emphasis mt-2">
        No hay datos suficientes para mostrar el gráfico
      </p>
      <v-btn variant="outlined" size="small" @click="generateSampleData" class="mt-2">
        Generar Datos de Ejemplo
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Props
const props = defineProps({
  stats: {
    type: Object,
    default: () => ({})
  },
  width: {
    type: Number,
    default: 400
  },
  height: {
    type: Number,
    default: 300
  },
  chartType: {
    type: String,
    default: 'line'
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    default: 'dark'
  }
})

// Reactive state
const chartCanvas = ref(null)
const chartInstance = ref(null)

// Computed
const chartData = computed(() => {
  // Process stats data for chart
  const labels = []
  const pointsData = []
  const reboundsData = []
  const assistsData = []

  // Generate labels (game dates)
  for (let i = 10; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    labels.push(date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    }))
  }

  // Generate sample data if no stats provided
  if (!props.stats || Object.keys(props.stats).length === 0) {
    for (let i = 0; i < 11; i++) {
      pointsData.push(Math.floor(Math.random() * 25) + 5)
      reboundsData.push(Math.floor(Math.random() * 12) + 1)
      assistsData.push(Math.floor(Math.random() * 8) + 1)
    }
  } else {
    // Process actual stats data here
    // For now, generate sample data
    for (let i = 0; i < 11; i++) {
      pointsData.push(Math.floor(Math.random() * 25) + 5)
      reboundsData.push(Math.floor(Math.random() * 12) + 1)
      assistsData.push(Math.floor(Math.random() * 8) + 1)
    }
  }

  const isDark = props.theme === 'dark'
  const textColor = isDark ? '#E4E4E7' : '#18181B'
  const gridColor = isDark ? '#27272A' : '#E4E4E7'

  return {
    labels,
    datasets: [
      {
        label: 'Puntos',
        data: pointsData,
        borderColor: '#FF5F1F',
        backgroundColor: 'rgba(255, 95, 31, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#FF5F1F',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'Rebotes',
        data: reboundsData,
        borderColor: '#007BFF',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#007BFF',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'Asistencias',
        data: assistsData,
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#22C55E',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  }
})

const hasData = computed(() => {
  return chartData.value.datasets.some(dataset =>
    dataset.data && dataset.data.length > 0
  )
})

const chartOptions = computed(() => {
  const isDark = props.theme === 'dark'
  const textColor = isDark ? '#E4E4E7' : '#18181B'
  const gridColor = isDark ? '#27272A' : '#E4E4E7'
  const backgroundColor = isDark ? '#141414' : '#FFFFFF'

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Rendimiento en los Últimos Partidos',
        color: textColor,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        display: props.showLegend,
        position: 'bottom',
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: backgroundColor,
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function (context) {
            return `Partido ${context[0].label}`
          },
          label: function (context) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: textColor,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: textColor,
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      line: {
        borderJoinStyle: 'round'
      },
      point: {
        hoverBorderWidth: 3
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  }
})

// Methods
const createChart = () => {
  if (!chartCanvas.value) return

  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')

  chartInstance.value = new ChartJS(ctx, {
    type: props.chartType,
    data: chartData.value,
    options: chartOptions.value
  })
}

const updateChart = () => {
  if (chartInstance.value) {
    chartInstance.value.data = chartData.value
    chartInstance.value.options = chartOptions.value
    chartInstance.value.update('active')
  }
}

const generateSampleData = () => {
  // This would typically fetch real data from an API
  console.log('Generating sample performance data...')

  // For demonstration, we'll just trigger a chart update
  setTimeout(() => {
    updateChart()
  }, 500)
}

// Lifecycle
onMounted(() => {
  // Always create chart on mount, even if loading
  setTimeout(() => {
    createChart()
  }, 100)
})

// Watchers
watch([() => props.stats, () => props.theme], () => {
  if (chartInstance.value && hasData.value) {
    updateChart()
  } else if (!chartInstance.value && hasData.value) {
    createChart()
  }
}, { deep: true })

watch(() => props.loading, (newVal) => {
  if (!newVal && hasData.value) {
    if (chartInstance.value) {
      updateChart()
    } else {
      createChart()
    }
  }
})
</script>

<style scoped>
.performance-chart {
  position: relative;
  width: 100%;
}

.chart-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.chart-loading,
.chart-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgb(var(--v-theme-text-secondary));
}

.chart-legend {
  border-top: 1px solid rgb(var(--v-theme-divider));
  padding-top: 16px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .chart-legend {
    gap: 12px !important;
  }

  .legend-color {
    width: 10px;
    height: 10px;
  }
}
</style>