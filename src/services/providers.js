import api from './api'

export const PROVIDER_CATEGORIES = {
  UNIFORMS: { label: 'Uniformes', icon: 'checkroom' },
  EQUIPMENT: { label: 'Balones e implementos', icon: 'sports_basketball' },
  REFEREES: { label: 'Arbitraje', icon: 'sports' },
  MEDIA: { label: 'Foto y video', icon: 'photo_camera' },
  COURTS: { label: 'Canchas', icon: 'stadium' },
  TROPHIES: { label: 'Trofeos y medallas', icon: 'emoji_events' },
  HEALTH: { label: 'Salud y fisio', icon: 'healing' },
  OTHER: { label: 'Otros', icon: 'storefront' }
}

export default {
  list: (country, category) => api.get('/providers', { params: { country, ...(category && { category }) } }),
  listAdmin: country => api.get('/providers/admin', { params: { country } }),
  create: data => api.post('/providers', data),
  update: (id, data) => api.patch(`/providers/${id}`, data),
  remove: id => api.delete(`/providers/${id}`),
  uploadLogo: file => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/uploads/provider-logo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  }
}
