<template>
  <!-- Page switcher for poster lists; hidden when everything fits in one page -->
  <nav v-if="pages > 1" class="pager" aria-label="Paginación">
    <button type="button" class="p-chip" :disabled="page <= 1" @click="go(page - 1)">Anterior</button>
    <span class="mono pager__info">Página {{ page }} de {{ pages }} · {{ total }} {{ noun }}</span>
    <button type="button" class="p-chip" :disabled="page >= pages" @click="go(page + 1)">Siguiente</button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  perPage: { type: Number, required: true },
  total: { type: Number, required: true },
  noun: { type: String, default: 'resultados' }
})
const emit = defineEmits(['update:page'])
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const go = p => emit('update:page', p)
</script>

<style scoped>
.pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
}

.pager__info {
  font-size: 12px;
  color: var(--muted);
}

.p-chip:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
