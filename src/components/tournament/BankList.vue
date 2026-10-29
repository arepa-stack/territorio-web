<template>
  <!-- Suggestions for bank inputs (list="ve-banks"); free text is still allowed -->
  <datalist id="ve-banks">
    <option v-for="b in BANKS" :key="b" :value="b" />
  </datalist>
</template>

<script setup>
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
