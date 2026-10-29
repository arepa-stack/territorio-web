<template>
  <div class="flex flex-col gap-space-xl">
    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando tu equipo…</p>

    <!-- No team yet: a captain manages exactly one team -->
    <section v-else-if="!team" class="card mx-auto flex w-full max-w-xl flex-col gap-space-md p-space-lg">
      <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase">Crea tu equipo</h1>
      <p class="m-0 text-body-md text-on-surface-variant">Como capitán gestionas un equipo. Después le cargas el plantel y lo inscribes en torneos.</p>
      <form class="flex flex-col gap-space-md" @submit.prevent="createTeam">
        <div>
          <label class="field-label" for="team-name">Nombre del equipo *</label>
          <input id="team-name" v-model.trim="newTeam.name" class="input" required placeholder="Toros del Este" />
        </div>
        <div class="grid gap-space-md sm:grid-cols-2">
          <div>
            <label class="field-label" for="team-category">Categoría</label>
            <select id="team-category" v-model="newTeam.category" class="input">
              <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="team-city">Ciudad</label>
            <input id="team-city" v-model.trim="newTeam.city" class="input" placeholder="Caracas" />
          </div>
        </div>
        <button type="submit" class="btn-primary" :disabled="saving || !newTeam.name">Crear equipo</button>
      </form>
    </section>

    <template v-else>
      <!-- Team hero -->
      <section class="card relative overflow-hidden p-space-lg">
        <div class="flex items-start gap-space-md">
          <img v-if="team.logoUrl" :src="team.logoUrl" :alt="`Logo de ${team.name}`" class="h-16 w-16 shrink-0 rounded-lg object-cover" />
          <div v-else class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary-container font-headline-lg text-headline-lg text-white">
            {{ team.name.charAt(0) }}
          </div>
          <div class="min-w-0 flex-1">
            <span class="label-tactical text-secondary">{{ categoryLabel(team.category) }}{{ team.city ? ' · ' + team.city : '' }}</span>
            <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase leading-none md:font-headline-lg md:text-headline-lg">{{ team.name }}</h1>
            <p class="m-0 mt-1 text-body-sm text-on-surface-variant">Capitán: <strong class="text-on-surface">{{ team.captain.fullName }}</strong></p>
          </div>
          <button type="button" class="btn-secondary shrink-0" @click="openEdit">
            <span class="icon">edit</span> Editar equipo
          </button>
        </div>
        <div class="mt-space-lg flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
          <RosterChip v-if="team.roster" :roster="team.roster" class="self-start" />
          <p class="m-0 flex items-center gap-space-xs text-body-sm text-on-surface-variant">
            <span class="icon text-[18px] text-secondary">info</span>
            Con 5 jugadores activos tu inscripción queda validada y puede entrar al fixture.
          </p>
        </div>
      </section>

      <dialog ref="editDialog" class="card w-full max-w-md p-space-lg backdrop:bg-black/60">
        <form class="flex flex-col gap-space-md" @submit.prevent="saveTeam">
          <h2 class="m-0 font-title-sm text-title-sm uppercase">Editar equipo</h2>
          <div>
            <label class="field-label" for="edit-name">Nombre *</label>
            <input id="edit-name" v-model.trim="editTeam.name" class="input" required />
          </div>
          <div class="grid gap-space-md sm:grid-cols-2">
            <div>
              <label class="field-label" for="edit-category">Categoría</label>
              <select id="edit-category" v-model="editTeam.category" class="input">
                <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="edit-city">Ciudad</label>
              <input id="edit-city" v-model.trim="editTeam.city" class="input" />
            </div>
          </div>
          <div>
            <label class="field-label" for="edit-logo">Logo</label>
            <input id="edit-logo" type="file" accept="image/*" class="input" @change="e => (logoFile = e.target.files[0] || null)" />
          </div>
          <div class="flex justify-end gap-space-sm">
            <button type="button" class="btn-ghost" @click="editDialog.close()">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving || !editTeam.name">Guardar</button>
          </div>
        </form>
      </dialog>

      <div class="grid gap-space-sm sm:grid-cols-2">
        <router-link to="/app/tournaments" class="btn-primary">
          <span class="icon icon-fill">emoji_events</span> Inscribir equipo en un torneo
        </router-link>
        <router-link :to="`/app/teams/${team.id}/history`" class="btn-secondary">
          <span class="icon">history</span> Historial y récords
        </router-link>
      </div>

      <!-- Registrations -->
      <section>
        <SectionHeader title="Mis inscripciones" icon="how_to_reg" />
        <p v-if="!team.registrations?.length" class="m-0 text-body-md text-on-surface-variant">Tu equipo todavía no está inscrito en ningún torneo.</p>
        <div v-else class="grid gap-space-sm md:grid-cols-2">
          <article v-for="r in team.registrations" :key="r.id" class="card flex flex-col gap-space-xs p-space-md">
            <router-link :to="`/torneo/${r.tournament.id}`" class="text-on-surface no-underline hover:text-primary">
              <h3 class="m-0 font-title-sm text-title-sm">{{ r.tournament.name }}</h3>
            </router-link>
            <div class="flex flex-wrap gap-space-xs">
              <StatusChip :status="r.status" />
              <RosterChip v-if="team.roster" :roster="team.roster" />
              <StatusChip :status="r.tournament.status" />
            </div>
            <!-- Registration payment: only for tournaments with a fee -->
            <div v-if="r.tournament.entryFee > 0" class="mt-space-xs flex flex-wrap items-center justify-between gap-space-xs border-0 border-t border-solid border-outline-variant/40 pt-space-sm">
              <div class="flex flex-col gap-1">
                <StatusChip
                  :status="r.payment?.status || 'UNPAID'"
                  :label="r.payment ? PAYMENT_STATUS[r.payment.status] : `Pago pendiente · $${r.tournament.entryFee}`"
                />
                <span v-if="r.payment?.status === 'PENDING_REVIEW' && !r.payment.hasReceipt" class="text-body-sm text-on-surface-variant">Falta subir el comprobante</span>
                <span v-if="r.payment?.status === 'REJECTED' && r.payment.reviewNote" class="text-body-sm text-error">{{ r.payment.reviewNote }}</span>
              </div>
              <button
                v-if="r.payment?.status !== 'VERIFIED' && r.status !== 'REJECTED' && !['FINISHED', 'CANCELLED'].includes(r.tournament.status)"
                type="button"
                class="btn-primary"
                @click="paymentDialog.open(r)"
              >
                <span class="icon">payments</span>
                {{ !r.payment ? 'Pagar inscripción' : r.payment.status === 'REJECTED' ? 'Reenviar pago' : 'Ver / subir comprobante' }}
              </button>
            </div>
          </article>
        </div>
        <PaymentDialog ref="paymentDialog" @changed="load" />
      </section>

      <!-- Invite links -->
      <section>
        <SectionHeader title="Invitar por link" icon="link" />
        <p class="m-0 mb-space-sm text-body-sm text-on-surface-variant">
          Comparte un link para que los jugadores se unan solos eligiendo dorsal y posición. Se aplican las mismas reglas del fichaje por cédula.
        </p>
        <form class="card mb-space-sm flex flex-col gap-space-sm p-space-md sm:flex-row sm:items-end" @submit.prevent="createInvite">
          <div>
            <label class="field-label" for="inv-days">Vence en</label>
            <select id="inv-days" v-model.number="newInvite.expiresInDays" class="input">
              <option v-for="d in [1, 3, 7, 14, 30]" :key="d" :value="d">{{ d }} día{{ d > 1 ? 's' : '' }}</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="inv-uses">Máx. usos (opcional)</label>
            <input id="inv-uses" v-model.number="newInvite.maxUses" class="input font-mono" type="number" min="1" max="50" placeholder="Sin límite" />
          </div>
          <button type="submit" class="btn-secondary" :disabled="saving">
            <span class="icon">add_link</span> Generar link
          </button>
        </form>
        <p v-if="!invites.length" class="m-0 text-body-md text-on-surface-variant">No tienes links activos.</p>
        <div class="flex flex-col gap-space-xs">
          <article v-for="i in invites" :key="i.id" class="card flex flex-col gap-space-sm p-space-md sm:flex-row sm:items-center">
            <div class="min-w-0 flex-1">
              <p class="m-0 truncate font-stat-mono text-body-sm">{{ inviteUrl(i.token) }}</p>
              <span class="text-body-sm text-on-surface-variant">
                {{ i.uses }}{{ i.maxUses ? ` / ${i.maxUses}` : '' }} uso(s) · vence {{ formatDate(i.expiresAt) }}
              </span>
            </div>
            <div class="flex gap-space-xs">
              <button type="button" class="btn-ghost" aria-label="Copiar link" @click="copyInvite(i)"><span class="icon">content_copy</span></button>
              <a class="btn-ghost" :href="whatsappUrl(i)" target="_blank" rel="noopener" aria-label="Compartir por WhatsApp"><span class="icon">share</span> WhatsApp</a>
              <button type="button" class="btn-ghost text-error" aria-label="Revocar link" @click="revokeInvite(i)"><span class="icon">link_off</span></button>
            </div>
          </article>
        </div>
      </section>

      <!-- Upcoming matches -->
      <section>
        <SectionHeader title="Próximos partidos" icon="event" />
        <p v-if="!upcoming.length" class="m-0 text-body-md text-on-surface-variant">No hay partidos programados por ahora.</p>
        <div v-else class="flex flex-col gap-space-xs">
          <div v-for="m in upcoming" :key="m.id" class="flex flex-col gap-1">
            <MatchCard :match="m" :mine="team.id" />
            <details
              v-if="attendanceByMatch[m.id]"
              class="card bg-surface-container-low px-space-md py-space-xs"
            >
              <summary class="flex cursor-pointer list-none items-center justify-between gap-space-sm text-body-sm text-on-surface-variant [&::-webkit-details-marker]:hidden">
                <span class="font-stat-mono text-[12px] text-on-surface">
                  {{ attendanceByMatch[m.id].summary.going }} van ·
                  {{ attendanceByMatch[m.id].summary.notGoing }} no ·
                  <template v-if="attendanceByMatch[m.id].summary.maybe > 0">
                    {{ attendanceByMatch[m.id].summary.maybe }} quizá ·
                  </template>
                  {{ attendanceByMatch[m.id].summary.noResponse }} sin responder
                </span>
                <span class="label-tactical flex items-center gap-0.5 text-primary">
                  <span class="icon text-[16px]">group</span> Ver lista
                </span>
              </summary>
              <div class="mt-space-xs grid gap-1 border-t border-outline-variant/30 pt-space-xs sm:grid-cols-2">
                <div
                  v-for="pl in attendanceByMatch[m.id].players"
                  :key="pl.playerId"
                  class="flex items-center justify-between gap-space-xs rounded bg-surface-container px-space-sm py-1 text-body-sm"
                >
                  <span class="truncate">
                    <strong v-if="pl.jerseyNumber != null" class="font-stat-mono">#{{ pl.jerseyNumber }}</strong>
                    {{ pl.fullName }}
                  </span>
                  <span
                    class="label-tactical text-[11px]"
                    :class="attendanceBadgeClass(pl.status)"
                  >{{ attendanceStatusLabel(pl.status) }}</span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      <!-- Technical staff -->
      <section>
        <SectionHeader title="Cuerpo técnico" icon="co_present">
          <span class="font-stat-mono text-stat-mono text-on-surface-variant">{{ staff.length }} asignado(s)</span>
        </SectionHeader>
        <div class="flex flex-col gap-space-xs">
          <article v-for="s in staff" :key="s.id" class="card flex items-center justify-between gap-space-sm p-space-md">
            <div class="min-w-0">
              <span class="label-tactical text-secondary">{{ staffRoleLabel(s.role) }}</span>
              <p class="m-0 truncate font-title-sm text-title-sm">{{ s.fullName }}</p>
            </div>
            <button type="button" class="btn-ghost" :aria-label="`Quitar a ${s.fullName}`" @click="removeStaff(s)">
              <span class="icon">close</span>
            </button>
          </article>
          <form class="card flex flex-col gap-space-sm p-space-md sm:flex-row sm:items-end" @submit.prevent="addStaff">
            <div class="flex-1">
              <label class="field-label" for="staff-name">Nombre</label>
              <input id="staff-name" v-model.trim="newStaff.fullName" class="input" placeholder="Roberto Sánchez" />
            </div>
            <div>
              <label class="field-label" for="staff-role">Rol</label>
              <select id="staff-role" v-model="newStaff.role" class="input">
                <option v-for="r in staffRoles" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
            </div>
            <button type="submit" class="btn-secondary" :disabled="!newStaff.fullName || saving">
              <span class="icon">person_add</span> Agregar
            </button>
          </form>
        </div>
      </section>

      <!-- Roster -->
      <section>
        <SectionHeader title="Nómina del plantel" icon="groups">
          <div class="flex items-center gap-space-sm">
            <span class="font-stat-mono text-stat-mono text-on-surface-variant">{{ players.length }} / {{ maxPlayers }} jugadores</span>
            <button
              v-if="rosterLocked || players.length >= maxPlayers"
              type="button"
              class="btn-secondary cursor-not-allowed opacity-50"
              disabled
            >
              <span class="icon">badge</span> Fichar por cédula
            </button>
            <router-link
              v-else
              :to="{ path: '/app/captain/register-player', query: { teamId: team.id } }"
              class="btn-secondary"
            >
              <span class="icon">badge</span> Fichar por cédula
            </router-link>
          </div>
        </SectionHeader>
        <p
          v-if="rosterLocked"
          role="alert"
          class="m-0 mb-space-sm flex items-center gap-space-xs rounded border border-solid border-error/50 bg-error/10 p-space-sm text-body-sm text-error"
        >
          <span class="icon text-[18px]">lock</span>
          Plantel cerrado: tu equipo está compitiendo en un torneo en curso{{ team.roster?.lockedByTournament ? ` (${team.roster.lockedByTournament})` : '' }}. No puedes fichar ni quitar jugadores.
        </p>
        <p class="m-0 mb-space-sm flex items-center gap-space-xs text-body-sm text-on-surface-variant">
          <span class="icon text-[18px] text-secondary">notifications</span>
          Un jugador puede estar en varios equipos y torneos, pero con un solo equipo por torneo.
        </p>
        <p v-if="!players.length" class="m-0 text-body-md text-on-surface-variant">Todavía no hay jugadores. Ficha el primero por cédula.</p>
        <div class="flex flex-col gap-space-xs">
          <article
            v-for="p in players"
            :key="p.id"
            class="card flex items-center gap-space-md p-space-md"
            :class="{ 'border-l-4 border-l-primary-container': p.isCaptain }"
          >
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded font-scoreboard-num text-[26px] tabular"
              :class="p.isCaptain ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface'"
            >{{ p.jerseyNumber }}</span>
            <div class="min-w-0 flex-1">
              <p class="m-0 flex items-center gap-space-xs truncate font-title-sm text-title-sm">
                {{ p.fullName }}
                <span v-if="p.isCaptain" class="label-tactical rounded bg-secondary-container/30 px-1 text-secondary">Cap</span>
              </p>
              <span class="label-tactical text-primary">{{ positionLabel(p.position) }}</span>
            </div>
            <button type="button" class="btn-ghost" :aria-label="`Editar a ${p.fullName}`" @click="startEditPlayer(p)">
              <span class="icon">edit</span>
            </button>
            <button
              type="button"
              class="btn-ghost"
              :class="{ 'cursor-not-allowed opacity-40': rosterLocked }"
              :disabled="rosterLocked"
              :aria-label="`Quitar a ${p.fullName}`"
              @click="removePlayer(p)"
            >
              <span class="icon">person_remove</span>
            </button>
          </article>
          <form v-if="editingPlayer" class="card flex flex-col gap-space-sm border-l-4 border-l-secondary p-space-md sm:flex-row sm:items-end" @submit.prevent="savePlayer">
            <p class="m-0 flex-1 font-title-sm text-title-sm">Editando a {{ editingPlayer.fullName }}</p>
            <div>
              <label class="field-label" for="pl-jersey">Dorsal</label>
              <input id="pl-jersey" v-model.number="playerForm.jerseyNumber" class="input" type="number" min="0" max="99" required />
            </div>
            <div>
              <label class="field-label" for="pl-pos">Posición</label>
              <select id="pl-pos" v-model="playerForm.position" class="input">
                <option v-for="o in positionOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
            <button type="submit" class="btn-primary" :disabled="saving">Guardar</button>
            <button type="button" class="btn-ghost" @click="editingPlayer = null">Cancelar</button>
          </form>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import teamsService from '@/services/teams'
