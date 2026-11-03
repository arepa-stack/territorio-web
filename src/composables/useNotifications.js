// Bell state shared by the app shells: polls the user's notifications every minute
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import notificationsService from '@/services/notifications'

export function useNotifications() {
  const router = useRouter()
  const authStore = useAuthStore()
  const notifications = ref([])
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
  let timer = null

  const load = async () => {
    if (!authStore.isAuthenticated) return
    try {
      const { data } = await notificationsService.getMyNotifications()
      notifications.value = Array.isArray(data) ? data : []
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
