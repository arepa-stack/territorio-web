<template>
  <!-- Design: Claude Design canvas "Landing Basketball MVP" (cartel de cancha) -->
  <div class="poster">
    <PosterHeader />

    <!-- Hero: court photo in black and white under the headline -->
    <section class="hero">
      <img v-if="heroPhoto" :src="heroPhoto" alt="" class="hero__photo" />
      <div class="hero__shade" />
      <div class="wrap hero__body">
        <p class="eyebrow hero__kicker">
          <span class="text-blaze">Temporada {{ year }}</span><span>{{ country === 'VE' ? 'Caracas' : COUNTRIES[country].name }}</span>
          <span v-if="summary">{{ summary.stats.activeTournaments }} torneos en juego</span>
        </p>
        <h1 class="display hero__title">
          <span>Tu barrio.</span><span>Tu cancha.</span><span class="text-blaze">Tu corona.</span>
        </h1>
        <p class="hero__lead">
          Torneos en las canchas de tu zona, la planilla de cada partido y equipos que buscan jugadores. Gana en tu zona y tu equipo se queda con ella.
        </p>
        <div class="hero__ctas">
          <router-link to="/torneos" class="btn-blaze hero__cta">
            Buscar torneo
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </router-link>
          <router-link to="/equipos" class="btn-line hero__cta">Busco equipo</router-link>
        </div>
        <p class="mono hero__note">Mirar torneos, equipos y zonas es gratis. Sin cuenta.</p>
      </div>
    </section>

    <!-- Upcoming matches: printed match-sheet strip -->
    <section v-if="summary?.upcoming.length" class="sheet" aria-labelledby="prox">
      <div class="wrap sheet__body">
        <div class="sheet__head">
          <h2 id="prox" class="display sheet__title">Próximos partidos</h2>
        </div>
        <router-link v-for="m in summary.upcoming.slice(0, 4)" :key="m.id" :to="`/partido/${m.id}`" class="match-row">
          <span class="mono match-row__when">{{ shortDay(m.matchDate) }} <span class="match-row__time">· {{ m.matchTime }}</span></span>
          <span class="display match-row__teams">{{ m.homeTeam.name }} <span class="match-row__vs">vs</span> {{ m.awayTeam.name }}</span>
          <span class="match-row__where">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
            {{ m.venue || 'Cancha por definir' }} · {{ m.tournament.name }}
          </span>
        </router-link>
      </div>
    </section>

    <!-- The league in numbers (real counters) -->
    <section v-if="summary" class="rule-bottom" aria-label="La liga en números">
      <dl class="wrap stats">
        <div v-for="c in counters" :key="c.label" class="stats__cell">
          <dt class="mono stats__label">{{ c.label }}</dt>
          <dd class="display stats__value">{{ String(c.value).padStart(2, '0') }}</dd>
        </div>
      </dl>
    </section>

    <!-- Playoffs being played: live bracket (or projection) per tournament -->
    <section v-if="summary?.brackets?.length" class="rule-bottom" aria-labelledby="playoffs-t">
      <div class="wrap section-pad stack-40">
        <div class="split">
          <h2 id="playoffs-t" class="display section-title">Playoffs<br />en juego</h2>
          <router-link to="/torneos?estado=IN_PROGRESS" class="link-under">Ver torneos en curso</router-link>
        </div>
        <!-- One bracket at a time; the API sends the one closest to the title first -->
        <div v-if="summary.brackets.length > 1" class="bracket-tabs" role="tablist" aria-label="Torneo">
          <button
            v-for="(b, i) in summary.brackets"
            :key="b.tournamentId"
            type="button"
            role="tab"
            class="bracket-tab"
            :aria-selected="i === bracketIndex"
            @click="bracketIndex = i"
          >{{ b.tournamentName }}<span class="bracket-tab__stage">{{ stageOf(b.bracket) }}</span></button>
        </div>
        <router-link :to="`/torneo/${shownBracket.tournamentId}`" class="bracket-link">
          <PlayoffBracket :bracket="shownBracket.bracket" :title="shownBracket.tournamentName" subtitle="Camino al título" />
        </router-link>
      </div>
    </section>

    <!-- Zonas de control: the hook that makes this league different -->
    <section class="zones rule-bottom" aria-labelledby="zonas-t">
      <svg class="zones__court" aria-hidden="true" width="900" height="900" viewBox="0 0 900 900" fill="none" stroke="#1C1B17" stroke-width="3">
        <circle cx="450" cy="450" r="420" /><circle cx="450" cy="450" r="140" /><rect x="330" y="0" width="240" height="380" /><path d="M30 450h840" />
      </svg>
      <div class="wrap section-pad zones__body">
        <div class="split">
          <div class="split__text">
            <span class="eyebrow text-gold">El juego dentro del juego</span>
            <h2 id="zonas-t" class="display section-title">Zonas de control</h2>
            <p class="lead">
              Cada zona de {{ country === 'VE' ? 'Caracas' : 'tu ciudad' }} tiene sus canchas. Gana torneos ahí y tu equipo suma títulos: con más de la mitad, la zona es tuya. Si nadie llega, está en disputa.
            </p>
          </div>
          <router-link to="/zonas" class="btn-line">
            Ver mapa de zonas
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </router-link>
        </div>

        <template v-if="summary?.zones.length">
          <router-link to="/zonas" class="zones__map" aria-label="Abrir el mapa de zonas">
            <ZoneLeafletMap :zones="mapZones" :standings="standings" :interactive="false" />
            <span class="zones__map-open">Abrir mapa completo</span>
          </router-link>
          <div class="zones__grid">
            <ZonePanel v-for="z in summary.zones" :key="z.id" :zone="z" :max-teams="6" />
          </div>
        </template>
        <p v-else class="empty-box">
          <strong>Ninguna zona tiene dueño todavía.</strong> El primer campeón de cada zona se lleva la corona.
        </p>
      </div>
    </section>

    <!-- Open registrations: poster rows -->
    <section id="torneos" class="rule-bottom" aria-labelledby="torneos-t">
      <div class="wrap section-pad stack-40">
        <div class="split">
          <h2 id="torneos-t" class="display section-title">Inscripciones<br />abiertas</h2>
          <router-link to="/torneos" class="link-under">Ver todos los torneos</router-link>
        </div>
        <TurfLoader v-if="loading" label="Cargando torneos" />
        <div v-else-if="!openTournaments.length" class="empty-box">
          No hay torneos con inscripciones abiertas ahora mismo.
          <router-link to="/torneos?estado=IN_PROGRESS" class="link-under">Ver torneos en curso</router-link>
        </div>
        <div v-else class="t-list">
          <PosterTournamentRow v-for="t in openTournaments" :key="t.id" :tournament="t" />
        </div>
      </div>
    </section>

    <!-- League leaders (only once match sheets exist) -->
    <section v-if="summary?.leaders.length" class="rule-bottom" aria-labelledby="figuras-t">
      <div class="wrap section-pad stack-40">
        <h2 id="figuras-t" class="display section-title">Figuras de la liga</h2>
        <ol class="leaders">
          <li v-for="(l, i) in summary.leaders" :key="l.playerId" class="leaders__item" :class="{ 'is-first': i === 0 }">
            <span class="display leaders__rank">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="leaders__who">
              <router-link :to="`/jugador/${l.playerId}`" class="display leaders__name" style="color: inherit">{{ l.fullName }}</router-link>
              <span class="mono leaders__team">{{ l.teamName }} · {{ l.gamesPlayed }} PJ</span>
            </span>
            <span class="leaders__ppg"><span class="display">{{ l.pointsPerGame }}</span><span class="mono leaders__unit">Pts/P</span></span>
          </li>
        </ol>
      </div>
    </section>

    <!-- One path per profile -->
    <section id="equipos" class="rule-bottom" aria-labelledby="jugar-t">
      <div class="wrap section-pad stack-48">
        <h2 id="jugar-t" class="display section-title">¿Cómo quieres jugar?</h2>
        <div class="steps">
          <div v-for="(p, i) in paths" :key="p.title" class="steps__item">
            <span class="display steps__n">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3 class="display steps__title">{{ p.title }}</h3>
            <p class="steps__body">{{ p.body }}</p>
            <router-link :to="p.to" class="link-under steps__cta">{{ p.cta }}</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Final call to action (visitors only) -->
    <section v-if="!authStore.isAuthenticated" class="cta" aria-labelledby="cta-t">
      <div class="wrap cta__body">
        <h2 id="cta-t" class="display cta__title">La próxima temporada empieza en tu cancha</h2>
        <div class="cta__side">
          <router-link to="/auth/register" class="btn-ink cta__btn">Crear cuenta gratis</router-link>
          <span class="mono cta__note">Jugadores, capitanes y organizadores.</span>
        </div>
      </div>
    </section>

    <footer>
      <div class="wrap launch">
        <p class="launch__text">
          <span class="launch__tag mono">Lanzamiento</span>
          Organizar torneos en Turf es <strong>gratis por tiempo limitado</strong>. Aprovecha y sé de los primeros organizadores: más adelante publicar un torneo tendrá costo.
        </p>
        <a class="launch__mail mono" :href="contactMail">¿Dudas? adminnibstech@gmail.com</a>
      </div>
      <div class="wrap footer mono">
        <span>Turf · Basket de barrio</span>
        <nav class="footer__links" aria-label="Pie de página">
          <router-link to="/torneos">Torneos</router-link>
          <router-link to="/equipos">Equipos</router-link>
          <router-link to="/zonas">Zonas</router-link>
          <router-link to="/auth/login">Entrar</router-link>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { watch as watchCountry } from 'vue'
