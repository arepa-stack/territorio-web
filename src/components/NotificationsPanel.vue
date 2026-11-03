<template>
  <!-- Slide-over with the latest notifications, grouped by day. Native <dialog>: Esc, focus trap and backdrop for free -->
  <dialog ref="dialog" class="np" aria-labelledby="np-title" @click.self="close" @close="$emit('closed')">
    <div class="np__inner">
      <header class="np__head">
        <h2 id="np-title" class="np__title">Notificaciones</h2>
        <button type="button" class="np__x" aria-label="Cerrar" @click="close"><span class="icon">close</span></button>
      </header>
      <div class="np__bar">
        <div class="np__tabs" role="group" aria-label="Filtro">
          <button type="button" class="filter-chip" :aria-pressed="!unreadOnly" @click="unreadOnly = false">Todas</button>
          <button type="button" class="filter-chip" :aria-pressed="unreadOnly" @click="unreadOnly = true">No leídas · {{ unreadCount }}</button>
        </div>
        <button v-if="unreadCount" type="button" class="np__link" @click="$emit('mark-all')">Marcar todo leído</button>
      </div>

      <div class="np__list">
        <div v-if="!shown.length" class="np__empty">
          <span class="icon">notifications_off</span>
          {{ unreadOnly ? 'Estás al día: nada sin leer.' : 'Todavía no tienes notificaciones.' }}
        </div>
        <section v-for="g in groups" :key="g.label">
          <h3 class="np__group">{{ g.label }}</h3>
          <NotificationItem v-for="n in g.items" :key="n.id" :n="n" @open="pick" />
        </section>
      </div>

      <router-link to="/app/notifications" class="np__all" @click="close">Ver historial completo</router-link>
    </div>
  </dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { groupByDay } from '@/utils/notifications'
import NotificationItem from '@/components/NotificationItem.vue'

const props = defineProps({
  notifications: { type: Array, default: () => [] },
  unreadCount: { type: Number, default: 0 }
})
const emit = defineEmits(['open', 'mark-all', 'closed'])

const dialog = ref(null)
const unreadOnly = ref(false)
const shown = computed(() => (unreadOnly.value ? props.notifications.filter(n => !n.read) : props.notifications))
const groups = computed(() => groupByDay(shown.value))

const open = () => dialog.value?.showModal()
const close = () => dialog.value?.close()
const pick = n => {
  close()
  emit('open', n)
}

defineExpose({ open, close })
</script>

<style scoped>
.np {
  position: fixed;
  inset: 0 0 0 auto;
  width: min(440px, 100vw);
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-left: 1px solid rgb(var(--c-outline-variant));
  background: rgb(var(--c-surface));
  color: rgb(var(--c-on-surface));
}

.np[open] {
  animation: np-in 0.22s ease-out;
}

.np::backdrop {
  background: rgb(0 0 0 / 0.55);
}

@keyframes np-in {
  from {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .np[open] {
    animation: none;
  }
}

.np__inner {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.np__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 8px;
  border-top: 6px solid rgb(var(--c-primary-container));
}

.np__title {
  margin: 0;
  font-family: var(--f-display);
  font-size: 34px;
  font-weight: 400;
  line-height: 1;
  text-transform: uppercase;
}

.np__x {
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: rgb(var(--c-on-surface));
  cursor: pointer;
}

.np__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 20px 12px;
  border-bottom: 3px solid rgb(var(--c-on-surface));
}

.np__tabs {
  display: flex;
  gap: 6px;
}

.np__link {
  min-height: 44px;
  border: 0;
  background: none;
  color: rgb(var(--c-primary-container));
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.np__list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.np__group {
  position: sticky;
  top: 0;
  z-index: 1;
  margin: 0;
  padding: 14px 12px 6px;
  background: rgb(var(--c-surface));
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--c-secondary));
}

.np__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 20px;
  color: rgb(var(--c-on-surface-variant));
  text-align: center;
}

.np__empty .icon {
  font-size: 40px;
}

.np__all {
  display: block;
  padding: 16px 20px;
  border-top: 1px solid rgb(var(--c-outline-variant));
  color: rgb(var(--c-on-surface));
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.np__all:hover {
  color: rgb(var(--c-primary-container));
}
</style>
