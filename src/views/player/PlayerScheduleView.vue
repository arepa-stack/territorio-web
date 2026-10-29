<template>
  <div class="flex flex-col gap-space-lg">
    <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Mi calendario</h1>

    <div v-if="teams.length > 1" class="-mx-gutter flex gap-space-xs overflow-x-auto px-gutter pb-1 md:mx-0 md:px-0">
      <button type="button" class="filter-chip" :aria-pressed="teamFilter === 'ALL'" @click="teamFilter = 'ALL'">Todos</button>
      <button
        v-for="t in teams"
        :key="t.team.id"
        type="button"
        class="filter-chip"
        :aria-pressed="teamFilter === t.team.id"
        @click="teamFilter = t.team.id"
      >{{ t.team.name }}</button>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando…</p>
    <p v-else-if="!days.length" class="text-body-md text-on-surface-variant">
      No hay partidos. Aparecen cuando se genera el fixture de un torneo donde juega tu equipo.
    </p>

    <section v-for="d in days" :key="d.key" class="flex flex-col gap-space-xs">
      <h2 class="label-tactical m-0 capitalize text-on-surface-variant">{{ formatDay(d.date) }}</h2>
      <MatchCard v-for="m in d.matches" :key="m.id" :match="m" :mine="myTeamIn(m)?.team.id" />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import { formatDay } from '@/utils/labels'
import MatchCard from '@/components/tournament/MatchCard.vue'

const { loading, load, teams, matches, myTeamIn } = usePlayerOverview()
const teamFilter = ref('ALL')

const days = computed(() => {
  const list = matches.value.filter(
    m => teamFilter.value === 'ALL' || m.homeTeamId === teamFilter.value || m.awayTeamId === teamFilter.value
  )
  const byDay = new Map()
  for (const m of list) {
    const key = m.matchDate.slice(0, 10)
    if (!byDay.has(key)) byDay.set(key, { key, date: m.matchDate, matches: [] })
    byDay.get(key).matches.push(m)
  }
  return [...byDay.values()]
})

onMounted(() => load())
</script>
