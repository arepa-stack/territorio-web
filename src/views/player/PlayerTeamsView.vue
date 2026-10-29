<template>
  <div class="flex flex-col gap-space-lg">
    <div>
      <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Mis equipos</h1>
      <p class="m-0 mt-1 flex items-center gap-space-xs text-body-sm text-on-surface-variant">
        <span class="icon text-[18px] text-secondary">info</span>
        Puedes jugar en varios equipos, pero con uno solo por torneo.
      </p>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando…</p>
    <p v-else-if="!teams.length" class="text-body-md text-on-surface-variant">
      Todavía no estás en ningún equipo. Un capitán te puede fichar con tu cédula.
    </p>

    <article v-for="t in teams" :key="t.playerId" class="card flex flex-col gap-space-md p-space-lg">
      <div class="flex items-start gap-space-md">
        <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary-container font-headline-lg text-headline-lg text-white">
          {{ t.team.name.charAt(0) }}
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="m-0 font-headline-md text-headline-md uppercase">{{ t.team.name }}</h2>
          <p class="m-0 text-body-sm text-on-surface-variant">Capitán: {{ t.team.captainName }}</p>
          <p class="m-0 mt-1 font-stat-mono text-stat-mono text-primary">
            #{{ t.jerseyNumber }} · {{ POSITIONS[t.position] }}<template v-if="t.isCaptain"> · CAP</template>
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-space-xs">
        <div v-for="r in t.registrations" :key="r.tournament.id" class="flex flex-wrap items-center gap-space-xs">
          <span class="text-body-sm">{{ r.tournament.name }}</span>
          <StatusChip :status="r.status" />
          <RosterChip :roster="t.roster" />
        </div>
        <p v-if="!t.registrations.length" class="m-0 text-body-sm text-on-surface-variant">Este equipo todavía no está inscrito en torneos.</p>
      </div>

      <div class="flex flex-wrap gap-space-sm">
        <router-link :to="`/app/teams/${t.team.id}/history`" class="btn-secondary">
          <span class="icon">history</span> Historial
        </router-link>
        <button type="button" class="btn-secondary" @click="toggleRoster(t.team.id)">
          <span class="icon">{{ open[t.team.id] ? 'expand_less' : 'groups' }}</span>
          {{ open[t.team.id] ? 'Ocultar plantel' : 'Ver plantel' }}
        </button>
      </div>

      <div v-if="open[t.team.id]" class="flex flex-col gap-space-xs">
        <div
          v-for="p in rosters[t.team.id] || []"
          :key="p.id"
          class="flex items-center gap-space-md rounded bg-surface-container-low p-space-sm"
        >
          <span class="w-10 text-center font-scoreboard-num text-[22px] tabular">{{ p.jerseyNumber }}</span>
          <span class="min-w-0 flex-1 truncate text-body-md" :class="{ 'font-bold text-primary': p.id === t.playerId }">
            {{ p.fullName }}<template v-if="p.id === t.playerId"> (tú)</template>
          </span>
          <span class="label-tactical text-on-surface-variant">{{ POSITIONS[p.position] }}</span>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import teamsService from '@/services/teams'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import { POSITIONS } from '@/utils/labels'
import StatusChip from '@/components/ui/StatusChip.vue'
import RosterChip from '@/components/ui/RosterChip.vue'

const { loading, load, teams } = usePlayerOverview()
const open = reactive({})
const rosters = reactive({})

const toggleRoster = async teamId => {
  open[teamId] = !open[teamId]
  if (open[teamId] && !rosters[teamId]) {
    const res = await teamsService.getPlayers(teamId)
    rosters[teamId] = [...res.data].sort((a, b) => a.jerseyNumber - b.jerseyNumber)
  }
}

onMounted(() => load())
</script>