import { COUNTRIES, country } from '@/composables/useCountry'
import { computed, onMounted, ref } from 'vue'
import '@/styles/poster.css'
import tournamentsService from '@/services/tournaments'
import zonesService from '@/services/zones'
import { useAuthStore } from '@/stores/auth'
import PosterTournamentRow from '@/components/poster/PosterTournamentRow.vue'
import PosterHeader from '@/components/PosterHeader.vue'
import PlayoffBracket from '@/components/PlayoffBracket.vue'
import { PHASE_LABEL } from '@/utils/labels'
import ZoneLeafletMap from '@/components/zone/ZoneLeafletMap.vue'
import ZonePanel from '@/components/zone/ZonePanel.vue'

const authStore = useAuthStore()
const year = new Date().getFullYear()

const paths = [
  { title: 'Jugador', body: 'Encuentra un equipo que busca gente en tu zona, postúlate y sigue tus números partido a partido.', cta: 'Busco equipo', to: '/equipos' },
  { title: 'Capitán', body: 'Arma tu plantel, invita por WhatsApp, inscribe al equipo y pelea la corona de tu zona.', cta: 'Elegir torneo', to: '/torneos' },
  {
    title: 'Organizador',
    body: 'Crea el torneo con la foto de tu cancha, aprueba inscripciones y carga resultados.',
    cta: 'Organizar un torneo',
    to: { path: '/auth/register', query: { role: 'ORGANIZER' } }
  }
]

