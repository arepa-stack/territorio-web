<template>
  <!-- Full screen on mobile, modal on desktop. Steps are a horizontal scroll-snap track (native swipe). -->
  <dialog
    ref="dialog"
    class="m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden border-t-2 border-solid border-x-0 border-b-0 border-primary-container bg-surface-container p-0 text-on-surface backdrop:bg-[rgba(11,15,23,0.8)] md:m-auto md:h-[min(720px,90vh)] md:w-full md:max-w-xl md:rounded-lg"
    aria-labelledby="pay-title"
    @click.self="dialog.close()"
    @close="onClose"
  >
    <div v-if="reg" class="flex h-full flex-col">
      <header class="flex items-start justify-between gap-space-sm border-0 border-b border-solid border-outline-variant/40 px-space-lg py-space-md">
        <div class="min-w-0">
          <h2 id="pay-title" class="m-0 font-headline-md text-headline-md uppercase">Pagar inscripción</h2>
          <p class="m-0 truncate text-body-sm text-on-surface-variant">{{ reg.tournament.name }}</p>
        </div>
        <button type="button" class="btn-ghost" aria-label="Cerrar" @click="dialog.close()"><span class="icon">close</span></button>
      </header>

      <!-- Step indicator 1 · 2 · 3, synced with the scroll position -->
      <ol class="m-0 flex list-none items-center justify-center gap-space-xs px-space-lg py-space-sm" aria-label="Pasos">
        <li v-for="(label, i) in STEPS" :key="label" class="flex items-center gap-space-xs">
          <span v-if="i" class="text-on-surface-variant" aria-hidden="true">·</span>
          <button
            type="button"
            class="label-tactical flex cursor-pointer items-center gap-1 rounded-full border border-solid bg-transparent px-space-sm py-1"
            :class="step === i ? 'border-primary-container text-primary' : 'border-outline-variant/40 text-on-surface-variant'"
            :aria-current="step === i ? 'step' : undefined"
            :disabled="i === 2 && !canUpload"
            @click="goTo(i)"
          >
            <span class="font-stat-mono">{{ i + 1 }}</span>
            <span class="hidden sm:inline">{{ label }}</span>
          </button>
        </li>
      </ol>

      <!-- Current status of the latest report -->
      <div v-if="payment" class="mx-space-lg mb-space-sm flex flex-col gap-1 rounded bg-surface-container-high p-space-sm">
        <div class="flex flex-wrap items-center gap-space-xs">
          <StatusChip :status="payment.status" :label="PAYMENT_STATUS[payment.status]" />
          <span v-if="payment.status === 'PENDING_REVIEW' && !payment.hasReceipt" class="text-body-sm text-on-surface-variant">Sin comprobante</span>
        </div>
        <p v-if="payment.status === 'REJECTED'" class="m-0 text-body-sm text-error">
          {{ payment.reviewNote || 'El organizador rechazó el pago.' }} Puedes reenviarlo con los datos correctos.
        </p>
      </div>

      <div
        ref="track"
        class="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll.passive="onScroll"
      >
        <!-- Step 1: payment details -->
        <section class="w-full shrink-0 snap-start snap-always overflow-y-auto px-space-lg pb-space-lg" aria-label="Paso 1: Datos de pago">
          <h3 class="label-tactical m-0 mb-space-sm text-secondary">1 · Datos de pago</h3>
          <div class="mb-space-md rounded-lg bg-surface-container-high p-space-md text-center">
            <span class="label-tactical text-on-surface-variant">Monto a pagar</span>
            <p class="m-0 font-scoreboard-num text-[44px] leading-none tabular text-primary">${{ fee }}</p>
          </div>

          <p v-if="!methods.length" class="m-0 mb-space-md flex items-center gap-space-xs rounded border border-solid border-secondary/50 bg-secondary/10 p-space-sm text-body-sm">
            <span class="icon text-[18px] text-secondary">info</span>
            El organizador aún no publicó sus datos de pago. Contáctalo y luego reporta tu pago aquí.
          </p>

          <div class="mb-space-md grid grid-cols-2 gap-space-sm" role="radiogroup" aria-label="Método de pago">
            <label
              v-for="m in methodOptions"
              :key="m.value"
              class="flex cursor-pointer items-center gap-space-xs rounded-lg border-2 border-solid p-space-sm"
              :class="form.method === m.value ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/40'"
            >
              <input v-model="form.method" type="radio" name="pay-method" :value="m.value" class="sr-only" />
              <span class="icon" :class="form.method === m.value ? 'text-primary' : 'text-on-surface-variant'">{{ m.icon }}</span>
              <span class="font-title-sm text-title-sm">{{ m.label }}</span>
            </label>
          </div>

          <dl v-if="details.length" class="m-0 flex flex-col gap-space-xs">
            <div v-for="d in details" :key="d.label" class="flex items-center justify-between gap-space-sm rounded bg-surface-container-high px-space-md py-space-sm">
              <div class="min-w-0">
                <dt class="label-tactical text-on-surface-variant">{{ d.label }}</dt>
                <dd class="m-0 break-all font-stat-mono text-body-md">{{ d.value }}</dd>
              </div>
              <button type="button" class="btn-ghost shrink-0" :aria-label="`Copiar ${d.label}`" @click="copy(d)">
                <span class="icon">{{ copied === d.label ? 'check' : 'content_copy' }}</span>
              </button>
            </div>
          </dl>
        </section>

        <!-- Step 2: confirm the payment -->
        <section class="w-full shrink-0 snap-start snap-always overflow-y-auto px-space-lg pb-space-lg" aria-label="Paso 2: Confirma tu pago">
          <h3 class="label-tactical m-0 mb-space-sm text-secondary">2 · Confirma tu pago</h3>
          <form ref="formEl" class="flex flex-col gap-space-md" novalidate @submit.prevent="submitPayment">
            <div>
              <label class="field-label" for="pay-method">Método</label>
              <select id="pay-method" v-model="form.method" class="input" required>
                <option v-for="m in methodOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
            <div class="grid gap-space-md sm:grid-cols-2">
              <div>
                <label class="field-label" for="pay-ref">Referencia *</label>
                <input id="pay-ref" v-model.trim="form.reference" class="input font-mono" inputmode="numeric" maxlength="50" required placeholder="00123456" />
              </div>
              <div>
                <label class="field-label" for="pay-amount">Monto ($) *</label>
                <input id="pay-amount" v-model.number="form.amount" class="input font-mono" type="number" min="0.01" step="0.01" required />
              </div>
            </div>
            <div>
              <label class="field-label" for="pay-date">Fecha de pago *</label>
              <input id="pay-date" v-model="form.paidAt" class="input" type="date" :max="today" required />
            </div>
            <div>
              <label class="field-label" for="pay-bank">Banco de origen *</label>
              <input id="pay-bank" v-model.trim="form.payerBank" class="input" list="ve-banks" maxlength="80" required placeholder="Banesco (0134)" />
              <BankList />
            </div>
            <div class="grid gap-space-md sm:grid-cols-2">
              <div>
                <label class="field-label" for="pay-ci">Cédula / RIF del pagador *</label>
                <input
                  id="pay-ci"
                  v-model.trim="form.payerId"
                  class="input font-mono"
                  required
                  pattern="([VvEeJjGgPp]-?)?\d{5,10}(-?\d)?"
                  title="Ej. V-12345678 o J-123456789"
                  placeholder="V-12345678"
                />
              </div>
              <div>
                <label class="field-label" for="pay-phone">Teléfono{{ form.method === 'PAGO_MOVIL' ? ' *' : '' }}</label>
                <input
                  id="pay-phone"
                  v-model.trim="form.payerPhone"
                  class="input font-mono"
                  inputmode="tel"
                  :required="form.method === 'PAGO_MOVIL'"
                  pattern="\+?[\d\s()\-]{7,20}"
                  title="Ej. 0414-1234567"
                  placeholder="0414-1234567"
                />
              </div>
            </div>
            <p v-if="formError" role="alert" class="m-0 flex items-center gap-space-xs rounded border border-solid border-error/50 bg-error/10 p-space-sm text-body-sm text-error">
              <span class="icon text-[18px]">error</span>{{ formError }}
            </p>
          </form>
        </section>

        <!-- Step 3: receipt (only exists for a pending report, so it can't be swiped to before submitting) -->
        <section v-if="canUpload" class="w-full shrink-0 snap-start snap-always overflow-y-auto px-space-lg pb-space-lg" aria-label="Paso 3: Comprobante">
          <h3 class="label-tactical m-0 mb-space-sm text-secondary">3 · Comprobante</h3>
          <p class="m-0 mb-space-md text-body-sm text-on-surface-variant">
            Sube la captura o el PDF del pago (máx. 5MB) para que el organizador lo verifique más rápido.
          </p>
          <div class="grid grid-cols-2 gap-space-sm">
            <label class="btn-secondary cursor-pointer">
              <span class="icon">photo_camera</span> Tomar foto
              <input type="file" accept="image/*" capture="environment" class="sr-only" @change="pickFile" />
            </label>
            <label class="btn-secondary cursor-pointer">
              <span class="icon">upload_file</span> Elegir archivo
              <input type="file" accept="image/*,application/pdf" class="sr-only" @change="pickFile" />
            </label>
          </div>
          <div v-if="file" class="mt-space-md rounded-lg bg-surface-container-high p-space-sm">
            <img v-if="previewUrl" :src="previewUrl" alt="Vista previa del comprobante" class="max-h-64 w-full rounded object-contain" />
            <p v-else class="m-0 flex items-center gap-space-xs text-body-sm"><span class="icon text-error">picture_as_pdf</span>{{ file.name }}</p>
          </div>
          <p v-else-if="payment.hasReceipt" class="m-0 mt-space-md flex items-center gap-space-xs text-body-sm text-tertiary">
            <span class="icon text-[18px]">check_circle</span> Ya subiste un comprobante. Puedes reemplazarlo.
          </p>
        </section>
      </div>

      <footer class="flex gap-space-sm border-0 border-t border-solid border-outline-variant/40 px-space-lg py-space-md" style="padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px)">
        <button v-if="step > 0" type="button" class="btn-ghost" :disabled="busy" @click="goTo(step - 1)">
          <span class="icon">arrow_back</span> Anterior
        </button>
        <button v-if="step === 0" type="button" class="btn-primary flex-1" @click="goTo(1)">
          Siguiente <span class="icon">arrow_forward</span>
        </button>
        <template v-else-if="step === 1">
          <button v-if="canUpload && !form.reference" type="button" class="btn-primary flex-1" @click="goTo(2)">
            Siguiente <span class="icon">arrow_forward</span>
          </button>
          <button v-else type="button" class="btn-primary flex-1" :disabled="busy" @click="submitPayment">
            <span class="icon">send</span> {{ busy ? 'Enviando…' : payment ? 'Reenviar pago' : 'Enviar pago' }}
          </button>
        </template>
        <template v-else>
          <button type="button" class="btn-ghost flex-1" :disabled="busy" @click="later">Lo subo después</button>
          <button type="button" class="btn-primary flex-1" :disabled="busy || !file" @click="uploadReceipt">
            <span class="icon">check</span> {{ busy ? 'Subiendo…' : 'Finalizar' }}
          </button>
        </template>
      </footer>
    </div>
  </dialog>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useToast } from 'vue-toastification'
