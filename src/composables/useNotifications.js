// Bell state shared by the app shells: polls the user's notifications every minute
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import notificationsService from '@/services/notifications'

export function useNotifications() {
  const router = useRouter()
  const authStore = useAuthStore()
  const toast = useToast()
  const notifications = ref([])
  let seen = null // ids already known; null until the first load so old ones don't pop up
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
  let timer = null

  const load = async () => {
    if (!authStore.isAuthenticated) return
    try {
      const { data } = await notificationsService.getMyNotifications()
      notifications.value = Array.isArray(data) ? data : []
      // A toast for each notification that arrived since the last poll
      if (seen) notifications.value.filter(n => !n.read && !seen.has(n.id)).slice(0, 3).forEach(n => toast.info(`${n.title}: ${n.message}`))
      seen = new Set(notifications.value.map(n => n.id))
    } catch {
      // Background polling: errors stay silent
    }
  }

  const open = n => {
    if (!n.read) {
      n.read = true
      notificationsService.markAsRead(n.id).catch(() => {})
    }
    if (n.link) router.push(n.link)
  }

  const markAllRead = async () => {
    notifications.value.forEach(n => (n.read = true))
    try {
      await notificationsService.markAllAsRead()
    } catch {
      await load()
    }
  }

  onMounted(() => {
    load()
    timer = setInterval(load, 60000)
  })
  onUnmounted(() => clearInterval(timer))

  return { notifications, unreadCount, open, markAllRead }
}
