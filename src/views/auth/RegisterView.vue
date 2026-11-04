<template>
  <div class="flex flex-col gap-space-md">
    <div>
      <h1 class="m-0 font-headline-lg text-headline-lg uppercase">Crea tu cuenta</h1>
      <p class="m-0 mt-1 text-body-md text-on-surface-variant">El resto de tus datos los completas en tu perfil.</p>
    </div>

    <form class="flex flex-col gap-space-md" novalidate @submit.prevent="handleRegister">
      <fieldset class="m-0 border-0 p-0">
        <legend class="field-label">Voy a ser</legend>
        <div class="grid grid-cols-3 gap-space-xs">
          <label
            v-for="r in roles"
            :key="r.value"
            class="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-solid px-space-xs py-space-sm text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-2"
            :class="form.role === r.value ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/60 bg-surface-container-low'"
            :title="r.description"
          >
            <input v-model="form.role" type="radio" name="role" :value="r.value" class="sr-only" />
            <span class="icon text-[24px]" :class="form.role === r.value ? 'text-primary' : 'text-on-surface-variant'">{{ r.icon }}</span>
            <span class="text-body-sm font-bold">{{ r.label }}</span>
          </label>
        </div>
        <p class="m-0 mt-space-xs text-body-sm text-on-surface-variant">{{ roles.find(r => r.value === form.role)?.description }}</p>
      </fieldset>

      <div>
        <label class="field-label" for="reg-name">Nombre completo *</label>
        <input id="reg-name" v-model.trim="form.fullName" class="input" autocomplete="name" required />
      </div>
      <div>
        <label class="field-label" for="reg-email">Email *</label>
        <input id="reg-email" v-model.trim="form.email" class="input" type="email" autocomplete="email" required />
      </div>
      <div class="grid gap-space-md sm:grid-cols-2">
        <div>
          <label class="field-label" for="reg-ci">Cédula</label>
          <input id="reg-ci" v-model.trim="form.ci" class="input font-mono" placeholder="V-12345678" />
        </div>
        <div>
          <label class="field-label" for="reg-phone">Teléfono</label>
          <input id="reg-phone" v-model.trim="form.phone" class="input" type="tel" autocomplete="tel" />
        </div>
      </div>
      <div class="grid gap-space-md sm:grid-cols-2">
        <div>
          <label class="field-label" for="reg-pass">Contraseña *</label>
          <input id="reg-pass" v-model="form.password" class="input" type="password" autocomplete="new-password" required />
        </div>
        <div>
          <label class="field-label" for="reg-pass2">Confirmar *</label>
          <input id="reg-pass2" v-model="form.confirmPassword" class="input" type="password" autocomplete="new-password" required />
        </div>
      </div>

      <p v-if="error" role="alert" class="m-0 flex items-center gap-space-sm rounded border border-solid border-error/50 bg-error/10 p-space-sm text-body-sm text-error">
        <span class="icon">error</span>{{ error }}
      </p>

      <button type="submit" class="btn-primary w-full" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? 'Creando…' : 'Crear cuenta' }}
      </button>
    </form>

    <p class="m-0 text-center text-body-md text-on-surface-variant">
      ¿Ya tienes cuenta?
      <router-link :to="{ path: '/auth/login', query: $route.query }" class="font-bold text-primary no-underline hover:underline">Iniciar sesión</router-link>
    </p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const authStore = useAuthStore()
const route = useRoute()

// Referee, moderator and admin are assigned by an admin (the API rejects them here)
const roles = [
  { value: 'PLAYER', label: 'Jugador / Aficionado', icon: 'sports_basketball', description: 'Juega en equipos, sigue tus estadísticas o comenta partidos como aficionado.' },
  { value: 'TEAM_CAPTAIN', label: 'Capitán', icon: 'groups', description: 'Arma y gestiona un equipo.' },
  { value: 'ORGANIZER', label: 'Organizador', icon: 'emoji_events', description: 'Crea y administra torneos.' }
]

// ?role=TEAM_CAPTAIN preselects the account type (public CTAs link here)
const form = reactive({
  role: roles.some(r => r.value === route.query.role) ? route.query.role : 'PLAYER',
  fullName: '',
  email: '',
  ci: '',
  phone: '',
  password: '',
  confirmPassword: ''
})
const error = ref('')

const validate = () => {
  if (!form.fullName || !form.email || !form.password) return 'Completa nombre, email y contraseña.'
  if (!/.+@.+\..+/.test(form.email)) return 'El email no es válido.'
  if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden.'
  return ''
}

const handleRegister = async () => {
  error.value = validate()
  if (error.value) return

  // ponytail: city, position, height and birth date are filled in the profile after signing up
  const payload = {
    role: form.role,
    fullName: form.fullName,
    email: form.email,
    password: form.password,
    confirmPassword: form.confirmPassword,
    ...(form.ci && { ci: form.ci }),
    ...(form.phone && { phone: form.phone })
  }

  const result = await authStore.register(payload)
  if (result.success) {
    toast.success('¡Cuenta creada!')
  } else {
    error.value = [].concat(result.error || 'No se pudo crear la cuenta').join(' · ')
  }
}
</script>
