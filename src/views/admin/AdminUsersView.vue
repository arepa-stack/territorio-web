<template>
  <div class="flex flex-col gap-space-lg">
    <div>
      <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Permisos y usuarios</h1>
      <p class="m-0 mt-1 text-body-md text-on-surface-variant">
        <span class="font-stat-mono tabular">{{ users.length }}</span> usuarios activos. Asigna árbitros y moderadores desde aquí.
      </p>
    </div>

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
import { ROLE_LABEL } from '@/router/navigation'

const toast = useToast()
const authStore = useAuthStore()

const roles = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))
const roleFilters = [{ value: 'ALL', label: 'Todos' }, ...roles]

const users = ref([])
const loading = ref(true)
const search = ref('')
const roleFilter = ref('ALL')
const busy = ref(null)
const confirming = ref(null)

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
    const res = await usersService.getAll()
    users.value = res.data
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron cargar los usuarios'))
  } finally {
    loading.value = false
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
