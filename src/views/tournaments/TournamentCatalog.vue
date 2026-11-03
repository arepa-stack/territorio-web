<template>
  <div class="cat">
    <div class="cat__head">
      <div>
        <h1 class="cat__title">Torneos</h1>
        <p class="cat__lead">Torneos de la liga, con sus cupos y canchas.</p>
      </div>
      <router-link v-if="isOrganizer" to="/app/organizer" class="btn-secondary">Gestionar mis torneos</router-link>
    </div>

    <!-- Captain without a team -->
    <div v-if="isCaptain && !loadingTeam && !myTeam" class="cat__notice">
      <p class="m-0">Para inscribirte primero crea tu equipo.</p>
      <router-link to="/app/captain" class="btn-primary">Crear mi equipo</router-link>
    </div>

    <div class="cat__filters">
      <div class="cat__search">
        <label class="field-label" for="tournament-search">Buscar</label>
        <input id="tournament-search" v-model="search" class="input" placeholder="Nombre o cancha" />
      </div>
      <div class="cat__chips" role="group" aria-label="Estado">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          type="button"
          class="filter-chip"
          :aria-pressed="status === f.value"
          @click="status = f.value"
        >{{ f.label }} · {{ countStatus(f.value) }}</button>
      </div>
    </div>

    <p v-if="loading" class="cat__lead">Cargando torneos…</p>
    <p v-else-if="!filtered.length" class="cat__empty">No hay torneos con este filtro.</p>

    <div v-else class="cat__list">
      <article v-for="t in filtered" :key="t.id" class="row">
        <div class="row__main">
          <img v-if="t.coverPhoto" :src="t.coverPhoto" :alt="`Cancha de ${t.name}`" class="row__photo" />
          <span v-else class="row__photo row__photo--empty" aria-hidden="true" />
          <div class="row__name-box">
            <span class="row__tags">
              <span class="row__status" :style="{ color: statusOf(t).color, borderColor: statusOf(t).color }">{{ statusOf(t).label }}</span>
              <span class="row__cat">{{ categoryLabel(t.category) }}</span>
            </span>
            <router-link :to="`/torneo/${t.id}`" class="row__name">{{ t.name }}</router-link>
            <span class="row__place">{{ t.location || 'Cancha por definir' }}</span>
          </div>
          <div class="row__fact">
            <span class="row__label">Fechas</span>
            <span class="row__value">{{ formatDate(t.startDate) }}<br />{{ formatDate(t.endDate) }}</span>
          </div>
          <div class="row__fact">
            <span class="row__label">Inscripción</span>
            <span class="row__value">{{ Number(t.entryFee) > 0 ? `$${t.entryFee}` : 'Gratis' }}</span>
          </div>
          <div class="row__fact row__slots">
            <span class="row__label row__slots-head">
              <span>Cupos</span>
              <span :class="{ 'row__last': t.status === 'REGISTRATION' && t.maxTeams - t.registeredTeams === 1 }">{{ t.registeredTeams }}/{{ t.maxTeams }}</span>
            </span>
            <span class="row__track"><span class="row__fill" :style="{ width: Math.min(100, (t.registeredTeams / t.maxTeams) * 100) + '%' }" /></span>
          </div>
        </div>

        <!-- Actions and the viewer's own status in this tournament -->
        <div class="row__bar">
          <!-- Player: their team plays here, and the waiver -->
          <template v-if="isPlayer && playerRegistrationOf(t)">
            <span class="row__mine">Juegas con {{ playerRegistrationOf(t).teamName }}</span>
            <StatusChip :status="playerRegistrationOf(t).status" />
            <span v-if="playerRegistrationOf(t).waiverAcceptedAt" class="row__ok">Reglamento aceptado</span>
          </template>

          <!-- Captain: registration status of their team -->
          <template v-if="isCaptain && myTeam && registrationOf(t)">
            <span class="row__mine">{{ myTeam.name }}</span>
            <StatusChip :status="registrationOf(t).status" />
          </template>

          <div class="row__actions">
            <TournamentInfoButton :tournament="t" />
            <router-link :to="`/torneo/${t.id}`" class="btn-ghost">Fixture y tabla</router-link>
            <TournamentInfoButton
              v-if="isPlayer && playerRegistrationOf(t) && !playerRegistrationOf(t).waiverAcceptedAt"
              :tournament="t"
              waiver
              @accepted="playerOverview.load(true)"
            />
            <template v-if="isCaptain && myTeam && confirming !== t.id">
              <button
                v-if="registrationOf(t)?.status === 'REJECTED' && t.status === 'REGISTRATION' && t.registeredTeams < t.maxTeams"
                type="button"
                class="btn-secondary"
                @click="confirming = t.id"
              >Volver a inscribir</button>
              <button
                v-else-if="!registrationOf(t) && t.status === 'REGISTRATION' && t.registeredTeams < t.maxTeams"
                type="button"
                class="btn-primary"
                @click="confirming = t.id"
              >Inscribir mi equipo</button>
            </template>
          </div>

          <div v-if="isCaptain && myTeam && confirming === t.id" class="row__confirm">
            <p class="m-0">Inscribir a <strong>{{ myTeam.name }}</strong>. Estado de tu plantel:</p>
            <RosterChip v-if="myTeam.roster" :roster="myTeam.roster" class="self-start" />
            <p v-if="myTeam.roster?.status === 'NOT_VALIDATED'" class="row__note">Puedes inscribirte igual; la inscripción se valida al llegar a 5 jugadores.</p>
            <div class="row__actions">
              <button type="button" class="btn-ghost" @click="confirming = null">Cancelar</button>
              <button type="button" class="btn-primary" :disabled="registering" @click="register(t)">Confirmar</button>
            </div>
          </div>
        </div>
      </article>
    </div>
    <PaymentDialog ref="paymentDialog" />
  </div>
