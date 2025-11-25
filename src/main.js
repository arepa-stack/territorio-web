import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import Toast from 'vue-toastification'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import 'vue-toastification/dist/index.css'
import './styles/global.css'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

// Stores
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

// Vuetify Configuration
app.use(vuetify)

// Toast notifications
app.use(Toast, {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnHover: true,
  showCloseButton: true,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
})

// Router
app.use(router)

// Pinia
app.use(pinia)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

// Initialize authentication
const authStore = useAuthStore()
authStore.initializeFromStorage()

app.mount('#app')