import api from './api'

const usersService = {
    async getReferees() {
        return await api.get('/users/referees')
    }
}

export default usersService
