<template>
  <!-- Organizer: sanctions of one tournament. Create, lift, resolve appeals and confirm fines -->
  <section class="ts">
    <div class="ts__head">
      <p class="ts__lead">
        <strong>{{ activeCount }}</strong> activa{{ activeCount === 1 ? '' : 's' }}
        <template v-if="appealCount"> · <strong class="ts__warn">{{ appealCount }} apelación{{ appealCount === 1 ? '' : 'es' }} por resolver</strong></template>
      </p>
      <button type="button" class="btn-primary" @click="openForm()"><span class="icon">gavel</span> Nueva sanción</button>
    </div>

    <!-- New sanction -->
    <form v-if="formOpen" class="ts__form" novalidate @submit.prevent="submit">
      <h3 class="ts__form-title">Nueva sanción</h3>
      <div class="ts__grid">
        <div class="ts__full">
          <label class="field-label" for="s-player">Jugador *</label>
          <select id="s-player" v-model="form.playerId" class="input">
            <option value="" disabled>Elige un jugador</option>
            <optgroup v-for="team in playersByTeam" :key="team.name" :label="team.name">
              <option v-for="p in team.players" :key="p.playerId" :value="p.playerId">#{{ p.jerseyNumber }} {{ p.fullName }}</option>
            </optgroup>
          </select>
        </div>
        <div class="ts__full">
          <label class="field-label" for="s-match">Partido (opcional)</label>
          <select id="s-match" v-model="form.matchId" class="input">
            <option value="">Fuera de un partido</option>
            <option v-for="m in playerMatches" :key="m.id" :value="m.id">{{ matchLabel(m) }}</option>
          </select>
        </div>
        <div>
          <label class="field-label" for="s-violation">Falta *</label>
          <select id="s-violation" v-model="form.violationType" class="input">
            <option v-for="(label, value) in VIOLATION_TYPES" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <div>
          <span class="field-label">Gravedad *</span>
          <div class="ts__chips" role="group" aria-label="Gravedad">
            <button v-for="(label, value) in SEVERITIES" :key="value" type="button" class="filter-chip" :aria-pressed="form.severity === value" @click="form.severity = value">{{ label }}</button>
          </div>
        </div>
        <div>
          <label class="field-label" for="s-type">Sanción *</label>
          <select id="s-type" v-model="form.sanctionType" class="input">
            <option v-for="(label, value) in SANCTION_TYPES" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <div v-if="form.sanctionType === 'SUSPENSION'">
          <label class="field-label" for="s-games">Partidos de suspensión *</label>
          <input id="s-games" v-model.number="form.gamesSuspended" class="input" type="number" min="1" max="20" />
        </div>
        <div v-if="form.sanctionType === 'FINE'">
          <label class="field-label" for="s-fine">Multa ($) *</label>
          <input id="s-fine" v-model.number="form.fine" class="input" type="number" min="1" step="1" />
        </div>
        <div class="ts__full">
          <label class="field-label" for="s-desc">Qué pasó *</label>
          <textarea id="s-desc" v-model.trim="form.description" class="input" rows="2" maxlength="500" placeholder="Ej. Insultó al árbitro en el 3.er cuarto después de una falta" />
        </div>
      </div>
      <p v-if="autoSuspends" class="ts__note">Por la gravedad o el tipo de falta, el jugador queda suspendido al menos 1 partido.</p>
      <p v-if="formError" role="alert" class="ts__error">{{ formError }}</p>
      <div class="ts__actions">
        <button type="button" class="btn-ghost" @click="formOpen = false">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Guardando…' : 'Aplicar sanción' }}</button>
      </div>
    </form>

    <!-- Filters -->
    <div class="ts__chips" role="group" aria-label="Filtro">
      <button v-for="f in FILTERS" :key="f.value" type="button" class="filter-chip" :aria-pressed="filter === f.value" @click="filter = f.value">
        {{ f.label }} · {{ countOf(f.value) }}
      </button>
    </div>

    <p v-if="loading" class="ts__muted">Cargando sanciones…</p>
    <p v-else-if="!shown.length" class="ts__empty">{{ sanctions.length ? 'Nada con este filtro.' : 'Este torneo no tiene sanciones. Ojalá siga así.' }}</p>

    <article v-for="s in shown" :key="s.id" class="ts__item" :class="{ 'is-off': !s.isActive, 'is-appealed': s.isAppealed }">
      <div class="ts__who">
        <TeamBadge :name="s.player.team?.name || ''" :logo-url="s.player.team?.logoUrl || ''" :size="36" />
        <div class="ts__who-text">
          <span class="ts__name">#{{ s.player.jerseyNumber }} {{ s.player.fullName }}</span>
          <span class="ts__meta">{{ s.player.team?.name }}{{ s.match ? ` · J${s.match.round} vs ${rivalOf(s)}` : '' }} · {{ formatDate(s.createdAt) }}</span>
        </div>
      </div>

      <div class="ts__tags">
        <span class="ts__tag is-type">{{ SANCTION_TYPES[s.sanctionType] || s.sanctionType }}</span>
        <span class="ts__tag">{{ VIOLATION_TYPES[s.violationType] || s.violationType }} · {{ SEVERITIES[s.severity] }}</span>
        <span v-if="s.gamesSuspended" class="ts__tag is-bad">{{ s.gamesSuspended }} partido{{ s.gamesSuspended > 1 ? 's' : '' }} fuera</span>
        <span v-if="s.fine" class="ts__tag" :class="s.isPaid ? 'is-good' : 'is-gold'">Multa ${{ s.fine }} · {{ s.isPaid ? 'pagada' : 'pendiente' }}</span>
        <span class="ts__tag" :class="s.isActive ? 'is-bad' : 'is-muted'">{{ s.isActive ? 'Activa' : 'Sin efecto' }}</span>
      </div>

      <p class="ts__desc">{{ s.description }}</p>
      <p v-if="s.isAppealed" class="ts__appeal"><strong>Apelación:</strong> “{{ s.appealReason }}”</p>

      <div class="ts__actions">
        <template v-if="s.isAppealed">
          <button type="button" class="btn-ghost" :disabled="busy === s.id" @click="review(s, 'REJECT_APPEAL')">Rechazar apelación</button>
          <button type="button" class="btn-primary" :disabled="busy === s.id" @click="review(s, 'ACCEPT_APPEAL')">Aceptar apelación</button>
        </template>
        <button v-if="s.fine && !s.isPaid" type="button" class="btn-secondary" :disabled="busy === s.id" @click="review(s, 'CONFIRM_PAID')">Confirmar pago</button>
        <button v-if="s.isActive && !s.isAppealed" type="button" class="btn-ghost" :disabled="busy === s.id" @click="review(s, 'LIFT')">Levantar sanción</button>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import sanctionsService from '@/services/sanctions'