import matchesService from '@/services/matches'
import invitesService, { inviteUrl } from '@/services/invites'
import { CATEGORIES, PAYMENT_STATUS, POSITIONS, formatDate, toOptions } from '@/utils/labels'
import { useConfirm } from '@/composables/useConfirm'
import PaymentDialog from '@/components/tournament/PaymentDialog.vue'
import MatchCard from '@/components/tournament/MatchCard.vue'
import { handleApiError } from '@/services/api'
import StatusChip from '@/components/ui/StatusChip.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'

const toast = useToast()
const confirm = useConfirm()

const categories = toOptions(CATEGORIES)
const positionOptions = toOptions(POSITIONS)
const staffRoles = [
  { value: 'COACH', label: 'Entrenador' },
  { value: 'ASSISTANT_COACH', label: 'Asistente' },
  { value: 'PHYSIOTHERAPIST', label: 'Fisioterapeuta' },
  { value: 'MANAGER', label: 'Delegado' },
  { value: 'OTHER', label: 'Otro' }
]

const categoryLabel = v => categories.find(c => c.value === v)?.label || v
const staffRoleLabel = v => staffRoles.find(r => r.value === v)?.label || v
const positionLabel = v => POSITIONS[v] || v

const ATTENDANCE_LABELS = {
  GOING: 'Confirmado',
  NOT_GOING: 'No va',
  MAYBE: 'Quizá',
  NO_RESPONSE: 'Sin respuesta'
}
const attendanceStatusLabel = s => ATTENDANCE_LABELS[s] || s
const attendanceBadgeClass = s => {
  if (s === 'GOING') return 'text-tertiary'
  if (s === 'NOT_GOING') return 'text-error'
  if (s === 'MAYBE') return 'text-secondary'
  return 'text-on-surface-variant'
}

