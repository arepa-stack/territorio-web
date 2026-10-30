<template>
  <div class="flex flex-col gap-space-lg">
    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando perfil…</p>

    <template v-else-if="me">
      <header class="card flex flex-col gap-space-md p-space-lg sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-space-md">
          <img
            v-if="me.profilePicture"
            :src="me.profilePicture"
            :alt="me.fullName"
            class="h-16 w-16 shrink-0 rounded-full object-cover"
          />
          <span
            v-else
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-container font-headline-lg text-headline-lg text-white"
          >
            {{ initials }}
          </span>
          <div class="min-w-0">
            <h1 class="m-0 truncate font-headline-lg-mobile text-headline-lg-mobile uppercase">{{ me.fullName }}</h1>
            <p class="m-0 font-stat-mono text-stat-mono text-on-surface-variant">{{ me.ci || 'Sin cédula' }}</p>
            <p class="m-0 truncate text-body-sm text-on-surface-variant">{{ me.email }}</p>
          </div>
        </div>
        <div>
          <label class="btn-secondary cursor-pointer">
            <span class="icon">photo_camera</span>
            {{ uploadingPhoto ? 'Subiendo foto…' : 'Cambiar foto' }}
            <input type="file" accept="image/*" class="sr-only" :disabled="uploadingPhoto" @change="onPhotoSelected" />
          </label>
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
          <div class="grid gap-space-md sm:grid-cols-3">
            <div>
              <label class="field-label" for="p-birth">Fecha de nacimiento</label>
              <input id="p-birth" v-model="form.birthDate" class="input" type="date" />
            </div>
            <div>
              <label class="field-label" for="p-gender">Género</label>
              <select id="p-gender" v-model="form.gender" class="input">
                <option :value="null">Sin especificar</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="p-jersey-size">Talla de camiseta</label>
              <select id="p-jersey-size" v-model="form.jerseySize" class="input">
                <option :value="null">Sin especificar</option>
                <option v-for="s in jerseySizes" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>
        </section>

        <section class="card flex flex-col gap-space-md p-space-lg">
          <h2 class="label-tactical m-0 text-secondary">Contacto de emergencia</h2>
          <div class="grid gap-space-md sm:grid-cols-2">
            <div>
              <label class="field-label" for="p-em-name">Nombre de contacto</label>
              <input id="p-em-name" v-model.trim="form.emergencyContactName" class="input" placeholder="Ej. María Pérez (Madre)" />
            </div>
            <div>
              <label class="field-label" for="p-em-phone">Teléfono de emergencia</label>
              <input id="p-em-phone" v-model.trim="form.emergencyContactPhone" class="input" type="tel" placeholder="Ej. 0991234567" />
            </div>
          </div>
        </section>

        <section class="card flex flex-col gap-space-md p-space-lg">
          <div class="flex flex-wrap items-center justify-between gap-space-xs">
            <h2 class="label-tactical m-0 text-secondary">Representante legal (Menores de 18 años)</h2>
            <span v-if="isMinor" class="rounded bg-tertiary px-2 py-0.5 text-label-sm font-bold uppercase text-on-surface">
              Requerido por ser menor de edad
            </span>
          </div>
          <div class="grid gap-space-md sm:grid-cols-3">
            <div>
              <label class="field-label" for="p-guard-name">Nombre del representante</label>
              <input id="p-guard-name" v-model.trim="form.guardianName" class="input" />
            </div>
            <div>
              <label class="field-label" for="p-guard-ci">Cédula del representante</label>
              <input id="p-guard-ci" v-model.trim="form.guardianCi" class="input" />
            </div>
            <div>
              <label class="field-label" for="p-guard-phone">Teléfono del representante</label>
              <input id="p-guard-phone" v-model.trim="form.guardianPhone" class="input" type="tel" />
            </div>
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

      <!-- Private Identity Document (Task 16) -->
      <section class="card flex flex-col gap-space-md p-space-lg">
        <div class="flex flex-wrap items-center justify-between gap-space-sm">
          <div>
            <h2 class="label-tactical m-0 text-secondary">Documento de identidad (Privado)</h2>
            <p class="m-0 mt-1 text-body-sm text-on-surface-variant">
              Usado por organizadores para verificar edad y categoría en torneos con control de identidad.
            </p>
          </div>
          <StatusChip v-if="idDoc" :status="idDoc.status" />
          <span v-else class="label-tactical text-on-surface-variant">Sin subir</span>
        </div>

        <p v-if="idDoc?.status === 'REJECTED' && idDoc.reviewNote" class="m-0 rounded bg-error/15 p-space-sm text-body-sm text-error">
          Motivo de rechazo: {{ idDoc.reviewNote }}
        </p>

        <div class="flex flex-wrap items-center gap-space-sm">
          <label class="btn-secondary cursor-pointer">
            <span class="icon">upload_file</span>
            {{ uploadingDoc ? 'Subiendo…' : (idDoc ? 'Reemplazar documento' : 'Subir cédula / documento') }}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              class="sr-only"
              :disabled="uploadingDoc"
              @change="onDocSelected"
            />
          </label>
          <button v-if="idDoc" type="button" class="btn-ghost" @click="viewMyDoc">
            <span class="icon">visibility</span> Ver mi documento
          </button>
        </div>
      </section>

      <!-- Captain Role Upgrade Request (Task 13) -->
      <section v-if="authStore.userRole === 'PLAYER'" class="card flex flex-col gap-space-md p-space-lg">
        <div class="flex flex-wrap items-center justify-between gap-space-sm">
          <div>
            <h2 class="label-tactical m-0 text-secondary">Quiero ser capitán</h2>
            <p class="m-0 mt-1 text-body-sm text-on-surface-variant">
              Solicita el rol de capitán para poder crear y gestionar tu propio equipo.
            </p>
          </div>
          <StatusChip v-if="captainRequest" :status="captainRequest.status" />
        </div>

        <div v-if="captainRequest && captainRequest.status === 'PENDING'" class="rounded bg-surface-container-low p-space-md text-body-sm">
          <p class="m-0 font-bold">Solicitud en revisión por administración</p>
          <p class="m-0 mt-1 text-on-surface-variant">
            Equipo propuesto: <strong>{{ captainRequest.teamNameProposal }}</strong> ({{ captainRequest.city }} · {{ captainRequest.category }})
          </p>
        </div>

        <template v-else>
          <p v-if="captainRequest?.status === 'REJECTED'" class="m-0 rounded bg-error/15 p-space-sm text-body-sm text-error">
            Solicitud anterior rechazada{{ captainRequest.responseNote ? `: ${captainRequest.responseNote}` : '.' }} Puedes enviar una nueva.
          </p>
          <form class="flex flex-col gap-space-md" @submit.prevent="submitCaptainRequest">
            <div class="grid gap-space-md sm:grid-cols-3">
              <div>
                <label class="field-label" for="cr-team">Nombre del equipo propuesto</label>
                <input id="cr-team" v-model.trim="captainForm.teamNameProposal" class="input" required />
              </div>
              <div>
                <label class="field-label" for="cr-city">Ciudad</label>
                <input id="cr-city" v-model.trim="captainForm.city" class="input" required />
              </div>
              <div>
                <label class="field-label" for="cr-cat">Categoría</label>
                <select id="cr-cat" v-model="captainForm.category" class="input" required>
                  <option value="OPEN">Libre</option>
                  <option value="SUB_13">Sub-13</option>
                  <option value="SUB_15">Sub-15</option>
                  <option value="SUB_17">Sub-17</option>
                  <option value="SUB_19">Sub-19</option>
                  <option value="VETERANS">Veteranos +35</option>
                  <option value="FEMALE">Femenina</option>
                  <option value="MIXED">Mixta</option>
                </select>
              </div>
            </div>
            <div>
              <label class="field-label" for="cr-reason">Mensaje / motivo (opcional)</label>
              <input id="cr-reason" v-model.trim="captainForm.reason" class="input" placeholder="Ej. Tengo equipo armado en mi barrio para el torneo apertura" />
            </div>
            <button type="submit" class="btn-secondary self-start" :disabled="submittingCaptainReq">
              <span class="icon">military_tech</span>
              {{ submittingCaptainReq ? 'Enviando…' : 'Solicitar ser capitán' }}
            </button>
          </form>
        </template>
      </section>

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
import playersService from '@/services/players'
import usersService from '@/services/users'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { POSITIONS, toOptions } from '@/utils/labels'
import StatusChip from '@/components/ui/StatusChip.vue'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const positions = toOptions(POSITIONS)
const jerseySizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const me = ref(null)
const idDoc = ref(null)
const captainRequest = ref(null)
const loading = ref(true)
const saving = ref(false)
const uploadingPhoto = ref(false)
const uploadingDoc = ref(false)
const submittingCaptainReq = ref(false)

