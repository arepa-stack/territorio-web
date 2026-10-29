import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/auth'
import { HOME_BY_ROLE } from '@/router/navigation'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(null)
  const refreshToken = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const userName = computed(() => user.value?.fullName)
  const userEmail = computed(() => user.value?.email)

  // Actions
  const login = async (credentials) => {
    try {
      isLoading.value = true
      error.value = null

      const { email, password } = credentials
      const response = await authService.login({ email, password })

      if (response.data.access_token && response.data.user) {
        token.value = response.data.access_token
        user.value = response.data.user
        refreshToken.value = response.data.refresh_token

        // Save to localStorage
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        localStorage.setItem('refreshToken', refreshToken.value)

        router.push(HOME_BY_ROLE[user.value.role] || '/')

        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al iniciar sesión'
      return {
        success: false,
        error: error.value
      }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await authService.register(userData)

      if (response.data.access_token && response.data.user) {
        token.value = response.data.access_token
        user.value = response.data.user
        refreshToken.value = response.data.refresh_token

        // Save to localStorage
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        localStorage.setItem('refreshToken', refreshToken.value)

        router.push(HOME_BY_ROLE[user.value.role] || '/')

        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al registrar usuario'
      return {
        success: false,
        error: error.value
      }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await authService.logout()
      }
    } catch (err) {
      console.error('Error during logout:', err)
    } finally {
      // Clear state
      user.value = null
      token.value = null
      refreshToken.value = null
      error.value = null

      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('refreshToken')

      // Redirect to login
      router.push('/auth/login')
    }
  }

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('No refresh token available')
      }

      const response = await authService.refreshToken(refreshToken.value)

      if (response.data.access_token) {
        token.value = response.data.access_token
        if (response.data.refresh_token) {
          refreshToken.value = response.data.refresh_token
          localStorage.setItem('refreshToken', refreshToken.value)
        }
        localStorage.setItem('token', token.value)
        return true
      }

      throw new Error('Token refresh failed')
    } catch (err) {
      console.error('Token refresh failed:', err)
      // If refresh fails, logout user
      await logout()
      return false
    }
  }

  const updateProfile = async (profileData) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await authService.updateProfile(profileData)

      if (response.data.user) {
        user.value = { ...user.value, ...response.data.user }
        localStorage.setItem('user', JSON.stringify(user.value))
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar perfil'
      return {
        success: false,
        error: error.value
      }
    } finally {
      isLoading.value = false
    }
  }

  const initializeFromStorage = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    const savedRefreshToken = localStorage.getItem('refreshToken')

    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      refreshToken.value = savedRefreshToken
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    user,
    token,
    refreshToken,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    userRole,
    userName,
    userEmail,

    // Actions
    login,
    register,
    logout,
    refreshAccessToken,
    updateProfile,
    initializeFromStorage,
    clearError
  }
})