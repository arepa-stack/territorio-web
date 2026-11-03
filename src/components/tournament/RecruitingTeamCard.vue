<template>
  <!-- Team looking for players, "cartel de cancha" style (public pages only) -->
  <article class="r-card">
    <div class="r-card__head">
      <TeamBadge :name="team.name" :logo-url="team.logoUrl || ''" :size="48" />
      <div class="r-card__title">
        <span class="mono r-card__cat">{{ CATEGORIES[team.category] || team.category || 'Libre' }}</span>
        <h3 class="display r-card__name">{{ team.name }}</h3>
      </div>
      <span class="mono r-card__spots">{{ team.openSpots }} {{ team.openSpots === 1 ? 'cupo' : 'cupos' }}</span>
    </div>
    <p v-if="team.city" class="mono r-card__city">{{ team.city }}</p>
    <p v-if="team.description" class="r-card__desc">{{ team.description }}</p>
    <div class="r-card__actions">
      <router-link :to="ctaLink(authStore.isAuthenticated, 'PLAYER', `/app/player/recruiting?equipo=${team.id}`)" class="btn-blaze r-card__apply">Postularme</router-link>
      <router-link v-if="authStore.isAuthenticated" :to="`/app/teams/${team.id}/history`" class="link-under">Historial</router-link>
    </div>
  </article>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { ctaLink } from '@/router/navigation'
import { CATEGORIES } from '@/utils/labels'
import TeamBadge from '@/components/TeamBadge.vue'

defineProps({ team: { type: Object, required: true } })
const authStore = useAuthStore()
</script>

<style scoped>
.r-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border: 1px solid var(--line);
  border-top: 6px solid var(--blaze);
  background: var(--asphalt-2);
}

.r-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.r-card__title {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.r-card__cat,
.r-card__city {
  font-size: 11px;
  color: var(--muted);
}

.r-card__name {
  font-size: 34px;
  line-height: 1;
  overflow-wrap: anywhere;
}

.r-card__spots {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 2px solid var(--gold);
  font-size: 12px;
  font-weight: 700;
  color: var(--gold);
}

.r-card__desc {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 15px;
  line-height: 1.5;
  color: var(--chalk-dim);
}

.r-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  margin-top: auto;
  padding-top: 6px;
}

.r-card__apply {
  flex: 1;
}
</style>
