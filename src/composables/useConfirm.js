import { reactive } from 'vue'

// One shared dialog (mounted in App.vue); callers just await the answer:
//   if (!(await confirm({ title, message, confirmText, danger: true }))) return
// With `input: { label, placeholder }` it resolves to the typed text ('' allowed) or false on cancel.
const DEFAULTS = { title: '¿Confirmar?', message: '', confirmText: 'Confirmar', cancelText: 'Cancelar', danger: false, input: null }

export const confirmState = reactive({ ...DEFAULTS, open: false })

let resolver = null

export function settleConfirm(value) {
  confirmState.open = false
  resolver?.(value)
  resolver = null
}

export function useConfirm() {
  return options => {
    resolver?.(false) // a new question cancels a pending one
    Object.assign(confirmState, DEFAULTS, options, { open: true })
    return new Promise(resolve => (resolver = resolve))
  }
}
