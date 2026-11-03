<template>
  <!-- One notification: category tile, title, message, relative time and an unread dot -->
  <button type="button" class="ni" :class="{ 'is-unread': !n.read }" @click="$emit('open', n)">
    <span class="ni__tile" :class="`is-${cat.tone}`" aria-hidden="true"><span class="icon">{{ cat.icon }}</span></span>
    <span class="ni__body">
      <span class="ni__top">
        <span class="ni__cat">{{ cat.label }}</span>
        <span class="ni__time" :title="new Date(n.createdAt).toLocaleString('es-VE')">{{ relativeTime(n.createdAt) }}</span>
      </span>
      <span class="ni__title">{{ n.title }}</span>
      <span class="ni__msg">{{ n.message }}</span>
    </span>
    <span v-if="!n.read" class="ni__dot"><span class="sr-only">Sin leer</span></span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { categoryOf, relativeTime } from '@/utils/notifications'

const props = defineProps({ n: { type: Object, required: true } })
defineEmits(['open'])
const cat = computed(() => categoryOf(props.n.type))
</script>

<style scoped>
.ni {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 12px;
  border: 0;
  border-bottom: 1px solid rgb(var(--c-outline-variant) / 0.5);
  background: transparent;
  color: rgb(var(--c-on-surface));
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.ni:hover {
  background: rgb(var(--c-surface-container-high));
}

.ni:focus-visible {
  outline: 3px solid rgb(var(--c-on-surface));
  outline-offset: -3px;
}

.ni__tile {
  display: flex;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.ni__tile .icon {
  font-size: 22px;
}

.ni__tile.is-blaze {
  background: rgb(var(--c-primary-container) / 0.18);
  color: rgb(var(--c-primary-container));
}

.ni__tile.is-gold {
  background: rgb(var(--c-secondary) / 0.18);
  color: rgb(var(--c-secondary));
}

.ni__tile.is-good {
  background: rgb(var(--c-tertiary) / 0.18);
  color: rgb(var(--c-tertiary));
}

.ni__tile.is-bad {
  background: rgb(var(--c-error) / 0.18);
  color: rgb(var(--c-error));
}

.ni__tile.is-muted {
  background: rgb(var(--c-surface-container-highest));
  color: rgb(var(--c-on-surface-variant));
}

.ni__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.ni__top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.ni__cat,
.ni__time {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--c-on-surface-variant));
}

.ni__time {
  white-space: nowrap;
}

.ni__title {
  font-size: 15px;
  font-weight: 600;
}

.is-unread .ni__title {
  font-weight: 800;
}

.ni__msg {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 13px;
  line-height: 1.45;
  color: rgb(var(--c-on-surface-variant));
}

.ni__dot {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  margin-top: 4px;
  border-radius: 50%;
  background: rgb(var(--c-primary-container));
}
</style>
