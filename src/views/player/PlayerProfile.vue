<template>
  <div class="flex flex-col gap-space-lg">
    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando perfil…</p>

    <template v-else-if="me">
      <header class="card flex items-center gap-space-md p-space-lg">
        <span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-container font-headline-lg text-headline-lg text-white">
          {{ initials }}
        </span>
        <div class="min-w-0">
          <h1 class="m-0 truncate font-headline-lg-mobile text-headline-lg-mobile uppercase">{{ me.fullName }}</h1>
          <p class="m-0 font-stat-mono text-stat-mono text-on-surface-variant">{{ me.ci || 'Sin cédula' }}</p>
          <p class="m-0 truncate text-body-sm text-on-surface-variant">{{ me.email }}</p>
        </div>
      </header>

      <form class="flex flex-col gap-space-lg" novalidate @submit.prevent="save">
        <section class="card flex flex-col gap-space-md p-space-lg">
          <h2 class="label-tactical m-0 text-secondary">Datos personales</h2>
          <div>
            <label class="field-label" for="p-name">Nombre completo</label>
            <input id="p-name" v-model.trim="form.fullName" class="input" autocomplete="name" />
          </div>
          <div class="grid gap-space-md sm:grid-cols-2">
            <div>
              <label class="field-label" for="p-phone">Teléfono</label>
              <input id="p-phone" v-model.trim="form.phone" class="input" type="tel" autocomplete="tel" />
            </div>
            <div>
              <label class="field-label" for="p-city">Ciudad</label>
              <input id="p-city" v-model.trim="form.city" class="input" />
            </div>
          </div>
          <div class="sm:w-1/2">
            <label class="field-label" for="p-birth">Fecha de nacimiento</label>
            <input id="p-birth" v-model="form.birthDate" class="input" type="date" />
          </div>
        </section>

        <section class="card flex flex-col gap-space-md p-space-lg">
          <h2 class="label-tactical m-0 text-secondary">Datos de juego</h2>
          <div>
            <span class="field-label">Posición</span>
            <div class="flex flex-wrap gap-space-xs">
              <button
                v-for="p in positions"
                :key="p.value"
                type="button"
                class="filter-chip"
                :aria-pressed="form.position === p.value"
                @click="form.position = p.value"
              >{{ p.label }}</button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-space-md">
            <div>
              <label class="field-label" for="p-height">Altura (cm)</label>
              <input id="p-height" v-model.number="form.height" class="input" type="number" min="120" max="250" />
            </div>
            <div>
              <label class="field-label" for="p-weight">Peso (kg)</label>
              <input id="p-weight" v-model.number="form.weight" class="input" type="number" min="30" max="200" />
            </div>
          </div>
        </section>

        <button type="submit" class="btn-primary" :disabled="saving">
          <span class="icon">save</span> {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>

      <section class="card flex flex-col gap-space-xs p-space-md">
        <h2 class="label-tactical m-0 px-space-sm text-on-surface-variant">Cuenta</h2>
        <router-link to="/auth/forgot-password" class="btn-ghost justify-start text-on-surface">
          <span class="icon">key</span> Cambiar contraseña
        </router-link>
        <button type="button" class="btn-ghost justify-start text-error" @click="logout">
          <span class="icon">logout</span> Cerrar sesión
        </button>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import authService from '@/services/auth'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { POSITIONS, toOptions } from '@/utils/labels'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const positions = toOptions(POSITIONS)

const me = ref(null)
const loading = ref(true)
const saving = ref(false)
const form = reactive({ fullName: '', phone: '', city: '', birthDate: '', position: null, height: null, weight: null })

const initials = computed(() =>
  (me.value?.fullName || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
)

const fill = u => {
  me.value = u
  Object.assign(form, {
    fullName: u.fullName || '',
    phone: u.phone || '',
    city: u.city || '',
    birthDate: u.birthDate ? u.birthDate.slice(0, 10) : '',
    position: u.position || null,
    height: u.height ?? null,
    weight: u.weight ?? null
  })
}

const save = async () => {
  saving.value = true
  try {
    // Only send what has a value; empty fields keep their current value
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '' && v !== null))
    const res = await authService.updateProfile(payload)
    fill(res.data)
    toast.success('Perfil actualizado')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo guardar'))
  } finally {
    saving.value = false
  }
}

const logout = async () => {
  await authStore.logout()
  router.push('/auth/login')
}

onMounted(async () => {
  try {
    fill((await authService.getProfile()).data)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cargar tu perfil'))
  } finally {
    loading.value = false
  }
})
</script>
