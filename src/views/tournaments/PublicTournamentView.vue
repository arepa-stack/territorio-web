<template>
  <div class="poster">
    <PosterHeader />

    <p v-if="loading" class="wrap page page__lead">Cargando torneo…</p>
    <p v-else-if="!tournament" class="wrap page page__lead">No encontramos este torneo.</p>

    <template v-else>
      <!-- Hero: grayscale court photo with the name on top -->
      <header class="hero">
        <img v-if="tournament.coverPhoto" :src="tournament.coverPhoto" :alt="`Cancha de ${tournament.name}`" class="hero__photo" />
        <div class="hero__shade" />
        <div class="wrap hero__body">
          <router-link to="/torneos" class="mono page__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
            Torneos
          </router-link>
          <div class="hero__tags">
            <span class="mono hero__status" :style="{ color: status.color, borderColor: status.color }">{{ status.label }}</span>
            <span class="mono hero__cat">{{ categoryLabel }}</span>
          </div>
          <h1 class="display hero__name">{{ tournament.name }}</h1>
          <p v-if="tournament.description" class="hero__desc">{{ tournament.description }}</p>
        </div>
      </header>

      <section class="facts" aria-label="Datos del torneo">
        <div class="wrap facts__grid">
          <div class="facts__cell">
            <span class="mono facts__label">Cancha</span>
            <span class="facts__value">{{ venueLabel || 'Por definir' }}</span>
          </div>
          <div class="facts__cell">
            <span class="mono facts__label">Fechas</span>
            <span class="mono facts__value">{{ formatDate(tournament.startDate) }} – {{ formatDate(tournament.endDate) }}</span>
          </div>
          <div class="facts__cell">
            <span class="mono facts__label">Inscripción</span>
            <span class="mono facts__value">{{ fee(tournament.entryFee, tournament.country) }}</span>
          </div>
          <div class="facts__cell">
            <span class="mono facts__label facts__slots"><span>Cupos</span><span>{{ tournament.registeredTeams }}/{{ tournament.maxTeams }}</span></span>
            <span class="facts__track"><span class="facts__fill" :style="{ width: Math.min(100, (tournament.registeredTeams / tournament.maxTeams) * 100) + '%' }" /></span>
          </div>
        </div>
      </section>

      <main class="wrap page">
        <div v-if="tournament.status === 'FINISHED' && tournament.winner" class="champ-box champ">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F5B21B" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 18h18M4 18 3 7l5 4 4-6 4 6 5-4-1 11" />
          </svg>
          <div class="champ__text">
            <span class="mono champ__label">Campeón</span>
            <span class="display champ__name">{{ tournament.winner.name }}</span>
          </div>
        </div>

        <div v-if="showTeamCta || showPlayerCta" class="ctas">
          <router-link v-if="showTeamCta" :to="ctaLink(authStore.isAuthenticated, 'TEAM_CAPTAIN', '/app/tournaments')" class="btn-blaze">Inscribir mi equipo</router-link>
          <a v-if="showPlayerCta && recruitingHere.length" href="#buscan-jugadores" class="btn-line">
            Quiero jugar aquí · {{ recruitingHere.length }} {{ recruitingHere.length === 1 ? 'equipo busca' : 'equipos buscan' }} jugadores
          </a>
          <router-link v-else-if="showPlayerCta" :to="ctaLink(authStore.isAuthenticated, 'PLAYER', '/app/player/recruiting')" class="btn-line">No tengo equipo</router-link>
          <p v-if="!authStore.isAuthenticated" class="ctas__note">Para inscribirte o postularte necesitas una cuenta; al crearla vuelves directo a este paso.</p>
        </div>

        <section v-if="showPlayerCta && recruitingHere.length" id="buscan-jugadores" class="block">
          <h2 class="display block__title">Equipos de este torneo que buscan jugadores</h2>
          <div class="r-grid">
            <RecruitingTeamCard v-for="t in recruitingHere" :key="t.id" :team="t" />
          </div>
        </section>

        <div class="tabs" role="tablist" aria-label="Secciones del torneo">
          <button
            v-for="t in visibleTabs"
            :key="t.value"
            type="button"
            role="tab"
            class="p-tab"
            :aria-selected="tab === t.value"
            @click="tab = t.value"
          >{{ t.label }}</button>
        </div>

        <PlayoffBracket v-if="tab === 'playoffs' && bracket" :bracket="bracket" subtitle="Playoffs" :title="tournament.name" />

        <div v-if="tab === 'standings'" class="table-box">
          <table class="standings">
            <thead>
              <tr class="mono">
                <th v-for="h in STANDING_HEADERS" :key="h" scope="col">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(s, i) in tableRows" :key="s.teamId">
              <tr v-if="s.group && s.group !== tableRows[i - 1]?.group"><th :colspan="STANDING_HEADERS.length" scope="colgroup" class="mono standings__group">Grupo {{ s.group }}</th></tr>
              <tr :class="{ 'is-first': s.position === 1 }">
                <td class="mono standings__pos">{{ String(s.position).padStart(2, '0') }}</td>
                <td class="standings__team"><router-link :to="`/equipo/${s.teamId}`" class="ent-link"><TeamBadge :name="s.teamName" :logo-url="s.logoUrl || ''" :size="26" /> {{ s.teamName }}</router-link></td>
                <td class="mono">{{ s.gamesPlayed }}</td>
                <td class="mono">{{ s.wins }}</td>
                <td class="mono">{{ s.losses }}</td>
                <td class="mono">{{ s.pointsFor }}</td>
                <td class="mono">{{ s.pointsAgainst }}</td>
                <td class="mono">{{ s.pointDifferential > 0 ? '+' : '' }}{{ s.pointDifferential }}</td>
                <td class="mono standings__pts">{{ s.points }}</td>
              </tr>
              </template>
              <tr v-if="!standings.length">
                <td :colspan="STANDING_HEADERS.length" class="standings__none">La tabla aparece cuando hay equipos aprobados.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="tab === 'fixture'" class="block">
          <p v-if="!rounds.length" class="page__empty">El fixture todavía no se generó.</p>
          <div v-for="r in rounds" :key="r.round" class="round">
            <h2 class="mono round__title">{{ PHASE_LABEL[r.matches[0].phase] || `Jornada ${r.round}` }}</h2>
            <router-link v-for="m in r.matches" :key="m.id" :to="`/partido/${m.id}`" class="fx ent-link">
              <span class="mono fx__when">{{ shortDay(m.matchDate) }} · {{ m.matchTime }}</span>
              <span class="display fx__teams">
                <TeamBadge :name="m.homeTeam.name" :logo-url="m.homeTeam.logoUrl || ''" :size="26" /> {{ m.homeTeam.name }}
                <span class="fx__vs">vs</span>
                <TeamBadge :name="m.awayTeam.name" :logo-url="m.awayTeam.logoUrl || ''" :size="26" /> {{ m.awayTeam.name }}
              </span>
              <span class="fx__where">{{ m.venue }}</span>
              <span v-if="m.status === 'FINISHED'" class="display fx__score">{{ m.homeScore }}–{{ m.awayScore }}</span>
              <span v-else class="mono fx__status" :style="{ color: matchStatus(m).color }">{{ matchStatus(m).label }}</span>
            </router-link>
          </div>
        </div>

        <div v-if="tab === 'leaders'" class="leaders">
          <article v-for="cat in leaderCategories" :key="cat.key" class="leaders__box">
            <div class="leaders__head">
              <h2 class="display leaders__title">{{ cat.title }}</h2>
              <span class="mono leaders__unit">{{ cat.unit }}</span>
            </div>
            <p v-if="!leaders[cat.key]?.length" class="leaders__none">Sin estadísticas registradas todavía.</p>
            <ol v-else class="leaders__list">
              <li v-for="(item, idx) in leaders[cat.key].slice(0, 5)" :key="item.userId || idx" class="leaders__row" :class="{ 'is-first': idx === 0 }">
                <span class="display leaders__rank">{{ idx + 1 }}</span>
                <span class="leaders__who">
                  <router-link v-if="item.playerId" :to="`/jugador/${item.playerId}`" class="leaders__name ent-link">{{ item.fullName }}</router-link>
                  <span v-else class="leaders__name">{{ item.fullName }}</span>
                  <span class="mono leaders__team">{{ item.teamName }} · {{ item.gamesPlayed }} PJ</span>
                </span>
                <span class="leaders__val">
                  <span class="display leaders__total">{{ item.value }}</span>
                  <span class="mono leaders__pg">{{ item.perGame }}/P</span>
                </span>
              </li>
            </ol>
          </article>
        </div>

        <div v-if="tab === 'teams'" class="block">
          <p v-if="!standings.length" class="page__empty">Todavía no hay equipos aprobados.</p>
          <div v-else class="teams">
            <router-link v-for="s in standings" :key="s.teamId" :to="`/equipo/${s.teamId}`" class="teams__item ent-link">
              <TeamBadge :name="s.teamName" :logo-url="s.logoUrl || ''" :size="48" />
              <span class="teams__name">{{ s.teamName }}</span>
            </router-link>
          </div>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { fee } from '@/composables/useCountry'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import tournamentsService from '@/services/tournaments'
