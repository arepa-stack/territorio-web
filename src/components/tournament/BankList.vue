<template>
  <!-- Suggestions for bank inputs (list="ve-banks" / "co-banks"); free text is still allowed -->
  <datalist :id="country === 'CO' ? 'co-banks' : 've-banks'">
    <option v-for="b in country === 'CO' ? CO_BANKS : BANKS" :key="b" :value="b" />
  </datalist>
</template>

<script setup>
defineProps({ country: { type: String, default: 'VE' } })

const CO_BANKS = [
  'Nequi',
  'Daviplata',
  'Bancolombia',
  'Davivienda',
  'Banco de Bogotá',
  'BBVA Colombia',
  'Banco de Occidente',
  'Banco Popular',
  'Scotiabank Colpatria',
  'Banco AV Villas',
  'Banco Caja Social',
  'Itaú',
  'Banco Falabella',
  'Nu Colombia',
  'Lulo Bank'
]
const BANKS = [
  'Banco de Venezuela (0102)',
  'Banesco (0134)',
  'Mercantil (0105)',
  'BBVA Provincial (0108)',
  'Bancamiga (0172)',
  'Banco Nacional de Crédito (0191)',
  'Bancaribe (0114)',
  'Banco del Tesoro (0163)',
  'Banco Bicentenario (0175)',
  'Banco Exterior (0115)',
  'Banco Plaza (0138)',
  'Banplus (0174)',
  'Banco Activo (0171)',
  '100% Banco (0156)',
  'Banco Caroní (0128)',
  'Venezolano de Crédito (0104)',
  'Banco Sofitasa (0137)',
  'Mi Banco (0169)'
]
</script>
