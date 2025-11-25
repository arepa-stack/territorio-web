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

  // Logout
  async logout() {
    return await api.post('/auth/logout')
  },

  // Refresh token
  async refreshToken(refreshToken) {
    return await api.post('/auth/refresh', { refreshToken })
  },

  // Get current user profile
  async getProfile() {
    return await api.get('/auth/profile')
  },

  // Update profile
  async updateProfile(profileData) {
    return await api.put('/auth/profile', profileData)
  },

  // Change password
  async changePassword(passwordData) {
    return await api.put('/auth/change-password', passwordData)
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
  async resendVerification() {
    return await api.post('/auth/resend-verification')
  },

  // Validate token
  async validateToken() {
    return await api.get('/auth/validate')
  },

  // Get user permissions
  async getUserPermissions() {
    return await api.get('/auth/permissions')
  },

  // Update user preferences
  async updatePreferences(preferences) {
    return await api.put('/auth/preferences', preferences)
  },

  // Get user preferences
  async getPreferences() {
    return await api.get('/auth/preferences')
  }
}

export default authService