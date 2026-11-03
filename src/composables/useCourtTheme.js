// Puts the "cancha" theme on <html> while any layout using it is mounted.
// A counter, because the next layout mounts before the previous one's onUnmounted runs.
import { onUnmounted } from 'vue'

let users = 0

export function useCourtTheme() {
  users++
  document.documentElement.classList.add('court')
  onUnmounted(() => {
    if (--users === 0) document.documentElement.classList.remove('court')
  })
}