const tournaments = ref([])
const summary = ref(null)
const mapZones = ref([])
const loading = ref(true)

const today = new Date(new Date().toDateString())
// Registration still open but already over: stale test data, keep it off the landing
const openTournaments = computed(() => tournaments.value.filter(t => new Date(t.endDate) >= today).slice(0, 5))
const bracketIndex = ref(0)
const shownBracket = computed(() => summary.value?.brackets?.[bracketIndex.value] || summary.value?.brackets?.[0])
// Latest round with games: "Final", "Semifinales"… or "Proyección" before the playoffs exist
const stageOf = b => {
  if (b.champion) return 'Campeón'
  if (b.projected) return 'Proyección'
  const played = [...b.phases].reverse().find(ph => ph.games.some(g => g.matchId))
  return PHASE_LABEL[played?.phase] || ''
}
const contactMail = `mailto:adminnibstech@gmail.com?subject=${encodeURIComponent('Quiero organizar un torneo en Turf')}`
const heroPhoto = computed(() => tournaments.value.find(t => t.coverPhoto)?.coverPhoto || '')
const standings = computed(() => Object.fromEntries((summary.value?.zones || []).map(z => [z.id, z])))
const counters = computed(() => [
  { label: 'Torneos activos', value: summary.value.stats.activeTournaments },
  { label: 'Equipos', value: summary.value.stats.teams },
  { label: 'Jugadores', value: summary.value.stats.players },
  { label: 'Partidos jugados', value: summary.value.stats.matchesPlayed }
])
// Dates are stored as UTC calendar days; reading them in local time (UTC-4) shows the day before
const shortDay = d => new Date(d).toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' })

