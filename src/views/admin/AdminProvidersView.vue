<template>
  <!-- Providers directory of the selected country (switcher in the admin header) -->
  <div class="admin">
    <div class="page__head">
      <h1 class="display page__h1">Proveedores</h1>
      <p class="page__lead">
        <span class="ap-where"><CountryFlag :code="country" :size="14" /> {{ COUNTRIES[country].name }}</span>
        Directorio público en <router-link to="/proveedores" class="link-under">/proveedores</router-link>. Cambia de país arriba.
      </p>
    </div>

    <button v-if="!form" type="button" class="btn-blaze ap-new" @click="openForm()">+ Nuevo proveedor</button>

    <!-- Create / edit -->
    <form v-if="form" class="ap-form" @submit.prevent="save">
      <h2 class="display ap-form__title">{{ form.id ? 'Editar proveedor' : 'Nuevo proveedor' }}</h2>
      <div class="ap-grid">
        <div class="p-field">
          <label class="p-label" for="pv-name">Nombre</label>
          <input id="pv-name" v-model="form.name" class="p-input" required maxlength="80" />
        </div>
        <div class="p-field">
          <label class="p-label" for="pv-cat">Rubro</label>
          <select id="pv-cat" v-model="form.category" class="p-input" required>
            <option v-for="(c, key) in PROVIDER_CATEGORIES" :key="key" :value="key">{{ c.label }}</option>
          </select>
        </div>
        <div class="p-field">
          <label class="p-label" for="pv-country">País</label>
          <select id="pv-country" v-model="form.country" class="p-input">
            <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">{{ c.name }}</option>
          </select>
        </div>
        <div class="p-field">
          <label class="p-label" for="pv-city">Ciudad</label>
          <input id="pv-city" v-model="form.city" class="p-input" maxlength="80" :placeholder="form.country === 'CO' ? 'Bogotá' : 'Caracas'" />
        </div>
        <div class="p-field">
          <label class="p-label" for="pv-wa">WhatsApp (con código de país)</label>
          <input id="pv-wa" v-model="form.whatsapp" class="p-input" inputmode="tel" :placeholder="form.country === 'CO' ? '+57 300 1234567' : '+58 414 1234567'" />
        </div>
        <div class="p-field">
          <label class="p-label" for="pv-ig">Instagram</label>
          <input id="pv-ig" v-model="form.instagram" class="p-input" placeholder="@usuario" />
        </div>
        <div class="p-field">
          <label class="p-label" for="pv-web">Web</label>
          <input id="pv-web" v-model="form.website" class="p-input" type="url" placeholder="https://" />
        </div>
        <div class="p-field">
          <label class="p-label" for="pv-logo">Logo</label>
          <div class="ap-logo">
            <img v-if="form.logoUrl" :src="form.logoUrl" alt="" class="ap-logo__img" />
            <input id="pv-logo" type="file" accept="image/*" class="ap-logo__file" :disabled="uploading" @change="upload($event, 'logo')" />
            <button v-if="form.logoUrl" type="button" class="link-under" @click="form.logoUrl = ''">Quitar</button>
          </div>
        </div>
        <div class="p-field">
          <label class="p-label" for="pv-cover">Portada (foto horizontal)</label>
          <div class="ap-logo">
            <img v-if="form.coverUrl" :src="form.coverUrl" alt="" class="ap-logo__img ap-logo__img--cover" />
            <input id="pv-cover" type="file" accept="image/*" class="ap-logo__file" :disabled="uploading" @change="upload($event, 'cover')" />
            <button v-if="form.coverUrl" type="button" class="link-under" @click="form.coverUrl = ''">Quitar</button>
          </div>
        </div>
        <div class="p-field ap-grid__wide">
          <label class="p-label" for="pv-desc">Descripción</label>
          <textarea id="pv-desc" v-model="form.description" class="p-input" rows="3" maxlength="500" placeholder="Qué ofrece, tiempos de entrega, desde cuánto…" />
        </div>
        <label class="ap-check ap-grid__wide">
          <input v-model="form.isActive" type="checkbox" /> Visible en el directorio
        </label>
      </div>
      <div class="ap-form__actions">
        <button type="submit" class="btn-blaze" :disabled="busy || uploading">{{ busy ? 'Guardando…' : 'Guardar' }}</button>
        <button type="button" class="btn-line" @click="form = null">Cancelar</button>
      </div>
    </form>

    <p v-if="loading" class="page__lead">Cargando…</p>
    <p v-else-if="!providers.length" class="page__lead">No hay proveedores en {{ COUNTRIES[country].name }} todavía.</p>
    <div v-else class="table-box">
      <table class="t-table">
        <thead>
          <tr class="mono">
            <th scope="col">Proveedor</th>
            <th scope="col">Rubro</th>
            <th scope="col">Contacto</th>
            <th scope="col">Estado</th>
            <th scope="col"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in providers" :key="p.id" :class="{ 'is-off': !p.isActive }">
            <td>
              <span class="display t-table__name">{{ p.name }}</span>
              <span class="t-table__sub">{{ p.city || 'Sin ciudad' }}</span>
            </td>
            <td class="t-table__org">{{ PROVIDER_CATEGORIES[p.category]?.label || p.category }}</td>
            <td class="mono t-table__dates">
              <span v-if="p.whatsapp">+{{ p.whatsapp }}</span><br v-if="p.whatsapp && p.instagram" />
              <span v-if="p.instagram">@{{ p.instagram }}</span>
            </td>
            <td>
              <button type="button" class="mono t-table__status" :class="p.isActive ? 'is-on' : ''" @click="toggle(p)">
                {{ p.isActive ? 'Visible' : 'Oculto' }}
              </button>
            </td>
            <td class="ap-row-actions">
              <button type="button" class="link-under" @click="openForm(p)">Editar</button>
              <button type="button" class="link-under ap-del" @click="remove(p)">Borrar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { handleApiError } from '@/services/api'
