import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import zonesService from '@/services/zones'

export const useZonesStore = defineStore('zones', () => {
  // State
  const zones = ref([])
  const zoneDominance = ref({})
  const selectedZone = ref(null)
  const zoneChallenges = ref([])
  const zoneChampionsTournaments = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Map state
  const mapState = ref({
    selectedZoneId: null,
    hoveredZoneId: null,
    viewMode: 'dominance', // 'dominance', 'challenges', 'champions'
    showContours: true,
    zoom: 1,
    center: { lat: 4.6097, lng: -74.0817 } // Bogotá default
  })

  // Getters
  const activeZones = computed(() => 
    zones.value.filter(zone => zone.isActive)
  )

  const dominantZones = computed(() => {
    return zones.value.filter(zone => {
      const dominance = zoneDominance.value[zone.id]
      return dominance && dominance.level > 70 // More than 70% controlled
    })
  })

  const contestedZones = computed(() => {
    return zones.value.filter(zone => {
      const dominance = zoneDominance.value[zone.id]
      return dominance && dominance.level >= 30 && dominance.level <= 70 // Between 30-70%
    })
  })

  const opponentZones = computed(() => {
    return zones.value.filter(zone => {
      const dominance = zoneDominance.value[zone.id]
      return dominance && dominance.level < 30 // Less than 30% controlled
    })
  })

  const activeChallenges = computed(() => 
    zoneChallenges.value.filter(challenge => challenge.status === 'ACTIVE')
  )

  const pendingChallenges = computed(() => 
    zoneChallenges.value.filter(challenge => challenge.status === 'PENDING')
  )

  const selectedZoneData = computed(() => {
    if (!selectedZone.value) return null
    
    return {
      ...selectedZone.value,
      dominance: zoneDominance.value[selectedZone.value.id] || null,
      challenges: zoneChallenges.value.filter(c => c.zoneId === selectedZone.value.id)
    }
  })

  // Actions
  const fetchZones = async (filters = {}) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await zonesService.getAll(filters)
      zones.value = response.data.zones || []
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al obtener zonas'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchZoneDominance = async (tournamentId = null) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await zonesService.getDominance(tournamentId)
      zoneDominance.value = response.data.dominance || {}
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al obtener dominación de zonas'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchZoneChallenges = async (filters = {}) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await zonesService.getChallenges(filters)
      zoneChallenges.value = response.data.challenges || []
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al obtener desafíos de zona'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchZoneChampionsTournaments = async () => {
    try {
      isLoading.value = true
      error.value = null

      const response = await zonesService.getChampionsTournaments()
      zoneChampionsTournaments.value = response.data.tournaments || []
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al obtener torneos de champions'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const createZone = async (zoneData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await zonesService.create(zoneData)
      
      // Add to local state
      zones.value.push(response.data.zone)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al crear zona'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const updateZone = async (zoneId, zoneData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await zonesService.update(zoneId, zoneData)
      
      // Update local state
      const index = zones.value.findIndex(z => z.id === zoneId)
      if (index !== -1) {
        zones.value[index] = response.data.zone
      }
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar zona'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const deleteZone = async (zoneId) => {
    try {
      isLoading.value = true
      error.value = null

      await zonesService.delete(zoneId)
      
      // Remove from local state
      zones.value = zones.value.filter(z => z.id !== zoneId)
      
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar zona'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const createZoneChallenge = async (challengeData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await zonesService.createChallenge(challengeData)
      
      // Add to local state
      zoneChallenges.value.push(response.data.challenge)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al crear desafío de zona'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const respondToChallenge = async (challengeId, response) => {
    try {
      isLoading.value = true
      error.value = null

      const result = await zonesService.respondToChallenge(challengeId, response)
      
      // Update local state
      const index = zoneChallenges.value.findIndex(c => c.id === challengeId)
      if (index !== -1) {
        zoneChallenges.value[index] = result.data.challenge
      }
      
      return { success: true, data: result.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al responder desafío'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const updateZoneDominance = async (zoneId, teamId, points) => {
    try {
      const response = await zonesService.updateDominance(zoneId, teamId, points)
      
      // Update local state
      zoneDominance.value[zoneId] = response.data.dominance
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar dominación'
      return { success: false, error: error.value }
    }
  }

  const selectZone = (zoneId) => {
    mapState.value.selectedZoneId = zoneId
    selectedZone.value = zones.value.find(z => z.id === zoneId) || null
  }

  const hoverZone = (zoneId) => {
    mapState.value.hoveredZoneId = zoneId
  }

  const clearHover = () => {
    mapState.value.hoveredZoneId = null
  }

  const clearSelection = () => {
    mapState.value.selectedZoneId = null
    selectedZone.value = null
  }

  const setViewMode = (mode) => {
    if (['dominance', 'challenges', 'champions'].includes(mode)) {
      mapState.value.viewMode = mode
    }
  }

  const setMapCenter = (center) => {
    mapState.value.center = center
  }

  const setMapZoom = (zoom) => {
    mapState.value.zoom = Math.max(0.5, Math.min(3, zoom))
  }

  const toggleContours = () => {
    mapState.value.showContours = !mapState.value.showContours
  }

  const getZoneColor = (zoneId, viewMode = 'dominance') => {
    const dominance = zoneDominance.value[zoneId]
    
    if (viewMode === 'dominance') {
      if (!dominance) return '#27272A' // Neutral color
      if (dominance.level > 70) return '#FF5F1F' // Dominated by user's team (Orange)
      if (dominance.level >= 30 && dominance.level <= 70) {
        // Contested zone - gradient between orange and blue
        const intensity = (dominance.level - 30) / 40 // 0 to 1
        return `linear-gradient(135deg, #FF5F1F ${(1-intensity)*100}%, #007BFF ${intensity*100}%)`
      }
      return '#007BFF' // Opponent dominated (Blue)
    }
    
    if (viewMode === 'challenges') {
      const hasActiveChallenge = zoneChallenges.value.some(c => 
        c.zoneId === zoneId && c.status === 'ACTIVE'
      )
      const hasPendingChallenge = zoneChallenges.value.some(c => 
        c.zoneId === zoneId && c.status === 'PENDING'
      )
      
      if (hasActiveChallenge) return '#F59E0B' // Active challenges (Yellow)
      if (hasPendingChallenge) return '#F97316' // Pending challenges (Orange)
      return '#27272A' // No challenges
    }
    
    return '#27272A' // Default
  }

  const clearError = () => {
    error.value = null
  }

  const clearAll = () => {
    zones.value = []
    zoneDominance.value = {}
    selectedZone.value = null
    zoneChallenges.value = []
    zoneChampionsTournaments.value = []
    error.value = null
    mapState.value = {
      selectedZoneId: null,
      hoveredZoneId: null,
      viewMode: 'dominance',
      showContours: true,
      zoom: 1,
      center: { lat: 4.6097, lng: -74.0817 }
    }
  }

  return {
    // State
    zones,
    zoneDominance,
    selectedZone,
    zoneChallenges,
    zoneChampionsTournaments,
    isLoading,
    error,
    mapState,
    
    // Getters
    activeZones,
    dominantZones,
    contestedZones,
    opponentZones,
    activeChallenges,
    pendingChallenges,
    selectedZoneData,
    
    // Actions
    fetchZones,
    fetchZoneDominance,
    fetchZoneChallenges,
    fetchZoneChampionsTournaments,
    createZone,
    updateZone,
    deleteZone,
    createZoneChallenge,
    respondToChallenge,
    updateZoneDominance,
    selectZone,
    hoverZone,
    clearHover,
    clearSelection,
    setViewMode,
    setMapCenter,
    setMapZoom,
    toggleContours,
    getZoneColor,
    clearError,
    clearAll
  }
})