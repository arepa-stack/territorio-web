<template>
  <div class="nv">
    <div class="nv__head">
      <div>
        <h1 class="nv__title">Notificaciones</h1>
        <p class="nv__lead">Avisos de tus equipos, partidos, torneos y sanciones · {{ unreadCount }} sin leer</p>
      </div>
      <button v-if="unreadCount > 0" type="button" class="btn-secondary" :disabled="markingAll" @click="markAll">
        <span class="icon">done_all</span> {{ markingAll ? 'Marcando…' : 'Marcar todas como leídas' }}
      </button>
    </div>

    <div class="nv__tabs" role="group" aria-label="Filtro">
      <button type="button" class="filter-chip" :aria-pressed="filter === 'ALL'" @click="setFilter('ALL')">Todas</button>
      <button type="button" class="filter-chip" :aria-pressed="filter === 'UNREAD'" @click="setFilter('UNREAD')">No leídas · {{ unreadCount }}</button>
    </div>

    <p v-if="loading" class="nv__lead">Cargando notificaciones…</p>
    <div v-else-if="!items.length" class="nv__empty">
      <span class="icon">notifications_off</span>
      {{ filter === 'UNREAD' ? 'Estás al día: nada sin leer.' : 'Todavía no tienes notificaciones.' }}
    </div>

    <div v-else class="nv__list">
      <section v-for="g in groups" :key="g.label">
        <h2 class="nv__group">{{ g.label }}</h2>
        <NotificationItem v-for="n in g.items" :key="n.id" :n="n" @open="openNotification" />
      </section>
    </div>

    <nav v-if="totalPages > 1" class="nv__pager" aria-label="Paginación">
      <button type="button" class="filter-chip" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Anterior</button>
      <span class="label-tactical text-on-surface-variant">Página {{ page }} de {{ totalPages }}</span>
      <button type="button" class="filter-chip" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">Siguiente</button>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import notificationsService from '@/services/notifications'
import { handleApiError } from '@/services/api'
import { groupByDay } from '@/utils/notifications'
import NotificationItem from '@/components/NotificationItem.vue'

const router = useRouter()
const toast = useToast()

const items = ref([])
const loading = ref(true)
const markingAll = ref(false)
const filter = ref('ALL')
const page = ref(1)
const limit = 20
const totalPages = ref(1)
const unreadCount = ref(0)

const groups = computed(() => groupByDay(items.value))

const loadNotifications = async () => {
  loading.value = true
  try {
    const params = { page: page.value, limit }
    if (filter.value === 'UNREAD') params.read = 'false'
    const res = await notificationsService.list(params)
    items.value = res.data.items || []
    totalPages.value = res.data.totalPages || 1
    unreadCount.value = res.data.unreadCount ?? 0
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron cargar las notificaciones'))
  } finally {
    loading.value = false
  }
}

const setFilter = f => {
  filter.value = f
  page.value = 1
  loadNotifications()
}

const changePage = p => {
  page.value = p
  loadNotifications()
}

const markAll = async () => {
  markingAll.value = true
  try {
    await notificationsService.markAllAsRead()
    toast.success('Todas las notificaciones marcadas como leídas')
    await loadNotifications()
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron actualizar las notificaciones'))
  } finally {
    markingAll.value = false
  }
}

const openNotification = async n => {
  if (!n.read) {
    try {
      await notificationsService.markAsRead(n.id)
      n.read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // ignore error on read status update
    }
  }
  if (n.link) {
    router.push(n.link)
  }
}

onMounted(() => loadNotifications())
</script>

<style scoped>
.nv {
  display: flex;
  max-width: 820px;
  flex-direction: column;
  gap: 20px;
}

.nv__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.nv__title {
  margin: 0;
  font-family: var(--f-display);
  font-size: clamp(44px, 5vw, 72px);
  font-weight: 400;
  line-height: 0.9;
  text-transform: uppercase;
}

.nv__lead {
  margin: 8px 0 0;
  color: rgb(var(--c-on-surface-variant));
}

.nv__tabs {
  display: flex;
  gap: 6px;
}

.nv__list {
  border-top: 3px solid rgb(var(--c-on-surface));
}

.nv__group {
  margin: 0;
  padding: 16px 12px 6px;
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--c-secondary));
}

.nv__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 20px;
  border: 2px dashed rgb(var(--c-outline-variant));
  color: rgb(var(--c-on-surface-variant));
  text-align: center;
}

.nv__empty .icon {
  font-size: 40px;
}

.nv__pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nv__pager .filter-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
