import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'

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
      }
    ]
  },
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
          roles: ['PLAYER'],
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
          roles: ['PLAYER', 'TEAM_CAPTAIN'],
          title: 'Catálogo de Torneos'
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
        path: 'captain/team/:id',
        name: 'TeamManagement',
        component: () => import('@/views/captain/TeamManagementView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['TEAM_CAPTAIN'],
          title: 'Gestión de Equipo'
        }
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
          roles: ['PLAYER', 'TEAM_CAPTAIN', 'ORGANIZER', 'ADMIN'],
          title: 'Mapa de Zonas'
        }
      }
    ]
  }
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
      next('/auth/login')
      return
    }

    // Check role-based access
    if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
      // Redirect to appropriate dashboard based on user role
      const dashboardRoutes = {
        PLAYER: '/app/player',
        TEAM_CAPTAIN: '/app/captain',
        ORGANIZER: '/app/organizer',
        ADMIN: '/app/admin'
      }

      next(dashboardRoutes[authStore.user.role] || '/app/player')
      return
    }
  }

  // Redirect authenticated users away from auth pages
  if (to.matched.some(record => record.meta.guestOnly) && authStore.isAuthenticated) {
    const dashboardRoutes = {
      PLAYER: '/app/player',
      TEAM_CAPTAIN: '/app/captain',
      ORGANIZER: '/app/organizer',
      ADMIN: '/app/admin'
    }

    next(dashboardRoutes[authStore.user.role] || '/app/player')
    return
  }

  next()
})

export default router