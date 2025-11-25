import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import playerService from '@/services/players'

export const usePlayerStore = defineStore('player', () => {
  // State
  const players = ref([])
  const currentPlayer = ref(null)
  const searchResults = ref([])
  const zoneConflicts = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  
  // Search filters
  const searchFilters = ref({
    ci: '',
    name: '',
    position: null,
    city: '',
    ageRange: { min: null, max: null },
    heightRange: { min: null, max: null },
    page: 1,
    limit: 10
  })

  // Getters
  const playerStats = computed(() => {
    if (!currentPlayer.value?.tournamentStats) return []
    
    return currentPlayer.value.tournamentStats.map(stat => ({
      label: stat.tournament.name,
      value: stat.points || 0,
      trend: stat.points > 0 ? 'up' : 'neutral'
    }))
  })

  const teamsByZone = computed(() => {
    if (!currentPlayer.value?.teams) return {}
    
    return currentPlayer.value.teams.reduce((acc, team) => {
      const zoneId = team.tournament?.zone?.id || 'unknown'
      if (!acc[zoneId]) {
        acc[zoneId] = {
          zone: team.tournament?.zone,
          teams: []
        }
      }
      acc[zoneId].teams.push(team)
      return acc
    }, {})
  })

  const conflictCount = computed(() => zoneConflicts.value.length)

  // Actions
  const searchPlayers = async (filters = {}) => {
    try {
      isLoading.value = true
      error.value = null

      // Merge with current filters
      const searchParams = { ...searchFilters.value, ...filters }
      const response = await playerService.search(searchParams)
      
      searchResults.value = response.data.players
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al buscar jugadores'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const findPlayerByCI = async (ci) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await playerService.findByCI(ci)
      
      if (response.data.player) {
        return { 
          success: true, 
          player: response.data.player,
          found: true 
        }
      }
      
      return { 
        success: true, 
        found: false,
        message: 'Jugador no encontrado' 
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al buscar jugador'
      return { 
        success: false, 
        error: error.value 
      }
    } finally {
      isLoading.value = false
    }
  }

  const checkZoneConflicts = async (playerId, tournamentId) => {
    try {
      const response = await playerService.checkAvailability(playerId, tournamentId)
      
      zoneConflicts.value = response.data.conflicts || []
      
      return {
        success: true,
        available: response.data.available,
        conflicts: response.data.conflicts,
        targetTournament: response.data.targetTournament
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al verificar conflictos de zona'
      return { 
        success: false, 
        error: error.value 
      }
    }
  }

  const registerPlayerInTeam = async (teamId, playerData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await playerService.registerInTeam(teamId, playerData)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al registrar jugador en equipo'
      return { 
        success: false, 
        error: error.value 
      }
    } finally {
      isLoading.value = false
    }
  }

  const createNewPlayer = async (playerData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await playerService.create(playerData)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al crear jugador'
      return { 
        success: false, 
        error: error.value 
      }
    } finally {
      isLoading.value = false
    }
  }

  const addPlayerToTournament = async (playerId, tournamentId) => {
    try {
      isLoading.value = true
      error.value = null

      // First check for conflicts
      const conflictCheck = await checkZoneConflicts(playerId, tournamentId)
      
      if (!conflictCheck.available) {
        return {
          success: false,
          conflicts: conflictCheck.conflicts,
          message: 'El jugador tiene conflictos de zona'
        }
      }

      const response = await playerService.addToTournament(playerId, tournamentId)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al agregar jugador al torneo'
      return { 
        success: false, 
        error: error.value 
      }
    } finally {
      isLoading.value = false
    }
  }

  const getPlayerStats = async (playerId = null) => {
    try {
      isLoading.value = true
      error.value = null

      const id = playerId || currentPlayer.value?.id
      if (!id) {
        throw new Error('Player ID required')
      }

      const response = await playerService.getStats(id)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al obtener estadísticas'
      return { 
        success: false, 
        error: error.value 
      }
    } finally {
      isLoading.value = false
    }
  }

  const getPlayerHistory = async (playerId = null) => {
    try {
      isLoading.value = true
      error.value = null

      const id = playerId || currentPlayer.value?.id
      if (!id) {
        throw new Error('Player ID required')
      }

      const response = await playerService.getHistory(id)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al obtener historial'
      return { 
        success: false, 
        error: error.value 
      }
    } finally {
      isLoading.value = false
    }
  }

  const updatePlayerInTeam = async (playerId, teamId, updateData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await playerService.updateInTeam(playerId, teamId, updateData)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar jugador'
      return { 
        success: false, 
        error: error.value 
      }
    } finally {
      isLoading.value = false
    }
  }

  const removePlayerFromTeam = async (playerId, teamId) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await playerService.removeFromTeam(playerId, teamId)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al remover jugador'
      return { 
        success: false, 
        error: error.value 
      }
    } finally {
      isLoading.value = false
    }
  }

  const getTeamPlayers = async (teamId) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await playerService.getByTeam(teamId)
      
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al obtener jugadores del equipo'
      return { 
        success: false, 
        error: error.value 
      }
    } finally {
      isLoading.value = false
    }
  }

  const clearSearch = () => {
    searchResults.value = []
    searchFilters.value = {
      ci: '',
      name: '',
      position: null,
      city: '',
      ageRange: { min: null, max: null },
      heightRange: { min: null, max: null },
      page: 1,
      limit: 10
    }
  }

  const clearConflicts = () => {
    zoneConflicts.value = []
  }

  const clearError = () => {
    error.value = null
  }

  const clearAll = () => {
    players.value = []
    currentPlayer.value = null
    searchResults.value = []
    zoneConflicts.value = []
    error.value = null
    clearSearch()
  }

  return {
    // State
    players,
    currentPlayer,
    searchResults,
    zoneConflicts,
    isLoading,
    error,
    searchFilters,
    
    // Getters
    playerStats,
    teamsByZone,
    conflictCount,
    
    // Actions
    searchPlayers,
    findPlayerByCI,
    checkZoneConflicts,
    registerPlayerInTeam,
    createNewPlayer,
    addPlayerToTournament,
    getPlayerStats,
    getPlayerHistory,
    updatePlayerInTeam,
    removePlayerFromTeam,
    getTeamPlayers,
    clearSearch,
    clearConflicts,
    clearError,
    clearAll
  }
})