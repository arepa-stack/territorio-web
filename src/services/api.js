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
    
    // Handle specific error codes
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          const authStore = useAuthStore()
          if (authStore.refreshToken && !originalRequest._retry) {
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
          break
          
        case 403:
          toast.error('No tienes permisos para realizar esta acción')
          break
          
        case 404:
          toast.error('Recurso no encontrado')
          break
          
        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            const errorMessages = data.errors.map(err => err.message || err.msg).join(', ')
            toast.error(errorMessages)
          } else {
            toast.error(data.message || 'Error de validación')
          }
          break
          
        case 429:
          toast.error('Demasiadas solicitudes. Por favor intenta más tarde.')
          break
          
        case 500:
          toast.error('Error del servidor. Por favor intenta más tarde.')
          break
          
        default:
          toast.error(data.message || 'Error inesperado del servidor')
      }
    } else if (error.request) {
      // Network error
      toast.error('Error de conexión. Verifica tu conexión a internet.')
    } else {
      // Something else happened
      toast.error('Error inesperado')
    }
    
    return Promise.reject(error)
  }
)

// Helper functions for error handling
export const handleApiError = (error, defaultMessage = 'Error inesperado') => {
  if (error.response) {
    return error.response.data?.message || defaultMessage
  } else if (error.request) {
    return 'Error de conexión'
  } else {
    return error.message || defaultMessage
  }
}

export const isNetworkError = (error) => {
  return !error.response && error.request
}

export const isValidationError = (error) => {
  return error.response?.status === 422
}

export const isAuthError = (error) => {
  return error.response?.status === 401
}

// Utility functions
export const buildQueryString = (params) => {
  const query = new URLSearchParams()
  
  Object.keys(params).forEach(key => {
    const value = params[key]
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle nested objects
        Object.keys(value).forEach(nestedKey => {
          if (value[nestedKey] !== null && value[nestedKey] !== undefined) {
            query.append(`${key}.${nestedKey}`, value[nestedKey])
          }
        })
      } else if (Array.isArray(value)) {
        // Handle arrays
        value.forEach(item => {
          query.append(key, item)
        })
      } else {
        query.append(key, value)
      }
    }
  })
  
  return query.toString()
}

// File upload helper
export const uploadFile = async (file, endpoint, onProgress = null) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
  
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      onProgress(percentCompleted)
    }
  }
  
  return api.post(endpoint, formData, config)
}

// Download file helper
export const downloadFile = async (url, filename) => {
  const response = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data])
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(downloadUrl)
}

export default api