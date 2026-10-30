<template>
  <div class="flex flex-col gap-space-lg">
    <div>
      <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Permisos y usuarios</h1>
      <p class="m-0 mt-1 text-body-md text-on-surface-variant">
        <span class="font-stat-mono tabular">{{ users.length }}</span> usuarios activos. Asigna árbitros, capitanes y moderadores desde aquí.
      </p>
    </div>

    <!-- Pending Captain Upgrade Requests (Task 13) -->
    <section v-if="pendingCaptainRequests.length" class="flex flex-col gap-space-sm">
      <div class="flex items-center justify-between">
        <h2 class="m-0 font-headline-md text-headline-md uppercase text-secondary">
          Solicitudes para ser capitán ({{ pendingCaptainRequests.length }})
        </h2>
      </div>
      <div class="grid gap-space-sm md:grid-cols-2">
        <article
          v-for="req in pendingCaptainRequests"
          :key="req.id"
          class="card flex flex-col justify-between gap-space-md border-l-4 border-l-secondary p-space-md"
        >
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-space-xs">
              <strong class="font-title-sm text-title-sm">{{ req.user?.fullName || 'Jugador' }}</strong>
              <span class="font-stat-mono text-body-sm text-on-surface-variant">{{ req.user?.ci || 'Sin CI' }}</span>
            </div>
            <p class="m-0 text-body-sm text-on-surface-variant">{{ req.user?.email }}</p>
            <p class="m-0 mt-1 text-body-sm">
              Equipo propuesto: <strong>{{ req.teamNameProposal }}</strong> ({{ req.city }} · {{ req.category }})
            </p>
            <p v-if="req.reason" class="m-0 text-body-sm italic text-on-surface-variant">"{{ req.reason }}"</p>
          </div>
          <div class="flex gap-space-xs">
            <button
              type="button"
              class="btn-danger flex-1"
              :disabled="resolvingReq === req.id"
              @click="resolveCaptainReq(req, 'REJECTED')"
            >
              Rechazar
            </button>
            <button
              type="button"
              class="btn-primary flex-1"
              :disabled="resolvingReq === req.id"
              @click="resolveCaptainReq(req, 'APPROVED')"
            >
              Aprobar capitán
            </button>
          </div>
        </article>
      </div>
    </section>

    <div class="flex flex-col gap-space-sm">
      <label class="sr-only" for="user-search">Buscar</label>
      <div class="relative">
        <span class="icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input id="user-search" v-model="search" class="input pl-10" placeholder="Buscar por nombre, email o cédula" />
      </div>
      <div class="-mx-gutter flex gap-space-xs overflow-x-auto px-gutter pb-1 md:mx-0 md:px-0">
        <button
          v-for="r in roleFilters"
          :key="r.value"
          type="button"
          class="filter-chip"
          :aria-pressed="roleFilter === r.value"
          @click="roleFilter = r.value"
        >{{ r.label }} ({{ countRole(r.value) }})</button>
      </div>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando usuarios…</p>
    <p v-else-if="!filtered.length" class="text-body-md text-on-surface-variant">Ningún usuario coincide con la búsqueda.</p>

    <div class="flex flex-col gap-space-xs">
      <article v-for="u in filtered" :key="u.id" class="card flex flex-col gap-space-sm p-space-md md:flex-row md:items-center">
        <div class="flex min-w-0 flex-1 items-center gap-space-md">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest font-label-tactical text-label-tactical">
            {{ initials(u.fullName) }}
          </span>
          <div class="min-w-0">
            <p class="m-0 truncate font-title-sm text-title-sm">{{ u.fullName }}</p>
            <p class="m-0 truncate font-stat-mono text-[12px] text-on-surface-variant">
              {{ u.ci || 'Sin cédula' }} · {{ u.email }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-space-sm">
          <label class="sr-only" :for="`role-${u.id}`">Rol de {{ u.fullName }}</label>
          <select
            :id="`role-${u.id}`"
            class="input w-auto py-space-sm"
            :value="u.role"
            :disabled="u.id === authStore.user?.id || busy === u.id"
            @change="changeRole(u, $event.target.value)"
          >
            <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>

          <template v-if="u.id !== authStore.user?.id">
            <template v-if="confirming === u.id">
              <button type="button" class="btn-danger" :disabled="busy === u.id" @click="deactivate(u)">Confirmar</button>
              <button type="button" class="btn-ghost" @click="confirming = null">Cancelar</button>
            </template>
            <button v-else type="button" class="btn-ghost" :aria-label="`Desactivar a ${u.fullName}`" @click="confirming = u.id">
              <span class="icon">person_off</span>
            </button>
          </template>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import usersService from '@/services/users'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useConfirm } from '@/composables/useConfirm'
import { ROLE_LABEL } from '@/router/navigation'

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const roles = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))
const roleFilters = [{ value: 'ALL', label: 'Todos' }, ...roles]

const users = ref([])
const captainRequests = ref([])
const loading = ref(true)
const search = ref('')
const roleFilter = ref('ALL')
const busy = ref(null)
const resolvingReq = ref(null)
const confirming = ref(null)

const pendingCaptainRequests = computed(() => captainRequests.value.filter(r => r.status === 'PENDING'))

const initials = name => (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
const countRole = r => (r === 'ALL' ? users.value.length : users.value.filter(u => u.role === r).length)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter(
    u =>
      (roleFilter.value === 'ALL' || u.role === roleFilter.value) &&
      (!q || [u.fullName, u.email, u.ci].some(v => v?.toLowerCase().includes(q)))
  )
})

const load = async () => {
  try {
    const [usersRes, capRes] = await Promise.all([
      usersService.getAll(),
      usersService.getCaptainRequests().catch(() => ({ data: [] }))
    ])
    users.value = usersRes.data
    captainRequests.value = capRes.data || []
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron cargar los usuarios'))
  } finally {
    loading.value = false
  }
}

const resolveCaptainReq = async (req, status) => {
  const approved = status === 'APPROVED'
  const note = await confirm({
    title: approved ? 'Aprobar solicitud de capitán' : 'Rechazar solicitud de capitán',
    message: approved
      ? `${req.user?.fullName || 'El usuario'} pasará a tener rol de Capitán para crear el equipo "${req.teamNameProposal}".`
      : `Indica opcionalmente el motivo del rechazo para ${req.user?.fullName || 'el jugador'}.`,
    confirmText: approved ? 'Aprobar' : 'Rechazar',
    danger: !approved,
    input: approved ? null : { label: 'Motivo (opcional)', placeholder: 'Ej. Datos incompletos' }
  })
  if (note === false) return
  resolvingReq.value = req.id
  try {
    await usersService.resolveCaptainRequest(req.id, {
      status,
      ...(typeof note === 'string' && note.trim() ? { responseNote: note.trim() } : {})
    })
    toast.success(approved ? 'Solicitud aprobada' : 'Solicitud rechazada')
    await load()
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo procesar la solicitud'))
  } finally {
    resolvingReq.value = null
  }
}

const changeRole = async (u, role) => {
  busy.value = u.id
  try {
    await usersService.updateRole(u.id, role)
    u.role = role
    toast.success(`${u.fullName} ahora es ${ROLE_LABEL[role]}`)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cambiar el rol'))
    await load()
  } finally {
    busy.value = null
  }
}

const deactivate = async u => {
  busy.value = u.id
  try {
    await usersService.deactivate(u.id)
    users.value = users.value.filter(x => x.id !== u.id)
    toast.success(`${u.fullName} desactivado`)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo desactivar'))
  } finally {
    busy.value = null
    confirming.value = null
  }
}

onMounted(load)
</script>