const loading = ref(true)
const saving = ref(false)
const team = ref(null)
const players = ref([])
const staff = ref([])
const upcoming = ref([])
const attendanceByMatch = ref({})
const editDialog = ref(null)
const editTeam = ref({ name: '', category: 'OPEN', city: '' })
let logoFile = null
const editingPlayer = ref(null)
const playerForm = ref({ jerseyNumber: 0, position: 'BASE' })
const newTeam = ref({ name: '', category: 'OPEN', city: '' })
const newStaff = ref({ fullName: '', role: 'COACH' })
const paymentDialog = ref(null)
const invites = ref([])
const newInvite = ref({ expiresInDays: 7, maxUses: null })

const rosterLocked = computed(() =>
  Boolean(
    team.value?.roster?.isLocked ||
      team.value?.registrations?.some(r => r.status === 'APPROVED' && r.tournament?.status === 'IN_PROGRESS')
  )
)

const maxPlayers = computed(() => {
  if (team.value?.roster?.maxPlayers) return team.value.roster.maxPlayers
  const activeLimits = (team.value?.registrations || [])
    .filter(r => ['APPROVED', 'PENDING'].includes(r.status) && ['REGISTRATION', 'IN_PROGRESS'].includes(r.tournament?.status))
    .map(r => r.tournament?.playersPerTeam)
    .filter(n => typeof n === 'number' && n > 0)
  return activeLimits.length ? Math.min(...activeLimits) : 15
})