import providersService, { PROVIDER_CATEGORIES } from '@/services/providers'
import { useConfirm } from '@/composables/useConfirm'
import { COUNTRIES, country } from '@/composables/useCountry'
import CountryFlag from '@/components/CountryFlag.vue'

const toast = useToast()
const confirm = useConfirm()
const providers = ref([])
const loading = ref(true)
const busy = ref(false)
const uploading = ref(false)
const form = ref(null)

const FIELDS = ['name', 'category', 'country', 'city', 'whatsapp', 'instagram', 'website', 'logoUrl', 'coverUrl', 'description', 'isActive']

const load = async () => {
  loading.value = true
  try {
    providers.value = (await providersService.listAdmin(country.value)).data || []
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron cargar los proveedores'))
  } finally {
    loading.value = false
  }
}
watch(country, () => {
  form.value = null
  load()
}, { immediate: true })

const openForm = (p = null) => {
  form.value = p
    ? { id: p.id, ...Object.fromEntries(FIELDS.map(f => [f, p[f] ?? ''])), whatsapp: p.whatsapp ? `+${p.whatsapp}` : '' }
    : { name: '', category: 'UNIFORMS', country: country.value, city: '', whatsapp: '', instagram: '', website: '', logoUrl: '', coverUrl: '', description: '', isActive: true }
}

const upload = async (e, kind) => {
  const file = e.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    form.value[kind === 'cover' ? 'coverUrl' : 'logoUrl'] = (await providersService.uploadImage(file, kind)).data.url
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo subir el logo'))
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

const save = async () => {
  busy.value = true
  // Empty optional fields go as null on edit (clears them) and are left out on create
  const body = Object.fromEntries(
    FIELDS.map(f => [f, typeof form.value[f] === 'string' ? form.value[f].trim() : form.value[f]]).map(([k, v]) => [k, v === '' ? (form.value.id ? null : undefined) : v])
  )
  try {
    if (form.value.id) await providersService.update(form.value.id, body)
    else await providersService.create(body)
    toast.success('Proveedor guardado')
    form.value = null
    await load()
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo guardar el proveedor'))
  } finally {
    busy.value = false
  }
}

const toggle = async p => {
  try {
    await providersService.update(p.id, { isActive: !p.isActive })
    p.isActive = !p.isActive
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cambiar el estado'))
  }
}

const remove = async p => {
  const ok = await confirm({ title: 'Borrar proveedor', message: `¿Borrar "${p.name}"? No se puede deshacer. Si solo quieres ocultarlo, usa "Visible".`, confirmText: 'Borrar', danger: true })
  if (!ok) return
  try {
    await providersService.remove(p.id)
    providers.value = providers.value.filter(x => x.id !== p.id)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo borrar'))
  }
}
</script>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.ap-where {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 6px;
  font-weight: 800;
  color: var(--chalk);
}

.ap-new {
  align-self: flex-start;
}

.ap-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--line);
  border-top: 3px solid var(--blaze);
  background: var(--asphalt-2);
}

.ap-form__title {
  font-size: 28px;
}

.ap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 16px;
}

.ap-grid__wide {
  grid-column: 1 / -1;
}

.ap-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
}

.ap-logo__img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
}

.ap-logo__img--cover {
  width: 85px;
}

.ap-logo__file {
  min-width: 0;
  font-size: 13px;
  color: var(--muted);
}

.ap-check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
}

.ap-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.table-box {
  overflow-x: auto;
  border-top: 3px solid var(--chalk);
}

.t-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.t-table th {
  padding: 14px 12px 14px 0;
  border-bottom: 1px solid var(--line);
  font-size: 11px;
  font-weight: 400;
  color: var(--muted);
}

.t-table td {
  padding: 18px 12px 18px 0;
  border-bottom: 1px solid var(--line-soft);
  vertical-align: middle;
}

.t-table tr.is-off {
  opacity: 0.55;
}

.t-table__name {
  display: block;
  font-size: 24px;
  line-height: 1;
}

.t-table__sub {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--muted);
}

.t-table__org {
  font-size: 15px;
  white-space: nowrap;
}

.t-table__dates {
  font-size: 12px;
  line-height: 1.6;
  white-space: nowrap;
}

.t-table__status {
  padding: 6px 10px;
  border: 2px solid var(--muted);
  background: transparent;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.t-table__status.is-on {
  border-color: var(--gold);
  color: var(--gold);
}

.ap-row-actions {
  display: flex;
  gap: 16px;
  white-space: nowrap;
}

.poster .ap-del,
.ap-del {
  color: var(--hot);
}

.ap-row-actions .link-under,
.ap-logo .link-under {
  border: 0;
  background: none;
  color: var(--chalk);
  cursor: pointer;
}

.ap-row-actions .ap-del {
  color: var(--hot);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
