import axios from 'axios'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Toast instance
const toast = useToast()

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate response time for debugging
    const endTime = new Date()
    const startTime = response.config.metadata?.startTime
    if (startTime) {
      const duration = endTime - startTime
      if (duration > 5000) {
        console.warn(`Slow API request: ${response.config.url} took ${duration}ms`)
      }
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    let globalToastMessage = ''
    
    // Handle only global error codes here; components handle action-level errors (400, 404, 409, 422) via handleApiError
    if (error.response) {
      const { status } = error.response
      
      if (status === 401) {
        // Unauthorized - token expired or invalid
        const authStore = useAuthStore()
        if (authStore.refreshToken && !originalRequest?._retry) {
          originalRequest._retry = true
          
          try {
            // Try to refresh token
            const refreshed = await authStore.refreshAccessToken()
            if (refreshed) {
              // Retry original request with new token
              return api(originalRequest)
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
          }
          
          // If refresh failed, logout user
          await authStore.logout()
        }
      } else if (status === 403) {
        globalToastMessage = 'No tienes permisos para realizar esta acción'
      } else if (status === 429) {
        globalToastMessage = 'Demasiadas solicitudes. Por favor intenta más tarde.'
      } else if (status >= 500) {
        globalToastMessage = 'Error del servidor. Por favor intenta más tarde.'
      }
    } else if (error.request) {
      // Network error
      globalToastMessage = 'Error de conexión. Verifica tu conexión a internet.'
    }

    if (globalToastMessage) {
      setTimeout(() => {
        if (!error._handled) toast.error(globalToastMessage)
      }, 0)
    }
    
    return Promise.reject(error)
  }
)

// Helper functions for error handling
export const handleApiError = (error, defaultMessage = 'Error inesperado') => {
  if (error && typeof error === 'object') {
    error._handled = true
  }
  if (error?.response) {
    // class-validator returns one message per invalid field
    const message = error.response.data?.message
    return Array.isArray(message) ? message.join(' · ') : message || defaultMessage
  } else if (error?.request) {
    return 'Error de conexión'
  } else {
    return error?.message || defaultMessage
  }
}

export default api