<template>
  <div class="min-h-screen bg-surface font-body text-on-surface">
    <PublicHeader />

    <!-- Hero: full-bleed court photo (cover of an open tournament) under a dark gradient -->
    <section class="relative isolate overflow-hidden">
      <img v-if="heroPhoto" :src="heroPhoto" alt="" class="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div class="absolute inset-0 -z-10 bg-gradient-to-r from-surface via-surface/85 to-surface/30" />
      <div class="absolute inset-0 -z-10 bg-gradient-to-t from-surface via-transparent to-transparent" />

      <div class="mx-auto max-w-[1200px] px-gutter pb-margin-lg pt-margin-lg md:px-margin-md md:pt-[96px]">
        <div class="flex flex-col gap-space-lg">
          <span class="label-tactical flex items-center gap-space-xs self-start rounded border border-solid border-primary-container/50 bg-primary-container/15 px-space-sm py-1 text-primary">
            <span class="h-2 w-2 animate-pulse rounded-full bg-primary-container" /> Temporada {{ year }} · Caracas
          </span>
          <h1 class="m-0 font-display-xl-mobile text-[44px] uppercase leading-[0.95] md:font-display-xl md:text-[80px]">
            Tu barrio.<br />Tu cancha.<br /><span class="text-primary-container">Tu corona.</span>
          </h1>
          <p class="m-0 max-w-[52ch] text-body-md text-on-surface-variant md:text-[17px] md:leading-7">
            Torneos en las canchas de tu zona, estadísticas de cada partido y equipos que buscan jugadores. Gana torneos y tu equipo se vuelve dueño de la zona.
          </p>
          <div class="flex flex-col gap-space-sm sm:flex-row">
            <router-link to="/torneos" class="btn-primary"><span class="icon">search</span> Buscar torneo</router-link>
            <router-link to="/equipos" class="btn-secondary"><span class="icon">person_search</span> Busco equipo</router-link>
          </div>
          <p class="m-0 text-body-sm text-on-surface-variant">Mirar torneos y equipos es gratis y no requiere cuenta.</p>
        </div>
      </div>

      <!-- Social proof: real counters -->
      <div v-if="summary" class="mx-auto max-w-[1200px] px-gutter pb-margin-lg md:px-margin-md">
        <dl class="m-0 grid grid-cols-2 gap-px overflow-hidden rounded border border-solid border-outline-variant/40 bg-outline-variant/40 md:grid-cols-4">
          <div v-for="c in counters" :key="c.label" class="flex flex-col gap-1 bg-surface-container-low/90 p-space-md backdrop-blur">
            <dt class="label-tactical order-2 text-on-surface-variant">{{ c.label }}</dt>
            <dd class="m-0 font-scoreboard-num text-[32px] tabular text-on-surface md:text-[40px]">{{ c.value.toLocaleString('es-VE') }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <main class="mx-auto flex max-w-[1200px] flex-col gap-margin-lg px-gutter pb-margin-lg md:px-margin-md">
      <!-- Upcoming matches: broadcast-style strip -->
      <section v-if="summary?.upcoming.length">
        <SectionHeader title="Próximos partidos" icon="scoreboard" />
        <div class="-mx-gutter flex snap-x gap-space-sm overflow-x-auto px-gutter pb-space-xs md:mx-0 md:px-0">
          <router-link
            v-for="m in summary.upcoming"
            :key="m.id"
            :to="`/torneo/${m.tournament.id}`"
            class="card flex min-w-[240px] snap-start flex-col gap-space-xs p-space-md text-on-surface no-underline transition-colors hover:border-primary-container"
          >
            <span class="label-tactical flex items-center justify-between text-on-surface-variant">
              <span class="capitalize">{{ formatDay(m.matchDate) }}</span>
              <span class="font-stat-mono text-primary">{{ m.matchTime }}</span>
            </span>
            <span v-for="side in [m.homeTeam, m.awayTeam]" :key="side.id" class="flex items-center gap-space-xs font-title-sm text-title-sm">
              <span class="h-3 w-3 shrink-0 rounded-full border border-solid border-outline-variant" :style="{ backgroundColor: side.homeColor || 'transparent' }" />
              <span class="truncate">{{ side.name }}</span>
            </span>
            <span class="truncate text-body-sm text-on-surface-variant">{{ m.venue || 'Cancha por definir' }} · {{ m.tournament.name }}</span>
          </router-link>
        </div>
      </section>

      <!-- Open tournaments -->
      <section>
        <SectionHeader title="Inscripciones abiertas" icon="emoji_events">
          <router-link to="/torneos" class="text-body-sm text-primary">Ver todos los torneos</router-link>
        </SectionHeader>
        <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando torneos…</p>
        <div v-else-if="!tournaments.length" class="card flex flex-col gap-space-sm p-space-lg">
          <p class="m-0 text-body-md text-on-surface-variant">No hay torneos con inscripciones abiertas ahora mismo.</p>
          <router-link to="/torneos?estado=IN_PROGRESS" class="btn-secondary self-start">Ver torneos en curso</router-link>
        </div>
        <div v-else class="grid gap-space-md md:grid-cols-2 lg:grid-cols-3">
          <TournamentCard v-for="t in tournaments" :key="t.id" :tournament="t" />
        </div>
      </section>

      <!-- Leaders: pride and competition -->
      <section v-if="summary?.leaders.length">
        <SectionHeader title="Figuras de la liga" icon="local_fire_department" />
        <div class="grid gap-space-md md:grid-cols-3">
          <article
            v-for="(l, i) in summary.leaders"
            :key="l.playerId"
            class="card flex items-center gap-space-md p-space-lg"
            :class="{ 'shadow-[0_0_16px_rgba(245,158,11,0.3)]': i === 0 }"
          >
            <div class="relative shrink-0">
              <img v-if="l.photoUrl" :src="l.photoUrl" :alt="l.fullName" class="h-16 w-16 rounded-full object-cover" />
              <span v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high font-headline-md text-headline-md">
                {{ initials(l.fullName) }}
              </span>
              <span class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full font-stat-mono text-body-sm text-surface" :class="MEDALS[i]">{{ i + 1 }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="m-0 truncate font-title-sm text-title-sm">{{ l.fullName }}</p>
              <p class="m-0 truncate text-body-sm text-on-surface-variant">{{ l.teamName }} · {{ l.gamesPlayed }} PJ</p>
            </div>
            <div class="text-right">
              <span class="block font-scoreboard-num text-scoreboard-num tabular text-primary-container">{{ l.pointsPerGame }}</span>
              <span class="label-tactical text-on-surface-variant">PTS/P</span>
            </div>
          </article>
        </div>
      </section>

      <!-- Territory: the hook that makes this league different -->
      <section class="card relative overflow-hidden p-space-lg md:p-space-xl">
        <span class="icon icon-fill pointer-events-none absolute -right-6 -top-6 text-[180px] text-secondary-container/10">workspace_premium</span>
        <div class="relative grid gap-space-lg md:grid-cols-[1fr_1.2fr] md:items-center">
          <div class="flex flex-col gap-space-sm">
            <span class="label-tactical text-secondary">Dominio territorial</span>
            <h2 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Dueños de zona</h2>
            <p class="m-0 text-body-md text-on-surface-variant">
              Cada zona de Caracas tiene canchas y torneos. El equipo que más torneos gana en una zona se corona su dueño y los demás lo pueden retar.
            </p>
            <router-link :to="ctaLink(authStore.isAuthenticated, 'TEAM_CAPTAIN', '/app/zones/map')" class="btn-secondary self-start">
              <span class="icon">map</span> Ver mapa de zonas
            </router-link>
          </div>
          <div v-if="summary?.zoneOwners.length" class="flex flex-col gap-space-sm">
            <div
              v-for="z in summary.zoneOwners"
              :key="z.zone.id"
              class="flex items-center gap-space-md rounded border border-solid border-secondary-container/40 bg-surface-container-low p-space-md"
            >
              <span class="icon icon-fill text-[28px] text-secondary-container">crown</span>
              <div class="min-w-0 flex-1">
                <p class="label-tactical m-0 text-on-surface-variant">{{ z.zone.name }}</p>
                <p class="m-0 truncate font-title-sm text-title-sm">{{ z.team.name }}</p>
              </div>
              <span class="font-stat-mono text-stat-mono text-secondary">{{ z.championshipsWon }} títulos</span>
            </div>
          </div>
          <div v-else class="flex items-center gap-space-md rounded border border-dashed border-secondary-container/50 bg-surface-container-low p-space-lg">
            <span class="icon icon-fill text-[40px] text-secondary-container">crown</span>
            <p class="m-0 text-body-md">
              <strong class="block font-title-sm text-title-sm">Ninguna zona tiene dueño todavía.</strong>
              <span class="text-on-surface-variant">El primer campeón de cada zona se lleva la corona.</span>
            </p>
          </div>
        </div>
      </section>

      <!-- One path per profile -->
      <section>
        <SectionHeader title="¿Cómo quieres jugar?" icon="sports" />
        <div class="grid gap-space-md md:grid-cols-3">
          <article v-for="r in paths" :key="r.title" class="card flex flex-col gap-space-sm p-space-lg">
            <span class="icon text-[32px] text-primary-container">{{ r.icon }}</span>
            <h3 class="m-0 font-headline-md text-headline-md uppercase">{{ r.title }}</h3>
            <ol class="m-0 flex flex-col gap-space-xs p-0 text-body-md text-on-surface-variant">
              <li v-for="(s, i) in r.steps" :key="s" class="flex items-start gap-space-sm">
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-container-high font-stat-mono text-body-sm text-primary">{{ i + 1 }}</span>
                {{ s }}
              </li>
            </ol>
            <router-link :to="r.to" class="btn-secondary mt-auto">{{ r.cta }}</router-link>
          </article>
        </div>
      </section>

      <!-- Final call to action -->
      <section v-if="!authStore.isAuthenticated" class="relative isolate overflow-hidden rounded-lg bg-primary-container p-space-xl text-center md:p-margin-lg">
        <img v-if="heroPhoto" :src="heroPhoto" alt="" class="absolute inset-0 -z-10 h-full w-full object-cover opacity-20 mix-blend-multiply" />
        <h2 class="m-0 font-display-xl-mobile text-display-xl-mobile uppercase text-surface md:font-display-xl md:text-display-xl">
          La próxima temporada empieza en tu cancha
        </h2>
        <p class="mx-auto mb-space-lg mt-space-sm max-w-[48ch] text-body-md font-semibold text-surface">Crea tu cuenta gratis y entra a tu primer torneo en minutos.</p>
        <router-link to="/auth/register" class="btn-secondary border-surface bg-surface text-on-surface">Crear cuenta gratis</router-link>
      </section>
    </main>

    <footer class="border-0 border-t border-solid border-outline-variant/40">
      <div class="mx-auto flex max-w-[1200px] flex-col gap-space-sm px-gutter py-space-xl text-body-sm text-on-surface-variant md:flex-row md:justify-between md:px-margin-md">
        <span>Basketball MVP · CCS Streetball</span>
        <span class="flex flex-wrap gap-space-md">
          <router-link to="/torneos" class="text-on-surface-variant no-underline hover:text-primary">Torneos</router-link>
          <router-link to="/equipos" class="text-on-surface-variant no-underline hover:text-primary">Equipos</router-link>
          <router-link to="/auth/login" class="text-on-surface-variant no-underline hover:text-primary">Iniciar sesión</router-link>
          <router-link to="/auth/register" class="text-on-surface-variant no-underline hover:text-primary">Crear cuenta</router-link>
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import tournamentsService from '@/services/tournaments'
import { useAuthStore } from '@/stores/auth'
import { ctaLink } from '@/router/navigation'
import { formatDay } from '@/utils/labels'
import PublicHeader from '@/components/PublicHeader.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import TournamentCard from '@/components/tournament/TournamentCard.vue'

const authStore = useAuthStore()
const year = new Date().getFullYear()
const MEDALS = ['bg-secondary-container', 'bg-[#cbd5e1]', 'bg-[#d97706]']

const paths = [
  {
    icon: 'sports_basketball',
    title: 'Busco equipo',
    steps: ['Mira qué equipos buscan jugadores', 'Crea tu cuenta de jugador', 'Postúlate y el capitán te acepta'],
    cta: 'Ver equipos que buscan jugadores',
    to: '/equipos'
  },
  {
    icon: 'groups',
    title: 'Tengo equipo',
    steps: ['Elige un torneo con cupos', 'Crea tu cuenta de capitán', 'Ficha a tu gente e inscríbete'],
    cta: 'Elegir torneo',
    to: '/torneos'
  },
  {
    icon: 'emoji_events',
    title: 'Organizo torneos',
    steps: ['Crea el torneo en una cancha de tu zona', 'Aprueba equipos y pagos', 'Genera el fixture y carga resultados'],
    cta: 'Crear cuenta de organizador',
    to: { path: '/auth/register', query: { role: 'ORGANIZER' } }
  }
]

const tournaments = ref([])
const summary = ref(null)
const loading = ref(true)

const heroPhoto = computed(() => tournaments.value.find(t => t.coverPhoto)?.coverPhoto || '')
const counters = computed(() => [
  { label: 'Torneos activos', value: summary.value.stats.activeTournaments },
  { label: 'Equipos', value: summary.value.stats.teams },
  { label: 'Jugadores', value: summary.value.stats.players },
  { label: 'Partidos jugados', value: summary.value.stats.matchesPlayed }
])
const initials = name => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

onMounted(async () => {
  const [t, s] = await Promise.allSettled([
    tournamentsService.getAll({ status: 'REGISTRATION', limit: 6 }),
    tournamentsService.getLandingSummary()
  ])
  tournaments.value = t.status === 'fulfilled' ? t.value.data.tournaments || [] : []
  summary.value = s.status === 'fulfilled' ? s.value.data : null
  loading.value = false
})
</script>
