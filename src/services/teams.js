import api from './api'

const teamsService = {
    // Get all teams (public with filters)
    async getAll(params = {}) {
        return await api.get('/teams', { params })
    },

    // Get my teams (Captain only)
    async getMyTeams() {
        return await api.get('/teams/my-teams')
    },

    // Get team by ID
    async getById(id) {
        return await api.get(`/teams/${id}`)
    },

    // Create team
    async create(teamData) {
        return await api.post('/teams', teamData)
    },

    // Create team with logo
    async createWithLogo(formData) {
        return await api.post('/teams/with-logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // Update team
    async update(id, teamData) {
        return await api.patch(`/teams/${id}`, teamData)
    },

    // Update team logo
    async updateLogo(id, formData) {
        return await api.patch(`/teams/${id}/logo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // Delete team
    async delete(id) {
        return await api.delete(`/teams/${id}`)
    },

    // Add player to team
    async addPlayer(teamId, playerData) {
        return await api.post(`/teams/${teamId}/players`, playerData)
    },

    // Add player with photo
    async addPlayerWithPhoto(teamId, formData) {
        return await api.post(`/teams/${teamId}/players-with-photo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // Get team players
    async getPlayers(teamId) {
        return await api.get(`/teams/${teamId}/players`)
    },

    // Update player
    async updatePlayer(teamId, playerId, playerData) {
        return await api.patch(`/teams/${teamId}/players/${playerId}`, playerData)
    },

    // Update player photo
    async updatePlayerPhoto(teamId, playerId, formData) {
        return await api.patch(`/teams/${teamId}/players/${playerId}/photo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // Remove player
    async removePlayer(teamId, playerId) {
        return await api.delete(`/teams/${teamId}/players/${playerId}`)
    },

    // Validate team for registration
    async validateForRegistration(teamId) {
        return await api.get(`/teams/${teamId}/validate`)
    }
}

export default teamsService
