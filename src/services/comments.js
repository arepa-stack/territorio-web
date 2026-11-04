import api from './api'

const commentsService = {
    async getStatus() {
        return await api.get('/comments/status')
    },

    async getForMatch(matchId) {
        return await api.get(`/comments/match/${matchId}`, { params: { limit: 50 } })
    },

    async createForMatch(matchId, content) {
        return await api.post('/comments/match', { matchId, content })
    },

    async like(commentId) {
        return await api.post(`/comments/${commentId}/like`, { commentType: 'match_comment' })
    },

    async report(commentId, reason) {
        return await api.post('/comments/report', { commentId, commentType: 'match_comment', reason })
    },

    async getForTeam(teamId) {
        return await api.get(`/comments/team/${teamId}`, { params: { limit: 50 } })
    },

    async createForTeam(teamId, content) {
        return await api.post('/comments/team', { teamId, content })
    },

    async likeTeam(commentId) {
        return await api.post(`/comments/${commentId}/like`, { commentType: 'team_comment' })
    },

    async reportTeam(commentId, reason) {
        return await api.post('/comments/report', { commentId, commentType: 'team_comment', reason })
    }
}

export default commentsService
