import api from './api'

const tournamentsService = {
    // Get all tournaments (public with filters)
    async getAll(params = {}) {
        return await api.get('/tournaments', { params })
    },

    // Get tournament by ID
    async getById(id) {
        return await api.get(`/tournaments/${id}`)
    },

    // Create tournament (Organizer only)
    async create(tournamentData) {
        return await api.post('/tournaments', tournamentData)
    },

    // Update tournament (Organizer only)
    async update(id, tournamentData) {
        return await api.patch(`/tournaments/${id}`, tournamentData)
    },

    // Delete tournament (Organizer only)
    async delete(id) {
        return await api.delete(`/tournaments/${id}`)
    },

    // Register team in tournament (Captain only)
    async registerTeam(registrationData) {
        return await api.post('/tournaments/register', registrationData)
    },

    // Approve/Reject registration (Organizer only)
    async processRegistration(tournamentId, data) {
        return await api.patch(`/tournaments/${tournamentId}/approve-registration`, data)
    },

    // Get tournament registrations (Organizer only)
    async getRegistrations(tournamentId) {
        return await api.get(`/tournaments/${tournamentId}/registrations`)
    },

    // Generate fixtures (Organizer only)
    async generateFixtures(tournamentId) {
        return await api.post(`/tournaments/${tournamentId}/generate-fixtures`)
    },

    // Get all registered players in tournament with category/waiver/ID status (Organizer/Admin)
    async getPlayers(tournamentId) {
        return await api.get(`/tournaments/${tournamentId}/players`)
    },

    // Get tournament statistical leaders (Public)
    async getLeaders(tournamentId) {
        return await api.get(`/tournaments/${tournamentId}/leaders`)
    }
}

export default tournamentsService
