import { ref } from 'vue'

// One shared state: the <html class="dark"> flag drives Tailwind; index.html sets it before mount.
const isDark = ref(document.documentElement.classList.contains('dark'))

/** Light/dark mode for the whole app. Persists in localStorage. */
export function useColorMode() {
  const toggle = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    try {
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    } catch (e) {
      // storage blocked: the mode still applies for this session
    }
  }

  return { isDark, toggle }
}
