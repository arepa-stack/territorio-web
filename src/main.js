import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'

import 'vue-toastification/dist/index.css'
import './styles/tailwind.css'

import App from './App.vue'
import TurfLoader from './components/TurfLoader.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(Toast, {
  position: 'top-right',
  timeout: 4500,
  closeOnClick: true,
  pauseOnHover: true,
  hideProgressBar: false,
  icon: true,
  transition: 'Vue-Toastification__fade',
  maxToasts: 4,
  newestOnTop: true
})
app.use(router)
app.component('TurfLoader', TurfLoader)

app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info)
}

useAuthStore().initializeFromStorage()

app.mount('#app')
