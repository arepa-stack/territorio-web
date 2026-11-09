<template>
  <!-- One tournament as a poster row: photo, name, start, fee and slots (or status once registration closed) -->
  <router-link :to="`/torneo/${tournament.id}`" class="t-row">
    <img v-if="tournament.coverPhoto" :src="tournament.coverPhoto" :alt="`Cancha de ${tournament.name}`" class="t-row__photo" />
    <span v-else class="t-row__photo t-row__photo--empty" aria-hidden="true" />
    <span class="t-row__main">
      <span class="display t-row__name">{{ tournament.name }}</span>
      <span class="t-row__place">{{ tournament.location || 'Cancha por definir' }} · {{ CATEGORIES[tournament.category] || tournament.category }}</span>
    </span>
    <span class="t-row__fact">
      <span class="mono t-row__label">{{ tournament.status === 'FINISHED' ? 'Terminó' : 'Arranca' }}</span>
      <span class="mono t-row__value">{{ formatDate(tournament.status === 'FINISHED' ? tournament.endDate : tournament.startDate) }}</span>
    </span>
    <span class="t-row__fact">
      <span class="mono t-row__label">Inscripción</span>
      <span class="mono t-row__value">{{ fee(tournament.entryFee, tournament.country) }}</span>
    </span>
    <span v-if="tournament.status === 'REGISTRATION'" class="t-row__slots">
      <span class="mono t-row__slots-head">
        <span class="t-row__label">Cupos</span>
        <span :class="{ 't-row__last': left === 1 }">{{ tournament.registeredTeams }}/{{ tournament.maxTeams }}{{ left === 1 ? ' · Último cupo' : '' }}</span>
      </span>
      <span class="t-row__track"><span class="t-row__fill" :style="{ width: Math.min(100, (tournament.registeredTeams / tournament.maxTeams) * 100) + '%' }" /></span>
    </span>
    <span v-else class="mono t-row__status" :style="{ color: status.color, borderColor: status.color }">{{ status.label }}</span>
  </router-link>
</template>

<script setup>
import { fee } from '@/composables/useCountry'
import { computed } from 'vue'
import { CATEGORIES, POSTER_STATUS, formatDate } from '@/utils/labels'

const props = defineProps({ tournament: { type: Object, required: true } })
const left = computed(() => props.tournament.maxTeams - props.tournament.registeredTeams)
const status = computed(() => POSTER_STATUS[props.tournament.status] || { label: props.tournament.status, color: '#8C877C' })
</script>

<style scoped>
.poster .t-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) 150px 120px 200px;
  align-items: center;
  gap: 24px;
  padding: 28px 0;
  border-bottom: 1px solid var(--line);
  text-decoration: none;
}

.poster .t-row:hover .t-row__name {
  color: var(--blaze);
}

.t-row__photo {
  width: 120px;
  height: 80px;
  object-fit: cover;
  filter: grayscale(1) contrast(1.15);
}

.t-row__photo--empty {
  display: block;
  background: repeating-linear-gradient(135deg, #1c1b17 0 10px, #141411 10px 20px);
}

.t-row__main,
.t-row__fact,
.t-row__slots {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.t-row__name {
  font-size: 34px;
  line-height: 1;
}

.t-row__place {
  font-size: 15px;
  color: var(--muted);
}

.t-row__label {
  font-size: 11px;
  color: var(--muted);
}

.t-row__value {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.t-row__slots-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
}

.t-row__last {
  color: var(--hot);
}

.t-row__track {
  display: block;
  height: 6px;
  background: var(--line);
}

.t-row__fill {
  display: block;
  height: 6px;
  background: var(--blaze);
}

.t-row__status {
  justify-self: start;
  padding: 6px 10px;
  border: 2px solid;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .poster .t-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .t-row__photo {
    width: 100%;
    height: 140px;
  }
}
</style>
