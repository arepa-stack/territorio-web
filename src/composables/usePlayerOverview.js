import { computed, ref } from 'vue'
import playersService from '@/services/players'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

// Shared by the player views so switching tabs does not refetch; tied to the user who loaded it.
const overview = ref(null)
const ownerId = ref(null)
const loading = ref(false)
const error = ref('')

export function usePlayerOverview() {
  const authStore = useAuthStore()

  const load = async (force = false) => {
    if (overview.value && ownerId.value === authStore.user?.id && !force) return
    loading.value = true
    error.value = ''
    try {
      overview.value = (await playersService.getMe()).data
      ownerId.value = authStore.user?.id
    } catch (e) {
      error.value = handleApiError(e, 'No se pudieron cargar tus datos')
    } finally {
      loading.value = false
    }
  }

  const teams = computed(() => overview.value?.teams ?? [])
  const matches = computed(() => overview.value?.matches ?? [])
  const stats = computed(() => overview.value?.stats ?? null)

  // Which of my teams plays this match
  const myTeamIn = match => teams.value.find(t => t.team.id === match.homeTeamId || t.team.id === match.awayTeamId)

  const upcoming = computed(() =>
    matches.value.filter(m => m.status === 'SCHEDULED' && new Date(m.matchDate) >= new Date(new Date().toDateString()))
  )

  const perGame = key => {
    const s = stats.value
    if (!s?.gamesPlayed) return '0.0'
    return (s[key] / s.gamesPlayed).toFixed(1)
  }

  return { overview, loading, error, load, teams, matches, stats, upcoming, myTeamIn, perGame }
}
