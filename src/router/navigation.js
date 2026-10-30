// Navigation per role, shared by the bottom bar (mobile), the side bar (desktop) and the router guard.
// Icons are Material Symbols names.

export const ROLE_LABEL = {
  ADMIN: 'Admin',
  ORGANIZER: 'Organizador',
  TEAM_CAPTAIN: 'Capitán',
  PLAYER: 'Jugador',
  REFEREE: 'Árbitro',
  MODERATOR: 'Moderador'
}

export const HOME_BY_ROLE = {
  ADMIN: '/app/admin/users',
  ORGANIZER: '/app/organizer',
  TEAM_CAPTAIN: '/app/captain',
  PLAYER: '/app/player',
  // ponytail: referee and moderator have no own screens yet; they land on the tournament catalog
  REFEREE: '/app/tournaments',
  MODERATOR: '/app/tournaments'
}

const tournaments = { label: 'Torneos', icon: 'emoji_events', to: '/app/tournaments' }
const courts = { label: 'Canchas', icon: 'location_on', to: '/app/zones/map' }

export const NAV_BY_ROLE = {
  ADMIN: [
    { label: 'Usuarios', icon: 'group', to: '/app/admin/users' },
    { label: 'Zonas', icon: 'map', to: '/app/admin/zones' },
    tournaments
  ],
  ORGANIZER: [
    { label: 'Panel', icon: 'dashboard', to: '/app/organizer' },
    tournaments,
    courts
  ],
  TEAM_CAPTAIN: [
    { label: 'Mi equipo', icon: 'groups', to: '/app/captain', exact: true },
    { label: 'Fichar', icon: 'person_add', to: '/app/captain/register-player' },
    tournaments,
    courts
  ],
  PLAYER: [
    { label: 'Inicio', icon: 'home', to: '/app/player', exact: true },
    { label: 'Equipos', icon: 'groups', to: '/app/player/teams' },
    { label: 'Buscar equipo', icon: 'person_search', to: '/app/player/recruiting' },
    tournaments,
    { label: 'Calendario', icon: 'calendar_month', to: '/app/player/schedule' },
    { label: 'Estadísticas', icon: 'bar_chart', to: '/app/player/stats' },
    { label: 'Perfil', icon: 'person', to: '/app/player/profile' }
  ],
  REFEREE: [tournaments, courts],
  MODERATOR: [tournaments, courts]
}
