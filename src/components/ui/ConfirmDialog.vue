<template>
  <!-- Native <dialog>: Esc / backdrop cancel, focus trap for free. Driven by useConfirm(). -->
  <dialog
    ref="dialog"
    class="w-full max-w-md rounded-lg border-t-2 border-solid border-x-0 border-b-0 bg-surface-container p-0 text-on-surface backdrop:bg-[rgba(11,15,23,0.8)]"
    :class="state.danger ? 'border-error' : 'border-primary-container'"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-message"
    @cancel.prevent="settleConfirm(false)"
    @click.self="settleConfirm(false)"
  >
    <form class="flex flex-col gap-space-md p-space-lg" @submit.prevent="settleConfirm(state.input ? text.trim() : true)">
      <h2 id="confirm-title" class="m-0 flex items-center gap-space-xs font-headline-md text-headline-md uppercase">
        <span class="icon" :class="state.danger ? 'text-error' : 'text-primary'">{{ state.danger ? 'warning' : 'help' }}</span>
        {{ state.title }}
      </h2>
      <p id="confirm-message" class="m-0 text-body-md text-on-surface-variant">{{ state.message }}</p>
      <div v-if="state.input">
        <label class="field-label" for="confirm-input">{{ state.input.label }}</label>
        <textarea
          id="confirm-input"
          ref="inputEl"
          v-model="text"
          class="input"
          rows="3"
          maxlength="300"
          :placeholder="state.input.placeholder"
        />
      </div>
      <div class="flex justify-end gap-space-sm">
        <button ref="cancelBtn" type="button" class="btn-ghost" @click="settleConfirm(false)">{{ state.cancelText }}</button>
        <button type="submit" :class="state.danger ? 'btn-danger' : 'btn-primary'">{{ state.confirmText }}</button>
      </div>
    </form>
  </dialog>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { confirmState as state, settleConfirm } from '@/composables/useConfirm'

const dialog = ref(null)
const cancelBtn = ref(null)
const inputEl = ref(null)
const text = ref('')

watch(
  () => state.open,
  async open => {
    if (!open) return dialog.value?.close()
    text.value = ''
    if (!dialog.value.open) dialog.value.showModal()
    await nextTick()
    // Safe default: focus Cancel (or the note field when one is asked)
    ;(inputEl.value || cancelBtn.value)?.focus()
  }
)
</script>
