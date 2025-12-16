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

  // Refresh token
  async refreshToken(refreshToken) {
    return await api.post('/auth/refresh', { refreshToken })
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

  // Verify email
  async verifyEmail(token) {
    return await api.post('/auth/verify-email', { token })
  },

  // Resend verification email
  async resendVerification(email) {
    return await api.post('/auth/resend-verification', { email })
  },

  // Validate token
  async validateToken(token) {
    return await api.post('/auth/validate-token', { token })
  },

  // Get user permissions
  async getUserPermissions() {
    return await api.get('/users/me/permissions')
  },

  // Update user preferences
  async updatePreferences(preferences) {
    return await api.patch('/users/me/preferences', preferences)
  },

  // Get user preferences
  async getPreferences() {
    return await api.get('/users/me/preferences')
  }
}

export default authService