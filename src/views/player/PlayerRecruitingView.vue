<template>
  <div class="flex flex-col gap-space-lg">
    <div>
      <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Buscar equipo</h1>
      <p class="m-0 mt-1 text-body-md text-on-surface-variant">
        Explora equipos que buscan jugadores y envía tu solicitud para unirte.
      </p>
    </div>

    <!-- Filters -->
    <div class="card grid gap-space-md p-space-md sm:grid-cols-3">
      <div>
        <label class="field-label" for="rec-category">Categoría</label>
        <select id="rec-category" v-model="filters.category" class="input" @change="loadRecruiting">
          <option value="">Todas las categorías</option>
          <option v-for="(label, key) in CATEGORIES" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div>
        <label class="field-label" for="rec-city">Ciudad</label>
        <input
          id="rec-city"
          v-model.trim="filters.city"
          class="input"
          placeholder="Ej. Quito, Guayaquil…"
          @keyup.enter="loadRecruiting"
        />
      </div>
      <div class="flex items-end gap-space-xs">
        <button type="button" class="btn-primary flex-1" @click="loadRecruiting">
          <span class="icon">search</span> Filtrar
        </button>
        <button type="button" class="btn-ghost" @click="clearFilters">Limpiar</button>
      </div>
    </div>

    <!-- My Join Requests -->
    <section v-if="myRequests.length" class="flex flex-col gap-space-sm">
      <h2 class="m-0 font-headline-md text-headline-md uppercase">Mis solicitudes enviadas</h2>
      <div class="grid gap-space-sm md:grid-cols-2">
        <article
          v-for="req in myRequests"
          :key="req.id"
          class="card flex flex-col gap-space-xs p-space-md"
        >
          <div class="flex items-center justify-between gap-space-sm">
            <h3 class="m-0 font-title-sm text-title-sm uppercase">{{ req.team?.name || 'Equipo' }}</h3>
            <StatusChip :status="req.status" />
          </div>
          <p class="m-0 text-body-sm text-on-surface-variant">
            <span v-if="req.position">{{ POSITIONS[req.position] || req.position }}</span>
            <span v-if="req.jerseyNumber"> · Dorsal preferido #{{ req.jerseyNumber }}</span>
          </p>
          <p v-if="req.message" class="m-0 text-body-sm italic text-on-surface-variant">"{{ req.message }}"</p>
          <p v-if="req.responseNote" class="m-0 text-body-sm text-secondary">
            Respuesta del capitán: {{ req.responseNote }}
          </p>
          <div v-if="req.status === 'PENDING'" class="pt-1">
            <button
              type="button"
              class="btn-ghost text-body-sm text-error"
              :disabled="cancelling === req.id"
              @click="cancelRequest(req)"
            >
              <span class="icon text-[16px]">cancel</span>
              {{ cancelling === req.id ? 'Cancelando…' : 'Cancelar solicitud' }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- Recruiting Teams -->
    <section class="flex flex-col gap-space-sm">
      <h2 class="m-0 font-headline-md text-headline-md uppercase">Equipos buscando jugadores</h2>
      <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando equipos…</p>
      <p v-else-if="!teams.length" class="text-body-md text-on-surface-variant">
        No se encontraron equipos buscando jugadores con estos filtros.
      </p>

      <div v-else class="grid gap-space-md md:grid-cols-2 xl:grid-cols-3">
        <article v-for="t in teams" :key="t.id" class="card flex flex-col justify-between gap-space-md p-space-lg">
          <div class="flex flex-col gap-space-xs">
            <div class="flex items-start justify-between gap-space-sm">
              <div>
                <span class="label-tactical text-secondary">{{ CATEGORIES[t.category] || t.category || 'Libre' }}</span>
                <h3 class="m-0 font-headline-md text-headline-md uppercase">{{ t.name }}</h3>
              </div>
              <span class="rounded bg-surface-container-high px-2 py-0.5 font-stat-mono text-body-sm">
                {{ t.activePlayersCount ?? t._count?.players ?? 0 }} jug.
              </span>
            </div>
            <p class="m-0 text-body-sm text-on-surface-variant">
              Capitán: {{ t.captain?.fullName || t.captainName || 'Capitán' }}
            </p>
            <p v-if="t.city" class="m-0 flex items-center gap-1 text-body-sm text-on-surface-variant">
              <span class="icon text-[16px]">location_on</span> {{ t.city }}
            </p>
          </div>

          <div>
            <div v-if="t.captain?.id === authStore.user?.id" class="rounded bg-surface-container-low p-space-sm text-center text-body-sm text-on-surface-variant">
              Es tu equipo. Si también juegas, fíchate desde tu panel de capitán.
            </div>
            <div v-else-if="hasPendingRequestFor(t.id)" class="rounded bg-surface-container-low p-space-sm text-center text-body-sm text-secondary">
              Ya tienes una solicitud pendiente en este equipo
            </div>
            <div v-else-if="activeTeamForm === t.id" class="flex flex-col gap-space-sm rounded bg-surface-container-low p-space-md">
              <div>
                <label class="field-label" :for="`pos-${t.id}`">Posición</label>
                <select :id="`pos-${t.id}`" v-model="applyForm.position" class="input">
                  <option :value="null">Sin preferencia</option>
                  <option v-for="(label, key) in POSITIONS" :key="key" :value="key">{{ label }}</option>
                </select>
              </div>
              <div>
                <label class="field-label" :for="`num-${t.id}`">Dorsal preferido (0-99)</label>
                <input
                  :id="`num-${t.id}`"
                  v-model.number="applyForm.preferredJersey"
                  type="number"
                  min="0"
                  max="99"
                  class="input"
                  placeholder="Ej. 23"
                />
              </div>
              <div>
                <label class="field-label" :for="`msg-${t.id}`">Mensaje al capitán</label>
                <input
                  :id="`msg-${t.id}`"
                  v-model.trim="applyForm.message"
                  class="input"
                  placeholder="Ej. Juego de base, disponible fines de semana"
                />
              </div>
              <div class="flex gap-space-xs">
                <button type="button" class="btn-ghost flex-1" @click="activeTeamForm = null">Cancelar</button>
                <button
                  type="button"
                  class="btn-primary flex-1"
                  :disabled="submitting === t.id"
                  @click="submitJoinRequest(t)"
                >
                  {{ submitting === t.id ? 'Enviando…' : 'Enviar' }}
                </button>
              </div>
            </div>
            <button
              v-else
              type="button"
              class="btn-primary w-full"
              @click="openApplyForm(t)"
            >
              <span class="icon">person_add</span> Postularme
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import teamsService from '@/services/teams'
import playersService from '@/services/players'
import { handleApiError } from '@/services/api'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import { POSITIONS } from '@/utils/labels'
import StatusChip from '@/components/ui/StatusChip.vue'

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
const route = useRoute()

const CATEGORIES = {
  OPEN: 'Libre',
  SUB_13: 'Sub-13',
  SUB_15: 'Sub-15',
  SUB_17: 'Sub-17',
  SUB_19: 'Sub-19',
  VETERANS: 'Veteranos +35',
  FEMALE: 'Femenina',
  MIXED: 'Mixta'
}

const filters = reactive({ category: '', city: '' })
const teams = ref([])
const myRequests = ref([])
const loading = ref(true)
const activeTeamForm = ref(null)
const submitting = ref(null)
const cancelling = ref(null)

const applyForm = reactive({
  position: null,
  preferredJersey: null,
  message: ''
})

const hasPendingRequestFor = teamId =>
  myRequests.value.some(r => r.teamId === teamId && r.status === 'PENDING')

const openApplyForm = team => {
  activeTeamForm.value = team.id
  applyForm.position = null
  applyForm.preferredJersey = null
  applyForm.message = ''
}

const loadRecruiting = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.category) params.category = filters.category
    if (filters.city) params.city = filters.city
    const res = await teamsService.getRecruitingTeams(params)
    teams.value = res.data || []
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron cargar los equipos'))
  } finally {
    loading.value = false
  }
}

