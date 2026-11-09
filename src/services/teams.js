import api from './api'
import { country } from '@/composables/useCountry'

const teamsService = {
    // Get all teams (public with filters)
    async getAll(params = {}) {
        return await api.get('/teams', { params })
    },

    // Get my teams (Captain only)
    async getMyTeams() {
        return await api.get('/teams/my-teams')
    },

    // Tournament history: record per tournament and each match with quarter scores
    async getHistory(teamId) {
        return await api.get(`/teams/${teamId}/history`)
    },

    // Get team by ID
    async getById(id) {
        return await api.get(`/teams/${id}`)
    },

    // Create team
    async create(teamData) {
        return await api.post('/teams', { country: country.value, ...teamData }) // a new team belongs to the selected country
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
    async getStaff(teamId) {
        return await api.get(`/teams/${teamId}/staff`)
    },

    async addStaff(teamId, staffData) {
        return await api.post(`/teams/${teamId}/staff`, staffData)
    },

    async removeStaff(teamId, staffId) {
        return await api.delete(`/teams/${teamId}/staff/${staffId}`)
    },

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
    },

    // Active sanctions and suspended players for next match
    async getActiveSanctions(teamId) {
        return await api.get(`/sanctions/team/${teamId}/active`)
    },

    // Teams looking for players
    async getRecruitingTeams(params = {}) {
        return await api.get('/teams/recruiting', { params: { country: country.value, ...params } })
    },

    // Join requests
    async createJoinRequest(teamId, data) {
        return await api.post(`/teams/${teamId}/join-requests`, data)
    },

    async getTeamJoinRequests(teamId) {
        return await api.get(`/teams/${teamId}/join-requests`)
    },

    async resolveJoinRequest(requestId, data) {
        return await api.patch(`/join-requests/${requestId}`, data)
    },

    async cancelJoinRequest(requestId) {
        return await api.delete(`/join-requests/${requestId}`)
    },

    // Claim links for captain-created players
    async createClaimLink(teamId, playerId) {
        return await api.post(`/teams/${teamId}/players/${playerId}/claim-link`)
    },

    async previewClaimToken(token) {
        return await api.get(`/claim/${token}`)
    },

    async claimAccount(token, data) {
        return await api.post(`/claim/${token}`, data)
    }
}

export default teamsService
