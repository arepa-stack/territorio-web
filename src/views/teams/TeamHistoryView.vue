<template>
  <!-- Design: Stitch "Historial del Equipo - Los Tigres" (Basketball MVP Caracas) -->
  <div class="relative flex flex-col gap-space-lg">
    <div class="flex items-center gap-space-sm">
      <button type="button" class="btn-ghost" aria-label="Volver" @click="$router.back()"><span class="icon">arrow_back</span></button>
      <span class="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
      <span class="label-tactical uppercase text-on-surface-variant">Sala de trofeos · Palmarés</span>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando historial…</p>

    <template v-else-if="history">
      <!-- 1. Hero: crest, name, trophies over a court-lines watermark -->
      <section class="relative flex flex-col items-center overflow-hidden pb-space-md pt-space-lg text-center">
        <svg class="pointer-events-none absolute -top-10 left-1/2 h-[420px] w-[420px] -translate-x-1/2 text-primary-container opacity-10" viewBox="0 0 300 300" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="150" cy="150" r="130" stroke-dasharray="4 4" />
          <circle cx="150" cy="150" r="45" />
          <line x1="20" y1="150" x2="280" y2="150" />
          <path d="M 90,20 L 90,80 A 60,60 0 0,0 210,80 L 210,20" />
          <path d="M 120,20 L 120,70 L 180,70 L 180,20" />
        </svg>

        <div class="relative mb-space-md">
          <div class="relative flex h-24 w-24 items-center justify-center rounded border-2 border-solid border-primary-container bg-surface-container-low shadow-[0_0_25px_rgba(255,85,0,0.35)]">
            <div class="absolute inset-1 flex items-center justify-center rounded border border-solid border-primary-container/30">
              <span class="font-display text-[64px] font-black leading-none text-primary-container drop-shadow-[0_2px_10px_rgba(255,85,0,0.6)]">{{ history.team.name.replace(/^(los|las|el|la)\s+/i, '').charAt(0) }}</span>
            </div>
            <span v-for="c in ['-left-1 -top-1', '-right-1 -top-1', '-bottom-1 -left-1', '-bottom-1 -right-1']" :key="c" class="absolute h-2 w-2 bg-primary-container" :class="c" />
          </div>
          <span
            v-if="summary.titles"
            class="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded bg-secondary-container px-1.5 font-display text-[11px] font-black tracking-wider text-on-secondary-container shadow-[0_0_12px_rgba(245,158,11,0.45)]"
          >★ {{ summary.titles }}X CAMPEÓN</span>
        </div>

        <h1 class="m-0 font-display text-[40px] font-black uppercase leading-none tracking-tight md:text-[56px]">{{ history.team.name }}</h1>
        <p class="m-0 mt-1 flex items-center gap-1.5 label-tactical uppercase text-on-surface-variant">
          <span class="h-1.5 w-1.5 rounded-full bg-primary-container" />
          {{ categoryLabel(history.team.category) }}<template v-if="history.team.city"> · {{ history.team.city }}</template>
        </p>

        <div v-if="summary.titles" class="mt-space-md flex items-center gap-space-sm rounded border border-solid border-secondary-container/45 bg-surface-container px-space-md py-space-sm shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <span
            v-for="t in titles"
            :key="t.tournament.id"
            class="icon icon-fill text-[22px] text-secondary-container drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
            :title="`Campeón ${t.tournament.name}`"
          >emoji_events</span>
          <span class="h-4 w-px bg-outline-variant" />
          <span class="font-display text-[15px] font-black uppercase tracking-widest text-secondary-container">{{ summary.titles }} {{ summary.titles === 1 ? 'título' : 'títulos' }}</span>
        </div>
      </section>

      <!-- 2. Key stats: scoreboard tiles -->
      <section class="grid grid-cols-2 gap-space-sm md:grid-cols-4">
        <div v-for="s in stats" :key="s.label" class="card flex flex-col gap-1 p-space-md">
          <div class="flex items-center justify-between label-tactical uppercase text-on-surface-variant">
            {{ s.label }} <span class="h-1.5 w-1.5 rounded-full" :class="s.dot" />
          </div>
          <span class="font-mono text-[28px] font-extrabold leading-none tracking-tight tabular" :class="s.color">{{ s.value }}</span>
          <span class="font-display text-[11px] uppercase" :class="s.hintColor || 'text-on-surface-variant'">{{ s.hint }}</span>
        </div>
      </section>

      <!-- 3. Form: last 10 results, most recent first -->
      <section v-if="lastTen.length" class="card p-space-md">
        <div class="mb-space-sm flex items-center justify-between">
          <h2 class="m-0 flex items-center gap-space-sm label-tactical uppercase">
            <span class="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_10px_rgba(16,185,129,0.35)]" /> Racha · últimos {{ lastTen.length }}
          </h2>
          <span class="font-mono text-body-sm font-bold text-tertiary">{{ lastTenWins }}G - {{ lastTen.length - lastTenWins }}P</span>
        </div>
        <ol class="m-0 grid list-none grid-cols-10 gap-1.5 p-0">
          <li v-for="m in lastTen" :key="m.id" class="flex flex-col items-center gap-1" :title="`${m.tournamentName} J${m.round}: ${m.result === 'W' ? 'Victoria' : 'Derrota'} ${m.teamScore}-${m.oppScore} ${m.home ? 'vs' : '@'} ${m.opponent.name}`">
            <span class="flex aspect-square w-full items-center justify-center rounded border border-solid font-mono text-body-sm font-bold" :class="resultClass(m)">{{ m.result === 'W' ? 'G' : 'P' }}</span>
          </li>
        </ol>
        <p class="m-0 mt-space-sm text-center font-display text-[11px] uppercase tracking-wider text-on-surface-variant">← Más reciente</p>
      </section>

      <!-- 4. Timeline: one node per tournament -->
      <section>
        <div class="mb-space-md flex items-center justify-between border-0 border-b border-solid border-outline-variant/40 pb-space-sm">
          <h2 class="m-0 flex items-baseline gap-space-sm font-display text-[20px] font-black uppercase tracking-wider">
            Trayectoria <span class="label-tactical font-normal text-on-surface-variant">{{ summary.tournaments }} torneos</span>
          </h2>
          <span v-if="summary.titles" class="rounded border border-solid border-secondary-container/30 bg-secondary-container/10 px-space-sm label-tactical uppercase text-secondary-container">
            {{ summary.titles }} {{ summary.titles === 1 ? 'corona' : 'coronas' }}
          </span>
        </div>

        <p v-if="!history.tournaments.length" class="m-0 text-body-md text-on-surface-variant">Este equipo todavía no tiene torneos jugados.</p>

        <ol class="relative m-0 flex list-none flex-col gap-space-lg p-0 pl-7 before:absolute before:bottom-3 before:left-2.5 before:top-3 before:w-0.5 before:bg-outline-variant/60">
          <li v-for="(row, i) in history.tournaments" :key="row.tournament.id" class="relative">
            <span
              class="absolute -left-7 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-solid bg-surface"
              :class="row.isChampion ? 'border-secondary-container shadow-[0_0_12px_rgba(245,158,11,0.45)]' : 'border-on-surface-variant/50'"
            >
              <span class="rounded-full" :class="row.isChampion ? ['h-2 w-2 bg-secondary-container', i === 0 && 'animate-pulse'] : 'h-1.5 w-1.5 bg-on-surface-variant/60'" />
            </span>

            <!-- Native <details>: open/close without JS; the latest starts open -->
            <details
              class="group overflow-hidden rounded border border-solid"
              :class="row.isChampion ? 'border-secondary-container/60 bg-surface-container shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-outline-variant/40 bg-surface-container-low'"
              :open="i === 0"
            >
              <summary class="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div class="flex items-start justify-between gap-space-sm px-space-md py-space-md" :class="row.isChampion && 'bg-gradient-to-r from-secondary-container/20 to-transparent'">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-space-sm">
                      <h3 class="m-0 font-display text-[20px] font-black uppercase tracking-wide" :class="!row.isChampion && 'text-on-surface/80'">{{ row.tournament.name }}</h3>
                      <span v-if="row.isChampion" class="inline-flex items-center gap-1 rounded bg-secondary-container px-1.5 py-0.5 font-display text-[11px] font-black uppercase tracking-wider text-on-secondary-container shadow-[0_0_12px_rgba(245,158,11,0.45)]">
                        <span class="icon icon-fill text-[13px]">workspace_premium</span> Campeón
                      </span>
                    </div>
                    <p class="m-0 mt-0.5 font-mono text-[11px] text-on-surface-variant">{{ formatDate(row.tournament.startDate) }} – {{ formatDate(row.tournament.endDate) }}</p>
                    <p v-if="!row.isChampion" class="m-0 mt-1 text-body-sm text-on-surface-variant">Campeón: <strong class="text-on-surface">{{ row.tournament.winner?.name || 'por definir' }}</strong></p>
                  </div>
                  <div class="flex items-start gap-space-sm">
                    <div class="text-right">
                      <span class="block font-mono text-[26px] font-extrabold leading-none tabular" :class="row.wins > row.losses ? 'text-tertiary' : 'text-on-surface/80'">{{ row.wins }}-{{ row.losses }}</span>
                      <span class="font-display text-[10px] uppercase tracking-widest" :class="row.isChampion ? 'font-bold text-secondary-container' : 'text-on-surface-variant'">{{ pct(row.wins, row.losses) }} éxito</span>
                    </div>
                    <span class="icon text-on-surface-variant transition-transform group-open:rotate-180">expand_more</span>
                  </div>
                </div>

                <div class="border-0 border-t border-solid border-outline-variant/40 px-space-md py-space-sm">
                  <div class="mb-1.5 flex h-1.5 w-full overflow-hidden rounded bg-surface-container-highest">
                    <div class="h-full bg-tertiary" :style="{ width: share(row.wins, row.losses) }" />
                    <div class="h-full flex-1 bg-error" />
                  </div>
                  <div class="flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
                    <span>PF:PC <strong class="text-on-surface">{{ row.pointsFor }} : {{ row.pointsAgainst }}</strong></span>
                    <span class="font-bold" :class="row.pointsFor >= row.pointsAgainst ? 'text-tertiary' : 'text-error'">{{ signed(row.pointsFor - row.pointsAgainst) }} DIF</span>
                  </div>
                </div>
              </summary>

              <!-- 5. Games as scoreboard rows with quarter-by-quarter bars -->
              <div class="border-0 border-t border-solid border-outline-variant/40 bg-surface-container-lowest p-space-md">
                <p class="m-0 mb-space-sm flex items-center gap-1.5 label-tactical uppercase text-primary-container">
                  <span class="h-1.5 w-1.5 rounded-full bg-primary-container" /> Partidos del torneo
                </p>
                <ul class="m-0 flex list-none flex-col gap-space-sm p-0">
                  <li
                    v-for="m in expanded[row.tournament.id] ? row.matches : row.matches.slice(0, 3)"
                    :key="m.id"
                    class="rounded border border-solid border-outline-variant/40 bg-surface-container-low p-space-sm transition-colors hover:border-primary-container/60"
                  >
                    <div class="flex items-center justify-between gap-space-sm">
                      <div class="flex min-w-0 items-center gap-space-sm">
                        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-solid font-mono text-body-sm font-bold" :class="resultClass(m)" :aria-label="m.result === 'W' ? 'Victoria' : 'Derrota'">{{ m.result === 'W' ? 'G' : 'P' }}</span>
                        <div class="min-w-0">
                          <p class="m-0 font-mono text-[10px] uppercase text-on-surface-variant">J{{ m.round }} · {{ formatDate(m.matchDate) }}</p>
                          <router-link :to="links.match(m.id)" class="m-0 block truncate font-display text-[15px] font-extrabold uppercase tracking-wide text-on-surface hover:text-primary">{{ m.home ? 'vs' : '@' }} {{ m.opponent.name }}</router-link>
                        </div>
                      </div>
                      <div class="shrink-0 text-right">
                        <span class="font-mono text-[22px] font-extrabold tabular">{{ m.teamScore }}<span class="font-normal text-on-surface-variant">–</span>{{ m.oppScore }}</span>
                        <span class="block font-display text-[10px] font-bold uppercase" :class="m.forfeit || m.status === 'FORFEIT' ? 'text-error' : m.result === 'W' ? 'text-tertiary' : 'text-error'">
                          {{ m.forfeit || m.status === 'FORFEIT' ? 'W.O.' : 'Final' }}
                        </span>
                      </div>
                    </div>

                    <div v-if="m.quarters.length" class="mt-space-sm grid grid-cols-4 gap-1.5 border-0 border-t border-solid border-outline-variant/30 pt-space-sm text-center">
                      <div v-for="q in m.quarters" :key="q.quarter" class="rounded border border-solid border-outline-variant/30 bg-surface-container p-1">
                        <div class="font-display text-[10px] font-bold uppercase text-on-surface-variant">{{ q.quarter }}</div>
                        <div class="font-mono text-[12px] font-bold tabular" :class="q.team > q.opp ? 'text-tertiary' : 'text-on-surface-variant'">{{ q.team }}-{{ q.opp }}</div>
                        <div class="mt-1 flex h-1 w-full overflow-hidden rounded bg-surface-container-highest">
                          <div class="h-full" :class="q.team > q.opp ? 'bg-tertiary' : 'bg-on-surface-variant/50'" :style="{ width: share(q.team, q.opp) }" />
                          <div class="h-full flex-1" :class="q.opp > q.team ? 'bg-error/80' : 'bg-on-surface-variant/50'" />
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
                <button
                  v-if="row.matches.length > 3"
                  type="button"
                  class="mt-space-sm flex w-full items-center justify-center gap-1.5 rounded border border-solid border-primary-container/40 bg-surface-container-low py-space-sm label-tactical uppercase text-primary-container transition-colors hover:border-primary-container"
                  @click="expanded[row.tournament.id] = !expanded[row.tournament.id]"
                >
                  {{ expanded[row.tournament.id] ? 'Ver menos' : `Ver los ${row.matches.length} partidos` }}
                  <span class="icon text-[16px]">{{ expanded[row.tournament.id] ? 'expand_less' : 'expand_more' }}</span>
                </button>
              </div>
            </details>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import teamsService from '@/services/teams'
