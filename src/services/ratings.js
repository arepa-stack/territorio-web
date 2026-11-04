import api from './api'

const ratingsService = {
    async getMineForMatch(matchId) {
        return await api.get(`/ratings/mine/match/${matchId}`)
    },

    async rateVenue(payload) {
        return await api.post('/ratings/venue', payload)
    },

    async rateTournament(payload) {
        return await api.post('/ratings/tournament', payload)
    },

    async rateReferee(payload) {
        return await api.post('/ratings/referee', payload)
    },

    async getTournamentSummary(tournamentId) {
        return await api.get(`/ratings/tournament/${tournamentId}/summary`)
    }
}

export default ratingsService
