<template>
  <v-form ref="loginForm" v-model="isFormValid" @submit.prevent="handleLogin" class="login-form">
    <div class="text-center mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">
        Iniciar Sesión
      </h2>
      <p class="text-body-1 text-medium-emphasis">
        Bienvenido de vuelta al sistema de torneos
      </p>
    </div>

    <!-- Email Field -->
    <v-text-field v-model="form.email" label="Correo Electrónico" type="email" prepend-inner-icon="mdi-email"
      :rules="emailRules" :error-messages="errors.email" variant="outlined" density="comfortable" class="mb-3"
      @input="clearError('email')" />

    <!-- Password Field -->
    <v-text-field v-model="form.password" :label="'Contraseña'" :type="showPassword ? 'text' : 'password'"
      prepend-inner-icon="mdi-lock" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" :rules="passwordRules"
      :error-messages="errors.password" variant="outlined" density="comfortable" class="mb-2"
      @click:append-inner="showPassword = !showPassword" @input="clearError('password')" @keyup.enter="handleLogin" />

    <!-- Remember Me & Forgot Password -->
    <div class="d-flex justify-space-between align-center mb-4">
      <v-checkbox v-model="form.rememberMe" label="Recordarme" density="compact" hide-details color="primary" />

      <v-btn variant="text" size="small" color="primary" @click="navigateToForgotPassword">
        ¿Olvidaste tu contraseña?
      </v-btn>
    </div>

    <!-- Login Button -->
    <v-btn type="submit" block size="large" color="primary" :loading="authStore.isLoading" :disabled="!isFormValid"
      class="mb-4" elevation="2">
      <v-icon start>mdi-login</v-icon>
      Iniciar Sesión
    </v-btn>

    <!-- Divider -->
    <v-divider class="my-4">
      <span class="text-body-2 text-medium-emphasis">o</span>
    </v-divider>

    <!-- Social Login (placeholder for future) -->
    <div class="d-flex gap-2 mb-4">
      <v-btn variant="outlined" block size="large" disabled class="flex-grow-1">
        <v-icon start>mdi-google</v-icon>
        Google
      </v-btn>

      <v-btn variant="outlined" block size="large" disabled class="flex-grow-1">
        <v-icon start>mdi-facebook</v-icon>
        Facebook
      </v-btn>
    </div>

    <!-- Register Link -->
    <div class="text-center">
      <p class="text-body-2">
        ¿No tienes una cuenta?
        <v-btn variant="text" color="primary" @click="navigateToRegister" class="text-decoration-none">
          Regístrate aquí
        </v-btn>
      </p>
    </div>

    <!-- Error Alert -->
    <v-alert v-if="authStore.error" type="error" variant="tonal" class="mt-4" closable
      @click:close="authStore.clearError">
      {{ authStore.error }}
    </v-alert>

    <!-- Success Alert -->
    <v-alert v-if="successMessage" type="success" variant="tonal" class="mt-4" closable
      @click:close="successMessage = ''">
      {{ successMessage }}
    </v-alert>
  </v-form>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

// Composables
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Reactive state
const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const isFormValid = ref(false)
const successMessage = ref('')
const errors = reactive({
  email: [],
  password: [],
  general: []
})

// Validation rules
const emailRules = [
  v => !!v || 'El correo electrónico es requerido',
  v => /.+@.+\..+/.test(v) || 'El correo electrónico debe ser válido'
]

const passwordRules = [
  v => !!v || 'La contraseña es requerida',
  v => v.length >= 6 || 'La contraseña debe tener al menos 6 caracteres'
]

// Methods
const handleLogin = async () => {
  if (!isFormValid.value) return

  try {
    const result = await authStore.login({
      email: form.email,
      password: form.password,
      rememberMe: form.rememberMe
    })

    if (result.success) {
      successMessage.value = '¡Inicio de sesión exitoso!'
      toast.success('¡Bienvenido de vuelta!')

      // Redirect will be handled by the store
    } else {
      toast.error(result.error || 'Error al iniciar sesión')
    }
  } catch (error) {
    console.error('Login error:', error)
    toast.error('Error inesperado. Por favor intenta nuevamente.')
  }
}

const clearError = (field) => {
  if (errors[field]) {
    errors[field] = []
  }
  if (errors.general) {
    errors.general = []
  }
  authStore.clearError()
}

const navigateToRegister = () => {
  router.push('/auth/register')
}

const navigateToForgotPassword = () => {
  // Implement forgot password navigation
  toast.info('Funcionalidad de recuperación de contraseña próximamente')
}

// Auto-focus email field on mount
onMounted(async () => {
  await nextTick()

  // Clear any previous errors
  authStore.clearError()

  // Pre-fill email if available in localStorage (for remember me functionality)
  const savedEmail = localStorage.getItem('savedEmail')
  if (savedEmail && form.rememberMe) {
    form.email = savedEmail
  }
})

// Auto-save email when remember me is checked
watch(() => form.rememberMe, (newVal) => {
  if (newVal && form.email) {
    localStorage.setItem('savedEmail', form.email)
  } else {
    localStorage.removeItem('savedEmail')
  }
})
</script>

<style scoped>
.login-form {
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Form enhancements */
:deep(.v-text-field) {
  margin-bottom: 8px;
}

:deep(.v-text-field .v-field) {
  border-radius: 12px;
}

:deep(.v-btn--elevated) {
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

:deep(.v-btn--elevated:hover) {
  box-shadow: 0 6px 16px rgba(var(--v-theme-primary), 0.4);
  transform: translateY(-1px);
}

/* Focus states */
:deep(.v-text-field:focus-within .v-field) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

/* Checkbox customization */
:deep(.v-checkbox) {
  margin: 0;
}

:deep(.v-checkbox .v-selection-control__input) {
  color: rgb(var(--v-theme-primary));
}

/* Alert styling */
:deep(.v-alert) {
  border-radius: 12px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .login-form {
    padding: 0 8px;
  }
}
</style>