import api from './api'

const venuesService = {
    async getAll() {
        return await api.get('/venues')
    }
}

export default venuesService