</template>

<script setup>
import { CATEGORIES, POSTER_STATUS, formatDate } from '@/utils/labels'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import teamsService from '@/services/teams'
import { handleApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { usePlayerOverview } from '@/composables/usePlayerOverview'
import StatusChip from '@/components/ui/StatusChip.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import TournamentInfoButton from '@/components/ui/TournamentInfoButton.vue'
import PaymentDialog from '@/components/tournament/PaymentDialog.vue'

const toast = useToast()
const authStore = useAuthStore()
const playerOverview = usePlayerOverview()

const statusFilters = [
  { value: 'REGISTRATION', label: 'Inscripciones' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'FINISHED', label: 'Finalizados' },
  { value: 'ALL', label: 'Todos' }
]

const isCaptain = computed(() => authStore.userRole === 'TEAM_CAPTAIN')
const isOrganizer = computed(() => authStore.userRole === 'ORGANIZER')
const isPlayer = computed(() => authStore.userRole === 'PLAYER')

const tournaments = ref([])
const myTeam = ref(null)
const loading = ref(true)
const loadingTeam = ref(true)
const search = ref('')
const status = ref('REGISTRATION')
const confirming = ref(null)
const registering = ref(false)
const paymentDialog = ref(null)

const categoryLabel = c => CATEGORIES[c] || c
const statusOf = t => POSTER_STATUS[t.status] || { label: t.status, color: '#8C877C' }
const countStatus = s => (s === 'ALL' ? tournaments.value.length : tournaments.value.filter(t => t.status === s).length)
const registrationOf = t => myTeam.value?.registrations?.find(r => r.tournament.id === t.id)

const playerRegistrationOf = t => {
  if (!isPlayer.value) return null
  for (const membership of playerOverview.teams.value) {
    const reg = membership.registrations?.find(
      r => r.tournament?.id === t.id && (r.status === 'APPROVED' || r.status === 'PENDING')
    )
    if (reg) {
      return { ...reg, teamName: membership.team.name }
    }
  }
  return null
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return tournaments.value.filter(
    t =>
      (status.value === 'ALL' || t.status === status.value) &&
      (!q || t.name.toLowerCase().includes(q) || t.location?.toLowerCase().includes(q))
  )
})

const loadTournaments = async () => {
  try {
    const res = await tournamentsService.getAll({ limit: 100 })
    tournaments.value = res.data.tournaments || []
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudieron cargar los torneos'))
  } finally {
    loading.value = false
  }
}

const loadTeam = async () => {
  if (!isCaptain.value) return (loadingTeam.value = false)
  try {
    const res = await teamsService.getMyTeams()
    myTeam.value = res.data[0] || null
  } catch {
    myTeam.value = null
  } finally {
    loadingTeam.value = false
  }
}