import paymentsService from '@/services/payments'
import { handleApiError } from '@/services/api'
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/utils/labels'
import StatusChip from '@/components/ui/StatusChip.vue'
import BankList from './BankList.vue'

// Usage: <PaymentDialog ref="pay" @changed="reload" /> then pay.value.open(registration)
// registration = { id, tournament: { name, entryFee, paymentInfo }, payment }
const emit = defineEmits(['changed'])
const toast = useToast()

const STEPS = ['Datos de pago', 'Confirma tu pago', 'Comprobante']
const MAX_FILE = 5 * 1024 * 1024

const dialog = ref(null)
const track = ref(null)
const formEl = ref(null)
const reg = ref(null)
const payment = ref(null)
const step = ref(0)
const busy = ref(false)
const formError = ref('')
const copied = ref('')
const file = ref(null)
const previewUrl = ref('')
const form = ref({})

const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
const fee = computed(() => Number(reg.value?.tournament.entryFee || 0))
const info = computed(() => reg.value?.tournament.paymentInfo || {})
const methods = computed(() => ['PAGO_MOVIL', 'TRANSFERENCIA'].filter(m => (m === 'PAGO_MOVIL' ? info.value.pagoMovil : info.value.transferencia)))
const methodOptions = computed(() =>
  (methods.value.length ? methods.value : Object.keys(PAYMENT_METHODS)).map(value => ({
    value,
    label: PAYMENT_METHODS[value],
    icon: value === 'PAGO_MOVIL' ? 'smartphone' : 'account_balance'
  }))
)
// The receipt goes on the latest pending report; a pending report can still be corrected by resending it
const canUpload = computed(() => payment.value?.status === 'PENDING_REVIEW')

