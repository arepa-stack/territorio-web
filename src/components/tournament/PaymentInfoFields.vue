<template>
  <!-- Organizer's payment details; v-model is an object from emptyPaymentInfo() -->
  <div class="grid gap-space-md md:grid-cols-2">
    <fieldset class="m-0 flex flex-col gap-space-sm rounded-lg border border-solid border-outline-variant/40 p-space-md">
      <legend class="label-tactical flex items-center gap-space-xs px-space-xs text-secondary">
        <span class="icon text-[18px]">smartphone</span> Pago Móvil
      </legend>
      <div>
        <label class="field-label" :for="`${idPrefix}-pm-banco`">Banco</label>
        <input :id="`${idPrefix}-pm-banco`" v-model="model.pagoMovil.banco" class="input" list="ve-banks" placeholder="Banesco (0134)" />
      </div>
      <div>
        <label class="field-label" :for="`${idPrefix}-pm-tel`">Teléfono</label>
        <input :id="`${idPrefix}-pm-tel`" v-model="model.pagoMovil.telefono" class="input font-mono" inputmode="tel" placeholder="0414-1234567" />
      </div>
      <div>
        <label class="field-label" :for="`${idPrefix}-pm-ci`">Cédula / RIF</label>
        <input :id="`${idPrefix}-pm-ci`" v-model="model.pagoMovil.cedula" class="input font-mono" placeholder="V-12345678" />
      </div>
    </fieldset>

    <fieldset class="m-0 flex flex-col gap-space-sm rounded-lg border border-solid border-outline-variant/40 p-space-md">
      <legend class="label-tactical flex items-center gap-space-xs px-space-xs text-secondary">
        <span class="icon text-[18px]">account_balance</span> Transferencia
      </legend>
      <div>
        <label class="field-label" :for="`${idPrefix}-tr-banco`">Banco</label>
        <input :id="`${idPrefix}-tr-banco`" v-model="model.transferencia.banco" class="input" list="ve-banks" placeholder="Banco de Venezuela (0102)" />
      </div>
      <div>
        <label class="field-label" :for="`${idPrefix}-tr-cuenta`">Número de cuenta (20 dígitos)</label>
        <input :id="`${idPrefix}-tr-cuenta`" v-model="model.transferencia.cuenta" class="input font-mono" inputmode="numeric" placeholder="0102-0000-00-0000000000" />
      </div>
      <div>
        <label class="field-label" :for="`${idPrefix}-tr-titular`">Titular</label>
        <input :id="`${idPrefix}-tr-titular`" v-model="model.transferencia.titular" class="input" placeholder="Liga Vecinal La Paz" />
      </div>
      <div>
        <label class="field-label" :for="`${idPrefix}-tr-rif`">RIF / Cédula</label>
        <input :id="`${idPrefix}-tr-rif`" v-model="model.transferencia.rif" class="input font-mono" placeholder="J-123456789" />
      </div>
    </fieldset>
    <BankList />
  </div>
</template>

<script setup>
import BankList from './BankList.vue'

defineProps({ idPrefix: { type: String, default: 'pi' } })
const model = defineModel({ type: Object, required: true })
</script>
