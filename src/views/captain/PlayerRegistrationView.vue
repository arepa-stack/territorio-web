<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-space-lg">
    <router-link to="/app/captain" class="btn-ghost self-start px-0"><span class="icon">arrow_back</span> Mi equipo</router-link>

    <div>
      <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Fichar por cédula</h1>
      <p v-if="team" class="m-0 mt-1 text-body-md text-on-surface-variant">Agregando jugadores a <strong class="text-on-surface">{{ team.name }}</strong>.</p>
    </div>

    <p v-if="loadingTeam" class="text-body-md text-on-surface-variant">Cargando tu equipo…</p>
    <div v-else-if="!team" class="card flex flex-col gap-space-sm p-space-md">
      <p class="m-0 text-body-md">Primero crea tu equipo.</p>
      <router-link to="/app/captain" class="btn-primary self-start">Crear mi equipo</router-link>
    </div>

    <template v-else>
      <p
        v-if="rosterLocked"
        role="alert"
        class="m-0 flex items-center gap-space-sm rounded border border-solid border-error/50 bg-error/10 p-space-sm text-body-sm text-error"
      >
        <span class="icon">lock</span>
        Plantel cerrado: tu equipo compite en un torneo en curso{{ team.roster?.lockedByTournament ? ` (${team.roster.lockedByTournament})` : '' }}. No puedes fichar ni quitar jugadores.
      </p>

      <!-- Search -->
      <form class="card flex flex-col gap-space-sm p-space-md sm:flex-row sm:items-end" @submit.prevent="search">
        <div class="flex-1">
          <label class="field-label" for="ci-search">Cédula</label>
          <input id="ci-search" v-model.trim="ci" class="input font-mono" placeholder="V-24891203" autocomplete="off" :disabled="rosterLocked" />
        </div>
        <button type="submit" class="btn-primary" :disabled="!ci || busy || rosterLocked"><span class="icon">search</span> Buscar</button>
      </form>
      <p class="m-0 flex items-center gap-space-xs text-body-sm text-on-surface-variant">
        <span class="icon text-[18px] text-secondary">info</span>
        Un jugador puede estar en varios equipos y torneos, pero con un solo equipo por torneo.
      </p>

      <!-- Found: add the existing person -->
      <section v-if="found" class="card flex flex-col gap-space-md border-l-4 border-l-tertiary p-space-md">
        <div>
          <span class="label-tactical text-tertiary">Jugador encontrado</span>
          <h2 class="m-0 font-headline-md text-headline-md uppercase">{{ found.fullName }}</h2>
          <p class="m-0 font-stat-mono text-stat-mono text-on-surface-variant">{{ found.ci }}</p>
          <p v-if="otherTeams" class="m-0 mt-1 text-body-sm text-on-surface-variant">Juega en: {{ otherTeams }}</p>
        </div>
        <p v-if="alreadyHere" class="m-0 text-body-md text-secondary">Ya está en tu equipo.</p>
        <form v-else class="flex flex-col gap-space-md" @submit.prevent="addExisting">
          <JerseyPosition v-model:jersey="jersey" v-model:position="position" />
          <button type="submit" class="btn-primary" :disabled="busy || !validSlot">Agregar a {{ team.name }}</button>
        </form>
      </section>

      <!-- Not found: create the person -->
      <section v-if="notFound" class="card flex flex-col gap-space-md p-space-md">
        <div>
          <span class="label-tactical text-secondary">Cédula sin registrar</span>
          <p class="m-0 text-body-md">
            No hay nadie con la cédula <strong class="font-mono">{{ searchedCi }}</strong>. Créalo y queda en tu plantel.
          </p>
        </div>
        <form class="flex flex-col gap-space-md" @submit.prevent="createNew">
          <div>
            <label class="field-label" for="new-name">Nombre completo *</label>
            <input id="new-name" v-model.trim="newName" class="input" />
          </div>
          <div>
            <label class="field-label" for="new-email">Email *</label>
            <input id="new-email" v-model.trim="newEmail" class="input" type="email" placeholder="para su cuenta en la liga" />
          </div>
          <div>
            <label class="field-label" for="new-birthdate">Fecha de nacimiento (opcional)</label>
            <input id="new-birthdate" v-model="newBirthDate" class="input" type="date" />
          </div>
          <JerseyPosition v-model:jersey="jersey" v-model:position="position" />
          <button type="submit" class="btn-primary" :disabled="busy || rosterLocked || !validSlot || !newName || !newEmail">Crear y agregar</button>
        </form>
      </section>

      <p v-if="error" role="alert" class="m-0 flex items-start gap-space-sm rounded border border-solid border-error/50 bg-error/10 p-space-sm text-body-sm text-error">
        <span class="icon">error</span>{{ error }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import teamsService from '@/services/teams'
import playersService from '@/services/players'
import { handleApiError } from '@/services/api'
import JerseyPosition from '@/components/JerseyPosition.vue'

const toast = useToast()

const team = ref(null)
const loadingTeam = ref(true)
const ci = ref('')
const searchedCi = ref('')
const found = ref(null)
const notFound = ref(false)
const alreadyHere = ref(false)
const jersey = ref(null)
const position = ref('BASE')
const newName = ref('')
const newEmail = ref('')
const newBirthDate = ref('')
const busy = ref(false)
const error = ref('')

const rosterLocked = computed(() =>
  Boolean(
    team.value?.roster?.isLocked ||
      team.value?.registrations?.some(r => r.status === 'APPROVED' && r.tournament?.status === 'IN_PROGRESS')
  )
)
const validSlot = computed(() => Number.isInteger(jersey.value) && jersey.value >= 0 && jersey.value <= 99 && !!position.value)
const otherTeams = computed(() => (found.value?.players || []).map(p => p.team?.name).filter(Boolean).join(', '))

const resetResult = () => {
  found.value = null
  notFound.value = false
  alreadyHere.value = false
  error.value = ''
}

const search = async () => {
  resetResult()
  busy.value = true
  searchedCi.value = ci.value
  try {
    const res = await playersService.searchPlayerForTeam(team.value.id, { ci: ci.value })
    found.value = res.data.player
    alreadyHere.value = res.data.isInThisTeam
  } catch (e) {
    if (e.response?.status === 404) notFound.value = true
    else error.value = handleApiError(e, 'No se pudo buscar la cédula')
  } finally {
    busy.value = false
  }
}

const done = (name, data) => {
  toast.success(`${name} agregado a ${team.value.name}`)
  const warn = data?.warning || (data?.warnings?.length ? data.warnings.join(' · ') : '')
  if (warn) toast.warning(warn)
  ci.value = ''
  jersey.value = null
  newName.value = ''
  newEmail.value = ''
  newBirthDate.value = ''
  resetResult()
}

const addExisting = async () => {
  busy.value = true
  error.value = ''
  try {
    const res = await playersService.registerInTeam(team.value.id, { userId: found.value.id, jerseyNumber: jersey.value, position: position.value })
    done(found.value.fullName, res.data)
  } catch (e) {
    error.value = handleApiError(e, 'No se pudo agregar al jugador')
  } finally {
    busy.value = false
  }
}

const createNew = async () => {
  busy.value = true
  error.value = ''
  try {
    const res = await playersService.create({
      teamId: team.value.id,
      fullName: newName.value,
      ci: searchedCi.value,
      email: newEmail.value,
      ...(newBirthDate.value ? { birthDate: newBirthDate.value } : {}),
      jerseyNumber: jersey.value,
      position: position.value
    })
    done(newName.value, res.data)
  } catch (e) {
    error.value = handleApiError(e, 'No se pudo crear al jugador')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    team.value = (await teamsService.getMyTeams()).data[0] || null
  } finally {
    loadingTeam.value = false
  }
})
</script>
