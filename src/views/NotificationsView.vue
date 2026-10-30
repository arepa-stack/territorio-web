<template>
  <div class="flex flex-col gap-space-lg">
    <div class="flex flex-col gap-space-sm sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase md:font-headline-lg md:text-headline-lg">
          Notificaciones
        </h1>
        <p class="m-0 mt-1 text-body-md text-on-surface-variant">
          Avisos sobre tus equipos, partidos, torneos y sanciones ({{ unreadCount }} sin leer).
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-space-xs">
        <button
          type="button"
          class="filter-chip"
          :aria-pressed="filter === 'ALL'"
          @click="setFilter('ALL')"
        >
          Todas
        </button>
        <button
          type="button"
          class="filter-chip"
          :aria-pressed="filter === 'UNREAD'"
          @click="setFilter('UNREAD')"
        >
          No leídas ({{ unreadCount }})
        </button>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="btn-secondary text-body-sm"
          :disabled="markingAll"
          @click="markAll"
        >
          <span class="icon text-[18px]">done_all</span>
          {{ markingAll ? 'Marcando…' : 'Marcar todas como leídas' }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando notificaciones…</p>
    <p v-else-if="!items.length" class="card p-space-lg text-body-md text-on-surface-variant">
      No tienes notificaciones {{ filter === 'UNREAD' ? 'sin leer' : 'registradas' }}.
    </p>

    <div v-else class="flex flex-col gap-space-xs">
      <article
        v-for="n in items"
        :key="n.id"
        class="card flex cursor-pointer items-start justify-between gap-space-md p-space-md transition-colors hover:bg-surface-container-high"
        :class="{ 'border-l-4 border-l-primary-container': !n.read }"
        @click="openNotification(n)"
      >
        <div class="flex items-start gap-space-sm">
          <span class="icon mt-0.5 text-secondary">{{ n.read ? 'notifications_none' : 'notifications_active' }}</span>
          <div class="flex flex-col gap-0.5">
            <h2 class="m-0 font-title-sm text-title-sm" :class="{ 'font-bold text-on-surface': !n.read }">
              {{ n.title }}
            </h2>
            <p class="m-0 text-body-sm text-on-surface-variant">{{ n.message }}</p>
            <span class="mt-1 font-stat-mono text-label-sm text-on-surface-variant">
              {{ formatDateTime(n.createdAt) }}
            </span>
          </div>
        </div>
        <span v-if="n.link" class="icon text-on-surface-variant">chevron_right</span>
      </article>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between gap-space-sm">
      <button type="button" class="btn-secondary" :disabled="page <= 1 || loading" @click="changePage(page - 1)">
        Anterior
      </button>
      <span class="font-stat-mono text-body-sm text-on-surface-variant">
        Página {{ page }} de {{ totalPages }}
      </span>
      <button type="button" class="btn-secondary" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">
        Siguiente
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import notificationsService from '@/services/notifications'
import { handleApiError } from '@/services/api'

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

const formatDateTime = d => (d ? new Date(d).toLocaleString() : '')

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
