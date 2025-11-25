import api, { buildQueryString } from './api'

const playersService = {
  // Search players with filters
  async search(filters = {}) {
    const queryString = buildQueryString(filters)
    return await api.get(`/players/search?${queryString}`)
  },

  // Find player by CI (Cédula de Identidad)
  async findByCI(ci) {
    return await api.get(`/players/find-by-ci/${ci}`)
  },

  // Check player availability (zone conflicts)
  async checkAvailability(playerId, tournamentId) {
    return await api.post('/players/check-availability', {
      playerId,
      tournamentId
    })
  },

  // Register existing user as player in team
  async registerInTeam(teamId, playerData) {
    return await api.post(`/players/team/${teamId}/register-in-team`, playerData)
  },

  // Create new player (user + player record)
  async create(playerData) {
    return await api.post('/players/create', playerData)
  },

  // Add player to tournament
  async addToTournament(playerId, tournamentId) {
    return await api.post('/players/add-to-tournament', {
      playerId,
      tournamentId
    })
  },

  // Get player statistics summary
  async getStats(playerId) {
    return await api.get(`/players/stats/summary/${playerId}`)
  },

  // Get player history (teams and tournaments)
  async getHistory(playerId) {
    return await api.get(`/players/history/${playerId}`)
  },

  // Update player in team
  async updateInTeam(playerId, teamId, updateData) {
    return await api.put(`/players/${playerId}`, updateData)
  },

  // Remove player from team
  async removeFromTeam(playerId, teamId) {
    return await api.delete(`/players/${playerId}`)
  },

  // Get full player details
  async getById(playerId) {
    return await api.get(`/players/${playerId}`)
  },

  // Get players in specific team
  async getByTeam(teamId) {
    return await api.get(`/players/team/${teamId}`)
  },

  // Captain: Search player for team
  async searchPlayerForTeam(teamId, searchCriteria) {
    return await api.post(`/players/team/${teamId}/search-player`, searchCriteria)
  },

  // Captain: Add player to team
  async addPlayerToTeam(teamId, playerData) {
    return await api.post(`/players/team/${teamId}/add-player`, playerData)
  },

  // Get zone conflicts for player
  async getZoneConflicts(playerId) {
    return await api.get(`/players/zone-conflicts/${playerId}`)
  },

  // Update player statistics
  async updateStats(playerId, tournamentId, statsData) {
    return await api.put(`/players/${playerId}/stats/${tournamentId}`, statsData)
  },

  // Get player statistics by tournament
  async getStatsByTournament(playerId, tournamentId) {
    return await api.get(`/players/${playerId}/stats/${tournamentId}`)
  },

  // Get player match history
  async getMatchHistory(playerId, tournamentId = null) {
    const endpoint = tournamentId 
      ? `/players/${playerId}/matches/${tournamentId}`
      : `/players/${playerId}/matches`
    return await api.get(endpoint)
  },

  // Add disciplinary record to player
  async addDisciplinaryRecord(playerId, recordData) {
    return await api.post(`/players/${playerId}/disciplinary`, recordData)
  },

  // Get disciplinary records
  async getDisciplinaryRecords(playerId) {
    return await api.get(`/players/${playerId}/disciplinary`)
  },

  // Update disciplinary record
  async updateDisciplinaryRecord(playerId, recordId, updateData) {
    return await api.put(`/players/${playerId}/disciplinary/${recordId}`, updateData)
  },

  // Delete disciplinary record
  async deleteDisciplinaryRecord(playerId, recordId) {
    return await api.delete(`/players/${playerId}/disciplinary/${recordId}`)
  },

  // Get player achievements
  async getAchievements(playerId) {
    return await api.get(`/players/${playerId}/achievements`)
  },

  // Add achievement to player
  async addAchievement(playerId, achievementData) {
    return await api.post(`/players/${playerId}/achievements`, achievementData)
  },

  // Upload player photo
  async uploadPhoto(playerId, photoFile) {
    const formData = new FormData()
    formData.append('photo', photoFile)
    
    return await api.post(`/players/${playerId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Get player photo
  async getPhoto(playerId) {
    return await api.get(`/players/${playerId}/photo`, {
      responseType: 'blob'
    })
  },

  // Export player data
  async exportPlayerData(playerId, format = 'json') {
    return await api.get(`/players/${playerId}/export`, {
      params: { format },
      responseType: 'blob'
    })
  },

  // Get players for specific tournament
  async getByTournament(tournamentId) {
    return await api.get(`/players/tournament/${tournamentId}`)
  },

  // Get players by position
  async getByPosition(position) {
    return await api.get('/players/position', {
      params: { position }
    })
  },

  // Get players by zone
  async getByZone(zoneId) {
    return await api.get(`/players/zone/${zoneId}`)
  },

  // Bulk operations
  async bulkUpdate(data) {
    return await api.put('/players/bulk-update', data)
  },

  async bulkDelete(playerIds) {
    return await api.delete('/players/bulk-delete', {
      data: { playerIds }
    })
  },

  // Player ranking
  async getRanking(tournamentId = null, metric = 'points') {
    const endpoint = tournamentId 
      ? `/players/ranking/${tournamentId}`
      : '/players/ranking'
    
    return await api.get(endpoint, {
      params: { metric }
    })
  },

  // Player comparison
  async comparePlayers(playerIds, metrics = ['points', 'rebounds', 'assists']) {
    return await api.post('/players/compare', {
      playerIds,
      metrics
    })
  },

  // Player notifications
  async getNotifications(playerId) {
    return await api.get(`/players/${playerId}/notifications`)
  },

  // Mark notification as read
  async markNotificationAsRead(playerId, notificationId) {
    return await api.put(`/players/${playerId}/notifications/${notificationId}/read`)
  },

  // Get player activity log
  async getActivityLog(playerId, filters = {}) {
    const queryString = buildQueryString(filters)
    return await api.get(`/players/${playerId}/activity?${queryString}`)
  },

  // Search players for transfer/loan
  async searchForTransfer(searchCriteria) {
    return await api.post('/players/search-transfer', searchCriteria)
  },

  // Request player transfer
  async requestTransfer(playerId, transferData) {
    return await api.post(`/players/${playerId}/transfer`, transferData)
  },

  // Get transfer requests
  async getTransferRequests(playerId) {
    return await api.get(`/players/${playerId}/transfers`)
  },

  // Respond to transfer request
  async respondToTransfer(transferId, response) {
    return await api.put(`/players/transfers/${transferId}/respond`, response)
  }
}

export default playersService