import matchesService from '@/services/matches'
import { useAuthStore } from '@/stores/auth'
import '@/styles/poster.css'
import PosterHeader from '@/components/PosterHeader.vue'
import { CATEGORIES, POSTER_STATUS, PHASE_LABEL, formatDate } from '@/utils/labels'
import PlayoffBracket from '@/components/PlayoffBracket.vue'
import TeamBadge from '@/components/TeamBadge.vue'
import RecruitingTeamCard from '@/components/tournament/RecruitingTeamCard.vue'
import teamsService from '@/services/teams'
import { ctaLink } from '@/router/navigation'

const tabs = [
  { value: 'standings', label: 'Tabla' },
  { value: 'fixture', label: 'Fixture' },
  { value: 'leaders', label: 'Líderes' },
  { value: 'teams', label: 'Equipos' }
]

const STANDING_HEADERS = ['Pos', 'Equipo', 'PJ', 'PG', 'PP', 'PF', 'PC', 'DIF', 'PTS']

const leaderCategories = [
  { key: 'points', title: 'Anotadores', unit: 'PTS' },
  { key: 'rebounds', title: 'Rebotes', unit: 'REB' },
  { key: 'assists', title: 'Asistencias', unit: 'AST' },
  { key: 'threePointers', title: 'Triples', unit: '3P' }
]

