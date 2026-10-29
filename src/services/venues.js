import api from './api'

const venuesService = {
    async getAll(zoneId) {
        return await api.get('/venues', { params: zoneId ? { zoneId } : {} })
    },

    async getById(venueId) {
        return await api.get(`/venues/${venueId}`)
    },

    async create(venueData) {
        return await api.post('/venues', venueData)
    },

    async update(venueId, venueData) {
        return await api.patch(`/venues/${venueId}`, venueData)
    },

    async delete(venueId) {
        return await api.delete(`/venues/${venueId}`)
    }
}

export default venuesService