const loadAll = async () => {
  const [t, s, z] = await Promise.allSettled([
    tournamentsService.getAll({ status: 'REGISTRATION', limit: 12 }),
    tournamentsService.getLandingSummary(),
    zonesService.getAll()
  ])
  tournaments.value = t.status === 'fulfilled' ? t.value.data.tournaments || [] : []
  summary.value = s.status === 'fulfilled' ? s.value.data : null
  mapZones.value = z.status === 'fulfilled' ? (z.value.data?.data || []).filter(zone => zone.isActive) : []
  loading.value = false
}
onMounted(loadAll)
watchCountry(country, loadAll)
</script>

<style scoped>
.text-blaze {
  color: var(--blaze);
}

.text-gold {
  color: var(--gold);
}

.text-hot {
  color: var(--hot);
}

.rule-bottom {
  border-bottom: 1px solid var(--line);
}

.section-pad {
  padding-top: 112px;
  padding-bottom: 112px;
}

.stack-40,
.stack-48 {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.stack-48 {
  gap: 48px;
}

.section-title {
  font-size: clamp(48px, 6vw, 88px);
}

.lead {
  max-width: 720px;
  font-size: 19px;
  line-height: 1.5;
  color: var(--chalk-dim);
}

.split {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
}

.split__text {
  display: flex;
  max-width: 720px;
  flex-direction: column;
  gap: 20px;
}

.empty-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 28px;
  border: 2px dashed var(--line);
  font-size: 17px;
  color: var(--chalk-dim);
}

/* Hero */
.hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
}

.hero__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.25) brightness(0.55);
}

.hero__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #0d0d0b 0%, rgb(13 13 11 / 0.75) 45%, rgb(13 13 11 / 0.2) 100%);
}

.hero__body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 96px;
  padding-bottom: 88px;
}

.hero__kicker {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.hero__title {
  font-size: clamp(64px, 11vw, 168px);
  line-height: 0.88;
  letter-spacing: -0.01em;
}

.hero__title span {
  display: block;
}

.hero__lead {
  max-width: 540px;
  font-size: 19px;
  line-height: 1.5;
  color: var(--chalk-dim);
}

.hero__ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.hero__cta {
  padding: 20px 28px;
  font-size: 16px;
}

.hero__note {
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: none;
  color: var(--muted);
}

/* Upcoming matches */
.sheet {
  background: var(--chalk);
  color: var(--asphalt);
}

.sheet__body {
  display: flex;
  flex-direction: column;
  padding-top: 40px;
  padding-bottom: 40px;
}

.sheet__head {
  padding-bottom: 16px;
  border-bottom: 3px solid var(--asphalt);
}

.sheet__title {
  font-size: 40px;
  line-height: 1;
}

.poster .match-row {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr) minmax(0, 320px);
  align-items: center;
  gap: 24px;
  padding: 18px 0;
  border-bottom: 1px solid #c9c3b4;
  color: var(--asphalt);
  text-decoration: none;
}

.poster .match-row:hover {
  background: #e3ddd0;
  color: var(--asphalt);
}

.match-row__when {
  font-size: 14px;
  font-weight: 700;
}

.match-row__time {
  color: #5e5a51;
}

.match-row__teams {
  font-size: 28px;
  line-height: 1.05;
}

.match-row__vs {
  padding: 0 8px;
  font-size: 20px;
  color: #c2390a;
}

.match-row__where {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4a473f;
}

/* Numbers */
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0 auto;
}

.stats__cell {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: 8px;
  padding: 48px 24px 40px 0;
  border-right: 1px solid var(--line);
}