const bracket = ref(null)
const visibleTabs = computed(() => (bracket.value ? [{ value: 'playoffs', label: 'Playoffs' }, ...tabs] : tabs))

const route = useRoute()
const authStore = useAuthStore()

const tournament = ref(null)
const matches = ref([])
const standings = ref([])
// Groups tournament: the API sends seed order (1A, 1B, 2A...); show them group by group
const tableRows = computed(() => [...standings.value].sort((a, b) => (a.group || "").localeCompare(b.group || "")))
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
const shortDay = d => new Date(d).toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' })
const status = computed(() => POSTER_STATUS[tournament.value?.status] || { label: tournament.value?.status, color: '#8C877C' })
const matchStatus = m => POSTER_STATUS[m.status] || { label: m.status, color: '#A8A397' }
const rounds = computed(() => {
  const byRound = {}
  for (const m of matches.value) (byRound[m.round] ||= []).push(m)
  return Object.keys(byRound)
    .sort((a, b) => a - b)
    .map(r => ({ round: r, matches: byRound[r] }))
})

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
  // Tournaments with playoffs open on the bracket
  if (tournament.value?.playoffTeams) {
    bracket.value = (await tournamentsService.getBracket(id).catch(() => ({ data: null }))).data
    if (bracket.value) tab.value = 'playoffs'
  }
  loading.value = false
})
</script>

<style scoped>
/* Rows and names that open the public match, team or player page */
.ent-link {
  color: inherit;
  text-decoration: none;
}
.ent-link:hover .teams__name,
a.leaders__name:hover,
.standings__team .ent-link:hover {
  text-decoration: underline;
}
a.fx:hover {
  background: rgb(255 255 255 / 0.04);
}
.standings__team .ent-link {
  display: inline-flex;
  align-items: center;
  gap: inherit;
}
.hero {
  position: relative;
  overflow: hidden;
  min-height: 420px;
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid var(--line);
  background: repeating-linear-gradient(135deg, #1c1b17 0 14px, #141411 14px 28px);
}

.hero__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.15) brightness(0.7);
}

.hero__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--asphalt) 0%, rgb(13 13 11 / 0.55) 55%, rgb(13 13 11 / 0.2) 100%);
}

.hero__body {
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding-top: 40px;
  padding-bottom: 48px;
}

.hero__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.hero__status {
  padding: 6px 10px;
  border: 2px solid;
  background: var(--asphalt);
  font-size: 12px;
  font-weight: 700;
}

.hero__cat {
  font-size: 12px;
  color: var(--gold);
}

.hero__name {
  max-width: 16ch;
  font-size: clamp(56px, 8vw, 120px);
  overflow-wrap: anywhere;
}

