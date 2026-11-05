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

    // Playoff bracket (public): projection from the standings until the playoffs exist
    async getBracket(tournamentId) {
        return await api.get(`/tournaments/${tournamentId}/bracket`)
    },

    // Create the first playoff round from the standings (Organizer only)
    async generatePlayoffs(tournamentId) {
        return await api.post(`/tournaments/${tournamentId}/playoffs`)
    },

    // Close the tournament and crown the leader of the standings (Organizer only)
    async finish(tournamentId) {
        return await api.post(`/tournaments/${tournamentId}/finish`)
    },

    // Groups tournament: { teamId: "A" | "B" | null } (Organizer only)
    async setGroups(tournamentId, groups) {
        return await api.patch(`/tournaments/${tournamentId}/groups`, { groups })
    },

    // Start with the games built by hand (Organizer only)
    async start(tournamentId) {
        return await api.post(`/tournaments/${tournamentId}/start`)
    },

    // Generate fixtures (Organizer only)
    async generateFixtures(tournamentId) {
        return await api.post(`/tournaments/${tournamentId}/generate-fixtures`)
    },

    // Get all registered players in tournament with category/waiver/ID status (Organizer/Admin)
    async getPlayers(tournamentId) {
        return await api.get(`/tournaments/${tournamentId}/players`)
    },

    // Public landing: counters, upcoming matches, leaders and zone owners
    async getZoneStandings() {
        return await api.get('/tournaments/zone-standings')
    },
    async getLandingSummary() {
        return await api.get('/tournaments/landing-summary')
    },

    // Court photo used as the tournament cover; returns { url }
    async uploadBanner(file) {
        const formData = new FormData()
        formData.append('file', file)
        return await api.post('/uploads/tournament-banner', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    async setBanner(tournamentId, bannerUrl) {
        return await api.patch(`/tournaments/${tournamentId}/banner`, { bannerUrl })
    },

    // Get tournament statistical leaders (Public)
    async getLeaders(tournamentId) {
        return await api.get(`/tournaments/${tournamentId}/leaders`)
    }
}

export default tournamentsService
