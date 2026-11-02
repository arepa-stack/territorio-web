<template>
  <div class="min-h-screen bg-surface font-body text-on-surface">
    <PublicHeader />

    <main class="mx-auto flex max-w-[1200px] flex-col gap-space-lg px-gutter py-space-lg md:px-margin-md">
      <router-link to="/torneos" class="btn-ghost self-start px-0"><span class="icon">arrow_back</span> Torneos</router-link>

      <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando torneo…</p>
      <p v-else-if="!tournament" class="text-body-md text-on-surface-variant">No encontramos este torneo.</p>

      <template v-else>
        <header class="card flex flex-col gap-space-md p-space-lg">
          <div class="flex flex-wrap items-start justify-between gap-space-sm">
            <div>
              <span class="label-tactical text-secondary">{{ categoryLabel }}</span>
              <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">{{ tournament.name }}</h1>
            </div>
            <StatusChip :status="tournament.status" />
          </div>
          <p v-if="tournament.description" class="m-0 max-w-[65ch] text-body-md text-on-surface-variant">{{ tournament.description }}</p>
          <div class="flex flex-wrap gap-x-space-lg gap-y-1 text-body-sm text-on-surface-variant">
            <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ venueLabel }}</span>
            <span class="flex items-center gap-space-xs">
              <span class="icon text-[18px]">calendar_month</span>{{ formatDate(tournament.startDate) }} – {{ formatDate(tournament.endDate) }}
            </span>
            <span class="flex items-center gap-space-xs">
              <span class="icon text-[18px]">payments</span>Inscripción
              <span class="font-stat-mono text-on-surface">{{ Number(tournament.entryFee) > 0 ? `$${tournament.entryFee}` : 'Gratis' }}</span>
            </span>
          </div>
          <div>
            <div class="mb-1 flex justify-between">
              <span class="label-tactical text-on-surface-variant">Cupos</span>
              <span class="font-stat-mono text-stat-mono tabular">{{ tournament.registeredTeams }}/{{ tournament.maxTeams }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
              <div class="h-full bg-secondary-container" :style="{ width: Math.min(100, (tournament.registeredTeams / tournament.maxTeams) * 100) + '%' }" />
            </div>
          </div>
          <div v-if="showTeamCta || showPlayerCta" class="flex flex-col gap-space-sm sm:flex-row">
            <router-link v-if="showTeamCta" :to="ctaLink(authStore.isAuthenticated, 'TEAM_CAPTAIN', '/app/tournaments')" class="btn-primary">
              <span class="icon">how_to_reg</span> Inscribir mi equipo
            </router-link>
            <a v-if="showPlayerCta && recruitingHere.length" href="#buscan-jugadores" class="btn-secondary">
              <span class="icon">person_search</span> Quiero jugar aquí ({{ recruitingHere.length }} {{ recruitingHere.length === 1 ? 'equipo busca' : 'equipos buscan' }} jugadores)
            </a>
            <router-link v-else-if="showPlayerCta" :to="ctaLink(authStore.isAuthenticated, 'PLAYER', '/app/player/recruiting')" class="btn-secondary">
              <span class="icon">person_search</span> No tengo equipo
            </router-link>
          </div>
          <p v-if="!authStore.isAuthenticated" class="m-0 text-body-sm text-on-surface-variant">
            Para inscribirte o postularte necesitas una cuenta; al crearla vuelves directo a este paso.
          </p>
        </header>

        <section v-if="showPlayerCta && recruitingHere.length" id="buscan-jugadores" class="scroll-mt-20">
          <h2 class="m-0 mb-space-sm font-headline-md text-headline-md uppercase">Equipos de este torneo que buscan jugadores</h2>
          <div class="grid gap-space-md md:grid-cols-2 lg:grid-cols-3">
            <RecruitingTeamCard v-for="t in recruitingHere" :key="t.id" :team="t" />
          </div>
        </section>

        <div class="flex gap-space-xs overflow-x-auto border-0 border-b border-solid border-outline-variant/40" role="tablist">
          <button
            v-for="t in tabs"
            :key="t.value"
            type="button"
            role="tab"
            :aria-selected="tab === t.value"
            class="label-tactical cursor-pointer whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-space-md py-space-sm text-[14px]"
            :class="tab === t.value ? 'border-primary-container text-primary' : 'border-transparent text-on-surface-variant'"
            @click="tab = t.value"
          >{{ t.label }}</button>
        </div>

        <StandingsTable v-if="tab === 'standings'" :standings="standings" />
        <FixtureList v-if="tab === 'fixture'" :matches="matches" />

        <!-- Statistical Leaders (Task 12) -->
        <div v-if="tab === 'leaders'" class="grid gap-space-md md:grid-cols-2">
          <article v-for="cat in leaderCategories" :key="cat.key" class="card flex flex-col gap-space-sm p-space-lg">
            <div class="flex items-center justify-between">
              <h2 class="m-0 font-headline-md text-headline-md uppercase">{{ cat.title }}</h2>
              <span class="label-tactical text-secondary">{{ cat.unit }}</span>
            </div>
            <p v-if="!leaders[cat.key]?.length" class="m-0 text-body-sm text-on-surface-variant">
              Sin estadísticas registradas todavía.
            </p>
            <div v-else class="flex flex-col gap-space-xs">
              <div
                v-for="(item, idx) in leaders[cat.key].slice(0, 5)"
                :key="item.userId || idx"
                class="flex items-center justify-between gap-space-sm rounded bg-surface-container-low px-space-sm py-2"
              >
                <div class="flex min-w-0 items-center gap-space-sm">
                  <span class="w-6 text-center font-scoreboard-num text-[20px] text-primary">{{ idx + 1 }}</span>
                  <div class="min-w-0">
                    <p class="m-0 truncate font-title-sm text-title-sm">{{ item.fullName }}</p>
                    <p class="m-0 truncate text-body-sm text-on-surface-variant">
                      {{ item.teamName }} · {{ item.gamesPlayed }} PJ
                    </p>
                  </div>
                </div>
                <div class="text-right font-stat-mono tabular">
                  <span class="text-title-sm font-bold text-primary">{{ item[cat.field] }}</span>
                  <span class="ml-1 text-body-sm text-on-surface-variant">({{ item[cat.perGameField] }}/P)</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-if="tab === 'teams'" class="grid gap-space-sm md:grid-cols-2">
          <p v-if="!standings.length" class="m-0 text-body-md text-on-surface-variant">Todavía no hay equipos aprobados.</p>
          <article v-for="s in standings" :key="s.teamId" class="card flex items-center gap-space-md p-space-md">
            <span class="flex h-10 w-10 items-center justify-center rounded bg-primary-container font-headline-md text-white">{{ s.teamName.charAt(0) }}</span>
            <span class="font-title-sm text-title-sm">{{ s.teamName }}</span>
          </article>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import tournamentsService from '@/services/tournaments'
import matchesService from '@/services/matches'
import { useAuthStore } from '@/stores/auth'
import PublicHeader from '@/components/PublicHeader.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import FixtureList from '@/components/tournament/FixtureList.vue'
import StandingsTable from '@/components/tournament/StandingsTable.vue'
import RecruitingTeamCard from '@/components/tournament/RecruitingTeamCard.vue'
import teamsService from '@/services/teams'
import { ctaLink } from '@/router/navigation'

const CATEGORIES = {
  OPEN: 'Libre', SUB_13: 'Sub-13', SUB_15: 'Sub-15', SUB_17: 'Sub-17', SUB_19: 'Sub-19',
  VETERANS: 'Veteranos +35', FEMALE: 'Femenina', MIXED: 'Mixta'
}
const tabs = [
  { value: 'standings', label: 'Tabla' },
  { value: 'fixture', label: 'Fixture' },
  { value: 'leaders', label: 'Líderes' },
  { value: 'teams', label: 'Equipos' }
]

const leaderCategories = [
  { key: 'points', title: 'Anotadores', unit: 'PTS', field: 'points', perGameField: 'pointsPerGame' },
  { key: 'rebounds', title: 'Rebotes', unit: 'REB', field: 'rebounds', perGameField: 'reboundsPerGame' },
  { key: 'assists', title: 'Asistencias', unit: 'AST', field: 'assists', perGameField: 'assistsPerGame' },
  { key: 'threePointers', title: 'Triples', unit: '3P', field: 'threePointers', perGameField: 'threePointersPerGame' }
]

const route = useRoute()
const authStore = useAuthStore()

const tournament = ref(null)
const matches = ref([])
const standings = ref([])
const leaders = ref({ points: [], rebounds: [], assists: [], threePointers: [] })
const loading = ref(true)
const tab = ref('standings')
const recruiting = ref([])

// Visitors see every CTA; logged-in users only the ones their role can act on
const role = computed(() => authStore.userRole)
const showTeamCta = computed(
  () => tournament.value?.status === 'REGISTRATION' && (!authStore.isAuthenticated || role.value === 'TEAM_CAPTAIN')
)
const showPlayerCta = computed(
  () => ['REGISTRATION', 'IN_PROGRESS'].includes(tournament.value?.status) && (!authStore.isAuthenticated || ['PLAYER', 'TEAM_CAPTAIN'].includes(role.value))
)
const recruitingHere = computed(() => {
  const inTournament = new Set(standings.value.map(s => s.teamId))
  return recruiting.value.filter(t => inTournament.has(t.id) && t.captain?.id !== authStore.user?.id)
})

const categoryLabel = computed(() => CATEGORIES[tournament.value?.category] || tournament.value?.category)
const venueLabel = computed(() => {
  const venues = tournament.value?.venues?.map(v => v.name).join(', ')
  const zones = tournament.value?.zones?.map(z => z.name).join(', ')
  return [venues || tournament.value?.location, zones && `zona ${zones}`].filter(Boolean).join(' · ')
})
const formatDate = d => (d ? new Date(d).toLocaleDateString() : '-')

onMounted(async () => {
  const id = route.params.id
  const [t, m, s, l, rec] = await Promise.allSettled([
    tournamentsService.getById(id),
    matchesService.getByTournament(id),
    matchesService.getStandings(id),
    tournamentsService.getLeaders(id),
    teamsService.getRecruitingTeams()
  ])
  tournament.value = t.status === 'fulfilled' ? t.value.data : null
  matches.value = m.status === 'fulfilled' ? m.value.data.matches || [] : []
  standings.value = s.status === 'fulfilled' ? s.value.data.standings || [] : []
  if (l.status === 'fulfilled' && l.value.data) {
    leaders.value = l.value.data
  }
  recruiting.value = rec.status === 'fulfilled' ? rec.value.data || [] : []
  loading.value = false
})
</script>
