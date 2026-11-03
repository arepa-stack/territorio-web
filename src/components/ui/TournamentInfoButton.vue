<template>
  <button v-if="waiver" type="button" class="btn-secondary" :disabled="accepting" @click="open">
    <span class="icon">fact_check</span> {{ accepting ? 'Aceptando…' : 'Aceptar reglamento' }}
  </button>
  <button v-else type="button" class="btn-secondary" @click="open">
    <span class="icon">info</span> Detalles
  </button>

  <!-- Native <dialog>: Esc, focus trap and backdrop for free -->
  <dialog
    ref="dialog"
    class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border-t-2 border-solid border-x-0 border-b-0 border-primary-container bg-surface-container p-0 text-on-surface backdrop:bg-[rgba(11,15,23,0.8)]"
    :aria-labelledby="titleId"
    @click.self="dialog.close()"
  >
    <header class="sticky top-0 flex items-center justify-between gap-space-sm border-0 border-b border-solid border-outline-variant/40 bg-surface-container px-space-lg py-space-md">
      <h2 :id="titleId" class="m-0 min-w-0 font-headline-md text-headline-md uppercase">{{ tournament.name }}</h2>
      <button type="button" class="btn-ghost" aria-label="Cerrar" @click="dialog.close()"><span class="icon">close</span></button>
    </header>

    <div class="flex flex-col gap-space-lg px-space-lg py-space-lg">
      <div class="flex flex-wrap gap-space-xs text-body-sm">
        <span class="rounded bg-surface-container-high px-space-sm py-1">{{ t.playersPerTeam }} jug. / equipo</span>
        <span class="rounded bg-surface-container-high px-space-sm py-1">Cuartos de {{ t.quarterDuration }} min</span>
        <span class="rounded bg-surface-container-high px-space-sm py-1">Máx. {{ t.maxTeams }} equipos</span>
        <span class="rounded bg-surface-container-high px-space-sm py-1">
          Inscripción {{ Number(t.entryFee) > 0 ? `$${t.entryFee}` : 'Gratis' }}
        </span>
      </div>

      <section>
        <h3 class="label-tactical m-0 mb-space-sm flex items-center gap-space-xs"><span class="icon text-[18px] text-secondary">emoji_events</span>Premiación</h3>
        <ul v-if="t.prizes?.length" class="m-0 flex flex-col gap-space-xs pl-space-lg text-body-md">
          <li v-for="(prize, i) in t.prizes" :key="i">{{ prize }}</li>
        </ul>
        <p v-else class="m-0 text-body-md text-on-surface-variant">Sin premiación publicada.</p>
      </section>

      <section>
        <h3 class="label-tactical m-0 mb-space-sm flex items-center gap-space-xs"><span class="icon text-[18px] text-secondary">location_on</span>Ubicación</h3>
        <p class="m-0 mb-space-sm text-body-md">{{ t.location }}</p>
        <p v-if="loading" class="m-0 text-body-sm text-on-surface-variant">Cargando canchas…</p>
        <p v-else-if="!t.venues?.length" class="m-0 text-body-sm text-on-surface-variant">El organizador aún no asignó canchas.</p>
        <article v-for="v in t.venues" :key="v.id" class="mb-space-md rounded bg-surface-container-high p-space-md last:mb-0">
          <div class="flex flex-wrap items-start justify-between gap-space-sm">
            <div class="min-w-0">
              <p class="m-0 font-bold">{{ v.name }}</p>
              <p class="m-0 text-body-sm text-on-surface-variant">{{ [v.address, v.city].filter(Boolean).join(', ') || 'Sin dirección' }}</p>
              <p v-if="v.capacity" class="m-0 text-body-sm text-on-surface-variant">Capacidad: {{ v.capacity }} personas</p>
            </div>
            <a
              v-if="v.latitude != null"
              class="btn-ghost"
              :href="`https://www.google.com/maps?q=${v.latitude},${v.longitude}`"
              target="_blank"
              rel="noopener"
            ><span class="icon">map</span> Cómo llegar</a>
          </div>
          <p v-if="v.description" class="m-0 mt-space-xs text-body-sm">{{ v.description }}</p>
          <div v-if="v.photos?.length" class="mt-space-sm grid grid-cols-2 gap-space-xs sm:grid-cols-3">
            <a v-for="(src, i) in v.photos" :key="i" :href="src" target="_blank" rel="noopener">
              <img :src="src" :alt="`Foto ${i + 1} de ${v.name}`" loading="lazy" class="aspect-video w-full rounded object-cover" />
            </a>
          </div>
        </article>
      </section>

      <section>
        <h3 class="label-tactical m-0 mb-space-sm flex items-center gap-space-xs"><span class="icon text-[18px] text-secondary">sports</span>Árbitros</h3>
        <p v-if="loading" class="m-0 text-body-sm text-on-surface-variant">Cargando…</p>
        <ul v-else-if="t.referees?.length" class="m-0 flex list-none flex-wrap gap-space-sm p-0">
          <li v-for="r in t.referees" :key="r.id" class="flex items-center gap-space-xs rounded bg-surface-container-high px-space-sm py-1 text-body-sm">
            <img v-if="r.avatarUrl" :src="r.avatarUrl" alt="" class="h-6 w-6 rounded-full object-cover" />
            <span v-else class="icon text-[20px]">person</span>
            {{ r.fullName }}
          </li>
        </ul>
        <p v-else class="m-0 text-body-md text-on-surface-variant">Árbitros por confirmar.</p>
      </section>

      <section>
        <h3 class="label-tactical m-0 mb-space-sm flex items-center gap-space-xs"><span class="icon text-[18px] text-secondary">gavel</span>Reglas</h3>
        <ol v-if="t.rules?.length" class="m-0 flex flex-col gap-space-sm pl-space-lg text-body-md">
          <li v-for="(rule, i) in t.rules" :key="i">{{ rule }}</li>
        </ol>
        <p v-else class="m-0 text-body-md text-on-surface-variant">El organizador aún no cargó reglas para este torneo.</p>
      </section>
    </div>

    <!-- Waiver mode: same sheet, plus the statement and the accept button -->
    <footer
      v-if="waiver"
      class="sticky bottom-0 flex flex-col gap-space-md border-0 border-t-2 border-solid border-primary-container bg-surface-container px-space-lg py-space-md"
    >
      <p class="m-0 text-body-md">{{ WAIVER_TEXT }}</p>
      <div class="flex flex-wrap justify-end gap-space-sm">
        <button type="button" class="btn-ghost" @click="dialog.close()">Cancelar</button>
        <button type="button" class="btn-primary" :disabled="accepting" @click="accept">Acepto reglamento y deslinde</button>
      </div>
    </footer>
  </dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import playersService from '@/services/players'
