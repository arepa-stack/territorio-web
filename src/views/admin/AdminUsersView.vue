<template>
  <div class="admin">
    <div class="page__head">
      <h1 class="display page__h1">Usuarios</h1>
      <p class="page__lead"><span class="mono">{{ users.length }}</span> usuarios activos. Asigna árbitros, capitanes y moderadores desde aquí.</p>
    </div>

    <!-- Pending captain upgrade requests -->
    <section v-if="pendingCaptainRequests.length" class="block" aria-labelledby="cap-req">
      <h2 id="cap-req" class="display block__title">Solicitudes para ser capitán · {{ pendingCaptainRequests.length }}</h2>
      <div class="req-grid">
        <article v-for="req in pendingCaptainRequests" :key="req.id" class="req">
          <div class="req__head">
            <strong class="req__name">{{ req.user?.fullName || 'Jugador' }}</strong>
            <span class="mono req__ci">{{ req.user?.ci || 'Sin CI' }}</span>
          </div>
          <p class="req__email">{{ req.user?.email }}</p>
          <p class="req__team">{{ req.reason }}</p>
          <div class="req__actions">
            <button type="button" class="btn-line" :disabled="resolvingReq === req.id" @click="resolveCaptainReq(req, 'REJECTED')">Rechazar</button>
            <button type="button" class="btn-blaze" :disabled="resolvingReq === req.id" @click="resolveCaptainReq(req, 'APPROVED')">Aprobar capitán</button>
          </div>
        </article>
      </div>
    </section>

    <div class="p-field">
      <label class="p-label" for="user-search">Buscar</label>
      <input id="user-search" v-model="search" class="p-input" placeholder="Nombre, email o cédula" />
    </div>
    <div class="p-chips" role="group" aria-label="Rol">
      <button
        v-for="r in roleFilters"
        :key="r.value"
        type="button"
        class="p-chip"
        :aria-pressed="roleFilter === r.value"
        @click="roleFilter = r.value"
      >{{ r.label }} · {{ countRole(r.value) }}</button>
    </div>

    <TurfLoader v-if="loading" label="Cargando usuarios" />
    <p v-else-if="!filtered.length" class="page__empty">Ningún usuario coincide con la búsqueda.</p>

    <div v-else class="u-list">
      <article v-for="u in pageItems" :key="u.id" class="u-row">
        <span class="display u-row__badge">{{ initials(u.fullName) }}</span>
        <div class="u-row__who">
          <span class="u-row__name">{{ u.fullName }}</span>
          <span class="mono u-row__meta">{{ u.ci || 'Sin cédula' }} · {{ u.email }}</span>
        </div>
        <div class="u-row__actions">
          <label class="sr-only" :for="`role-${u.id}`">Rol de {{ u.fullName }}</label>
          <select
            :id="`role-${u.id}`"
            class="p-input u-row__role"
            :value="u.role"
            :disabled="u.id === authStore.user?.id || busy === u.id"
            @change="changeRole(u, $event.target.value)"
          >
            <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
          <span v-if="u.id === authStore.user?.id" class="mono u-row__you">Tú</span>
          <template v-else-if="confirming === u.id">
            <button type="button" class="btn-blaze" :disabled="busy === u.id" @click="deactivate(u)">Confirmar</button>
            <button type="button" class="link-under u-row__plain" @click="confirming = null">Cancelar</button>
          </template>
          <button v-else type="button" class="link-under u-row__plain" :aria-label="`Desactivar a ${u.fullName}`" @click="confirming = u.id">Desactivar</button>
        </div>
      </article>
    </div>

    <PosterPager v-model:page="page" :per-page="PER_PAGE" :total="filtered.length" noun="usuarios" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import usersService from '@/services/users'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useConfirm } from '@/composables/useConfirm'
import { ROLE_LABEL } from '@/router/navigation'
import PosterPager from '@/components/poster/PosterPager.vue'

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

// ponytail: GET /users returns everyone and we page on the client; move paging to the API past a few thousand users
const PER_PAGE = 20
const page = ref(1)
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

const pageItems = computed(() => filtered.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))
// A new search or filter starts over at page 1
watch([search, roleFilter], () => (page.value = 1))
// Deactivating the last user of the last page must not leave an empty page
watch(() => filtered.value.length, n => (page.value = Math.min(page.value, Math.max(1, Math.ceil(n / PER_PAGE)))))

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
      ? `${req.user?.fullName || 'El usuario'} pasará a tener rol de Capitán.`
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

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.block__title {
  font-size: 36px;
  color: var(--gold);
}

.req-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.req {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  border: 1px solid var(--line);
  border-top: 6px solid var(--gold);
  background: var(--asphalt-2);
}

.req__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.req__name {
  font-size: 18px;
}

.req__ci,
.req__meta {
  font-size: 12px;
  color: var(--muted);
}

.req__email {
  font-size: 14px;
  color: var(--muted);
}

.req__team {
  font-size: 15px;
}

.req__meta {
  display: block;
  margin-top: 2px;
}

.req__reason {
  font-size: 14px;
  font-style: italic;
  color: var(--chalk-dim);
}

.req__actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 6px;
}

.req__actions > * {
  flex: 1;
}

.u-list {
  border-top: 3px solid var(--chalk);
}

.u-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}

.u-row__badge {
  display: flex;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  background: var(--line);
  font-size: 20px;
}

.u-row__who {
  display: flex;
  min-width: 0;
  flex: 1 1 260px;
  flex-direction: column;
  gap: 4px;
}

.u-row__name {
  font-size: 17px;
  font-weight: 700;
}

.u-row__meta {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--muted);
}

.u-row__actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.u-row__role {
  width: 180px;
  min-height: 44px;
  padding: 8px 10px;
  font-size: 14px;
}

.u-row__you {
  font-size: 11px;
  color: var(--gold);
}

.u-row__plain {
  border: 0;
  background: none;
  color: var(--chalk-dim);
  font-family: inherit;
  cursor: pointer;
}

.u-row__plain:hover {
  color: var(--blaze);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
