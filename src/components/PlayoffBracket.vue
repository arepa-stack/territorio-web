<template>
  <!-- Playoff bracket: two halves that meet at the final in the middle. Fixed poster colors so it reads the same on the landing and in the app -->
  <section class="pb" :aria-label="title || 'Playoffs'">
    <header class="pb__head">
      <div>
        <span v-if="subtitle" class="pb__kicker">{{ subtitle }}</span>
        <h3 v-if="title" class="pb__title">{{ title }}</h3>
      </div>
      <span v-if="bracket.projected" class="pb__flag">Proyección · si la fase regular terminara hoy</span>
    </header>

    <div class="pb__grid" :style="{ '--cols': columns.length }">
      <div v-for="col in columns" :key="col.key" class="pb__col" :class="[`is-${col.side}`, { 'is-final': col.final }]" :style="{ '--order': col.depth }">
        <span class="pb__phase">{{ col.label }}</span>
        <div class="pb__games">
          <template v-if="col.final">
            <div class="pb__trophy" :class="{ 'is-won': bracket.champion }">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 18h18M4 18 3 7l5 4 4-6 4 6 5-4-1 11" />
              </svg>
              <span class="pb__champ-label">{{ bracket.champion ? 'Campeón' : '¿Quién se corona?' }}</span>
              <span v-if="bracket.champion" class="pb__champ">{{ bracket.champion.name }}</span>
            </div>
          </template>
          <article v-for="g in col.games" :key="g.slot" class="pb__game" :class="{ 'is-final-game': col.final, 'is-live': g.status === 'IN_PROGRESS' }">
            <div v-for="side in ['home', 'away']" :key="side" class="pb__team" :class="rowClass(g, side)">
              <span class="pb__seed">{{ g[side]?.seed ? `#${g[side].seed}` : '' }}</span>
              <span class="pb__name">{{ g[side]?.name || 'Por definir' }}</span>
              <span class="pb__score">{{ g[side === 'home' ? 'homeScore' : 'awayScore'] ?? '' }}</span>
            </div>
            <span v-if="g.status === 'SCHEDULED' && g.matchDate" class="pb__when">{{ when(g) }}</span>
            <span v-else-if="g.status === 'IN_PROGRESS'" class="pb__when pb__when--live">En juego</span>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

// bracket: GET /tournaments/:id/bracket ({ size, projected, phases: [{ phase, label, games }], champion })
const props = defineProps({
  bracket: { type: Object, required: true },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' }
})

// Left half = first half of every phase, right half = second half (mirrored); the final sits in the middle
const columns = computed(() => {
  const phases = props.bracket.phases
  const final = phases.at(-1)
  const early = phases.slice(0, -1)
  const half = (p, right) => {
    const mid = p.games.length / 2
    return { key: `${p.phase}-${right ? 'r' : 'l'}`, side: right ? 'right' : 'left', depth: phases.indexOf(p), label: p.label, games: right ? p.games.slice(mid) : p.games.slice(0, mid) }
  }
  return [...early.map(p => half(p, false)), { key: 'F', side: 'center', depth: phases.length, label: final.label, games: final.games, final: true }, ...early.reverse().map(p => half(p, true))]
})

const rowClass = (g, side) => {
  const id = g[side]?.teamId
  if (!g.winnerId || !id) return { 'is-tbd': !id }
  return { 'is-winner': g.winnerId === id, 'is-loser': g.winnerId !== id }
}

const when = g =>
  `${new Date(g.matchDate).toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })} · ${g.matchTime}`
</script>

<style scoped>
.pb {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border: 1px solid #2a2924;
  border-top: 6px solid #f5b21b;
  background:
    radial-gradient(ellipse at center, rgb(245 178 27 / 0.08), transparent 60%),
    #141411;
  color: #ede8dc;
  font-family: 'Archivo', sans-serif;
}

.pb__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.pb__kicker,
.pb__phase,
.pb__flag,
.pb__seed,
.pb__when,
.pb__champ-label {
  font-family: 'Space Mono', monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.pb__kicker {
  font-size: 11px;
  color: #f5b21b;
}

.pb__title {
  margin: 4px 0 0;
  font-family: 'Anton', sans-serif;
  font-size: 34px;
  font-weight: 400;
  line-height: 1;
  text-transform: uppercase;
}

.pb__flag {
  padding: 5px 10px;
  border: 1px dashed #77736a;
  font-size: 10px;
  color: #a8a397;
}

.pb__grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 14px;
}

.pb__col {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
}

.pb__phase {
  font-size: 10px;
  text-align: center;
  color: #a8a397;
}

.pb__col.is-final .pb__phase {
  color: #f5b21b;
}

/* Games spread evenly so each later round sits between its two feeders */
.pb__games {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-around;
  gap: 14px;
}

.pb__game {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid #2a2924;
  background: #0d0d0b;
}

/* Short connector from each game toward the final */
.pb__col.is-left .pb__game::after,
.pb__col.is-right .pb__game::after {
  position: absolute;
  top: 50%;
  width: 14px;
  border-top: 2px solid #3a3832;
  content: '';
}

.pb__col.is-left .pb__game::after {
  right: -16px;
}

.pb__col.is-right .pb__game::after {
  left: -16px;
}

.pb__game.is-final-game {
  border: 2px solid #f5b21b;
}

.pb__game.is-live {
  border-color: #4fd18b;
}

.pb__team {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 10px;
  border-left: 3px solid transparent;
}

.pb__team + .pb__team {
  border-top: 1px solid #22211c;
}

.pb__team.is-winner {
  border-left-color: #ff4f12;
  font-weight: 800;
}

.pb__team.is-loser {
  color: #77736a;
}

.pb__team.is-tbd .pb__name {
  font-style: italic;
  color: #77736a;
}

.pb__seed {
  font-size: 10px;
  color: #f5b21b;
}

.pb__name {
  overflow-wrap: anywhere;
  font-size: 14px;
  line-height: 1.15;
}

.pb__score {
  font-family: 'Space Mono', monospace;
  font-size: 15px;
  font-weight: 700;
}

.pb__when {
  padding: 4px 10px 6px;
  border-top: 1px solid #22211c;
  font-size: 10px;
  color: #a8a397;
}

.pb__when--live {
  color: #4fd18b;
}

.pb__trophy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #77736a;
  text-align: center;
}

.pb__trophy.is-won {
  color: #f5b21b;
}

.pb__champ-label {
  font-size: 10px;
}

.pb__champ {
  font-family: 'Anton', sans-serif;
  font-size: 30px;
  line-height: 1;
  text-transform: uppercase;
  color: #f5b21b;
}

/* Narrow screens: rounds stacked in playing order instead of two mirrored halves */
@media (max-width: 860px) {
  .pb {
    padding: 18px 14px;
  }

  .pb__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .pb__col {
    order: var(--order);
  }

  .pb__phase {
    text-align: left;
  }

  /* the right half continues the same round: one title is enough */
  .pb__col.is-right .pb__phase,
  .pb__game::after {
    display: none;
  }
}
</style>
