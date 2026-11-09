<template>
  <div class="flex flex-col gap-space-lg">
    <button type="button" class="btn-ghost self-start" @click="$router.back()">
      <span class="icon">arrow_back</span> Volver
    </button>

    <TurfLoader v-if="loading" label="Cargando" />
    <p v-else-if="!player" class="text-body-md text-on-surface-variant">No se encontró el jugador.</p>

    <template v-else>
      <section class="card flex items-center gap-space-md p-space-lg">
        <img
          v-if="photo"
          :src="photo"
          :alt="name"
          class="h-20 w-20 shrink-0 rounded-full object-cover"
        />
        <div v-else class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-headline-md text-headline-md">
          {{ initials }}
        </div>
        <div class="min-w-0">
          <h1 class="m-0 truncate font-headline-lg-mobile text-headline-lg-mobile uppercase">{{ name }}</h1>
          <p class="m-0 text-body-md text-on-surface-variant">
            <span v-if="player.jerseyNumber != null" class="font-stat-mono">#{{ player.jerseyNumber }} · </span>
            {{ POSITIONS[player.position] || 'Sin posición' }}
            <template v-if="player.team"> · {{ player.team.name }}</template>
          </p>
          <router-link v-if="player.team" :to="links.team(player.team.id)" class="text-body-sm text-primary">
            Ver historial del equipo
          </router-link>
        </div>
      </section>

      <section v-if="stats">
        <SectionHeader title="Por partido" icon="speed">
          <span class="font-stat-mono text-stat-mono text-on-surface-variant">{{ stats.gamesPlayed }} PJ</span>
        </SectionHeader>
        <div class="grid grid-cols-3 gap-space-sm md:grid-cols-5">
          <StatTile label="PTS" :value="perGame('points')" accent />
          <StatTile label="REB" :value="perGame('rebounds')" />
          <StatTile label="AST" :value="perGame('assists')" />
          <StatTile label="ROB" :value="perGame('steals')" />
          <StatTile label="TAP" :value="perGame('blocks')" />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import playersService from '@/services/players'
import { POSITIONS } from '@/utils/labels'
import { useEntityLinks } from '@/utils/links'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'

const route = useRoute()
const links = useEntityLinks()
const player = ref(null)
const stats = ref(null)
const loading = ref(true)

const photo = computed(() => player.value?.photoUrl || player.value?.user?.avatarUrl)
const name = computed(() => player.value?.user?.fullName || 'Jugador')
const initials = computed(() => name.value.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(''))
const perGame = key => (stats.value?.gamesPlayed ? (stats.value[key] / stats.value.gamesPlayed).toFixed(1) : '0.0')

onMounted(async () => {
  const id = route.params.id
  try {
    const [p, s] = await Promise.all([playersService.getById(id), playersService.getStats(id).catch(() => ({ data: null }))])
    player.value = p.data
    stats.value = s.data
  } catch {
    player.value = null
  } finally {
    loading.value = false
  }
})
</script>
