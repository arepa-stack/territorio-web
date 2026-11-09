import { ref, watch } from 'vue'

// Countries where Turf runs. The entry fee currency comes from the tournament's country
export const COUNTRIES = {
  VE: { code: 'VE', name: 'Venezuela', currency: 'USD' },
  CO: { code: 'CO', name: 'Colombia', currency: 'COP' }
}

const KEY = 'country'
const initial = () => {
  try {
    const saved = localStorage.getItem(KEY)
    if (COUNTRIES[saved]) return saved
  } catch {
    /* private mode */
  }
  return /-CO$/i.test(navigator.language || '') ? 'CO' : 'VE' // first visit: guess from the browser
}

// One shared selection for the whole app (header switcher, lists, forms)
export const country = ref(initial())
watch(country, code => {
  try {
    localStorage.setItem(KEY, code)
  } catch {
    /* private mode: lasts until reload */
  }
})

// "$10" in Venezuela (USD), "$50.000 COP" in Colombia
export const money = (amount, code = 'VE') => {
  const n = Number(amount) || 0
  return code === 'CO' ? `$${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP` : `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}
export const fee = (amount, code) => (Number(amount) > 0 ? money(amount, code) : 'Gratis')
