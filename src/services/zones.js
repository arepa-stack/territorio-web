import api, { buildQueryString } from './api'

const zonesService = {
  // Zone CRUD operations
  async getAll(filters = {}) {
    const queryString = buildQueryString(filters)
    return await api.get(`/zones?${queryString}`)
  },

  async getById(zoneId) {
    return await api.get(`/zones/${zoneId}`)
  },

  async create(zoneData) {
    return await api.post('/zones', zoneData)
  },

  async update(zoneId, zoneData) {
    return await api.patch(`/zones/${zoneId}`, zoneData)
  },

  async delete(zoneId) {
    return await api.delete(`/zones/${zoneId}`)
  },

  // Zone dominance
  async getDominance(tournamentId = null) {
    // Backend: /zones/global-dominance for global, or /zones/:id/dominance for specific zone
    // If tournamentId is passed, it might be looking for something else, but let's default to global
    if (tournamentId) {
      // Not supported by backend currently
      return Promise.resolve({ data: [] })
    }
    return await api.get('/zones/global-dominance')
  },

  async getZoneDominance(zoneId) {
    return await api.get(`/zones/${zoneId}/dominance`)
  },

  async updateDominance(zoneId, teamId, points) {
    // Backend only supports recalculate
    // return await api.post(`/zones/${zoneId}/dominance`, { teamId, points })
    return Promise.reject(new Error('Update dominance manually not supported'))
  },

  async recalculateDominance(zoneId) {
    return await api.post(`/zones/${zoneId}/recalculate-dominance`)
  },

  // Zone challenges
  async getChallenges(filters = {}) {
    const queryString = buildQueryString(filters)
    return await api.get(`/zones/challenges?${queryString}`)
  },

  async getChallengeById(challengeId) {
    return await api.get(`/zones/challenges/${challengeId}`)
  },

  async createChallenge(challengeData) {
    return await api.post('/zones/challenges', challengeData)
  },

  async respondToChallenge(challengeId, response) {
    return await api.patch(`/zones/challenges/${challengeId}/respond`, response)
  },

  async cancelChallenge(challengeId) {
    // Backend does not support delete challenge
    // return await api.delete(`/zones/challenges/${challengeId}`)
    return Promise.reject(new Error('Cancel challenge not supported'))
  },

  async acceptChallenge(challengeId) {
    return await api.patch(`/zones/challenges/${challengeId}/respond`, { response: 'ACCEPTED' })
  },

  async declineChallenge(challengeId, reason = '') {
    return await api.patch(`/zones/challenges/${challengeId}/respond`, { response: 'DECLINED', reason })
  },

  async completeChallenge(challengeId, resultData) {
    return await api.patch(`/zones/challenges/${challengeId}/complete`, resultData)
  },

  // Zone champions tournaments
  async getChampionsTournaments() {
    return await api.get('/zones/champions-tournaments')
  },

  async createChampionsTournament(tournamentData) {
    return await api.post('/zones/champions-tournaments', tournamentData)
  },

  async getChampionsTournamentById(tournamentId) {
    // return await api.get(`/zones/champions-tournaments/${tournamentId}`)
    return Promise.reject(new Error('Get champions tournament by ID not supported'))
  },

  async updateChampionsTournament(tournamentId, tournamentData) {
    // return await api.put(`/zones/champions-tournaments/${tournamentId}`, tournamentData)
    return Promise.reject(new Error('Update champions tournament not supported'))
  },

  async deleteChampionsTournament(tournamentId) {
    // return await api.delete(`/zones/champions-tournaments/${tournamentId}`)
    return Promise.reject(new Error('Delete champions tournament not supported'))
  },

  // Zone statistics
  async getZoneStatistics(zoneId = null) {
    if (zoneId) {
      // Backend doesn't have specific stats endpoint per zone other than getZoneById or getZoneDominance
      // But it has getDashboardSummary which returns global stats
      return Promise.resolve({ data: {} })
    }
    return await api.get('/zones/statistics')
  },

  async getTerritoryMap() {
    return await api.get('/zones/territory-map')
  },

  async getDashboardSummary() {
    return await api.get('/zones/dashboard/summary')
  },

  async getTeamZoneStats(teamId) {
    return await api.get(`/zones/teams/${teamId}/zone-stats`)
  },

  async getPendingChallenges() {
    return await api.get('/zones/challenges/pending')
  },

  // --- Unsupported / Future Endpoints ---

  async getZoneHistory(zoneId, period = '30d') {
    /*
    return await api.get(`/zones/${zoneId}/history`, {
      params: { period }
    })
    */
    return Promise.resolve({ data: [] })
  },

  async getZoneActivities(zoneId, filters = {}) {
    /*
    const queryString = buildQueryString(filters)
    return await api.get(`/zones/${zoneId}/activities?${queryString}`)
    */
    return Promise.resolve({ data: [] })
  },

  // Zone ranking
  async getZoneRanking(metric = 'dominance_points', period = 'current') {
    /*
    return await api.get('/zones/ranking', {
      params: { metric, period }
    })
    */
    return Promise.resolve({ data: [] })
  },

  // Zone management operations
  async mergeZones(zoneIds, newZoneData) {
    // return await api.post('/zones/merge', { zoneIds, newZoneData })
    return Promise.reject(new Error('Merge zones not supported'))
  },

  async splitZone(zoneId, newZones) {
    // return await api.post(`/zones/${zoneId}/split`, { newZones })
    return Promise.reject(new Error('Split zone not supported'))
  },

  async transferZone(zoneId, targetOwner, reason = '') {
    /*
    return await api.post(`/zones/${zoneId}/transfer`, {
      targetOwner,
      reason
    })
    */
    return Promise.reject(new Error('Transfer zone not supported'))
  },

  // Zone notifications
  async getZoneNotifications(zoneId, filters = {}) {
    /*
    const queryString = buildQueryString(filters)
    return await api.get(`/zones/${zoneId}/notifications?${queryString}`)
    */
    return Promise.resolve({ data: [] })
  },

  async markZoneNotificationAsRead(zoneId, notificationId) {
    // return await api.put(`/zones/${zoneId}/notifications/${notificationId}/read`)
    return Promise.resolve({ data: {} })
  },

  // Zone territories (sub-zones)
  async getSubZones(parentZoneId) {
    // return await api.get(`/zones/${parentZoneId}/sub-zones`)
    return Promise.resolve({ data: [] })
  },

  async createSubZone(parentZoneId, subZoneData) {
    // return await api.post(`/zones/${parentZoneId}/sub-zones`, subZoneData)
    return Promise.reject(new Error('Create sub-zone not supported'))
  },

  async updateSubZone(zoneId, subZoneId, subZoneData) {
    // return await api.put(`/zones/${zoneId}/sub-zones/${subZoneId}`, subZoneData)
    return Promise.reject(new Error('Update sub-zone not supported'))
  },

  async deleteSubZone(zoneId, subZoneId) {
    // return await api.delete(`/zones/${zoneId}/sub-zones/${subZoneId}`)
    return Promise.reject(new Error('Delete sub-zone not supported'))
  },

  // Zone boundaries and geometry
  async getZoneBoundary(zoneId) {
    // return await api.get(`/zones/${zoneId}/boundary`)
    return Promise.resolve({ data: {} })
  },

  async updateZoneBoundary(zoneId, boundary) {
    // return await api.put(`/zones/${zoneId}/boundary`, { boundary })
    return Promise.reject(new Error('Update boundary not supported'))
  },

  async validateZoneBoundary(boundary) {
    // return await api.post('/zones/validate-boundary', { boundary })
    return Promise.resolve({ data: { valid: true } })
  },

  // Zone events and milestones
  async getZoneEvents(zoneId, filters = {}) {
    /*
    const queryString = buildQueryString(filters)
    return await api.get(`/zones/${zoneId}/events?${queryString}`)
    */
    return Promise.resolve({ data: [] })
  },

  async createZoneEvent(zoneId, eventData) {
    // return await api.post(`/zones/${zoneId}/events`, eventData)
    return Promise.reject(new Error('Create zone event not supported'))
  },

  async updateZoneEvent(zoneId, eventId, eventData) {
    // return await api.put(`/zones/${zoneId}/events/${eventId}`, eventData)
    return Promise.reject(new Error('Update zone event not supported'))
  },

  async deleteZoneEvent(zoneId, eventId) {
    // return await api.delete(`/zones/${zoneId}/events/${eventId}`)
    return Promise.reject(new Error('Delete zone event not supported'))
  },

  // Zone war history
  async getZoneWars(zoneId, filters = {}) {
    /*
    const queryString = buildQueryString(filters)
    return await api.get(`/zones/${zoneId}/wars?${queryString}`)
    */
    return Promise.resolve({ data: [] })
  },

  async getZoneWarDetails(zoneId, warId) {
    // return await api.get(`/zones/${zoneId}/wars/${warId}`)
    return Promise.resolve({ data: {} })
  },

  // Zone analytics and insights
  async getZoneInsights(zoneId, timeRange = '30d') {
    /*
    return await api.get(`/zones/${zoneId}/insights`, {
      params: { timeRange }
    })
    */
    return Promise.resolve({ data: {} })
  },

  async getZoneForecast(zoneId, period = '7d') {
    /*
    return await api.get(`/zones/${zoneId}/forecast`, {
      params: { period }
    })
    */
    return Promise.resolve({ data: {} })
  },

  async getZoneRecommendations(zoneId) {
    // return await api.get(`/zones/${zoneId}/recommendations`)
    return Promise.resolve({ data: [] })
  },

  // Bulk operations
  async bulkUpdateZones(updates) {
    // return await api.put('/zones/bulk-update', { updates })
    return Promise.reject(new Error('Bulk update zones not supported'))
  },

  async bulkDeleteZones(zoneIds) {
    /*
    return await api.delete('/zones/bulk-delete', {
      data: { zoneIds }
    })
    */
    return Promise.reject(new Error('Bulk delete zones not supported'))
  },

  // Zone export/import
  async exportZoneData(zoneId, format = 'json') {
    /*
    return await api.get(`/zones/${zoneId}/export`, {
      params: { format },
      responseType: 'blob'
    })
    */
    return Promise.reject(new Error('Export zone data not supported'))
  },

  async importZoneData(file, options = {}) {
    /*
    const formData = new FormData()
    formData.append('file', file)
    formData.append('options', JSON.stringify(options))
    
    return await api.post('/zones/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    */
    return Promise.reject(new Error('Import zone data not supported'))
  },

  // Zone search and discovery
  async searchZones(searchCriteria) {
    // return await api.post('/zones/search', searchCriteria)
    return Promise.resolve({ data: [] })
  },

  async getNearbyZones(zoneId, radius = 1000) {
    /*
    return await api.get(`/zones/${zoneId}/nearby`, {
      params: { radius }
    })
    */
    return Promise.resolve({ data: [] })
  },

  // Zone automation
  async setupZoneAutomation(zoneId, automationRules) {
    // return await api.post(`/zones/${zoneId}/automation`, { rules: automationRules })
    return Promise.reject(new Error('Setup automation not supported'))
  },

  async getZoneAutomation(zoneId) {
    // return await api.get(`/zones/${zoneId}/automation`)
    return Promise.resolve({ data: {} })
  },

  async updateZoneAutomation(zoneId, automationId, rules) {
    // return await api.put(`/zones/${zoneId}/automation/${automationId}`, { rules })
    return Promise.reject(new Error('Update automation not supported'))
  },

  async deleteZoneAutomation(zoneId, automationId) {
    // return await api.delete(`/zones/${zoneId}/automation/${automationId}`)
    return Promise.reject(new Error('Delete automation not supported'))
  }
}

export default zonesService