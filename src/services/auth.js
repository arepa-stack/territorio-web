import api from './api'

const authService = {
  // Login
  async login(credentials) {
    return await api.post('/auth/login', credentials)
  },

  // Register
  async register(userData) {
    return await api.post('/auth/register', userData)
  },

  // Logout (Client-side only for now as backend is stateless)
  async logout() {
    // return await api.post('/auth/logout')
    return Promise.resolve()
  },

  // Refresh token (Not supported by backend yet)
  async refreshToken(refreshToken) {
    // return await api.post('/auth/refresh', { refreshToken })
    return Promise.reject(new Error('Refresh token not supported'))
  },

  // Get current user profile
  async getProfile() {
    return await api.get('/users/me')
  },

  // Update profile
  async updateProfile(profileData) {
    return await api.patch('/users/me', profileData)
  },

  // Change password (Not supported)
  async changePassword(passwordData) {
    // return await api.put('/auth/change-password', passwordData)
    return Promise.reject(new Error('Change password not supported'))
  },

  // Forgot password
  async forgotPassword(email) {
    return await api.post('/auth/forgot-password', { email })
  },

  // Reset password
  async resetPassword(resetData) {
    return await api.post('/auth/reset-password', resetData)
  },

  // Verify email (Not supported)
  async verifyEmail(token) {
    // return await api.post('/auth/verify-email', { token })
    return Promise.reject(new Error('Verify email not supported'))
  },

  // Resend verification email (Not supported)
  async resendVerification() {
    // return await api.post('/auth/resend-verification')
    return Promise.reject(new Error('Resend verification not supported'))
  },

  // Validate token (Not supported)
  async validateToken() {
    // return await api.get('/auth/validate')
    return Promise.resolve({ data: { valid: true } }) // Mock for now
  },

  // Get user permissions (Not supported)
  async getUserPermissions() {
    // return await api.get('/auth/permissions')
    return Promise.resolve({ data: [] })
  },

  // Update user preferences (Not supported)
  async updatePreferences(preferences) {
    // return await api.put('/auth/preferences', preferences)
    return Promise.resolve({ data: {} })
  },

  // Get user preferences (Not supported)
  async getPreferences() {
    // return await api.get('/auth/preferences')
    return Promise.resolve({ data: {} })
  }
}

export default authService