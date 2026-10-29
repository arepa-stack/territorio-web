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
    },

    async setAttendance(matchId, status) {
        return await api.post(`/matches/${matchId}/attendance`, { status })
    },

    async getAttendance(matchId, teamId) {
        return await api.get(`/matches/${matchId}/attendance`, {
            params: teamId ? { teamId } : {}
        })
    }
}

export default matchesService
