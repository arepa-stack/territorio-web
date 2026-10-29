import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'
import { HOME_BY_ROLE } from './navigation'

// Layouts
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'

// Auth Views
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'

// Dashboard Views
import PlayerDashboard from '@/views/player/PlayerDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingPage.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: LoginView,
        meta: {
          requiresAuth: false,
          guestOnly: true
        }
      },
      {
        path: 'register',
        name: 'Register',
        component: RegisterView,
        meta: {
          requiresAuth: false,
          guestOnly: true
        }
      },
      {
        // Without ?token asks for the email; with ?token sets the new password
        path: 'forgot-password',
        alias: 'reset-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: '/torneo/:id',
    name: 'PublicTournament',
    component: () => import('@/views/tournaments/PublicTournamentView.vue'),
    meta: { requiresAuth: false }
  },
  {
    // Team invite link shared by a captain (public preview, join needs a PLAYER session)
    path: '/join/:token',
    name: 'JoinTeam',
    component: () => import('@/views/teams/JoinTeamView.vue'),
    meta: { requiresAuth: false }
  },
  // Link sent by the backend email: FRONTEND_URL/reset-password?token=...
  { path: '/reset-password', redirect: to => ({ path: '/auth/reset-password', query: to.query }) },
  {
    path: '/app',
    component: MainLayout,
    meta: { requiresAuth: false },
    children: [
      // Player Dashboard
      {
        path: 'player',
        name: 'PlayerDashboard',
        component: PlayerDashboard,
        meta: {
          requiresAuth: true,
          roles: ['PLAYER'],
          title: 'Dashboard'
        }
      },
      {
        path: 'player/profile',
        name: 'PlayerProfile',
        component: () => import('@/views/player/PlayerProfile.vue'),
        meta: {
          requiresAuth: true,
          roles: ['PLAYER', 'TEAM_CAPTAIN'],
          title: 'Mi Perfil'
        }
      },
      {
        path: 'player/stats',
        name: 'PlayerStats',
        component: () => import('@/views/player/PlayerStatsView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['PLAYER'],
          title: 'Estadísticas'
        }
      },
      {
        path: 'player/teams',
        name: 'PlayerTeams',
        component: () => import('@/views/player/PlayerTeamsView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['PLAYER'],
          title: 'Mis Equipos'
        }
      },
      {
        path: 'player/schedule',
        name: 'PlayerSchedule',
        component: () => import('@/views/player/PlayerScheduleView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['PLAYER'],
          title: 'Calendario'
        }
      },
      {
        path: 'tournaments',
        name: 'TournamentCatalog',
        component: () => import('@/views/tournaments/TournamentCatalog.vue'),
        meta: {
          requiresAuth: true,
          roles: ['PLAYER', 'TEAM_CAPTAIN', 'ORGANIZER', 'ADMIN', 'REFEREE', 'MODERATOR'],
          title: 'Catálogo de Torneos'
        }
      },
      {
        path: 'teams/:id/history',
        name: 'TeamHistory',
        component: () => import('@/views/teams/TeamHistoryView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['PLAYER', 'TEAM_CAPTAIN', 'ORGANIZER', 'ADMIN', 'REFEREE', 'MODERATOR'],
          title: 'Historial del equipo'
        }
      },
      {
        path: 'captain',
        name: 'CaptainDashboard',
        component: () => import('@/views/captain/CaptainDashboard.vue'),
        meta: {
          requiresAuth: true,
          roles: ['TEAM_CAPTAIN'],
          title: 'Panel de Capitán'
        }
      },
      {
        // Team management lives in the captain home now (one team per captain)
        path: 'captain/team/:id',
        redirect: '/app/captain'
      },
      {
        path: 'captain/register-player',
        name: 'PlayerRegistration',
        component: () => import('@/views/captain/PlayerRegistrationView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['TEAM_CAPTAIN'],
          title: 'Registrar Jugador'
        }
      },
      {
        path: 'organizer',
        name: 'OrganizerDashboard',
        component: () => import('@/views/organizer/OrganizerDashboard.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ORGANIZER'],
          title: 'Panel de Organizador'
        }
      },
      {
        path: 'zones/map',
        name: 'ZoneMap',
        component: () => import('@/views/zones/ZoneMapView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['PLAYER', 'TEAM_CAPTAIN', 'ORGANIZER', 'ADMIN', 'REFEREE', 'MODERATOR'],
          title: 'Mapa de Zonas'
        }
      },
      {
        path: 'organizer/tournament/:id',
        name: 'TournamentManage',
        component: () => import('@/views/organizer/TournamentManageView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ORGANIZER'],
          title: 'Gestionar torneo'
        }
      },
      {
        path: 'organizer/match/:id',
        name: 'MatchSheet',
        component: () => import('@/views/organizer/MatchSheetView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ORGANIZER'],
          title: 'Mesa técnica'
        }
      },
      {
        path: 'admin',
        redirect: '/app/admin/users'
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/AdminUsersView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ADMIN'],
          title: 'Usuarios'
        }
      },
      {
        path: 'admin/zones',
        name: 'AdminZones',
        component: () => import('@/views/zones/ZoneMapView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ADMIN'],
          title: 'Zonas y Canchas'
        }
      }
    ]
  },
  // Unknown URLs go back to the landing instead of rendering a blank page
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      next({ path: '/auth/login', query: { redirect: to.fullPath } })
      return
    }

    // Check role-based access
    if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
      // Redirect to appropriate dashboard based on user role
      next(HOME_BY_ROLE[authStore.user.role] || '/')
      return
    }
  }

  // Redirect authenticated users away from auth pages
  if (to.matched.some(record => record.meta.guestOnly) && authStore.isAuthenticated) {
    next(HOME_BY_ROLE[authStore.user.role] || '/')
    return
  }

  next()
})

export default router