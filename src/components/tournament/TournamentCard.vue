<template>
  <article class="card group flex flex-col gap-space-md overflow-hidden p-space-md">
    <TournamentCover :src="tournament.coverPhoto" :alt="`Cancha de ${tournament.name}`" class="-mx-space-md -mt-space-md h-48">
      <StatusChip :status="tournament.status" class="absolute right-space-sm top-space-sm" />
      <span class="label-tactical text-secondary">{{ CATEGORIES[tournament.category] || tournament.category }}</span>
      <h3 class="m-0 font-headline-md text-headline-md uppercase text-white">{{ tournament.name }}</h3>
    </TournamentCover>
    <div class="flex flex-col gap-1 text-body-sm text-on-surface-variant">
      <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ tournament.location || 'Por definir' }}</span>
      <span class="flex items-center gap-space-xs">
        <span class="icon text-[18px]">calendar_month</span>{{ formatDate(tournament.startDate) }} – {{ formatDate(tournament.endDate) }}
      </span>
      <span class="flex items-center gap-space-xs">
        <span class="icon text-[18px]">payments</span>Inscripción
        <span class="font-stat-mono text-on-surface">{{ Number(tournament.entryFee) > 0 ? `$${tournament.entryFee}` : 'Gratis' }}</span>
      </span>
    </div>
    <div>
      <div class="mb-1 flex justify-between">
        <span class="label-tactical text-on-surface-variant">Cupos</span>
        <span class="font-stat-mono text-stat-mono tabular">{{ tournament.registeredTeams }}/{{ tournament.maxTeams }}</span>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
        <div class="h-full bg-secondary-container" :style="{ width: Math.min(100, (tournament.registeredTeams / tournament.maxTeams) * 100) + '%' }" />
      </div>
    </div>
    <router-link :to="`/torneo/${tournament.id}`" class="btn-secondary mt-auto">Ver torneo</router-link>
  </article>
</template>

<script setup>
import StatusChip from '@/components/ui/StatusChip.vue'
import TournamentCover from '@/components/tournament/TournamentCover.vue'
import { CATEGORIES, formatDate } from '@/utils/labels'

defineProps({ tournament: { type: Object, required: true } })
</script>
