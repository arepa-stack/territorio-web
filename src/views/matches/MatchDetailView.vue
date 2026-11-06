<template>
  <div class="flex flex-col gap-space-lg">
    <button type="button" class="btn-ghost self-start" @click="$router.back()">
      <span class="icon">arrow_back</span> Volver
    </button>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando…</p>
    <p v-else-if="!match" class="text-body-md text-on-surface-variant">No se encontró el partido.</p>

    <template v-else>
      <!-- Header -->
      <section class="card flex flex-col items-center gap-space-sm p-space-lg text-center">
        <p class="label-tactical m-0 text-on-surface-variant">
          {{ match.tournament?.name }} · J{{ match.round }} · {{ formatDate(match.matchDate) }} {{ match.matchTime }}
        </p>
        <div class="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-space-md">
          <router-link :to="links.team(match.homeTeam.id)" class="font-title-sm text-title-sm text-on-surface hover:text-primary">{{ match.homeTeam.name }}</router-link>
          <span v-if="hasScore" class="font-scoreboard-num text-scoreboard-num tabular">{{ match.homeScore }}–{{ match.awayScore }}</span>
          <StatusChip v-else :status="match.status" />
          <router-link :to="links.team(match.awayTeam.id)" class="font-title-sm text-title-sm text-on-surface hover:text-primary">{{ match.awayTeam.name }}</router-link>
        </div>
        <p class="m-0 text-body-sm text-on-surface-variant">{{ match.venue || 'Cancha por definir' }}</p>
        <StatusChip v-if="match.status === 'FORFEIT'" status="FORFEIT" />
      </section>

      <section v-if="match.venue" class="card p-space-md">
        <SectionHeader title="Ubicación" icon="location_on" />
        <VenueLocation :name="match.venue" />
      </section>

      <!-- Box score (a scheduled match has nothing to show yet) -->
      <p v-if="match.status === 'SCHEDULED'" class="card m-0 p-space-md text-body-md text-on-surface-variant">
        Las estadísticas de cada jugador aparecerán aquí cuando se juegue el partido.
      </p>
      <template v-else>
      <section v-for="side in boxScore" :key="side.team.id">
        <SectionHeader :title="side.team.name" icon="sports_basketball" />
        <div v-if="side.rows.length" class="card overflow-x-auto">
          <table class="w-full border-collapse text-left text-body-sm">
            <thead>
              <tr class="label-tactical text-on-surface-variant">
                <th class="px-space-md py-space-sm">Jugador</th>
                <th v-for="c in boxColumns" :key="c.key" class="px-space-md py-space-sm">{{ c.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in side.rows" :key="r.id" class="border-0 border-t border-solid border-outline-variant/30">
                <td class="whitespace-nowrap px-space-md py-space-sm">
                  <router-link :to="links.player(r.id)" class="text-on-surface hover:text-primary">
                    <span v-if="r.jerseyNumber != null" class="font-stat-mono text-on-surface-variant">#{{ r.jerseyNumber }}</span>
                    {{ r.name }}
                  </router-link>
                </td>
                <td
                  v-for="c in boxColumns"
                  :key="c.key"
                  class="px-space-md py-space-sm font-stat-mono tabular"
                  :class="{ 'font-bold text-primary': c.key === 'points' }"
                >{{ r[c.key] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="m-0 text-body-md text-on-surface-variant">Sin planilla cargada.</p>
      </section>
      </template>

      <!-- Ratings (participants of a finished match) -->
      <section v-if="myRatings.canRate" class="grid gap-space-md md:grid-cols-2">
        <form v-if="match.venue" class="card flex flex-col gap-space-sm p-space-md" @submit.prevent="submitVenue">
          <h2 class="label-tactical m-0 text-on-surface-variant">Calificar cancha · {{ match.venue }}</h2>
          <p v-if="myRatings.venueRated" class="m-0 text-body-sm text-secondary">Ya calificaste esta cancha. ¡Gracias!</p>
          <template v-else>
            <StarRating v-for="c in venueCriteria" :key="c.key" v-model="venueForm[c.key]" :label="c.label" />
            <textarea v-model.trim="venueForm.comment" class="input" rows="2" maxlength="500" placeholder="Comentario (opcional)" />
            <button type="submit" class="btn-secondary self-start" :disabled="savingVenue || !isComplete(venueForm, venueCriteria)">
              {{ savingVenue ? 'Enviando…' : 'Enviar calificación' }}
            </button>
          </template>
        </form>

        <form class="card flex flex-col gap-space-sm p-space-md" @submit.prevent="submitTournament">
          <h2 class="label-tactical m-0 text-on-surface-variant">Calificar torneo · {{ match.tournament?.name }}</h2>
          <p v-if="myRatings.tournamentRated" class="m-0 text-body-sm text-secondary">Ya calificaste este torneo. ¡Gracias!</p>
          <template v-else>
            <StarRating v-for="c in tournamentCriteria" :key="c.key" v-model="tournamentForm[c.key]" :label="c.label" />
            <label class="flex items-center gap-space-xs text-body-sm">
              <input v-model="tournamentForm.wouldRecommend" type="checkbox" /> Lo recomendaría
            </label>
            <textarea v-model.trim="tournamentForm.comment" class="input" rows="2" maxlength="500" placeholder="Comentario (opcional)" />
            <button type="submit" class="btn-secondary self-start" :disabled="savingTournament || !isComplete(tournamentForm, tournamentCriteria)">
              {{ savingTournament ? 'Enviando…' : 'Enviar calificación' }}
            </button>
          </template>
        </form>
      </section>

      <!-- Comments -->
      <section>
        <SectionHeader title="Comentarios" icon="forum" />
        <p v-if="!commentsEnabled" class="card m-0 flex items-center gap-space-xs p-space-md text-body-md text-on-surface-variant">
          <span class="icon">comments_disabled</span> Los comentarios están suspendidos temporalmente.
        </p>
        <template v-else>
        <p v-if="!isLoggedIn" class="mb-space-md text-body-sm text-on-surface-variant">
          <router-link :to="{ path: '/auth/login', query: { redirect: route.fullPath } }" class="text-primary">Inicia sesión</router-link> para comentar.
        </p>
        <form v-else class="mb-space-md flex flex-col gap-space-xs" @submit.prevent="submitComment">
          <textarea v-model.trim="newComment" class="input" rows="2" maxlength="1000" placeholder="Comenta el partido con respeto" />
          <button type="submit" class="btn-secondary self-end" :disabled="postingComment || !newComment">
            {{ postingComment ? 'Publicando…' : 'Publicar' }}
          </button>
        </form>
        <p v-if="!comments.length" class="m-0 text-body-md text-on-surface-variant">Todavía no hay comentarios.</p>
        <article v-for="c in comments" :key="c.id" class="card mb-space-xs flex flex-col gap-1 p-space-md">
          <div class="flex items-center justify-between gap-space-sm">
            <span class="font-title-sm text-title-sm">{{ c.user.name }}</span>
            <span class="text-body-sm text-on-surface-variant">{{ formatDate(c.createdAt) }}</span>
          </div>
          <p class="m-0 whitespace-pre-line text-body-md">{{ c.content }}</p>
          <span v-if="!isLoggedIn" class="text-body-sm text-on-surface-variant">{{ c.likesCount }} likes</span>
          <div v-else class="flex items-center gap-space-sm">
            <button type="button" class="btn-ghost px-space-xs py-1 text-body-sm" @click="like(c)">
              <span class="icon text-[18px]">thumb_up</span> {{ c.likesCount }}
            </button>
            <select
              class="input w-auto py-1 text-body-sm"
              aria-label="Reportar comentario"
              value=""
              @change="report(c, $event)"
            >
              <option value="" disabled>Reportar…</option>
              <option v-for="(label, value) in REPORT_REASONS" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
        </article>
        </template>
      </section>
    </template>
  </div>
</template>

<script setup>
import VenueLocation from '@/components/VenueLocation.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import matchesService from '@/services/matches'
import ratingsService from '@/services/ratings'
import commentsService from '@/services/comments'
import { handleApiError } from '@/services/api'
import { formatDate } from '@/utils/labels'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import StarRating from '@/components/ui/StarRating.vue'
import { useAuthStore } from '@/stores/auth'
import { useEntityLinks } from '@/utils/links'

const route = useRoute()
const toast = useToast()
const links = useEntityLinks()
const isLoggedIn = computed(() => useAuthStore().isAuthenticated)

const match = ref(null)
const events = ref([])
const comments = ref([])
const myRatings = ref({ canRate: false, venueRated: false, tournamentRated: false })
const loading = ref(true)

const hasScore = computed(() => ['FINISHED', 'FORFEIT', 'IN_PROGRESS'].includes(match.value?.status) && match.value.homeScore != null)

// ---------- Box score ----------
const boxColumns = [
  { key: 'points', label: 'PTS' },
  { key: 'rebounds', label: 'REB' },
  { key: 'assists', label: 'AST' },
  { key: 'steals', label: 'ROB' },
  { key: 'blocks', label: 'TAP' },
  { key: 'turnovers', label: 'PER' },
  { key: 'fouls', label: 'FAL' }
]
const EVENT_FIELD = {
  REBOUND: 'rebounds',
  ASSIST: 'assists',
  STEAL: 'steals',
  BLOCK: 'blocks',
  TURNOVER: 'turnovers',
  FOUL: 'fouls',
  TECHNICAL_FOUL: 'fouls'
}

const boxScore = computed(() => {
  if (!match.value) return []
  const rows = new Map()
  for (const e of events.value) {
    const p = e.player
    if (!rows.has(p.id)) {
      rows.set(p.id, {
        id: p.id,
        teamId: p.team?.id,
        name: p.user?.fullName || p.fullName || 'Jugador',
        jerseyNumber: p.jerseyNumber,
        ...Object.fromEntries(boxColumns.map(c => [c.key, 0]))
      })
    }
    const row = rows.get(p.id)
    row.points += e.points || 0
    if (EVENT_FIELD[e.eventType]) row[EVENT_FIELD[e.eventType]]++
  }
  const all = [...rows.values()].sort((a, b) => b.points - a.points)
  return [match.value.homeTeam, match.value.awayTeam].map(team => ({ team, rows: all.filter(r => r.teamId === team.id) }))
})

// ---------- Ratings ----------
const venueCriteria = [
  { key: 'overallRating', label: 'General' },
  { key: 'quality', label: 'Estado de la cancha' },
  { key: 'equipment', label: 'Equipamiento' },
  { key: 'accessibility', label: 'Acceso' },
  { key: 'parking', label: 'Estacionamiento' },
  { key: 'cleanliness', label: 'Limpieza' }
]
const tournamentCriteria = [
  { key: 'overallRating', label: 'General' },
  { key: 'organization', label: 'Organización' },
  { key: 'punctuality', label: 'Puntualidad' },
  { key: 'fairness', label: 'Imparcialidad' },
  { key: 'facilities', label: 'Instalaciones' },
  { key: 'communication', label: 'Comunicación' }
]
const venueForm = reactive({ ...Object.fromEntries(venueCriteria.map(c => [c.key, 0])), comment: '' })
const tournamentForm = reactive({ ...Object.fromEntries(tournamentCriteria.map(c => [c.key, 0])), comment: '', wouldRecommend: true })
const savingVenue = ref(false)
const savingTournament = ref(false)

const isComplete = (form, criteria) => criteria.every(c => form[c.key] > 0)
const withoutEmptyComment = form => (form.comment ? { ...form } : { ...form, comment: undefined })

const submitVenue = async () => {
  savingVenue.value = true
  try {
    await ratingsService.rateVenue({ ...withoutEmptyComment(venueForm), venueName: match.value.venue, matchId: match.value.id })
    myRatings.value.venueRated = true
    toast.success('Cancha calificada')
  } catch (e) {
    toast.error(handleApiError(e, 'No se pudo calificar la cancha'))
  } finally {
    savingVenue.value = false
  }
}

const submitTournament = async () => {
  savingTournament.value = true
  try {
    await ratingsService.rateTournament({ ...withoutEmptyComment(tournamentForm), tournamentId: match.value.tournament?.id ?? match.value.tournamentId })
    myRatings.value.tournamentRated = true
    toast.success('Torneo calificado')
  } catch (e) {
    toast.error(handleApiError(e, 'No se pudo calificar el torneo'))
  } finally {
    savingTournament.value = false
  }
}

// ---------- Comments ----------
const REPORT_REASONS = {
  SPAM: 'Spam',
  HARASSMENT: 'Acoso',
  INSULTS: 'Insultos',
  OFF_TOPIC: 'Fuera de tema',
  INAPPROPRIATE: 'Inapropiado'
}
const newComment = ref('')
const commentsEnabled = ref(false)
const postingComment = ref(false)

const loadComments = async () => {
  try {
    comments.value = (await commentsService.getForMatch(route.params.id)).data?.comments ?? []
  } catch {
    comments.value = []
  }
}

const submitComment = async () => {
  postingComment.value = true
  try {
    await commentsService.createForMatch(match.value.id, newComment.value)
    newComment.value = ''
    toast.success('Comentario publicado')
    await loadComments()
  } catch (e) {
    toast.error(handleApiError(e, 'No se pudo publicar el comentario'))
  } finally {
    postingComment.value = false
  }
}

const like = async c => {
  try {
    await commentsService.like(c.id)
    c.likesCount++
  } catch (e) {
    toast.error(handleApiError(e, 'No se pudo dar like'))
  }
}

const report = async (c, event) => {
  const reason = event.target.value
  event.target.value = ''
  try {
    await commentsService.report(c.id, reason)
    toast.success('Comentario reportado. Un moderador lo revisará.')
  } catch (e) {
    toast.error(handleApiError(e, 'No se pudo reportar'))
  }
}

onMounted(async () => {
  const id = route.params.id
  try {
    const [m, ev, mine] = await Promise.all([
      matchesService.getById(id),
      matchesService.getEvents(id).catch(() => ({ data: [] })),
      isLoggedIn.value ? ratingsService.getMineForMatch(id).catch(() => ({ data: null })) : { data: null }
    ])
    match.value = m.data
    events.value = ev.data || []
    if (mine.data) myRatings.value = mine.data
    commentsEnabled.value = Boolean((await commentsService.getStatus().catch(() => ({ data: {} }))).data.enabled)
    if (commentsEnabled.value) await loadComments()
  } catch (e) {
    toast.error(handleApiError(e, 'No se pudo cargar el partido'))
  } finally {
    loading.value = false
  }
})
</script>
