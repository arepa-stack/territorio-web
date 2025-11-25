<template>
  <v-form ref="registerForm" v-model="isFormValid" @submit.prevent="handleRegister" class="register-form">
    <div class="text-center mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">
        Crear Cuenta
      </h2>
      <p class="text-body-1 text-medium-emphasis">
        Únete al sistema de torneos de baloncesto
      </p>
    </div>

    <!-- Role Selection -->
    <div class="mb-4">
      <p class="text-body-2 font-weight-medium mb-3">
        ¿Qué tipo de usuario eres?
      </p>

      <v-chip-group v-model="form.role" selected-class="text-primary" column class="mb-3">
        <v-chip v-for="role in availableRoles" :key="role.value" :value="role.value" filter variant="outlined"
          size="large" class="mb-2">
          <v-icon start>{{ role.icon }}</v-icon>
          {{ role.label }}
        </v-chip>
      </v-chip-group>

      <p class="text-caption text-medium-emphasis">
        {{ getRoleDescription(form.role) }}
      </p>
    </div>

    <v-divider class="my-4" />

    <!-- Personal Information -->
    <h3 class="text-h6 mb-3">Información Personal</h3>

    <!-- Full Name -->
    <v-text-field v-model="form.fullName" label="Nombre Completo" prepend-inner-icon="mdi-account" :rules="nameRules"
      :error-messages="errors.fullName" variant="outlined" density="comfortable" class="mb-3"
      @input="clearError('fullName')" />

    <!-- Email -->
    <v-text-field v-model="form.email" label="Correo Electrónico" type="email" prepend-inner-icon="mdi-email"
      :rules="emailRules" :error-messages="errors.email" variant="outlined" density="comfortable" class="mb-3"
      @input="clearError('email')" />

    <!-- Phone -->
    <v-text-field v-model="form.phone" label="Teléfono (Opcional)" prepend-inner-icon="mdi-phone" variant="outlined"
      density="comfortable" class="mb-3" />

    <!-- Password -->
    <v-text-field v-model="form.password" :label="'Contraseña'" :type="showPassword ? 'text' : 'password'"
      prepend-inner-icon="mdi-lock" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" :rules="passwordRules"
      :error-messages="errors.password" variant="outlined" density="comfortable" class="mb-3"
      @click:append-inner="showPassword = !showPassword" @input="clearError('password')" />

    <!-- Confirm Password -->
    <v-text-field v-model="form.confirmPassword" :label="'Confirmar Contraseña'"
      :type="showConfirmPassword ? 'text' : 'password'" prepend-inner-icon="mdi-lock-check"
      :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'" :rules="confirmPasswordRules"
      :error-messages="errors.confirmPassword" variant="outlined" density="comfortable" class="mb-3"
      @click:append-inner="showConfirmPassword = !showConfirmPassword" @input="clearError('confirmPassword')" />

    <!-- Player-specific fields -->
    <div v-if="form.role === 'PLAYER'">
      <v-divider class="my-4" />
      <h3 class="text-h6 mb-3">Información Adicional (Jugador)</h3>

      <!-- CI (Cédula de Identidad) -->
      <v-text-field v-model="form.ci" label="Cédula de Identidad" prepend-inner-icon="mdi-id-card" :rules="ciRules"
        variant="outlined" density="comfortable" class="mb-3" />

      <!-- Birth Date -->
      <v-text-field v-model="form.birthDate" label="Fecha de Nacimiento" type="date" prepend-inner-icon="mdi-calendar"
        variant="outlined" density="comfortable" class="mb-3" />

      <!-- City -->
      <v-text-field v-model="form.city" label="Ciudad" prepend-inner-icon="mdi-map-marker" variant="outlined"
        density="comfortable" class="mb-3" />

      <!-- Position -->
      <v-select v-model="form.position" label="Posición de Juego" :items="basketballPositions"
        prepend-inner-icon="mdi-basketball" variant="outlined" density="comfortable" class="mb-3" />

      <!-- Height -->
      <v-text-field v-model="form.height" label="Altura (cm)" type="number" prepend-inner-icon="mdi-ruler"
        :rules="heightRules" variant="outlined" density="comfortable" class="mb-3" />

      <!-- Weight -->
      <v-text-field v-model="form.weight" label="Peso (kg)" type="number" prepend-inner-icon="mdi-weight"
        :rules="weightRules" variant="outlined" density="comfortable" class="mb-4" />
    </div>

    <!-- Terms and Conditions -->
    <v-checkbox v-model="form.acceptTerms" :rules="termsRules" color="primary" class="mb-3">
      <template #label>
        <span class="text-body-2">
          Acepto los
          <v-btn variant="text" size="small" color="primary" @click="showTermsDialog = true">
            términos y condiciones
          </v-btn>
          del servicio
        </span>
      </template>
    </v-checkbox>

    <!-- Register Button -->
    <v-btn type="submit" block size="large" color="primary" :loading="authStore.isLoading" :disabled="!isFormValid"
      class="mb-4" elevation="2">
      <v-icon start>mdi-account-plus</v-icon>
      Crear Cuenta
    </v-btn>

    <!-- Login Link -->
    <div class="text-center">
      <p class="text-body-2">
        ¿Ya tienes una cuenta?
        <v-btn variant="text" color="primary" @click="navigateToLogin" class="text-decoration-none">
          Inicia sesión aquí
        </v-btn>
      </p>
    </div>

    <!-- Error Alert -->
    <v-alert v-if="authStore.error" type="error" variant="tonal" class="mt-4" closable
      @click:close="authStore.clearError">
      {{ authStore.error }}
    </v-alert>

    <!-- Terms Dialog -->
    <v-dialog v-model="showTermsDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          Términos y Condiciones
        </v-card-title>
        <v-card-text class="text-body-1">
          <p class="mb-3">
            Al usar este sistema de gestión de torneos de baloncesto, aceptas los siguientes términos:
          </p>

          <h4 class="text-h6 mb-2">1. Uso Responsable</h4>
          <p class="mb-3">
            El sistema está diseñado para facilitar la organización y gestión de torneos de baloncesto de manera justa y
            responsable.
          </p>

          <h4 class="text-h6 mb-2">2. Información Veraz</h4>
          <p class="mb-3">
            Debes proporcionar información precisa y actualizada sobre tu perfil, equipos y participaciones en torneos.
          </p>

          <h4 class="text-h6 mb-2">3. Respeto y Comportamiento</h4>
          <p class="mb-3">
            Mantén un comportamiento respetuoso hacia otros usuarios. El sistema cuenta con moderación automática de
            comentarios.
          </p>

          <h4 class="text-h6 mb-2">4. Privacidad</h4>
          <p class="mb-3">
            Tu información personal será utilizada únicamente para los fines del torneo y no será compartida con
            terceros
            sin tu consentimiento.
          </p>

          <h4 class="text-h6 mb-2">5. Disponibilidad del Servicio</h4>
          <p class="mb-3">
            Nos esforzamos por mantener el servicio disponible, pero no garantizamos disponibilidad 24/7 debido a
            mantenimiento o problemas técnicos.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="showTermsDialog = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