.hero__desc {
  max-width: 65ch;
  font-size: 17px;
  line-height: 1.5;
  color: var(--chalk-dim);
}

.facts {
  border-bottom: 1px solid var(--line);
  background: var(--asphalt-2);
}

.facts__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) repeat(3, minmax(0, 1fr));
}

.facts__cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 24px 24px 24px 0;
}

.facts__cell + .facts__cell {
  padding-left: 24px;
  border-left: 1px solid var(--line);
}

.facts__label {
  font-size: 11px;
  color: var(--muted);
}

.facts__value {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.facts__slots {
  display: flex;
  justify-content: space-between;
}

.facts__track {
  display: block;
  height: 6px;
  margin-top: 6px;
  background: var(--line);
}

.facts__fill {
  display: block;
  height: 6px;
  background: var(--blaze);
}

.champ__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.champ__label {
  font-size: 12px;
  color: var(--muted);
}

.champ__name {
  font-size: clamp(36px, 5vw, 56px);
  color: var(--gold);
}

.ctas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.ctas__note {
  flex-basis: 100%;
  font-size: 14px;
  color: var(--muted);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 24px;
  scroll-margin-top: 96px;
}

.block__title {
  font-size: 40px;
}

.r-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.table-box {
  overflow-x: auto;
  border-top: 3px solid var(--chalk);
}

.standings {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.standings th {
  padding: 14px 12px;
  border-bottom: 1px solid var(--line);
  font-size: 11px;
  font-weight: 400;
  color: var(--muted);
}

.standings td {
  padding: 16px 12px;
  border-bottom: 1px solid var(--line-soft);
  font-size: 15px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.standings__pos {
  color: var(--muted);
}

.standings__team :deep(.tb) {
  margin-right: 8px;
}

.standings__team {
  font-size: 17px;
  font-weight: 700;
}

.standings__pts {
  font-weight: 700;
  color: var(--blaze);
}

.standings .is-first .standings__pos,
.standings .is-first .standings__pts {
  color: var(--gold);
}

.standings__none {
  color: var(--muted);
}

.standings__group {
  padding-top: 18px;
  text-align: left;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.round {
  border-top: 3px solid var(--chalk);
}

.round__title {
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
}

.fx {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) 200px 120px;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
  border-bottom: 1px solid var(--line-soft);
}

.fx__when {
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  color: var(--blaze);
}

.fx__teams {
  font-size: 28px;
  line-height: 1;
}

.fx__vs {
  font-size: 18px;
  color: var(--muted);
}

.fx__where {
  font-size: 14px;
  color: var(--muted);
}

.fx__score {
  font-size: 32px;
  text-align: right;
  color: var(--gold);
}

.fx__status {
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.leaders {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.leaders__box {
  padding: 24px;
  border: 1px solid var(--line);
  background: var(--asphalt-2);
}

.leaders__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 3px solid var(--chalk);
}

.leaders__title {
  font-size: 32px;
}

.leaders__unit {
  font-size: 12px;
  color: var(--gold);
}

.leaders__none {
  padding-top: 16px;
  font-size: 14px;
  color: var(--muted);
}

.leaders__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.leaders__row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line-soft);
}

.leaders__rank {
  width: 32px;
  font-size: 28px;
  color: var(--muted);
}

.leaders__who {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.leaders__name {
  overflow: hidden;
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leaders__team,
.leaders__pg {
  font-size: 11px;
  color: var(--muted);
}

.leaders__val {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.leaders__total {
  font-size: 28px;
}

.leaders__row.is-first .leaders__rank,
.leaders__row.is-first .leaders__total {
  color: var(--gold);
}

.teams {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  border-top: 3px solid var(--chalk);
}

.teams__item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}

.teams__badge {
  display: flex;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  background: var(--blaze);
  color: var(--asphalt);
  font-size: 28px;
}

.teams__name {
  font-size: 17px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .hero {
    min-height: 340px;
  }

  .facts__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .facts__cell,
  .facts__cell + .facts__cell {
    padding: 18px 16px 18px 0;
    border-left: 0;
  }

  .facts__cell:nth-child(even) {
    padding-left: 16px;
    border-left: 1px solid var(--line);
  }

  .fx {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 16px;
  }

  .fx__when,
  .fx__where {
    grid-column: 1 / -1;
  }

  .fx__teams {
    font-size: 22px;
  }

  .leaders {
    grid-template-columns: minmax(0, 1fr);
  }

  .r-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
