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
    // Note: Backend expects RegisterPlayerInTeamDto structure
    return await api.post('/players/register-in-team', { ...playerData, teamId })
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
    // Backend expects query param playerId
    return await api.get('/players/stats/summary', { params: { playerId } })
  },

  // Get player history (teams and tournaments)
  async getHistory(playerId) {
    // Backend expects query param playerId
    return await api.get('/players/history', { params: { playerId } })
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
    // Backend expects query param ci
    return await api.post(`/players/team/${teamId}/search-player?ci=${searchCriteria.ci}`)
  },

  // Captain: Add player to team
  async addPlayerToTeam(teamId, playerData) {
    return await api.post(`/players/team/${teamId}/add-player`, playerData)
  },

  // Get zone conflicts for player
  async getZoneConflicts(playerId, zoneId) {
    // Backend endpoint: /players/zone-conflicts/check?playerId=...&zoneId=...
    return await api.get('/players/zone-conflicts/check', { params: { playerId, zoneId } })
  },

  // --- Unsupported / Future Endpoints ---

  // Update player statistics
  async updateStats(playerId, tournamentId, statsData) {
    // return await api.put(`/players/${playerId}/stats/${tournamentId}`, statsData)
    return Promise.reject(new Error('Update stats not supported'))
  },

  // Get player statistics by tournament
  async getStatsByTournament(playerId, tournamentId) {
    // return await api.get(`/players/${playerId}/stats/${tournamentId}`)
    return Promise.reject(new Error('Get stats by tournament not supported'))
  },

  // Get player match history
  async getMatchHistory(playerId, tournamentId = null) {
    /*
    const endpoint = tournamentId 
      ? `/players/${playerId}/matches/${tournamentId}`
      : `/players/${playerId}/matches`
    return await api.get(endpoint)
    */
    return Promise.resolve({ data: [] })
  },

  // Add disciplinary record to player
  async addDisciplinaryRecord(playerId, recordData) {
    // return await api.post(`/players/${playerId}/disciplinary`, recordData)
    return Promise.reject(new Error('Disciplinary records not supported'))
  },

  // Get disciplinary records
  async getDisciplinaryRecords(playerId) {
    // return await api.get(`/players/${playerId}/disciplinary`)
    return Promise.resolve({ data: [] })
  },

  // Update disciplinary record
  async updateDisciplinaryRecord(playerId, recordId, updateData) {
    // return await api.put(`/players/${playerId}/disciplinary/${recordId}`, updateData)
    return Promise.reject(new Error('Update disciplinary record not supported'))
  },

  // Delete disciplinary record
  async deleteDisciplinaryRecord(playerId, recordId) {
    // return await api.delete(`/players/${playerId}/disciplinary/${recordId}`)
    return Promise.reject(new Error('Delete disciplinary record not supported'))
  },

  // Get player achievements
  async getAchievements(playerId) {
    // return await api.get(`/players/${playerId}/achievements`)
    return Promise.resolve({ data: [] })
  },

  // Add achievement to player
  async addAchievement(playerId, achievementData) {
    // return await api.post(`/players/${playerId}/achievements`, achievementData)
    return Promise.reject(new Error('Add achievement not supported'))
  },

  // Upload player photo
  async uploadPhoto(playerId, photoFile) {
    /*
    const formData = new FormData()
    formData.append('photo', photoFile)
    
    return await api.post(`/players/${playerId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    */
    return Promise.reject(new Error('Upload photo not supported'))
  },

  // Get player photo
  async getPhoto(playerId) {
    /*
    return await api.get(`/players/${playerId}/photo`, {
      responseType: 'blob'
    })
    */
    return Promise.reject(new Error('Get photo not supported'))
  },

  // Export player data
  async exportPlayerData(playerId, format = 'json') {
    /*
    return await api.get(`/players/${playerId}/export`, {
      params: { format },
      responseType: 'blob'
    })
    */
    return Promise.reject(new Error('Export data not supported'))
  },

  // Get players for specific tournament
  async getByTournament(tournamentId) {
    // return await api.get(`/players/tournament/${tournamentId}`)
    return Promise.resolve({ data: [] })
  },

  // Get players by position
  async getByPosition(position) {
    /*
    return await api.get('/players/position', {
      params: { position }
    })
    */
    return Promise.resolve({ data: [] })
  },

  // Get players by zone
  async getByZone(zoneId) {
    // return await api.get(`/players/zone/${zoneId}`)
    return Promise.resolve({ data: [] })
  },

  // Bulk operations
  async bulkUpdate(data) {
    // return await api.put('/players/bulk-update', data)
    return Promise.reject(new Error('Bulk update not supported'))
  },

  async bulkDelete(playerIds) {
    /*
    return await api.delete('/players/bulk-delete', {
      data: { playerIds }
    })
    */
    return Promise.reject(new Error('Bulk delete not supported'))
  },

  // Player ranking
  async getRanking(tournamentId = null, metric = 'points') {
    /*
    const endpoint = tournamentId 
      ? `/players/ranking/${tournamentId}`
      : '/players/ranking'
    
    return await api.get(endpoint, {
      params: { metric }
    })
    */
    return Promise.resolve({ data: [] })
  },

  // Player comparison
  async comparePlayers(playerIds, metrics = ['points', 'rebounds', 'assists']) {
    /*
    return await api.post('/players/compare', {
      playerIds,
      metrics
    })
    */
    return Promise.resolve({ data: {} })
  },

  // Player notifications
  async getNotifications(playerId) {
    // return await api.get(`/players/${playerId}/notifications`)
    return Promise.resolve({ data: [] })
  },

  // Mark notification as read
  async markNotificationAsRead(playerId, notificationId) {
    // return await api.put(`/players/${playerId}/notifications/${notificationId}/read`)
    return Promise.resolve({ data: {} })
  },

  // Get player activity log
  async getActivityLog(playerId, filters = {}) {
    /*
    const queryString = buildQueryString(filters)
    return await api.get(`/players/${playerId}/activity?${queryString}`)
    */
    return Promise.resolve({ data: [] })
  },

  // Search players for transfer/loan
  async searchForTransfer(searchCriteria) {
    // return await api.post('/players/search-transfer', searchCriteria)
    return Promise.resolve({ data: [] })
  },

  // Request player transfer
  async requestTransfer(playerId, transferData) {
    // return await api.post(`/players/${playerId}/transfer`, transferData)
    return Promise.reject(new Error('Request transfer not supported'))
  },

  // Get transfer requests
  async getTransferRequests(playerId) {
    // return await api.get(`/players/${playerId}/transfers`)
    return Promise.resolve({ data: [] })
  },

  // Respond to transfer request
  async respondToTransfer(transferId, response) {
    // return await api.put(`/players/transfers/${transferId}/respond`, response)
    return Promise.reject(new Error('Respond to transfer not supported'))
  }
}

export default playersService