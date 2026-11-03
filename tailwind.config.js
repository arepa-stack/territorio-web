// Tokens del design system de Stitch ("Caracas Streetball Territorial League").
// Los colores son variables CSS (src/styles/tailwind.css) para que el mismo nombre sirva en modo claro y oscuro.
const colorNames = [
  'background', 'surface', 'surface-dim', 'surface-bright',
  'surface-container-lowest', 'surface-container-low', 'surface-container',
  'surface-container-high', 'surface-container-highest', 'surface-variant',
  'on-background', 'on-surface', 'on-surface-variant', 'outline', 'outline-variant',
  'inverse-surface', 'inverse-on-surface', 'inverse-primary', 'surface-tint',
  'primary', 'on-primary', 'primary-container', 'on-primary-container',
  'primary-fixed', 'primary-fixed-dim', 'on-primary-fixed', 'on-primary-fixed-variant',
  'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container',
  'secondary-fixed', 'secondary-fixed-dim', 'on-secondary-fixed', 'on-secondary-fixed-variant',
  'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
  'tertiary-fixed', 'tertiary-fixed-dim', 'on-tertiary-fixed', 'on-tertiary-fixed-variant',
  'error', 'on-error', 'error-container', 'on-error-container'
]

// Families and radii are CSS variables too (src/styles/tailwind.css) so the "cancha" theme can swap them
const display = ['var(--f-display)']
const label = ['var(--f-label)']
const body = ['var(--f-body)']
const mono = ['var(--f-mono)']

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: Object.fromEntries(colorNames.map(n => [n, `rgb(var(--c-${n}) / <alpha-value>)`])),
      borderRadius: { sm: 'var(--r-sm)', DEFAULT: 'var(--r)', md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)' },
      spacing: {
        'space-xs': '0.25rem', 'space-sm': '0.5rem', 'space-md': '0.75rem', 'space-lg': '1.25rem', 'space-xl': '2rem',
        gutter: '1rem', 'gutter-md': '1.5rem', 'gutter-lg': '2rem',
        margin: '1rem', 'margin-md': '2rem', 'margin-lg': '3rem'
      },
      fontFamily: {
        display, body, mono,
        'display-xl': display, 'display-xl-mobile': display, 'headline-lg': display, 'headline-lg-mobile': display,
        'headline-md': display, 'label-tactical': label,
        'title-sm': body, 'body-md': body, 'body-sm': body,
        'stat-mono': mono, 'scoreboard-num': mono
      },
      fontSize: {
        'display-xl': ['56px', { lineHeight: '60px', letterSpacing: '0.02em', fontWeight: '800' }],
        'display-xl-mobile': ['40px', { lineHeight: '44px', letterSpacing: '0.02em', fontWeight: '800' }],
        'headline-lg': ['36px', { lineHeight: '40px', letterSpacing: '0.03em', fontWeight: '700' }],
        'headline-lg-mobile': ['28px', { lineHeight: '32px', letterSpacing: '0.03em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '28px', letterSpacing: '0.02em', fontWeight: '700' }],
        'title-sm': ['18px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'body-md': ['15px', { lineHeight: '22px', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', letterSpacing: '0em', fontWeight: '500' }],
        'scoreboard-num': ['32px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'stat-mono': ['14px', { lineHeight: '18px', letterSpacing: '0.04em', fontWeight: '600' }],
        'label-tactical': ['13px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '700' }]
      },
      boxShadow: {
        'glow-primary': '0 0 16px rgba(255, 85, 0, 0.25)',
        'glow-gold': '0 0 16px rgba(245, 158, 11, 0.3)'
      }
    }
  },
  plugins: []
}
