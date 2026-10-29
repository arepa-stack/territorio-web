import api from './api'

const matchesService = {
    async getByTournament(tournamentId) {
        return await api.get('/matches', { params: { tournamentId, limit: 200 } })
    },

    async getTeamUpcoming(teamId) {
        return await api.get(`/matches/teams/${teamId}/upcoming`)
    },

    async getStandings(tournamentId) {
        return await api.get(`/matches/tournaments/${tournamentId}/standings`)
    }
}

export default matchesService