.stats__cell:last-child {
  border-right: 0;
}

.stats__label {
  font-size: 13px;
  color: var(--muted);
}

.stats__value {
  margin: 0;
  font-size: 96px;
}

/* Zones */
.zones {
  position: relative;
  overflow: hidden;
}

.zones__court {
  position: absolute;
  top: -120px;
  right: -260px;
}

.zones__body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.zones__map {
  position: relative;
  display: block;
  height: 460px;
  border: 1px solid var(--line);
}

/* The mini map is a picture: the whole box is the link to /zonas */
.zones__map :deep(.zone-map) {
  pointer-events: none;
}

.zones__map-open {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 500;
  padding: 14px 20px;
  background: var(--blaze);
  color: var(--asphalt);
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.zones__map:hover .zones__map-open {
  background: var(--chalk);
}

.zones__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

/* Leaders */
.leaders {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 3px solid var(--chalk);
}

.leaders__item {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 0;
  border-bottom: 1px solid var(--line);
}

.leaders__rank {
  width: 72px;
  font-size: 56px;
  color: var(--muted);
}

.leaders__item.is-first .leaders__rank,
.leaders__item.is-first .leaders__ppg {
  color: var(--gold);
}

.leaders__who {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.leaders__name {
  font-size: 34px;
  line-height: 1;
}

.leaders__team,
.leaders__unit {
  font-size: 12px;
  color: var(--muted);
}

.leaders__ppg {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 56px;
}

/* Steps */
.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 3px solid var(--chalk);
}

.steps__item {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 36px 32px 8px 0;
}

.steps__n {
  font-size: 72px;
  line-height: 1;
  color: var(--blaze);
}

.steps__title {
  font-size: 34px;
  line-height: 1;
}

.steps__body {
  font-size: 16px;
  line-height: 1.55;
  color: var(--chalk-dim);
}

.steps__cta {
  align-self: flex-start;
  margin-top: 8px;
}

/* Final CTA */
.cta {
  background: var(--blaze);
  color: var(--asphalt);
}

.cta__body {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  padding-top: 96px;
  padding-bottom: 96px;
}

.cta__title {
  max-width: 900px;
  font-size: clamp(52px, 7vw, 104px);
}

.cta__side {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 14px;
}

.cta__btn {
  padding: 22px 32px;
  font-size: 16px;
}

.cta__note {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: none;
}

/* Footer */
.launch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding-top: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid color-mix(in srgb, var(--muted) 25%, transparent);
}

.launch__text {
  margin: 0;
  max-width: 720px;
  line-height: 1.5;
}

.launch__tag {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 8px;
  background: var(--blaze);
  color: #fff;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.poster .launch__mail {
  color: var(--blaze);
  font-size: 13px;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.poster .launch__mail:hover {
  text-decoration: underline;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  padding-top: 32px;
  padding-bottom: 32px;
  font-size: 12px;
  color: var(--muted);
}

.footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.poster .footer__links a {
  color: var(--muted);
  text-decoration: none;
}

.poster .footer__links a:hover {
  color: var(--blaze);
}

@media (max-width: 900px) {
  .section-pad {
    padding-top: 72px;
    padding-bottom: 72px;
  }

  .split,
  .cta__body {
    flex-direction: column;
    align-items: flex-start;
  }

  .poster .match-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stats__cell:nth-child(2n) {
    border-right: 0;
  }

  .stats__value {
    font-size: 72px;
  }

  .zones__grid,
  .steps {
    grid-template-columns: minmax(0, 1fr);
  }

  .zones__map {
    height: 340px;
  }

  .leaders__ppg {
    font-size: 40px;
  }
}

.poster .bracket-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.poster .bracket-link:hover {
  color: inherit;
}

.bracket-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bracket-tab {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border: 2px solid var(--line);
  background: transparent;
  color: var(--chalk-dim);
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
}

.bracket-tab:hover {
  border-color: var(--chalk);
  color: var(--chalk);
}

.bracket-tab[aria-selected='true'] {
  border-color: var(--gold);
  color: var(--chalk);
}

.bracket-tab__stage {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.1em;
  color: var(--gold);
}
</style>
