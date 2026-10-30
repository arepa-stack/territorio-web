<template>
  <div class="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center p-space-md">
    <div class="card flex flex-col gap-space-md p-space-lg">
      <div>
        <span class="label-tactical text-secondary">Reclamación de cuenta</span>
        <h1 class="m-0 font-headline-md text-headline-md uppercase">Activa tu perfil de jugador</h1>
      </div>

      <p v-if="loading" class="text-body-md text-on-surface-variant">Verificando enlace de invitación…</p>
      <div v-else-if="previewError" class="flex flex-col gap-space-md">
        <p class="m-0 rounded bg-error/15 p-space-sm text-body-sm text-error">{{ previewError }}</p>
        <router-link to="/auth/login" class="btn-secondary text-center">Ir a iniciar sesión</router-link>
      </div>

      <template v-else-if="preview">
        <div class="rounded bg-surface-container-low p-space-md text-body-sm">
          <p class="m-0">
            Jugador: <strong>{{ preview.playerFullName }}</strong>
          </p>
          <p class="m-0 mt-1 text-on-surface-variant">
            Equipo: <strong>{{ preview.teamName }}</strong>
          </p>
        </div>

        <p class="m-0 text-body-sm text-on-surface-variant">
          Tu capitán te registró en el equipo. Confirma tu número de cédula y define tu correo y contraseña para acceder a tu cuenta.
        </p>

        <form class="flex flex-col gap-space-md" @submit.prevent="submitClaim">
          <div>
            <label class="field-label" for="claim-ci">Número de cédula (verificación)</label>
            <input id="claim-ci" v-model.trim="form.ci" class="input" required placeholder="Ingresa tu cédula" />
          </div>
          <div>
            <label class="field-label" for="claim-email">Tu correo electrónico</label>
            <input id="claim-email" v-model.trim="form.email" type="email" class="input" required placeholder="tu@correo.com" />
          </div>
          <div>
            <label class="field-label" for="claim-password">Nueva contraseña</label>
            <input
              id="claim-password"
              v-model="form.password"
              type="password"
              minlength="6"
              class="input"
              required
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="submitting">
            <span class="icon">verified_user</span>
            {{ submitting ? 'Activando cuenta…' : 'Reclamar mi cuenta' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import teamsService from '@/services/teams'
import { handleApiError } from '@/services/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const submitting = ref(false)
const preview = ref(null)
const previewError = ref('')

const form = reactive({
  ci: '',
  email: '',
  password: ''
})

const submitClaim = async () => {
  submitting.value = true
  try {
    await teamsService.claimAccount(route.params.token, form)
    toast.success('¡Cuenta activada! Ya puedes iniciar sesión con tu correo y contraseña.')
    router.push('/auth/login')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo reclamar la cuenta'))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await teamsService.previewClaimToken(route.params.token)
    preview.value = res.data
  } catch (error) {
    previewError.value = handleApiError(error, 'El enlace de reclamación es inválido o ha expirado')
  } finally {
    loading.value = false
  }
})
</script>
