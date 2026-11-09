<template>
  <div class="poster">
    <PosterHeader />
    <main class="wrap page">
      <div class="page__head">
        <div class="page__title">
          <router-link to="/" class="mono page__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
            Volver al inicio
          </router-link>
          <h1 class="display page__h1">Proveedores</h1>
        </div>
        <p class="page__lead">
          <span class="pv-where"><CountryFlag :code="country" :size="14" /> {{ COUNTRIES[country].name }}</span>
          Uniformes, árbitros, fotógrafos, canchas y todo lo que tu liga necesita. Escríbeles directo.
        </p>
      </div>

      <div class="p-chips" role="group" aria-label="Rubro">
        <button type="button" class="p-chip" :aria-pressed="!category" @click="category = ''">Todos · {{ providers.length }}</button>
        <button
          v-for="(c, key) in usedCategories"
          :key="key"
          type="button"
          class="p-chip"
          :aria-pressed="category === key"
          @click="category = key"
        >{{ c.label }} · {{ countOf(key) }}</button>
      </div>

      <p v-if="loading" class="page__lead">Cargando proveedores…</p>
      <div v-else-if="!filtered.length" class="pv-empty">
        <span class="icon pv-empty__icon">storefront</span>
        <p>Todavía no hay proveedores en {{ COUNTRIES[country].name }}{{ category ? ` en ${PROVIDER_CATEGORIES[category].label.toLowerCase()}` : '' }}.</p>
        <p class="pv-muted">Estamos sumando aliados. Vuelve pronto.</p>
      </div>

      <ul v-else class="pv-grid">
        <li v-for="p in filtered" :key="p.id" class="pv-card">
          <div class="pv-card__top">
            <img v-if="p.logoUrl" :src="p.logoUrl" :alt="`Logo de ${p.name}`" class="pv-card__logo" loading="lazy" />
            <span v-else class="display pv-card__logo pv-card__logo--txt" aria-hidden="true">{{ initials(p.name) }}</span>
            <div class="pv-card__id">
              <span class="mono pv-card__cat">
                <span class="icon pv-card__cat-icon">{{ PROVIDER_CATEGORIES[p.category]?.icon }}</span>
                {{ PROVIDER_CATEGORIES[p.category]?.label || p.category }}
              </span>
              <h2 class="display pv-card__name">{{ p.name }}</h2>
              <span v-if="p.city" class="pv-muted">{{ p.city }}</span>
            </div>
          </div>
          <p v-if="p.description" class="pv-card__desc">{{ p.description }}</p>
          <div class="pv-card__actions">
            <a
              v-if="p.whatsapp"
              :href="`https://wa.me/${p.whatsapp}?text=${encodeURIComponent('Hola, te encontré en Turf')}`"
              target="_blank"
              rel="noopener"
              class="btn-blaze pv-card__wa"
            >WhatsApp</a>
            <a v-if="p.instagram" :href="`https://instagram.com/${p.instagram}`" target="_blank" rel="noopener" class="link-under">@{{ p.instagram }}</a>
            <a v-if="p.website" :href="p.website" target="_blank" rel="noopener" class="link-under">Web</a>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import '@/styles/poster.css'
import PosterHeader from '@/components/PosterHeader.vue'
import CountryFlag from '@/components/CountryFlag.vue'
import providersService, { PROVIDER_CATEGORIES } from '@/services/providers'
import { COUNTRIES, country } from '@/composables/useCountry'

const providers = ref([])
const loading = ref(true)
const category = ref('')

const countOf = key => providers.value.filter(p => p.category === key).length
// Only chips with someone in them
const usedCategories = computed(() => Object.fromEntries(Object.entries(PROVIDER_CATEGORIES).filter(([key]) => countOf(key))))
const filtered = computed(() => providers.value.filter(p => !category.value || p.category === category.value))
const initials = name => name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()

const load = async () => {
  loading.value = true
  category.value = ''
  try {
    providers.value = (await providersService.list(country.value)).data || []
  } catch {
    providers.value = []
  } finally {
    loading.value = false
  }
}
watch(country, load, { immediate: true })
</script>

<style scoped>
.pv-where {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 6px;
  font-weight: 800;
  color: var(--chalk);
}

.pv-muted {
  font-size: 14px;
  color: var(--muted);
}

.pv-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 40px 0;
}

.pv-empty__icon {
  font-size: 40px;
  color: var(--blaze);
}

.pv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pv-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--line);
  border-top: 3px solid var(--chalk);
  background: var(--asphalt-2);
}

.pv-card__top {
  display: flex;
  gap: 16px;
  align-items: center;
}

.pv-card__logo {
  width: 64px;
  height: 64px;
  flex: none;
  object-fit: cover;
  border-radius: 4px;
  background: var(--asphalt);
}

.pv-card__logo--txt {
  display: grid;
  place-items: center;
  font-size: 26px;
  color: var(--blaze);
  border: 2px solid var(--line);
}

.pv-card__id {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.pv-card__cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--gold);
}

.pv-card__cat-icon {
  font-size: 16px;
}

.pv-card__name {
  font-size: 26px;
  overflow-wrap: anywhere;
}

.pv-card__desc {
  font-size: 15px;
  line-height: 1.5;
  color: var(--chalk-dim);
}

.pv-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  margin-top: auto;
}

.pv-card__wa {
  min-height: 40px;
  padding: 10px 18px;
  font-size: 13px;
}
</style>
