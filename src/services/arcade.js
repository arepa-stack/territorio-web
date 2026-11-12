import api from './api'

export default {
  leaderboard: () => api.get('/arcade/leaderboard'),
  save: (score, won) => api.post('/arcade/scores', { score, won })
}