const register = async t => {
  registering.value = true
  try {
    const res = await tournamentsService.registerTeam({ tournamentId: t.id, teamId: myTeam.value.id })
    const validated = res.data.roster?.status === 'VALIDATED'
    toast.success(`Inscrito en ${t.name}. Queda pendiente de aprobación${validated ? '' : ' y tu plantel aún no está validado'}.`)
    const warn = res.data.warning || (res.data.warnings?.length ? res.data.warnings.join(' · ') : '')
    if (warn) toast.warning(warn)
    confirming.value = null
    await Promise.all([loadTournaments(), loadTeam()])
    if (Number(t.entryFee) > 0) {
      tournamentsService
        .getById(t.id)
        .then(({ data }) => paymentDialog.value.open({ id: res.data.id, tournament: data, payment: null }))
        .catch(() => toast.info('Paga la inscripción desde tu panel de capitán'))
    }
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo inscribir el equipo'))
  } finally {
    registering.value = false
  }
}

onMounted(() => {
  const tasks = [loadTournaments(), loadTeam()]
  if (isPlayer.value) tasks.push(playerOverview.load())
  Promise.all(tasks)
})
</script>

<style scoped>
/* Poster rows built on theme tokens: "cancha" for player/captain, classic palette for the other roles */
.cat {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.cat__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.cat__title {
  margin: 0;
  font-family: var(--f-display);
  font-size: clamp(48px, 6vw, 88px);
  font-weight: 400;
  line-height: 0.9;
  text-transform: uppercase;
}

.cat__lead {
  margin: 10px 0 0;
  font-size: 16px;
  color: rgb(var(--c-on-surface-variant));
}

.cat__notice,
.cat__empty {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  padding: 20px;
  border: 2px dashed rgb(var(--c-outline-variant));
  color: rgb(var(--c-on-surface-variant));
}

.cat__filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cat__search {
  max-width: 560px;
}

.cat__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat__list {
  border-top: 3px solid rgb(var(--c-on-surface));
}

.row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 0;
  border-bottom: 1px solid rgb(var(--c-outline-variant) / 0.7);
}

.row__main {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr) 130px 110px 180px;
  align-items: center;
  gap: 24px;
}

.row__photo {
  width: 128px;
  height: 84px;
  object-fit: cover;
}

.row__photo--empty {
  display: block;
  background: repeating-linear-gradient(135deg, rgb(var(--c-surface-container-high)) 0 10px, rgb(var(--c-surface-container)) 10px 20px);
}

.row__name-box,
.row__fact {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.row__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.row__status {
  padding: 3px 8px;
  border: 2px solid;
  font-family: var(--f-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.row__cat,
.row__label {
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--c-on-surface-variant));
}

.row__cat {
  color: rgb(var(--c-secondary));
}

.row__name {
  font-family: var(--f-display);
  font-size: 32px;
  line-height: 1;
  text-transform: uppercase;
  color: rgb(var(--c-on-surface));
  text-decoration: none;
  overflow-wrap: anywhere;
}

.row__name:hover {
  color: rgb(var(--c-primary-container));
}

.row__place {
  font-size: 14px;
  color: rgb(var(--c-on-surface-variant));
}

.row__value {
  font-family: var(--f-mono);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
}

.row__slots-head {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
}

.row__last {
  color: rgb(var(--c-error));
}

.row__track {
  display: block;
  height: 6px;
  background: rgb(var(--c-surface-container-highest));
}

.row__fill {
  display: block;
  height: 6px;
  background: rgb(var(--c-primary-container));
}

.row__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin-left: 152px;
}

.row__mine {
  font-size: 14px;
  font-weight: 700;
}

.row__ok {
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--c-tertiary));
}

.row__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.row__confirm {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border: 2px solid rgb(var(--c-primary-container));
  background: rgb(var(--c-surface-container));
}

.row__confirm .row__actions {
  margin-left: 0;
}

.row__note {
  margin: 0;
  font-size: 13px;
  color: rgb(var(--c-on-surface-variant));
}

@media (max-width: 1100px) {
  .row__main {
    grid-template-columns: 112px minmax(0, 1fr) 120px;
  }

  .row__photo {
    width: 112px;
    height: 76px;
  }

  .row__slots {
    grid-column: 2 / -1;
  }

  .row__fact:nth-of-type(3) {
    display: none;
  }

  .row__bar {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .row__main {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
  }

  .row__photo {
    grid-column: 1 / -1;
    width: 100%;
    height: 150px;
  }

  .row__name-box,
  .row__slots {
    grid-column: 1 / -1;
  }

  .row__fact:nth-of-type(3) {
    display: flex;
  }

  .row__actions {
    margin-left: 0;
  }
}
</style>
