<template>
  <div class="flex flex-col gap-space-lg">
    <router-link to="/app/organizer" class="btn-ghost self-start px-0">
      <span class="icon">arrow_back</span> Panel
    </router-link>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando torneo…</p>

    <template v-else-if="tournament">
      <!-- Header -->
      <header class="card flex flex-col gap-space-md p-space-lg">
        <div class="flex flex-wrap items-start justify-between gap-space-sm">
          <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">
            {{ tournament.name }}
          </h1>
          <StatusChip :status="tournament.status" />
        </div>
        <div class="flex flex-wrap gap-x-space-lg gap-y-1 text-body-sm text-on-surface-variant">
          <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ tournament.location }}</span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">calendar_month</span>{{ formatDate(tournament.startDate) }} – {{ formatDate(tournament.endDate) }}
          </span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">groups</span>
            <span class="font-stat-mono tabular">{{ registrations.length }}/{{ tournament.maxTeams }}</span> equipos
          </span>
        </div>
      </header>

      <!-- Tabs -->
      <div class="flex gap-space-xs border-b border-solid border-x-0 border-t-0 border-outline-variant/40" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.value"
          type="button"
          role="tab"
          :aria-selected="tab === t.value"
          class="label-tactical cursor-pointer border-0 border-b-2 border-solid bg-transparent px-space-md py-space-sm text-[14px]"
          :class="tab === t.value ? 'border-primary-container text-primary' : 'border-transparent text-on-surface-variant'"
          @click="tab = t.value"
        >{{ t.label }}</button>
      </div>

      <!-- Registrations -->
      <section v-if="tab === 'registrations'" class="flex flex-col gap-space-sm">
        <p v-if="!registrations.length" class="text-body-md text-on-surface-variant">Todavía no hay equipos inscritos.</p>
        <article
          v-for="reg in registrations"
          :key="reg.id"
          class="card flex flex-col gap-space-sm p-space-md md:flex-row md:items-center md:justify-between"
        >
          <div class="min-w-0">
            <h3 class="m-0 font-title-sm text-title-sm">{{ reg.team.name }}</h3>
            <p class="m-0 text-body-sm text-on-surface-variant">Capitán: {{ reg.captain.fullName }}</p>
            <div class="mt-space-xs flex flex-wrap gap-space-xs">
              <StatusChip :status="reg.status" />
              <RosterChip v-if="reg.roster" :roster="reg.roster" />
            </div>
          </div>
          <div v-if="reg.status === 'PENDING'" class="flex gap-space-sm">
            <button type="button" class="btn-danger flex-1" :disabled="busy" @click="review(reg, 'REJECTED')">Rechazar</button>
            <button type="button" class="btn-primary flex-1" :disabled="busy" @click="review(reg, 'APPROVED')">Aprobar</button>
          </div>
        </article>
      </section>

      <!-- Fixture -->
      <section v-if="tab === 'fixture'" class="flex flex-col gap-space-md">
        <div v-if="tournament.status === 'REGISTRATION'" class="card flex flex-col gap-space-sm p-space-md">
          <p class="m-0 text-body-md">
            Se generará un fixture todos contra todos con los
            <strong class="font-stat-mono">{{ approved.length }}</strong> equipos aprobados.
          </p>
          <p v-if="fixtureBlocker" class="m-0 flex items-center gap-space-xs text-body-sm text-error">
            <span class="icon text-[18px]">warning</span>{{ fixtureBlocker }}
          </p>
          <button type="button" class="btn-primary self-start" :disabled="!!fixtureBlocker || busy" @click="generateFixture">
            <span class="icon">account_tree</span> Generar fixture
          </button>
        </div>

        <FixtureList :matches="matches" :link-for="m => `/app/organizer/match/${m.id}`" />
      </section>

      <!-- Standings -->
      <StandingsTable v-if="tab === 'standings'" :standings="standings" />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import matchesService from '@/services/matches'
import StatusChip from '@/components/ui/StatusChip.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import FixtureList from '@/components/tournament/FixtureList.vue'
import StandingsTable from '@/components/tournament/StandingsTable.vue'

const route = useRoute()
const toast = useToast()
const id = route.params.id

const tabs = [
  { value: 'registrations', label: 'Inscripciones' },
  { value: 'fixture', label: 'Fixture' },
  { value: 'standings', label: 'Tabla' }
]
const tab = ref('registrations')
const loading = ref(true)
const busy = ref(false)
const tournament = ref(null)
const registrations = ref([])
const matches = ref([])
const standings = ref([])

const approved = computed(() => registrations.value.filter(r => r.status === 'APPROVED'))

// Same rules the backend enforces in generateFixtures, shown before the click
const fixtureBlocker = computed(() => {
  const min = tournament.value?.minTeams ?? 2
  if (approved.value.length < min) return `Se necesitan al menos ${min} equipos aprobados (hay ${approved.value.length}).`
  const notValid = approved.value.filter(r => r.roster?.status === 'NOT_VALIDATED')
  if (notValid.length) return `Planteles sin validar: ${notValid.map(r => r.team.name).join(', ')}.`
  return ''
})

const formatDate = d => (d ? new Date(d).toLocaleDateString() : '-')

const load = async () => {
  try {
    const [t, regs, ms, st] = await Promise.allSettled([
      tournamentsService.getById(id),
      tournamentsService.getRegistrations(id),
      matchesService.getByTournament(id),
      matchesService.getStandings(id)
    ])
    if (t.status === 'rejected') throw t.reason
    tournament.value = t.value.data
    registrations.value = regs.status === 'fulfilled' ? regs.value.data : []
    matches.value = ms.status === 'fulfilled' ? ms.value.data.matches || [] : []
    standings.value = st.status === 'fulfilled' ? st.value.data.standings || [] : []
  } catch (error) {
    toast.error(error.response?.data?.message || 'No se pudo cargar el torneo')
  } finally {
    loading.value = false
  }
}

const run = async (action, okMessage) => {
  busy.value = true
  try {
    await action()
    toast.success(okMessage)
    await load()
  } catch (error) {
    toast.error(error.response?.data?.message || 'No se pudo completar la acción')
  } finally {
    busy.value = false
  }
}

const review = (reg, decision) =>
  run(
    () => tournamentsService.processRegistration(id, { registrationId: reg.id, decision }),
    `${reg.team.name}: ${decision === 'APPROVED' ? 'aprobado' : 'rechazado'}`
  )

const generateFixture = () => run(() => tournamentsService.generateFixtures(id), 'Fixture generado')

onMounted(load)
</script>
