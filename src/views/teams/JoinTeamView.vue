<template>
  <div class="min-h-screen bg-surface font-body text-on-surface">
    <PublicHeader />

    <main class="mx-auto flex max-w-xl flex-col gap-space-lg px-gutter py-space-lg md:px-margin-md">
      <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando invitación…</p>
      <section v-else-if="!invite" class="card flex flex-col gap-space-sm p-space-lg">
        <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase">Invitación no encontrada</h1>
        <p class="m-0 text-body-md text-on-surface-variant">El link no existe o está mal copiado. Pídele uno nuevo a tu capitán.</p>
      </section>

      <template v-else>
        <section class="card flex flex-col gap-space-md p-space-lg">
          <span class="label-tactical text-secondary">Te invitaron a unirte</span>
          <div class="flex items-center gap-space-md">
            <img v-if="invite.team.logoUrl" :src="invite.team.logoUrl" :alt="`Logo de ${invite.team.name}`" class="h-16 w-16 shrink-0 rounded-lg object-cover" />
            <div v-else class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary-container font-headline-lg text-headline-lg text-white">
              {{ invite.team.name.charAt(0) }}
            </div>
            <div class="min-w-0">
              <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase leading-none">{{ invite.team.name }}</h1>
              <p class="m-0 mt-1 text-body-sm text-on-surface-variant">
                {{ CATEGORIES[invite.team.category] || invite.team.category }}{{ invite.team.city ? ' · ' + invite.team.city : '' }}
              </p>
              <p class="m-0 text-body-sm text-on-surface-variant">Capitán: <strong class="text-on-surface">{{ invite.captain.fullName }}</strong></p>
            </div>
          </div>
          <p v-if="invite.valid" class="m-0 flex items-center gap-space-xs text-body-sm text-on-surface-variant">
            <span class="icon text-[18px] text-tertiary">schedule</span> Válida hasta el {{ formatDate(invite.expiresAt) }}
          </p>
          <p v-else role="alert" class="m-0 flex items-center gap-space-xs rounded border border-solid border-error/50 bg-error/10 p-space-sm text-body-sm text-error">
            <span class="icon text-[18px]">link_off</span>{{ invite.message }}. Pídele un link nuevo a tu capitán.
          </p>
        </section>

        <template v-if="invite.valid">
          <!-- Not logged in: come back here after auth -->
          <section v-if="!authStore.isAuthenticated" class="card flex flex-col gap-space-sm p-space-lg">
            <p class="m-0 text-body-md">Inicia sesión o crea tu cuenta de jugador para unirte al equipo.</p>
            <div class="grid gap-space-sm sm:grid-cols-2">
              <router-link :to="{ path: '/auth/login', query: { redirect: route.fullPath } }" class="btn-secondary">
                <span class="icon">login</span> Iniciar sesión
              </router-link>
              <router-link :to="{ path: '/auth/register', query: { redirect: route.fullPath } }" class="btn-primary">
                <span class="icon">person_add</span> Crear cuenta
              </router-link>
            </div>
          </section>

          <section v-else-if="!['PLAYER', 'TEAM_CAPTAIN'].includes(authStore.user?.role)" class="card p-space-lg">
            <p class="m-0 text-body-md text-on-surface-variant">
              Solo las cuentas de jugador o capitán pueden unirse con un link. Entra con tu cuenta de jugador para aceptar la invitación.
            </p>
          </section>

          <form v-else class="card flex flex-col gap-space-md p-space-lg" @submit.prevent="join">
            <h2 class="m-0 font-title-sm text-title-sm uppercase">Elige tu dorsal y posición</h2>
            <div class="grid gap-space-md sm:grid-cols-2">
              <div>
                <label class="field-label" for="join-jersey">Dorsal *</label>
                <input id="join-jersey" v-model.number="form.jerseyNumber" class="input font-mono" type="number" min="0" max="99" required />
              </div>
              <div>
                <label class="field-label" for="join-pos">Posición *</label>
                <select id="join-pos" v-model="form.position" class="input" required>
                  <option v-for="o in positionOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
            </div>
            <p v-if="error" role="alert" class="m-0 flex items-center gap-space-xs rounded border border-solid border-error/50 bg-error/10 p-space-sm text-body-sm text-error">
              <span class="icon text-[18px]">error</span>{{ error }}
            </p>
            <button type="submit" class="btn-primary" :disabled="busy || form.jerseyNumber === ''">
              <span class="icon">how_to_reg</span> {{ busy ? 'Uniéndote…' : `Unirme a ${invite.team.name}` }}
            </button>
          </form>
        </template>
      </template>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import PublicHeader from '@/components/PublicHeader.vue'
import invitesService from '@/services/invites'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { CATEGORIES, POSITIONS, formatDate, toOptions } from '@/utils/labels'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const positionOptions = toOptions(POSITIONS)

const loading = ref(true)
const busy = ref(false)
const error = ref('')
const invite = ref(null)
const form = ref({ jerseyNumber: '', position: authStore.user?.position || 'BASE' })

const join = async () => {
  error.value = ''
  busy.value = true
  try {
    const { data } = await invitesService.join(route.params.token, form.value)
    toast.success(`¡Ya eres parte de ${data.team.name}!`)
    router.push('/app/player/teams')
  } catch (err) {
    error.value = handleApiError(err, 'No se pudo unir al equipo')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    invite.value = (await invitesService.preview(route.params.token)).data
  } catch {
    invite.value = null
  } finally {
    loading.value = false
  }
})
</script>
