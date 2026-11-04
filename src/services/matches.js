import api from './api'

const matchesService = {
    // Organizer: date, time, venue or status (SCHEDULED / SUSPENDED / CANCELLED)
    async update(matchId, data) {
        return await api.patch(`/matches/${matchId}`, data)
    },

    async getById(matchId) {
        return await api.get(`/matches/${matchId}`)
    },

    async getEvents(matchId) {
        return await api.get(`/matches/${matchId}/events`)
    },

    // Undo one play from the scoring table
    async deleteEvent(eventId) {
        return await api.delete(`/matches/events/${eventId}`)
    },

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
    },

    async requestReschedule(matchId, payload) {
        return await api.post(`/matches/${matchId}/reschedule-requests`, payload)
    },

    async getRescheduleRequests(tournamentId) {
        return await api.get(`/tournaments/${tournamentId}/reschedule-requests`)
    },

    async resolveRescheduleRequest(requestId, payload) {
        return await api.patch(`/reschedule-requests/${requestId}`, payload)
    },

    async forfeit(matchId, forfeitTeamId) {
        return await api.patch(`/matches/${matchId}/forfeit`, { forfeitTeamId })
    }
}

export default matchesService
