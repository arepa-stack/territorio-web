import api from './api'

// Disciplinary sanctions: the organizer of a tournament creates and resolves them; the player can appeal
const sanctionsService = {
    async listByTournament(tournamentId) {
        return await api.get(`/sanctions/tournament/${tournamentId}/list`)
    },

    async create(data) {
        return await api.post('/sanctions', data)
    },

    // action: LIFT | ACCEPT_APPEAL | REJECT_APPEAL | CONFIRM_PAID
    async review(sanctionId, action) {
        return await api.patch(`/sanctions/${sanctionId}/review`, { action })
    },

    async appeal(sanctionId, appealReason) {
        return await api.patch('/sanctions/update-status', { sanctionId, appealReason })
    }
}

export default sanctionsService
