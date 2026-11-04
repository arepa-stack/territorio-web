import api from './api'

// Only endpoints that exist in the backend ZonesController.
const zonesService = {
  async getAll() {
    return await api.get('/zones')
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

  // Territorial challenges (captain vs the team that rules a zone)
  async createChallenge(data) {
    return await api.post('/zones/challenges', data)
  },

  async getPendingChallenges() {
    return await api.get('/zones/challenges/pending')
  },

  async respondChallenge(challengeId, response, message) {
    return await api.patch(`/zones/challenges/${challengeId}/respond`, { response, ...(message ? { message } : {}) })
  }
}

export default zonesService