const load = async () => {
  try {
    const { data } = await teamsService.getMyTeams()
    team.value = data[0] || null
    if (team.value) {
      const [p, s] = await Promise.all([teamsService.getPlayers(team.value.id), teamsService.getStaff(team.value.id)])
      // Captain first, then by jersey number
      // The captain is whoever's user is the team captain (the isCaptain flag may be unset)
      players.value = p.data
        .map(pl => ({ ...pl, isCaptain: pl.isCaptain || (pl.userId && pl.userId === team.value.captain.id) }))
        .sort((a, b) => (b.isCaptain - a.isCaptain) || a.jerseyNumber - b.jerseyNumber)
      staff.value = s.data
      invitesService.list(team.value.id).then(({ data }) => (invites.value = data)).catch(() => (invites.value = []))
      try {
        const { data } = await matchesService.getTeamUpcoming(team.value.id)
        upcoming.value = Array.isArray(data) ? data : data.matches || []
        const entries = await Promise.all(
          upcoming.value.map(async m => {
            try {
              const res = await matchesService.getAttendance(m.id, team.value.id)
              return [m.id, res.data]
            } catch {
              return [m.id, null]
            }
          })
        )
        attendanceByMatch.value = Object.fromEntries(entries.filter(([, v]) => v))
      } catch {
        upcoming.value = []
        attendanceByMatch.value = {}
      }
    }
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cargar tu equipo'))
  } finally {
    loading.value = false
  }
}

