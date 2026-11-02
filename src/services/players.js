import api from './api'

// Only endpoints that exist in the backend PlayersController.
const playersService = {
  // Public profile; the backend strips contact and sensitive data by viewer
  async getById(playerId) {
    return await api.get(`/players/${playerId}`)
  },

  async getStats(playerId) {
    return await api.get(`/matches/players/${playerId}/stats`)
  },

  // Teams, matches and stats of the logged-in user
  async getMe() {
    return await api.get('/players/me')
  },

  // Captain looks up a person by cédula for their team (404 if nobody has it)
  async searchPlayerForTeam(teamId, { ci }) {
    return await api.post(`/players/team/${teamId}/search-player`, {}, { params: { ci } })
  },

  // Adds an existing user to a team (one team per tournament is enforced by the API)
  async registerInTeam(teamId, playerData) {
    return await api.post('/players/register-in-team', { ...playerData, teamId })
  },

  // Creates the person (or reuses them if the cédula exists) and adds them to the team
  async create(playerData) {
    return await api.post('/players/create', playerData)
  },

  // Leave a team voluntarily
  async leaveTeam(teamId) {
    return await api.post(`/players/me/teams/${teamId}/leave`)
  },

  // Update logged-in player's photo
  async uploadMyPhoto(file) {
    const formData = new FormData()
    formData.append('photo', file)
    return await api.patch('/players/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Update logged-in player's profile
  async updateMe(data) {
    return await api.patch('/players/me', data)
  },

  // Get player's join requests
  async getMyJoinRequests() {
    return await api.get('/players/me/join-requests')
  },

  // Accept tournament waiver & rules
  async acceptTournamentWaiver(tournamentId) {
    return await api.post(`/players/me/tournaments/${tournamentId}/accept-waiver`)
  }
}

export default playersService
