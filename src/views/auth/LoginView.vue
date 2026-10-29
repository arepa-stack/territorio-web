<template>
  <div class="flex flex-col gap-space-lg">
    <div>
      <h1 class="m-0 font-headline-lg text-headline-lg uppercase">Entrar a la cancha</h1>
      <p class="m-0 mt-1 text-body-md text-on-surface-variant">Inicia sesión para seguir tus torneos.</p>
    </div>

    <form class="flex flex-col gap-space-md" novalidate @submit.prevent="handleLogin">
      <div>
        <label class="field-label" for="login-email">Email</label>
        <input
          id="login-email"
          v-model.trim="form.email"
          class="input"
          type="email"
          autocomplete="email"
          placeholder="ejemplo@correo.com"
          required
        />
      </div>

      <div>
        <div class="flex items-baseline justify-between">
          <label class="field-label" for="login-password">Contraseña</label>
          <router-link to="/auth/forgot-password" class="text-body-sm text-primary no-underline hover:underline">
            ¿Olvidaste tu contraseña?
          </router-link>
        </div>
        <div class="relative">
          <input
            id="login-password"
            v-model="form.password"
            class="input pr-12"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
          />
          <button
            type="button"
            class="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent text-on-surface-variant"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="showPassword = !showPassword"
          >
            <span class="icon">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>
      </div>

      <p v-if="error" role="alert" class="m-0 flex items-center gap-space-sm rounded border border-solid border-error/50 bg-error/10 p-space-sm text-body-sm text-error">
        <span class="icon">error</span>{{ error }}
      </p>

      <button type="submit" class="btn-primary w-full" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? 'Entrando…' : 'Iniciar sesión' }}
      </button>
    </form>

    <p class="m-0 text-center text-body-md text-on-surface-variant">
      ¿No tienes cuenta?
      <router-link :to="{ path: '/auth/register', query: $route.query }" class="font-bold text-primary no-underline hover:underline">Crear cuenta</router-link>
    </p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const authStore = useAuthStore()

const form = reactive({ email: '', password: '' })
const showPassword = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  if (!form.email || !form.password) {
    error.value = 'Escribe tu email y tu contraseña.'
    return
  }
  const result = await authStore.login({ email: form.email, password: form.password })
  if (result.success) {
    toast.success('¡Bienvenido de vuelta!')
  } else {
    // The store already redirects on success; on failure the API message is shown here
    error.value = result.error || 'Email o contraseña incorrectos'
  }
}
</script>