const run = async (action, okMessage) => {
  saving.value = true
  try {
    await action()
    toast.success(okMessage)
    await load()
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo completar la acción'))
  } finally {
    saving.value = false
  }
}

const createTeam = () => {
  const { name, category, city } = newTeam.value
  return run(() => teamsService.create({ name, category, ...(city && { city }) }), 'Equipo creado')
}

const addStaff = async () => {
  await run(() => teamsService.addStaff(team.value.id, newStaff.value), 'Cuerpo técnico actualizado')
  newStaff.value = { fullName: '', role: 'COACH' }
}

const openEdit = () => {
  const { name, category, city } = team.value
  editTeam.value = { name, category, city: city || '' }
  logoFile = null
  editDialog.value.showModal()
}

const saveTeam = async () => {
  const { name, category, city } = editTeam.value
  await run(async () => {
    await teamsService.update(team.value.id, { name, category, ...(city && { city }) })
    if (logoFile) {
      const fd = new FormData()
      fd.append('logo', logoFile)
      await teamsService.updateLogo(team.value.id, fd)
    }
  }, 'Equipo actualizado')
  editDialog.value?.close()
}

const startEditPlayer = p => {
  editingPlayer.value = p
  playerForm.value = { jerseyNumber: p.jerseyNumber, position: p.position }
}

