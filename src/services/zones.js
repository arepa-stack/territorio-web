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
    return await api.put(`/zones/${zoneId}`, zoneData)
  },

  async delete(zoneId) {
    return await api.delete(`/zones/${zoneId}`)
  },

  // Zone dominance
  async getDominance(tournamentId = null) {
    const endpoint = tournamentId 
      ? `/zones/dominance/${tournamentId}`
      : '/zones/dominance'
    return await api.get(endpoint)
  },

  async updateDominance(zoneId, teamId, points) {
    return await api.post(`/zones/${zoneId}/dominance`, {
      teamId,
      points
    })
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
    return await api.put(`/zones/challenges/${challengeId}/respond`, response)
  },

  async cancelChallenge(challengeId) {
    return await api.delete(`/zones/challenges/${challengeId}`)
  },

  async acceptChallenge(challengeId) {
    return await api.put(`/zones/challenges/${challengeId}/accept`)
  },

  async declineChallenge(challengeId, reason = '') {
    return await api.put(`/zones/challenges/${challengeId}/decline`, { reason })
  },

  // Zone champions tournaments
  async getChampionsTournaments() {
    return await api.get('/zones/champions-tournaments')
  },

  async createChampionsTournament(tournamentData) {
    return await api.post('/zones/champions-tournaments', tournamentData)
  },

  async getChampionsTournamentById(tournamentId) {
    return await api.get(`/zones/champions-tournaments/${tournamentId}`)
  },

  async updateChampionsTournament(tournamentId, tournamentData) {
    return await api.put(`/zones/champions-tournaments/${tournamentId}`, tournamentData)
  },

  async deleteChampionsTournament(tournamentId) {
    return await api.delete(`/zones/champions-tournaments/${tournamentId}`)
  },

  // Zone statistics
  async getZoneStatistics(zoneId, tournamentId = null) {
    const endpoint = tournamentId 
      ? `/zones/${zoneId}/stats/${tournamentId}`
      : `/zones/${zoneId}/stats`
    return await api.get(endpoint)
  },

  async getZoneHistory(zoneId, period = '30d') {
    return await api.get(`/zones/${zoneId}/history`, {
      params: { period }
    })
  },

  async getZoneActivities(zoneId, filters = {}) {
    const queryString = buildQueryString(filters)
    return await api.get(`/zones/${zoneId}/activities?${queryString}`)
  },

  // Zone ranking
  async getZoneRanking(metric = 'dominance_points', period = 'current') {
    return await api.get('/zones/ranking', {
      params: { metric, period }
    })
  },

  // Zone management operations
  async mergeZones(zoneIds, newZoneData) {
    return await api.post('/zones/merge', {
      zoneIds,
      newZoneData
    })
  },

  async splitZone(zoneId, newZones) {
    return await api.post(`/zones/${zoneId}/split`, { newZones })
  },

  async transferZone(zoneId, targetOwner, reason = '') {
    return await api.post(`/zones/${zoneId}/transfer`, {
      targetOwner,
      reason
    })
  },

  // Zone notifications
  async getZoneNotifications(zoneId, filters = {}) {
    const queryString = buildQueryString(filters)
    return await api.get(`/zones/${zoneId}/notifications?${queryString}`)
  },

  async markZoneNotificationAsRead(zoneId, notificationId) {
    return await api.put(`/zones/${zoneId}/notifications/${notificationId}/read`)
  },

  // Zone territories (sub-zones)
  async getSubZones(parentZoneId) {
    return await api.get(`/zones/${parentZoneId}/sub-zones`)
  },

  async createSubZone(parentZoneId, subZoneData) {
    return await api.post(`/zones/${parentZoneId}/sub-zones`, subZoneData)
  },

  async updateSubZone(zoneId, subZoneId, subZoneData) {
    return await api.put(`/zones/${zoneId}/sub-zones/${subZoneId}`, subZoneData)
  },

  async deleteSubZone(zoneId, subZoneId) {
    return await api.delete(`/zones/${zoneId}/sub-zones/${subZoneId}`)
  },

  // Zone boundaries and geometry
  async getZoneBoundary(zoneId) {
    return await api.get(`/zones/${zoneId}/boundary`)
  },

  async updateZoneBoundary(zoneId, boundary) {
    return await api.put(`/zones/${zoneId}/boundary`, { boundary })
  },

  async validateZoneBoundary(boundary) {
    return await api.post('/zones/validate-boundary', { boundary })
  },

  // Zone events and milestones
  async getZoneEvents(zoneId, filters = {}) {
    const queryString = buildQueryString(filters)
    return await api.get(`/zones/${zoneId}/events?${queryString}`)
  },

  async createZoneEvent(zoneId, eventData) {
    return await api.post(`/zones/${zoneId}/events`, eventData)
  },

  async updateZoneEvent(zoneId, eventId, eventData) {
    return await api.put(`/zones/${zoneId}/events/${eventId}`, eventData)
  },

  async deleteZoneEvent(zoneId, eventId) {
    return await api.delete(`/zones/${zoneId}/events/${eventId}`)
  },

  // Zone war history
  async getZoneWars(zoneId, filters = {}) {
    const queryString = buildQueryString(filters)
    return await api.get(`/zones/${zoneId}/wars?${queryString}`)
  },

  async getZoneWarDetails(zoneId, warId) {
    return await api.get(`/zones/${zoneId}/wars/${warId}`)
  },

  // Zone analytics and insights
  async getZoneInsights(zoneId, timeRange = '30d') {
    return await api.get(`/zones/${zoneId}/insights`, {
      params: { timeRange }
    })
  },

  async getZoneForecast(zoneId, period = '7d') {
    return await api.get(`/zones/${zoneId}/forecast`, {
      params: { period }
    })
  },

  async getZoneRecommendations(zoneId) {
    return await api.get(`/zones/${zoneId}/recommendations`)
  },

  // Bulk operations
  async bulkUpdateZones(updates) {
    return await api.put('/zones/bulk-update', { updates })
  },

  async bulkDeleteZones(zoneIds) {
    return await api.delete('/zones/bulk-delete', {
      data: { zoneIds }
    })
  },

  // Zone export/import
  async exportZoneData(zoneId, format = 'json') {
    return await api.get(`/zones/${zoneId}/export`, {
      params: { format },
      responseType: 'blob'
    })
  },

  async importZoneData(file, options = {}) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('options', JSON.stringify(options))
    
    return await api.post('/zones/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Zone search and discovery
  async searchZones(searchCriteria) {
    return await api.post('/zones/search', searchCriteria)
  },

  async getNearbyZones(zoneId, radius = 1000) {
    return await api.get(`/zones/${zoneId}/nearby`, {
      params: { radius }
    })
  },

  // Zone automation
  async setupZoneAutomation(zoneId, automationRules) {
    return await api.post(`/zones/${zoneId}/automation`, { rules: automationRules })
  },

  async getZoneAutomation(zoneId) {
    return await api.get(`/zones/${zoneId}/automation`)
  },

  async updateZoneAutomation(zoneId, automationId, rules) {
    return await api.put(`/zones/${zoneId}/automation/${automationId}`, { rules })
  },

  async deleteZoneAutomation(zoneId, automationId) {
    return await api.delete(`/zones/${zoneId}/automation/${automationId}`)
  }
}

export default zonesService