const details = computed(() => {
  if (form.value.method === 'PAGO_MOVIL' && info.value.pagoMovil) {
    const p = info.value.pagoMovil
    return [
      { label: 'Banco', value: p.banco },
      { label: 'Teléfono', value: p.telefono },
      { label: 'Cédula / RIF', value: p.cedula },
      { label: 'Monto', value: fee.value.toFixed(2) }
    ]
  }
  if (form.value.method === 'TRANSFERENCIA' && info.value.transferencia) {
    const t = info.value.transferencia
    return [
      { label: 'Banco', value: t.banco },
      { label: 'Cuenta', value: t.cuenta },
      { label: 'Titular', value: t.titular },
      { label: 'RIF / Cédula', value: t.rif },
      { label: 'Monto', value: fee.value.toFixed(2) }
    ]
  }
  return []
})

const resetFile = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = null
  previewUrl.value = ''
}

const open = async registration => {
  reg.value = registration
  payment.value = registration.payment || null
  formError.value = ''
  resetFile()
  const prev = payment.value
  form.value = {
    method: prev?.method || methodOptions.value[0].value,
    reference: '',
    amount: fee.value,
    paidAt: today,
    payerBank: prev?.payerBank || '',
    payerId: prev?.payerId || '',
    payerPhone: prev?.payerPhone || ''
  }
  await nextTick()
  dialog.value.showModal()
  // A pending report without receipt opens on the upload step
  const start = payment.value?.status === 'PENDING_REVIEW' ? 2 : 0
  step.value = start
  track.value.scrollLeft = start * track.value.clientWidth
}