const savePlayer = async () => {
  const p = editingPlayer.value
  await run(() => teamsService.updatePlayer(team.value.id, p.id, playerForm.value), `${p.fullName} actualizado`)
  editingPlayer.value = null
}

const removeStaff = async s => {
  if (!(await confirm({ title: 'Quitar del cuerpo técnico', message: `¿Quitar a ${s.fullName} del cuerpo técnico?`, confirmText: 'Quitar', danger: true }))) return
  run(() => teamsService.removeStaff(team.value.id, s.id), `${s.fullName} quitado`)
}
const removePlayer = async p => {
  if (!(await confirm({ title: 'Quitar del plantel', message: `¿Quitar a ${p.fullName} del plantel?`, confirmText: 'Quitar', danger: true }))) return
  run(() => teamsService.removePlayer(team.value.id, p.id), `${p.fullName} quitado del plantel`)
}

const createInvite = async () => {
  const { expiresInDays, maxUses } = newInvite.value
  saving.value = true
  try {
    const { data } = await invitesService.create(team.value.id, { expiresInDays, ...(maxUses > 0 && { maxUses }) })
    invites.value = [data, ...invites.value]
    copyInvite(data)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo generar el link'))
  } finally {
    saving.value = false
  }
}

const copyInvite = async i => {
  try {
    await navigator.clipboard.writeText(inviteUrl(i.token))
    toast.success('Link copiado')
  } catch {
    toast.info(inviteUrl(i.token))
  }
}

const whatsappUrl = i =>
  `https://wa.me/?text=${encodeURIComponent(`¡Únete a ${team.value.name} en Basketball MVP! Elige tu dorsal aquí: ${inviteUrl(i.token)}`)}`

const revokeInvite = async i => {
  if (!(await confirm({ title: 'Revocar link', message: 'Quien tenga este link ya no podrá unirse al equipo.', confirmText: 'Revocar', danger: true }))) return
  try {
    await invitesService.revoke(team.value.id, i.id)
    invites.value = invites.value.filter(x => x.id !== i.id)
    toast.success('Link revocado')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo revocar el link'))
  }
}

onMounted(load)
</script>
