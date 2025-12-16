import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Tema personalizado según diseño del landing
const darkTheme = {
  dark: true,
  colors: {
    primary: '#FF6B00',      // Orange vibrante del landing
    secondary: '#FF8C00',    // Orange claro para gradientes
    accent: '#FFD700',       // Oro para acentos
    background: '#0A0A0F',   // Negro profundo del landing
    surface: '#1A1A1F',      // Superficie oscura para cards
    hover: '#252530',        // Estado hover
    'on-background': '#FFFFFF',     // Texto principal blanco
    'on-surface': '#FFFFFF',        // Texto en superficie
    'text-primary': '#FFFFFF',      // Texto principal
    'text-secondary': 'rgba(255, 255, 255, 0.7)',   // Texto secundario
    'text-disabled': 'rgba(255, 255, 255, 0.4)',    // Texto deshabilitado
    divider: 'rgba(255, 255, 255, 0.1)',      // Divisores
    error: '#EF4444',        // Error (rojo)
    warning: '#F59E0B',      // Warning (amarillo)
    success: '#22C55E',      // Success (verde)
    info: '#00D9FF',         // Info (cyan del landing)
    purple: '#9D00FF',       // Púrpura del landing
  }
}

const lightTheme = {
  dark: false,
  colors: {
    primary: '#FF6B00',      // Orange vibrante
    secondary: '#FF8C00',    // Orange claro
    accent: '#FFD700',       // Oro
    background: '#FAFAFA',   // Fondo claro
    surface: '#FFFFFF',      // Superficie blanca
    hover: '#F5F5F5',        // Estado hover
    'on-background': '#0A0A0F',     // Texto principal oscuro
    'on-surface': '#0A0A0F',        // Texto en superficie
    'text-primary': '#0A0A0F',      // Texto principal
    'text-secondary': 'rgba(10, 10, 15, 0.7)',   // Texto secundario
    'text-disabled': 'rgba(10, 10, 15, 0.4)',    // Texto deshabilitado
    divider: 'rgba(10, 10, 15, 0.1)',      // Divisores
    error: '#EF4444',        // Error
    warning: '#F59E0B',      // Warning
    success: '#22C55E',      // Success
    info: '#00D9FF',         // Info
    purple: '#9D00FF',       // Púrpura
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: darkTheme,
      light: lightTheme
    },
    variations: {
      colors: ['primary', 'secondary'],
      lighten: 3,
      darken: 3
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  defaults: {
    VCard: {
      elevation: 0,
      rounded: 'lg',
      style: 'border: 1px solid rgb(var(--v-theme-divider))'
    },
    VBtn: {
      rounded: 'lg',
      style: 'font-weight: 600;'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable'
    }
  },
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1264,
      xl: 1904,
    }
  }
})