const form = reactive({
  fullName: '',
  phone: '',
  city: '',
  birthDate: '',
  gender: null,
  jerseySize: null,
  emergencyContactName: '',
  emergencyContactPhone: '',
  guardianName: '',
  guardianCi: '',
  guardianPhone: '',
  position: null,
  height: null,
  weight: null
})

const captainForm = reactive({
  teamNameProposal: '',
  city: '',
  category: 'OPEN',
  reason: ''
})

const initials = computed(() =>
  (me.value?.fullName || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
)

const isMinor = computed(() => {
  if (!form.birthDate) return false
  const birth = new Date(form.birthDate)
  if (Number.isNaN(birth.getTime())) return false
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age < 18
})

const fill = u => {
  me.value = u
  Object.assign(form, {
    fullName: u.fullName || '',
    phone: u.phone || '',
    city: u.city || '',
    birthDate: u.birthDate ? u.birthDate.slice(0, 10) : '',
    gender: u.gender || null,
    jerseySize: u.jerseySize || null,
    emergencyContactName: u.emergencyContactName || '',
    emergencyContactPhone: u.emergencyContactPhone || '',
    guardianName: u.guardianName || '',
    guardianCi: u.guardianCi || '',
    guardianPhone: u.guardianPhone || '',
    position: u.position || null,
    height: u.height ?? null,
    weight: u.weight ?? null
  })
  if (!captainForm.city && u.city) captainForm.city = u.city
}

const save = async () => {
  saving.value = true
  try {
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

const onPhotoSelected = async e => {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingPhoto.value = true
  try {
    const res = await playersService.uploadMyPhoto(file)
    if (res.data?.profilePicture) {
      me.value.profilePicture = res.data.profilePicture
    } else {
      fill((await authService.getProfile()).data)
    }
    toast.success('Foto actualizada')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo subir la foto'))
  } finally {
    uploadingPhoto.value = false
    e.target.value = ''
  }
}

const onDocSelected = async e => {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingDoc.value = true
  try {
    const res = await usersService.uploadIdentityDocument(file)
    idDoc.value = res.data
    toast.success('Documento de identidad subido')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo subir el documento'))
  } finally {
    uploadingDoc.value = false
    e.target.value = ''
  }
}

const viewMyDoc = async () => {
  if (!me.value?.id) return
  try {
    const res = await usersService.fetchIdentityDocumentBlob(me.value.id)
    const url = URL.createObjectURL(res.data)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo abrir el documento'))
  }
}

const submitCaptainRequest = async () => {
  submittingCaptainReq.value = true
  try {
    const res = await usersService.createCaptainRequest(captainForm)
    captainRequest.value = res.data
    toast.success('Solicitud de capitán enviada')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo enviar la solicitud'))
  } finally {
    submittingCaptainReq.value = false
  }
}

const logout = async () => {
  await authStore.logout()
  router.push('/auth/login')
}

onMounted(async () => {
  try {
    const [profileRes, docRes, capRes] = await Promise.all([
      authService.getProfile(),
      usersService.getMyIdentityDocumentInfo().catch(() => ({ data: null })),
      usersService.getMyCaptainRequest().catch(() => ({ data: null }))
    ])
    fill(profileRes.data)
    idDoc.value = docRes.data
    captainRequest.value = capRes.data
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cargar tu perfil'))
  } finally {
    loading.value = false
  }
})
</script>