const loadMyRequests = async () => {
  try {
    const res = await playersService.getMyJoinRequests()
    myRequests.value = res.data || []
  } catch {
    myRequests.value = []
  }
}

const clearFilters = () => {
  filters.category = ''
  filters.city = ''
  loadRecruiting()
}

const submitJoinRequest = async team => {
  submitting.value = team.id
  try {
    const payload = {}
    if (applyForm.position) payload.position = applyForm.position
    if (applyForm.preferredJersey !== null && applyForm.preferredJersey !== '') {
      payload.preferredJersey = Number(applyForm.preferredJersey)
    }
    if (applyForm.message) payload.message = applyForm.message
    await teamsService.createJoinRequest(team.id, payload)
    toast.success(`Solicitud enviada a ${team.name}`)
    activeTeamForm.value = null
    await loadMyRequests()
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo enviar la solicitud'))
  } finally {
    submitting.value = null
  }
}

const cancelRequest = async req => {
  const ok = await confirm({
    title: 'Cancelar solicitud',
    message: `¿Deseas cancelar tu solicitud para unirte a ${req.team?.name || 'este equipo'}?`,
    confirmText: 'Sí, cancelar',
    danger: true
  })
  if (!ok) return
  cancelling.value = req.id
  try {
    await teamsService.cancelJoinRequest(req.id)
    toast.success('Solicitud cancelada')
    await loadMyRequests()
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cancelar la solicitud'))
  } finally {
    cancelling.value = null
  }
}

onMounted(async () => {
  await Promise.all([loadRecruiting(), loadMyRequests()])
  // ?equipo=<id> comes from the public team list: open that team's form right away
  const target = teams.value.find(t => t.id === route.query.equipo)
  if (target && !hasPendingRequestFor(target.id) && target.captain?.id !== authStore.user?.id) {
    openApplyForm(target)
    requestAnimationFrame(() => document.getElementById('pos-' + target.id)?.scrollIntoView({ block: 'center' }))
  }
})
</script>