// Composables
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Reactive state
const form = reactive({
  role: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  // Player-specific fields
  ci: '',
  birthDate: '',
  city: '',
  position: null,
  height: null,
  weight: null
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isFormValid = ref(false)
const showTermsDialog = ref(false)
const errors = reactive({
  fullName: [],
  email: [],
  password: [],
  confirmPassword: [],
  ci: []
})

// Available roles
const availableRoles = [
  {
    value: 'PLAYER',
    label: 'Jugador',
    icon: 'mdi-basketball',
    description: 'Participa en torneos, ve tus estadísticas y gestiona tu perfil de jugador.'
  },
  {
    value: 'TEAM_CAPTAIN',
    label: 'Capitán de Equipo',
    icon: 'mdi-account-group',
    description: 'Gestiona tu equipo, registra jugadores y participates en torneos.'
  },
  {
    value: 'ORGANIZER',
    label: 'Organizador',
    icon: 'mdi-trophy',
    description: 'Crea y administra torneos, gestiona zonas y venues.'
  },
  {
    value: 'ADMIN',
    label: 'Administrador',
    icon: 'mdi-shield-account',
    description: 'Control total del sistema, gestión de usuarios y configuraciones.'
  }
]

// Basketball positions
const basketballPositions = [
  { title: 'Base (Point Guard)', value: 'BASE' },
  { title: 'Escolta (Shooting Guard)', value: 'ESCOLTA' },
  { title: 'Alero (Small Forward)', value: 'ALERO' },
  { title: 'Ala Pivot (Power Forward)', value: 'ALA_PIVOT' },
  { title: 'Pivot (Center)', value: 'PIVOT' }
]

// Validation rules
const nameRules = [
  v => !!v || 'El nombre completo es requerido',
  v => v.length >= 2 || 'El nombre debe tener al menos 2 caracteres'
]

const emailRules = [
  v => !!v || 'El correo electrónico es requerido',
  v => /.+@.+\..+/.test(v) || 'El correo electrónico debe ser válido'
]

const passwordRules = [
  v => !!v || 'La contraseña es requerida',
  v => v.length >= 8 || 'La contraseña debe tener al menos 8 caracteres',
  v => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v) || 'La contraseña debe contener mayúsculas, minúsculas y números'
]

const confirmPasswordRules = computed(() => [
  v => !!v || 'Confirmar contraseña es requerido',
  v => v === form.password || 'Las contraseñas no coinciden'
])

const ciRules = [
  v => !v || v.length >= 6 || 'La cédula debe tener al menos 6 caracteres'
]

const heightRules = [
  v => !v || (v >= 140 && v <= 220) || 'La altura debe estar entre 140 y 220 cm'
]

const weightRules = [
  v => !v || (v >= 40 && v <= 150) || 'El peso debe estar entre 40 y 150 kg'
]

const termsRules = [
  v => v || 'Debes aceptar los términos y condiciones'
]

// Methods
const getRoleDescription = (role) => {
  const roleObj = availableRoles.find(r => r.value === role)
  return roleObj ? roleObj.description : 'Selecciona un tipo de usuario para ver la descripción'
}

const handleRegister = async () => {
  if (!isFormValid.value) return

  try {
    // Prepare user data
    const userData = {
      role: form.role,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password
    }

    // Add player-specific data if role is PLAYER
    if (form.role === 'PLAYER') {
      userData.ci = form.ci || undefined
      userData.birthDate = form.birthDate ? new Date(form.birthDate).toISOString() : undefined
      userData.city = form.city || undefined
      userData.position = form.position || undefined
      userData.height = form.height || undefined
      userData.weight = form.weight || undefined
      userData.profileCompleted = !!(form.ci && form.birthDate && form.position)
    }

    const result = await authStore.register(userData)

    if (result.success) {
      toast.success('¡Cuenta creada exitosamente!')
      // Redirect will be handled by the store
    } else {
      toast.error(result.error || 'Error al crear la cuenta')
    }
  } catch (error) {
    console.error('Registration error:', error)
    toast.error('Error inesperado. Por favor intenta nuevamente.')
  }
}

const clearError = (field) => {
  if (errors[field]) {
    errors[field] = []
  }
  authStore.clearError()
}

const navigateToLogin = () => {
  router.push('/auth/login')
}

// Auto-focus role selection on mount
onMounted(async () => {
  await nextTick()
  authStore.clearError()
})
</script>

<style scoped>
.register-form {
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

/* Role selection styling */
:deep(.v-chip-group) {
  gap: 8px;
}

:deep(.v-chip) {
  padding: 12px 16px;
  border-radius: 12px !important;
  font-weight: 500;
}

:deep(.v-chip--selected) {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-primary)) !important;
}

/* Form enhancements */
:deep(.v-text-field) {
  margin-bottom: 8px;
}

:deep(.v-text-field .v-field) {
  border-radius: 12px;
}

:deep(.v-select) {
  margin-bottom: 8px;
}

:deep(.v-btn--elevated) {
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

/* Focus states */
:deep(.v-text-field:focus-within .v-field) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

/* Alert styling */
:deep(.v-alert) {
  border-radius: 12px;
}

/* Terms checkbox */
:deep(.v-checkbox) {
  margin: 0;
}

/* Dialog styling */
:deep(.v-dialog .v-card) {
  border-radius: 16px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .register-form {
    padding: 0 8px;
  }

  :deep(.v-chip-group) {
    flex-direction: column;
  }

  :deep(.v-chip) {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>