import { handleApiError } from '@/services/api'
import { useConfirm } from '@/composables/useConfirm'
import { SANCTION_TYPES, SEVERITIES, VIOLATION_TYPES, formatDate } from '@/utils/labels'
import TeamBadge from '@/components/TeamBadge.vue'

const props = defineProps({
  tournamentId: { type: String, required: true },
  players: { type: Array, default: () => [] }, // GET /tournaments/:id/players rows
  matches: { type: Array, default: () => [] },
  preselectPlayerId: { type: String, default: '' } // "Sancionar" from the players tab
})
const emit = defineEmits(['changed'])

const toast = useToast()
const confirm = useConfirm()
const FILTERS = [
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'APPEALED', label: 'Apeladas' },
  { value: 'UNPAID', label: 'Multas pendientes' },
  { value: 'ALL', label: 'Todas' }
]
// Same rule as the backend: these faults suspend at least one game
const AUTO_SUSPEND = ['FIGHTING', 'PHYSICAL_AGGRESSION', 'DOPING', 'OFFICIAL_ABUSE']

const sanctions = ref([])
const loading = ref(true)
const busy = ref(null)
const filter = ref('ACTIVE')
const formOpen = ref(false)
const saving = ref(false)
const formError = ref('')
const blank = () => ({ playerId: '', matchId: '', violationType: 'UNSPORTSMANLIKE_CONDUCT', severity: 'MINOR', sanctionType: 'WARNING', gamesSuspended: 1, fine: null, description: '' })
const form = reactive(blank())

const matchesFilter = {
  ACTIVE: s => s.isActive,
  APPEALED: s => s.isAppealed,
  UNPAID: s => s.fine && !s.isPaid,
  ALL: () => true
}
const countOf = f => sanctions.value.filter(matchesFilter[f]).length
const shown = computed(() => sanctions.value.filter(matchesFilter[filter.value]))
const activeCount = computed(() => countOf('ACTIVE'))
const appealCount = computed(() => countOf('APPEALED'))
const autoSuspends = computed(() => form.severity === 'SERIOUS' || AUTO_SUSPEND.includes(form.violationType))

const playersByTeam = computed(() => {
  const byTeam = {}
  for (const p of props.players) (byTeam[p.teamName] ||= []).push(p)
  return Object.entries(byTeam)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, players]) => ({ name, players: [...players].sort((a, b) => a.jerseyNumber - b.jerseyNumber) }))
})
// Only the chosen player's games are offered
const playerMatches = computed(() => {
  const teamId = props.players.find(p => p.playerId === form.playerId)?.teamId
  return props.matches.filter(m => !teamId || m.homeTeam?.id === teamId || m.awayTeam?.id === teamId || m.homeTeamId === teamId || m.awayTeamId === teamId)
})
const matchLabel = m => `J${m.round} · ${m.homeTeam?.name} vs ${m.awayTeam?.name} · ${formatDate(m.matchDate)}`
const rivalOf = s => (s.match.homeTeam?.name === s.player.team?.name ? s.match.awayTeam?.name : s.match.homeTeam?.name)

const load = async () => {
  try {
    sanctions.value = (await sanctionsService.listByTournament(props.tournamentId)).data || []
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron cargar las sanciones'))
  } finally {
    loading.value = false
  }
}

const openForm = (playerId = '') => {
  Object.assign(form, blank(), { playerId })
  formError.value = ''
  formOpen.value = true
}
watch(() => props.preselectPlayerId, id => id && openForm(id), { immediate: true })

