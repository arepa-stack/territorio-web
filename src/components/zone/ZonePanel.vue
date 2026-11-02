<template>
  <!-- One zone: who rules it, its current champion and every team that played there with its titles -->
  <article class="zone-panel" :style="{ borderTopColor: zone.color || 'var(--blaze)' }">
    <div class="zone-panel__head">
      <div class="zone-panel__title">
        <component :is="headingTag" class="display zone-panel__name">{{ zone.name }}</component>
        <span class="mono zone-panel__meta">{{ meta }}</span>
      </div>
      <span class="mono zone-panel__status" :class="zone.ownerTeamId ? 'is-owned' : 'is-contested'">
        {{ zone.ownerTeamId ? `Dueño: ${zone.ranking[0].teamName}` : 'En disputa' }}
      </span>
    </div>

    <div class="zone-panel__body">
      <div v-if="zone.champion" class="champ-box">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#F5B21B" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 18h18M4 18 3 7l5 4 4-6 4 6 5-4-1 11" />
        </svg>
        <div class="zone-panel__champ">
          <span class="mono zone-panel__label">Campeón actual</span>
          <span class="display zone-panel__champ-name">{{ zone.champion.teamName }}</span>
          <router-link :to="`/torneo/${zone.champion.tournamentId}`" class="zone-panel__won">Ganó {{ zone.champion.tournamentName }}</router-link>
        </div>
      </div>
      <div v-else class="champ-box zone-panel__empty">
        <div class="zone-panel__champ">
          <span class="mono zone-panel__label">Campeón actual</span>
          <span class="display zone-panel__champ-name zone-panel__champ-name--empty">Trono vacío</span>
          <span class="zone-panel__won">El primer campeón se lleva la corona.</span>
        </div>
      </div>

      <div class="zone-panel__teams">
        <div class="mono zone-panel__teams-head">
          <span>Equipos participantes · {{ zone.participants.length }}</span><span>Títulos</span>
        </div>
        <p v-if="!zone.participants.length" class="zone-panel__none">Ningún equipo ha jugado aquí todavía.</p>
        <div v-for="(t, i) in visibleTeams" :key="t.teamId" class="team-row">
          <span class="mono zone-panel__pos">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="zone-panel__team" :class="{ 'has-titles': t.titles }">{{ t.teamName }}</span>
          <span class="mono zone-panel__tag">{{ tagOf(t) }}</span>
          <span class="zone-panel__score">
            <span class="title-bar" :style="{ width: t.titles ? `${t.titles * 28}px` : '12px', background: t.titles ? 'var(--gold)' : '#3a3832' }" />
            <span class="mono zone-panel__titles" :class="{ 'has-titles': t.titles }">{{ t.titles }}</span>
          </span>
        </div>
        <p v-if="hiddenCount" class="mono zone-panel__more">+{{ hiddenCount }} equipo{{ hiddenCount > 1 ? 's' : '' }} más</p>
      </div>

      <slot />

      <router-link to="/torneos" class="btn-blaze zone-panel__cta">
        {{ zone.openTournaments ? `Retar al campeón · ${zone.openTournaments} torneo${zone.openTournaments > 1 ? 's' : ''} abierto${zone.openTournaments > 1 ? 's' : ''}` : 'Ver torneos' }}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
      </router-link>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  zone: { type: Object, required: true }, // GET /tournaments/zone-standings row
  maxTeams: { type: Number, default: Infinity },
  headingTag: { type: String, default: 'h3' }
})

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const meta = computed(() => `${plural(props.zone.venues, 'cancha')} · ${plural(props.zone.totalTitles, 'torneo')} jugado${props.zone.totalTitles === 1 ? '' : 's'}`)
const visibleTeams = computed(() => props.zone.participants.slice(0, props.maxTeams))
const hiddenCount = computed(() => Math.max(0, props.zone.participants.length - visibleTeams.value.length))
const tagOf = t =>
  [t.teamId === props.zone.ownerTeamId && 'Dueño', t.teamId === props.zone.champion?.teamId && 'Campeón'].filter(Boolean).join(' · ')
</script>

<style scoped>
.zone-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-top: 6px solid;
  background: var(--asphalt-2);
}

.zone-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 28px 20px;
}

.zone-panel__title {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.zone-panel__name {
  font-size: 48px;
  line-height: 0.95;
}

.zone-panel__meta {
  font-size: 12px;
  color: var(--muted);
}

.zone-panel__status {
  padding: 8px 12px;
  border: 2px solid;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.zone-panel__status.is-owned {
  color: var(--gold);
}

.zone-panel__status.is-contested {
  color: var(--hot);
}

.zone-panel__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  padding: 0 28px 28px;
}

.zone-panel__champ {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.zone-panel__label {
  font-size: 11px;
  color: var(--muted);
}

.zone-panel__champ-name {
  font-size: 34px;
  line-height: 1;
  color: var(--gold);
  overflow-wrap: anywhere;
}

.zone-panel__champ-name--empty {
  color: var(--chalk-dim);
}

.zone-panel__empty {
  border-style: dashed;
}

.poster .zone-panel__won {
  font-size: 14px;
  color: var(--chalk-dim);
  text-decoration: none;
}

.poster a.zone-panel__won:hover {
  color: var(--blaze);
}

.zone-panel__teams-head {
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  font-size: 11px;
  color: var(--muted);
}

.zone-panel__none,
.zone-panel__more {
  padding-top: 12px;
  font-size: 12px;
  color: var(--muted);
}

.zone-panel__pos {
  width: 24px;
  font-size: 12px;
  color: #77736a;
}

.zone-panel__team {
  min-width: 0;
  flex: 1;
  font-size: 16px;
  color: var(--muted);
}

.zone-panel__team.has-titles {
  font-weight: 700;
  color: var(--chalk);
}

.zone-panel__tag {
  font-size: 10px;
  color: var(--gold);
}

.zone-panel__score {
  display: flex;
  width: 96px;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.zone-panel__titles {
  width: 16px;
  font-size: 15px;
  font-weight: 700;
  text-align: right;
  color: var(--muted);
}

.zone-panel__titles.has-titles {
  color: var(--chalk);
}

.zone-panel__cta {
  margin-top: auto;
  justify-content: space-between;
}

@media (max-width: 600px) {
  .zone-panel__head {
    flex-direction: column;
    padding: 24px 20px 16px;
  }

  .zone-panel__body {
    padding: 0 20px 24px;
  }

  .zone-panel__name {
    font-size: 40px;
  }

  .zone-panel__tag {
    display: none;
  }
}
</style>
