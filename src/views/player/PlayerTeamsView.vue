<template>
  <div class="flex flex-col gap-space-lg">
    <div class="flex flex-col gap-space-sm sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">Mis equipos</h1>
        <p class="m-0 mt-1 flex items-center gap-space-xs text-body-sm text-on-surface-variant">
          <span class="icon text-[18px] text-secondary">info</span>
          Puedes jugar en varios equipos, pero con uno solo por torneo.
        </p>
      </div>
      <router-link to="/app/player/recruiting" class="btn-secondary self-start">
        <span class="icon">person_search</span> Buscar equipo
      </router-link>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando…</p>
    <div v-else-if="!teams.length" class="card flex flex-col gap-space-sm p-space-lg">
      <p class="m-0 text-body-md text-on-surface-variant">
        Todavía no estás en ningún equipo activo. Un capitán te puede fichar con tu cédula o puedes postularte a un equipo que busque jugadores.
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
        <div
          v-for="r in t.registrations"
          :key="r.tournament.id"
          class="flex flex-wrap items-center justify-between gap-space-xs rounded bg-surface-container-low p-space-sm"
        >
          <div class="flex flex-wrap items-center gap-space-xs">
            <router-link :to="`/torneo/${r.tournament.id}`" class="font-bold text-body-sm text-on-surface no-underline hover:text-primary">
              {{ r.tournament.name }}
            </router-link>
            <StatusChip :status="r.status" />
            <RosterChip :roster="t.roster" />
          </div>
          <div class="flex items-center gap-space-xs">
            <span v-if="r.waiverAcceptedAt" class="flex items-center gap-1 text-body-sm text-secondary">
              <span class="icon text-[16px]">verified</span> Reglamento aceptado
            </span>
            <TournamentInfoButton v-else :tournament="r.tournament" waiver @accepted="load(true)" />
          </div>
        </div>
        <p v-if="!t.registrations.length" class="m-0 text-body-sm text-on-surface-variant">Este equipo todavía no está inscrito en torneos.</p>
      </div>

      <div class="flex flex-wrap items-center gap-space-sm">
        <router-link :to="`/app/teams/${t.team.id}/history`" class="btn-secondary">
          <span class="icon">history</span> Historial
        </router-link>
        <button type="button" class="btn-secondary" @click="toggleRoster(t.team.id)">
          <span class="icon">{{ open[t.team.id] ? 'expand_less' : 'groups' }}</span>
          {{ open[t.team.id] ? 'Ocultar plantel' : 'Ver plantel' }}
        </button>
        <button
          type="button"
          class="btn-ghost text-error"
          :disabled="t.isCaptain || t.roster?.isLocked || leavingTeam === t.team.id"
          :title="leaveDisabledReason(t)"
          @click="handleLeaveTeam(t)"
        >
          <span class="icon">logout</span>
          {{ leavingTeam === t.team.id ? 'Saliendo…' : 'Salir del equipo' }}
        </button>
        <span v-if="leaveDisabledReason(t)" class="text-body-sm text-on-surface-variant">
          ({{ leaveDisabledReason(t) }})
        </span>
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

    <!-- Former teams section (Task 8) -->
    <section v-if="formerTeams.length" class="flex flex-col gap-space-md">
      <h2 class="m-0 font-headline-md text-headline-md uppercase text-on-surface-variant">Equipos anteriores</h2>
      <div class="grid gap-space-md md:grid-cols-2">
        <article
          v-for="ft in formerTeams"
          :key="ft.playerId"
          class="card flex flex-col gap-space-sm border border-outline-variant/30 bg-surface-container-low p-space-md opacity-90"
        >
          <div class="flex items-center justify-between gap-space-sm">
            <div>
              <h3 class="m-0 font-title-sm text-title-sm uppercase">{{ ft.team.name }}</h3>
              <p class="m-0 text-body-sm text-on-surface-variant">
                #{{ ft.jerseyNumber }} · {{ POSITIONS[ft.position] }} · Exjugador
              </p>
            </div>
            <router-link :to="`/app/teams/${ft.team.id}/history`" class="btn-secondary text-body-sm">
              <span class="icon text-[18px]">history</span> Historial
            </router-link>
          </div>
          <div v-if="ft.registrations?.length" class="flex flex-wrap gap-space-xs text-body-sm text-on-surface-variant">
            <span v-for="r in ft.registrations" :key="r.tournament.id" class="rounded bg-surface-container px-2 py-0.5">
              {{ r.tournament.name }}
            </span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import teamsService from '@/services/teams'
import playersService from '@/services/players'
import { handleApiError } from '@/services/api'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import { POSITIONS } from '@/utils/labels'
import StatusChip from '@/components/ui/StatusChip.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import TournamentInfoButton from '@/components/ui/TournamentInfoButton.vue'

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
const { loading, load, teams, formerTeams } = usePlayerOverview()
const open = reactive({})
const rosters = reactive({})
const leavingTeam = ref(null)

const leaveDisabledReason = t => {
  if (t.isCaptain) return 'Eres el capitán del equipo'
  if (t.roster?.isLocked) return 'Nómina bloqueada por torneo en curso'
  return ''
}

const handleLeaveTeam = async t => {
  if (leaveDisabledReason(t)) return
  const ok = await confirm({
    title: 'Salir del equipo',
    message: `¿Seguro que deseas salir de ${t.team.name}? Tu historial estadístico se conservará en Equipos anteriores.`,
    confirmText: 'Salir del equipo',
    danger: true
  })
  if (!ok) return
  leavingTeam.value = t.team.id
  try {
    await playersService.leaveTeam(t.team.id)
    toast.success(`Saliste de ${t.team.name}`)
    await load(true)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo salir del equipo'))
  } finally {
    leavingTeam.value = null
  }
}

const toggleRoster = async teamId => {
  open[teamId] = !open[teamId]
  if (open[teamId] && !rosters[teamId]) {
    const res = await teamsService.getPlayers(teamId)
    rosters[teamId] = [...res.data].sort((a, b) => a.jerseyNumber - b.jerseyNumber)
  }
}

onMounted(() => load())
</script>