const goTo = async i => {
  await nextTick()
  track.value.scrollTo({ left: i * track.value.clientWidth, behavior: 'smooth' })
  step.value = i
}

const onScroll = () => {
  const el = track.value
  if (el?.clientWidth) step.value = Math.round(el.scrollLeft / el.clientWidth)
}

const copy = async d => {
  try {
    await navigator.clipboard.writeText(d.value)
    copied.value = d.label
    toast.success(`${d.label} copiado`)
    setTimeout(() => copied.value === d.label && (copied.value = ''), 1500)
  } catch {
    toast.error('No se pudo copiar, selecciona el texto manualmente')
  }
}

const submitPayment = async () => {
  formError.value = ''
  if (!formEl.value.checkValidity()) {
    formEl.value.reportValidity()
    formError.value = 'Revisa los campos marcados antes de continuar.'
    return
  }
  busy.value = true
  try {
    const f = form.value
    const { data } = await paymentsService.submit(reg.value.id, {
      method: f.method,
      reference: f.reference,
      amount: Number(f.amount),
      paidAt: new Date(`${f.paidAt}T12:00:00`).toISOString(), // local noon: the date doesn't shift by timezone
      payerBank: f.payerBank,
      payerId: f.payerId,
      ...(f.payerPhone && { payerPhone: f.payerPhone })
    })
    payment.value = data
    toast.success('Pago reportado. Ahora sube el comprobante.')
    emit('changed')
    goTo(2)
  } catch (error) {
    formError.value = handleApiError(error, 'No se pudo reportar el pago')
  } finally {
    busy.value = false
  }
}

const pickFile = e => {
  const f = e.target.files[0]
  e.target.value = ''
  if (!f) return
  if (f.size > MAX_FILE) return toast.error('El comprobante no puede pesar más de 5MB')
  if (!f.type.startsWith('image/') && f.type !== 'application/pdf') return toast.error('Solo imágenes o PDF')
  resetFile()
  file.value = f
  if (f.type.startsWith('image/')) previewUrl.value = URL.createObjectURL(f)
}

const uploadReceipt = async () => {
  busy.value = true
  try {
    const { data } = await paymentsService.uploadReceipt(payment.value.id, file.value)
    payment.value = data
    toast.success('Comprobante enviado. El organizador verificará tu pago.')
    emit('changed')
    dialog.value.close()
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo subir el comprobante'))
  } finally {
    busy.value = false
  }
}

const later = () => {
  toast.info('Tu pago quedó pendiente. Sube el comprobante desde "Mis inscripciones".')
  dialog.value.close()
}

const onClose = () => resetFile()

defineExpose({ open })
</script>
