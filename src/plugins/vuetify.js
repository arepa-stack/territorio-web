import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Tema personalizado según diseño
const darkTheme = {
  dark: true,
  colors: {
    primary: '#FF5F1F',      // Orange energético
    secondary: '#007BFF',    // Azul confiable  
    background: '#000000',   // Negro puro para OLED
    surface: '#141414',      // Superficie oscura para cards
    hover: '#1F1F1F',        // Estado hover
    'on-background': '#E4E4E7',     // Texto principal
    'on-surface': '#E4E4E7',       // Texto en superficie
    'text-primary': '#E4E4E7',     // Texto principal
    'text-secondary': '#A1A1AA',   // Texto secundario
    'text-disabled': '#71717A',    // Texto deshabilitado
    divider: '#27272A',      // Divisores
    error: '#EF4444',        // Error (rojo)
    warning: '#F59E0B',      // Warning (amarillo)
    success: '#22C55E',      // Success (verde)
    info: '#0EA5E9',         // Info (cyan)
  }
}

const lightTheme = {
  dark: false,
  colors: {
    primary: '#F97316',      // Orange más profundo
    secondary: '#0063CC',    // Azul confiable
    background: '#F8F9FA',   // Fondo claro
    surface: '#FFFFFF',      // Superficie blanca
    hover: '#F1F5F9',        // Estado hover
    'on-background': '#18181B',     // Texto principal
    'on-surface': '#18181B',       // Texto en superficie
    'text-primary': '#18181B',     // Texto principal
    'text-secondary': '#52525B',   // Texto secundario
    'text-disabled': '#A1A1AA',    // Texto deshabilitado
    divider: '#E4E4E7',      // Divisores
    error: '#EF4444',        // Error
    warning: '#F59E0B',      // Warning
    success: '#22C55E',      // Success
    info: '#0EA5E9',         // Info
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