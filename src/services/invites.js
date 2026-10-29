import api from './api'

const invitesService = {
    // Captain
    async create(teamId, data = {}) {
        return await api.post(`/teams/${teamId}/invites`, data)
    },

    async list(teamId) {
        return await api.get(`/teams/${teamId}/invites`)
    },

    async revoke(teamId, inviteId) {
        return await api.delete(`/teams/${teamId}/invites/${inviteId}`)
    },

    // Public preview of a link
    async preview(token) {
        return await api.get(`/invites/${token}`)
    },

    // Player joins with { jerseyNumber, position }
    async join(token, data) {
        return await api.post(`/invites/${token}/join`, data)
    }
}

export default invitesService

// Absolute link the captain shares
export const inviteUrl = token => `${window.location.origin}/join/${token}`