import { handleApiError } from '@/services/api'

const WAIVER_TEXT =
  'Confirmo que he leído y acepto el reglamento deportivo del torneo y el deslinde de responsabilidad médica y deportiva.'

// Tournament from the API list; venues/referees only come with the detail, fetched on first open.
// waiver: the button opens the same sheet to accept the rules and waiver; emits 'accepted' when saved
const props = defineProps({ tournament: { type: Object, required: true }, waiver: { type: Boolean, default: false } })
const emit = defineEmits(['accepted'])
const toast = useToast()
const accepting = ref(false)

const dialog = ref(null)
const detail = ref(null)
const loading = ref(false)
const titleId = `info-${props.tournament.id}`
const t = computed(() => ({ ...props.tournament, ...detail.value }))

const open = async () => {
  dialog.value.showModal()
  if (detail.value) return
  loading.value = true
  try {
    detail.value = (await tournamentsService.getById(props.tournament.id)).data
  } catch {
    // api interceptor already toasts; the dialog still shows the list data
  } finally {
    loading.value = false
  }
}

const accept = async () => {
  accepting.value = true
  try {
    await playersService.acceptTournamentWaiver(props.tournament.id)
    toast.success('Reglamento y deslinde aceptado')
    dialog.value.close()
    emit('accepted')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo registrar tu aceptación'))
  } finally {
    accepting.value = false
  }
}
</script>