const validate = () => {
  if (!form.playerId) return 'Elige el jugador.'
  if (!form.description) return 'Cuenta qué pasó.'
  if (form.sanctionType === 'SUSPENSION' && !(form.gamesSuspended >= 1)) return 'Indica cuántos partidos de suspensión.'
  if (form.sanctionType === 'FINE' && !(form.fine > 0)) return 'Indica el monto de la multa.'
  return ''
}

const submit = async () => {
  formError.value = validate()
  if (formError.value) return
  saving.value = true
  try {
    await sanctionsService.create({
      tournamentId: props.tournamentId,
      playerId: form.playerId,
      ...(form.matchId && { matchId: form.matchId }),
      violationType: form.violationType,
      severity: form.severity,
      sanctionType: form.sanctionType,
      description: form.description,
      ...(form.sanctionType === 'SUSPENSION' && { gamesSuspended: form.gamesSuspended }),
      ...(form.sanctionType === 'FINE' && { fine: form.fine })
    })
    toast.success('Sanción aplicada; se avisó al jugador y a su capitán')
    formOpen.value = false
    filter.value = 'ACTIVE'
    await load()
    emit('changed')
  } catch (error) {
    formError.value = handleApiError(error, 'No se pudo aplicar la sanción')
  } finally {
    saving.value = false
  }
}

const REVIEW_TEXT = {
  LIFT: ['Levantar sanción', 'La sanción queda sin efecto y el jugador vuelve a estar habilitado.'],
  ACCEPT_APPEAL: ['Aceptar apelación', 'La sanción queda sin efecto.'],
  REJECT_APPEAL: ['Rechazar apelación', 'La sanción sigue vigente.'],
  CONFIRM_PAID: ['Confirmar pago', 'La multa queda registrada como pagada.']
}
const review = async (s, action) => {
  const [title, message] = REVIEW_TEXT[action]
  if (!(await confirm({ title, message: `${s.player.fullName}: ${message} Se le avisa al jugador y a su capitán.`, confirmText: title }))) return
  busy.value = s.id
  try {
    await sanctionsService.review(s.id, action)
    toast.success(`${title}: listo`)
    await load()
    emit('changed')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo actualizar la sanción'))
  } finally {
    busy.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.ts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ts__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ts__lead {
  margin: 0;
  font-size: 15px;
  color: rgb(var(--c-on-surface-variant));
}

.ts__warn {
  color: rgb(var(--c-secondary));
}

.ts__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid rgb(var(--c-outline-variant) / 0.6);
  border-top: 6px solid rgb(var(--c-error));
  background: rgb(var(--c-surface-container));
}

.ts__form-title {
  margin: 0;
  font-family: var(--f-display);
  font-size: 28px;
  font-weight: 400;
  text-transform: uppercase;
}

.ts__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.ts__full {
  grid-column: 1 / -1;
}

.ts__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ts__note,
.ts__muted {
  margin: 0;
  font-size: 13px;
  color: rgb(var(--c-on-surface-variant));
}

.ts__note {
  color: rgb(var(--c-secondary));
}

.ts__error {
  margin: 0;
  font-size: 14px;
  color: rgb(var(--c-error));
}

.ts__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.ts__empty {
  margin: 0;
  padding: 28px;
  border: 2px dashed rgb(var(--c-outline-variant));
  text-align: center;
  color: rgb(var(--c-on-surface-variant));
}

.ts__item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid rgb(var(--c-outline-variant) / 0.6);
  border-left: 5px solid rgb(var(--c-error));
  background: rgb(var(--c-surface-container));
}

.ts__item.is-appealed {
  border-left-color: rgb(var(--c-secondary));
}

.ts__item.is-off {
  border-left-color: rgb(var(--c-outline-variant));
  opacity: 0.75;
}

.ts__who {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ts__who-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.ts__name {
  font-size: 16px;
  font-weight: 800;
}

.ts__meta {
  font-size: 13px;
  color: rgb(var(--c-on-surface-variant));
}

.ts__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ts__tag {
  padding: 3px 8px;
  border: 1px solid rgb(var(--c-outline-variant));
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--c-on-surface-variant));
}

.ts__tag.is-type {
  border-color: rgb(var(--c-on-surface));
  color: rgb(var(--c-on-surface));
}

.ts__tag.is-bad {
  border-color: rgb(var(--c-error));
  color: rgb(var(--c-error));
}

.ts__tag.is-gold {
  border-color: rgb(var(--c-secondary));
  color: rgb(var(--c-secondary));
}

.ts__tag.is-good {
  border-color: rgb(var(--c-tertiary));
  color: rgb(var(--c-tertiary));
}

.ts__desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.ts__appeal {
  margin: 0;
  padding: 10px 12px;
  border-left: 3px solid rgb(var(--c-secondary));
  background: rgb(var(--c-secondary) / 0.08);
  font-size: 14px;
}

@media (max-width: 640px) {
  .ts__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .ts__actions {
    justify-content: stretch;
  }

  .ts__actions > * {
    flex: 1;
  }
}
</style>