import { handleApiError } from '@/services/api'
import { CATEGORIES, formatDate } from '@/utils/labels'
import { useEntityLinks } from '@/utils/links'

const route = useRoute()
const links = useEntityLinks()
const toast = useToast()
const history = ref(null)
const loading = ref(true)
const expanded = reactive({}) // tournamentId -> showing all games

const summary = computed(() => history.value.summary)
const titles = computed(() => history.value.tournaments.filter(t => t.isChampion))
const allMatches = computed(() =>
  history.value.tournaments.flatMap(t => t.matches.map(m => ({ ...m, tournamentName: t.tournament.name })))
)
const lastTen = computed(() =>
  [...allMatches.value].sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate)).slice(0, 10)
)
const lastTenWins = computed(() => lastTen.value.filter(m => m.result === 'W').length)

const stats = computed(() => {
  const { tournaments, wins, losses } = summary.value
  const games = wins + losses
  const points = allMatches.value.reduce((s, m) => s + m.teamScore, 0)
  return [
    { label: 'Torneos', value: tournaments, hint: 'Competidos', dot: 'bg-on-surface-variant' },
    { label: 'Récord', value: `${wins}-${losses}`, hint: `${signed(wins - losses)} dif. victorias`, dot: 'bg-tertiary', hintColor: wins >= losses ? 'text-tertiary' : 'text-error' },
    { label: '% Victorias', value: pct(wins, losses), hint: `${games} juegos`, dot: 'bg-primary-container', color: 'text-primary-container' },
    { label: 'Pts/partido', value: games ? (points / games).toFixed(1) : '-', hint: `${points.toLocaleString('es-VE')} pts total`, dot: 'bg-on-surface-variant' }
  ]
})

const categoryLabel = c => CATEGORIES[c] || c
const pct = (w, l) => (w + l ? `${Math.round((w / (w + l)) * 100)}%` : '-')
const share = (a, b) => (a + b ? `${(a / (a + b)) * 100}%` : '50%')
const signed = n => (n > 0 ? `+${n}` : `${n}`)
const resultClass = m => (m.result === 'W'
  ? 'border-tertiary bg-tertiary/20 text-tertiary shadow-[0_0_10px_rgba(16,185,129,0.35)]'
  : 'border-error bg-error/20 text-error shadow-[0_0_10px_rgba(239,68,68,0.35)]')

onMounted(async () => {
  try {
    history.value = (await teamsService.getHistory(route.params.id)).data
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cargar el historial del equipo'))
  } finally {
    loading.value = false
  }
})
</script>
