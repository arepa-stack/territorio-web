<template>
  <article class="card flex flex-col gap-space-sm p-space-md">
    <div class="flex items-start justify-between gap-space-sm">
      <div class="min-w-0">
        <span class="label-tactical text-secondary">{{ CATEGORIES[team.category] || team.category || 'Libre' }}</span>
        <h3 class="m-0 truncate font-headline-md text-headline-md uppercase">{{ team.name }}</h3>
      </div>
      <span class="shrink-0 rounded bg-secondary-container/20 px-2 py-0.5 font-stat-mono text-body-sm text-secondary">
        {{ team.openSpots }} {{ team.openSpots === 1 ? 'cupo' : 'cupos' }}
      </span>
    </div>
    <p v-if="team.city" class="m-0 flex items-center gap-1 text-body-sm text-on-surface-variant">
      <span class="icon text-[16px]">location_on</span> {{ team.city }}
    </p>
    <p v-if="team.description" class="m-0 line-clamp-2 text-body-sm text-on-surface-variant">{{ team.description }}</p>
    <div class="mt-auto flex flex-wrap gap-space-xs pt-space-xs">
      <router-link :to="ctaLink(authStore.isAuthenticated, 'PLAYER', `/app/player/recruiting?equipo=${team.id}`)" class="btn-primary flex-1">
        <span class="icon">how_to_reg</span> Postularme
      </router-link>
      <router-link :to="`/app/teams/${team.id}/history`" class="btn-ghost" v-if="authStore.isAuthenticated">Historial</router-link>
    </div>
  </article>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { ctaLink } from '@/router/navigation'
import { CATEGORIES } from '@/utils/labels'

defineProps({ team: { type: Object, required: true } })
const authStore = useAuthStore()
</script>
