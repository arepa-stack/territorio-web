import { useRoute } from 'vue-router'

// Same page lives in /app/* (logged-in shell) and at a public URL; keep visitors on the public side
export function useEntityLinks() {
  const route = useRoute()
  const inApp = () => route.path.startsWith('/app')
  return {
    match: id => (inApp() ? `/app/matches/${id}` : `/partido/${id}`),
    team: id => (inApp() ? `/app/teams/${id}/history` : `/equipo/${id}`),
    player: id => (inApp() ? `/app/players/${id}` : `/jugador/${id}`)
  }
}
