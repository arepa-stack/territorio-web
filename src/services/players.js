import api from './api'

// Only endpoints that exist in the backend PlayersController.
const playersService = {
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
  }
}

export default playersService
