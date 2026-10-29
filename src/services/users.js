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
    }
}

export default usersService
