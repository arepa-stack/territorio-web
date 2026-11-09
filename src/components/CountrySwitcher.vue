<template>
  <!-- Two countries: a segmented pill beats a dropdown (one tap, both options always visible) -->
  <div class="cs" role="radiogroup" aria-label="País">
    <button
      v-for="c in list"
      :key="c.code"
      type="button"
      role="radio"
      class="cs__opt"
      :aria-checked="country === c.code"
      :title="c.name"
      @click="country = c.code"
    >
      <CountryFlag :code="c.code" :size="13" />
      <span class="cs__code">{{ c.code }}</span>
    </button>
  </div>
</template>

<script setup>
import CountryFlag from '@/components/CountryFlag.vue'
import { COUNTRIES, country } from '@/composables/useCountry'

const list = Object.values(COUNTRIES)
</script>

<style scoped>
.cs {
  display: inline-flex;
  flex: none;
  padding: 3px;
  border: 1px solid var(--line, #2a2924);
  border-radius: 999px;
  background: var(--asphalt-2, #141411);
}

.cs__opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted, #a8a397);
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  opacity: 0.6;
  transition: background 0.15s, color 0.15s, opacity 0.15s;
}

.cs__opt:hover {
  opacity: 1;
}

.cs__opt[aria-checked='true'] {
  background: var(--chalk, #ede8dc);
  color: var(--asphalt, #0d0d0b);
  opacity: 1;
}

@media (max-width: 900px) {
  /* phones: flags only, the header is tight */
  .cs__code {
    display: none;
  }

  .cs__opt {
    padding: 0 8px;
  }
}

.cs__opt:focus-visible {
  outline: 2px solid var(--blaze, #ff4f12);
  outline-offset: 2px;
}
</style>
