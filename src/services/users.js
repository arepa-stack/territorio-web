import api from './api'

const usersService = {
    async getReferees() {
        return await api.get('/users/referees')
    },

    async getAll() {
        return await api.get('/users')
    },

    async updateRole(id, role) {
        return await api.patch(`/users/${id}/role`, { role })
    },

    async deactivate(id) {
        return await api.delete(`/users/${id}`)
    },

    // Captain role upgrade requests
    async createCaptainRequest(data) {
        return await api.post('/users/me/captain-request', data)
    },

    async getMyCaptainRequest() {
        return await api.get('/users/me/captain-request')
    },

    async getCaptainRequests() {
        return await api.get('/users/captain-requests')
    },

    async resolveCaptainRequest(id, data) {
        return await api.patch(`/users/captain-requests/${id}`, data)
    },

    // Private identity documents
    async uploadIdentityDocument(file) {
        const formData = new FormData()
        formData.append('document', file)
        return await api.post('/users/me/identity-document', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    async getMyIdentityDocumentInfo() {
        return await api.get('/users/me/identity-document/info')
    },

    async fetchIdentityDocumentBlob(userId) {
        return await api.get(`/users/${userId}/identity-document`, {
            responseType: 'blob'
        })
    },

    async reviewIdentityDocument(userId, data) {
        return await api.patch(`/users/${userId}/identity-document/review`, data)
    }
}

export default usersService
