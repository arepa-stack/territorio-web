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
  }
}

export default zonesService
