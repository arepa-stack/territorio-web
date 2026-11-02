<template>
  <div class="flex flex-col gap-space-xl">
    <div>
      <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">
        Hola, {{ firstName }}
      </h1>
      <p v-if="teams.length" class="m-0 mt-1 text-body-md text-on-surface-variant">
        {{ teams.map(t => `#${t.jerseyNumber} en ${t.team.name}`).join(' · ') }}
      </p>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando…</p>
    <p v-else-if="error" class="text-body-md text-error">{{ error }}</p>

    <template v-else>
      <!-- Active Sanctions / Suspension Alert (Task 4) -->
      <section v-if="isSuspendedNextMatch || activeSanctions.length" class="card flex flex-col gap-space-sm border-l-4 border-l-error bg-surface-container p-space-md">
        <div class="flex flex-wrap items-center gap-space-xs">
          <span class="inline-flex items-center gap-1 rounded-full bg-error px-2.5 py-0.5 text-label-sm font-bold uppercase text-white">
            <span class="icon text-[16px]">gavel</span> Suspendido
          </span>
          <strong class="text-body-md text-on-surface">
            {{ suspendedReason || 'Tienes sanciones activas pendientes de cumplir.' }}
          </strong>
        </div>
        <div v-if="activeSanctions.length" class="flex flex-col gap-1 text-body-sm text-on-surface-variant">
          <div v-for="s in activeSanctions" :key="s.id" class="flex flex-wrap items-center justify-between gap-space-xs">
            <span>{{ s.reason }} ({{ s.type }})</span>
            <span v-if="s.matchesRemaining > 0" class="font-stat-mono text-error">
              {{ s.matchesRemaining }} partido(s) restante(s)
            </span>
          </div>
        </div>
      </section>

      <!-- Next match -->
      <section>
        <SectionHeader title="Próximo partido" icon="sports_basketball" />
        <div v-if="next" class="card flex flex-col gap-space-md border-l-4 border-l-primary-container p-space-lg">
          <div class="flex flex-wrap items-center justify-between gap-space-xs">
            <span class="label-tactical text-secondary">{{ next.tournament.name }} · Jornada {{ next.round }}</span>
            <span
              v-if="isSuspendedNextMatch"
              class="inline-flex items-center gap-1 rounded-full bg-error px-2.5 py-0.5 text-label-sm font-bold uppercase text-white"
              :title="suspendedReason || 'Suspendido para este partido'"
            >
              <span class="icon text-[14px]">block</span> Suspendido ({{ suspendedReason || 'Sanción activa' }})
            </span>
          </div>
          <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-space-sm text-center">
            <span class="font-headline-md text-headline-md uppercase" :class="{ 'text-primary': myTeamIn(next)?.team.id === next.homeTeamId }">{{ next.homeTeam.name }}</span>
            <span class="font-scoreboard-num text-scoreboard-num text-on-surface-variant">vs</span>
            <span class="font-headline-md text-headline-md uppercase" :class="{ 'text-primary': myTeamIn(next)?.team.id === next.awayTeamId }">{{ next.awayTeam.name }}</span>
          </div>
          <div class="flex flex-wrap gap-x-space-lg gap-y-1 text-body-sm text-on-surface-variant">
            <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">event</span>{{ formatDay(next.matchDate) }} · {{ next.matchTime }}</span>
            <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ next.venue || 'Cancha por definir' }}</span>
            <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">groups</span>Juegas con {{ myTeamIn(next)?.team.name }}</span>
          </div>
        </div>
        <p v-else class="m-0 text-body-md text-on-surface-variant">
          No tienes partidos programados. Aparecen cuando el organizador genera el fixture de un torneo donde está tu equipo.
        </p>
      </section>

      <!-- Season stats -->
      <section>
        <SectionHeader title="Mi temporada" icon="bar_chart">
          <router-link to="/app/player/stats" class="btn-ghost">{{ stats?.gamesPlayed ?? 0 }} PJ · Ver más</router-link>
        </SectionHeader>
        <div class="grid grid-cols-3 gap-space-sm">
          <StatTile label="PTS / P" :value="perGame('points')" accent />
          <StatTile label="REB / P" :value="perGame('rebounds')" />
          <StatTile label="AST / P" :value="perGame('assists')" />
        </div>
      </section>

      <!-- My teams -->
      <section>
        <SectionHeader title="Mis equipos" icon="groups">
          <router-link to="/app/player/teams" class="btn-ghost">Ver todos</router-link>
        </SectionHeader>
        <div v-if="!teams.length" class="card flex flex-col gap-space-md p-space-lg">
          <p class="m-0 text-body-md text-on-surface-variant">
            Todavía no estás en ningún equipo. Un capitán te puede fichar con tu cédula, puedes buscar equipos que estén reclutando<template v-if="authStore.userRole === 'PLAYER'"> o solicitar ser capitán</template>.
          </p>
          <div class="flex flex-wrap gap-space-sm">
            <router-link to="/app/player/recruiting" class="btn-primary">
              <span class="icon">person_search</span> Buscar equipo
            </router-link>
            <router-link v-if="authStore.userRole === 'PLAYER'" to="/app/player/profile" class="btn-secondary">
              <span class="icon">military_tech</span> Quiero ser capitán
            </router-link>
          </div>
        </div>
        <div v-else class="grid gap-space-sm md:grid-cols-2">
          <article v-for="t in teams" :key="t.playerId" class="card flex flex-col gap-space-xs p-space-md">
            <div class="flex items-center justify-between gap-space-sm">
              <h3 class="m-0 font-title-sm text-title-sm">{{ t.team.name }}</h3>
              <span class="font-stat-mono text-stat-mono text-primary">#{{ t.jerseyNumber }} · {{ POSITIONS[t.position] }}</span>
            </div>
            <div v-for="r in t.registrations" :key="r.tournament.id" class="flex flex-wrap items-center gap-space-xs text-body-sm">
              <router-link :to="`/torneo/${r.tournament.id}`" class="text-on-surface-variant no-underline hover:text-primary">
                {{ r.tournament.name }}
              </router-link>
              <StatusChip :status="r.status" />
            </div>
            <p v-if="!t.registrations.length" class="m-0 text-body-sm text-on-surface-variant">Sin torneos todavía.</p>
          </article>
        </div>
      </section>

      <router-link to="/app/zones/map" class="card flex items-center justify-between gap-space-md p-space-md no-underline">
        <span class="flex items-center gap-space-sm text-on-surface">
          <span class="icon text-secondary">map</span> Mapa de zonas y canchas
        </span>
        <span class="icon text-on-surface-variant">chevron_right</span>
      </router-link>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import { POSITIONS, formatDay } from '@/utils/labels'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'
import StatusChip from '@/components/ui/StatusChip.vue'

const authStore = useAuthStore()
const {
  loading,
  error,
  load,
  teams,
  stats,
  activeSanctions,
  isSuspendedNextMatch,
  suspendedReason,
  upcoming,
  myTeamIn,
  perGame
} = usePlayerOverview()

const firstName = computed(() => (authStore.userName || '').split(' ')[0])
const next = computed(() => upcoming.value[0])

onMounted(() => load())
</script>
