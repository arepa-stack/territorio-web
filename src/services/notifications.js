import api from './api'

const notificationsService = {
  async getMyNotifications() {
    return await api.get('/notifications/my-notifications')
  },

  async list(params = {}) {
    return await api.get('/notifications', { params })
  },

  async markAsRead(id) {
    return await api.patch(`/notifications/${id}/read`)
  },

  async markAllAsRead() {
    return await api.patch('/notifications/read-all')
  }
}

export default notificationsService
