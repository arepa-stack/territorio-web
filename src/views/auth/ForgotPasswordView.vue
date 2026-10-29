<template>
  <div class="flex flex-col gap-space-lg">
    <!-- Step 3: set a new password (link from the email carries ?token=) -->
    <template v-if="token">
      <div>
        <h1 class="m-0 font-headline-lg text-headline-lg uppercase">Crea tu nueva contraseña</h1>
        <p class="m-0 mt-1 text-body-md text-on-surface-variant">Mínimo 6 caracteres.</p>
      </div>
      <form v-if="!done" class="flex flex-col gap-space-md" novalidate @submit.prevent="resetPassword">
        <div>
          <label class="field-label" for="new-pass">Nueva contraseña</label>
          <input id="new-pass" v-model="password" class="input" type="password" autocomplete="new-password" />
        </div>
        <div>
          <label class="field-label" for="new-pass2">Confirmar contraseña</label>
          <input id="new-pass2" v-model="confirm" class="input" type="password" autocomplete="new-password" />
        </div>
        <p v-if="error" role="alert" class="m-0 text-body-sm text-error">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="busy">Guardar contraseña</button>
      </form>
      <div v-else class="flex flex-col gap-space-md">
        <p class="m-0 flex items-center gap-space-sm text-body-md text-tertiary"><span class="icon">check_circle</span>Contraseña actualizada.</p>
        <router-link to="/auth/login" class="btn-primary">Iniciar sesión</router-link>
      </div>
    </template>

    <!-- Step 1 and 2: ask for the email, then confirm it was sent -->
    <template v-else>
      <div>
        <h1 class="m-0 font-headline-lg text-headline-lg uppercase">{{ sent ? 'Revisa tu correo' : '¿Olvidaste tu contraseña?' }}</h1>
        <p class="m-0 mt-1 text-body-md text-on-surface-variant">
          <template v-if="sent">Si <strong>{{ email }}</strong> tiene una cuenta, le enviamos un enlace. Vence en 1 hora.</template>
          <template v-else>Escribe el email de tu cuenta y te enviamos un enlace para crear una nueva.</template>
        </p>
      </div>
      <form v-if="!sent" class="flex flex-col gap-space-md" novalidate @submit.prevent="requestLink">
        <div>
          <label class="field-label" for="forgot-email">Email</label>
          <input id="forgot-email" v-model.trim="email" class="input" type="email" autocomplete="email" />
        </div>
        <p v-if="error" role="alert" class="m-0 text-body-sm text-error">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="busy">Enviar enlace</button>
      </form>
      <button v-else type="button" class="btn-secondary w-full" :disabled="busy" @click="requestLink">Reenviar</button>
    </template>

    <router-link to="/auth/login" class="btn-ghost self-center">
      <span class="icon">arrow_back</span> Volver a iniciar sesión
    </router-link>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import authService from '@/services/auth'
import { handleApiError } from '@/services/api'

const route = useRoute()
const token = computed(() => route.query.token)

const email = ref('')
const password = ref('')
const confirm = ref('')
const sent = ref(false)
const done = ref(false)
const busy = ref(false)
const error = ref('')

const requestLink = async () => {
  error.value = ''
  if (!/.+@.+\..+/.test(email.value)) {
    error.value = 'Escribe un email válido.'
    return
  }
  busy.value = true
  try {
    await authService.forgotPassword(email.value)
    sent.value = true
  } catch (e) {
    error.value = handleApiError(e, 'No se pudo enviar el enlace')
  } finally {
    busy.value = false
  }
}

const resetPassword = async () => {
  error.value = ''
  if (password.value.length < 6) return (error.value = 'La contraseña debe tener al menos 6 caracteres.')
  if (password.value !== confirm.value) return (error.value = 'Las contraseñas no coinciden.')
  busy.value = true
  try {
    await authService.resetPassword({ token: token.value, newPassword: password.value, confirmPassword: confirm.value })
    done.value = true
  } catch (e) {
    error.value = handleApiError(e, 'El enlace no es válido o ya venció')
  } finally {
    busy.value = false
  }
}
</script>
