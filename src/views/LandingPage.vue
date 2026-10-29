<template>
  <div class="min-h-screen bg-surface font-body text-on-surface">
    <PublicHeader />

    <main class="mx-auto flex max-w-[1200px] flex-col gap-margin-lg px-gutter pb-margin-lg md:px-margin-md">
      <!-- Hero -->
      <section class="grid items-center gap-space-xl pt-margin-md md:grid-cols-[1.2fr_1fr] md:pt-margin-lg">
        <div class="flex flex-col gap-space-lg">
          <span class="label-tactical self-start rounded bg-primary-container/15 px-space-sm py-1 text-primary">Caracas · Liga de barrio</span>
          <h1 class="m-0 font-display-xl-mobile text-display-xl-mobile uppercase md:font-display-xl md:text-display-xl">
            Compite por <span class="text-primary-container">tu zona</span>
          </h1>
          <p class="m-0 max-w-[52ch] text-body-md text-on-surface-variant md:text-[17px] md:leading-7">
            Los equipos de barrio juegan torneos en las canchas de su zona. El que más torneos gana en una zona se convierte en su dueño.
          </p>
          <div class="flex flex-col gap-space-sm sm:flex-row">
            <router-link to="/auth/register" class="btn-primary">Crear cuenta</router-link>
            <a href="#torneos" class="btn-secondary">Ver torneos</a>
          </div>
        </div>
        <div class="hidden h-[360px] md:block">
          <Basketball3D />
        </div>
      </section>

      <!-- Open tournaments -->
      <section id="torneos" class="scroll-mt-20">
        <SectionHeader title="Inscripciones abiertas" icon="emoji_events" />
        <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando torneos…</p>
        <p v-else-if="!open.length" class="text-body-md text-on-surface-variant">No hay torneos con inscripciones abiertas en este momento.</p>
        <div class="grid gap-space-md md:grid-cols-2 lg:grid-cols-3">
          <article v-for="t in open" :key="t.id" class="card flex flex-col gap-space-md p-space-md">
            <div class="flex items-start justify-between gap-space-sm">
              <h3 class="m-0 font-headline-md text-headline-md uppercase">{{ t.name }}</h3>
              <StatusChip :status="t.status" />
            </div>
            <div class="flex flex-col gap-1 text-body-sm text-on-surface-variant">
              <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ t.location }}</span>
              <span class="flex items-center gap-space-xs">
                <span class="icon text-[18px]">calendar_month</span>{{ formatDate(t.startDate) }} – {{ formatDate(t.endDate) }}
              </span>
              <span class="flex items-center gap-space-xs">
                <span class="icon text-[18px]">payments</span>Inscripción
                <span class="font-stat-mono text-on-surface">{{ Number(t.entryFee) > 0 ? `$${t.entryFee}` : 'Gratis' }}</span>
              </span>
            </div>
            <div>
              <div class="mb-1 flex justify-between">
                <span class="label-tactical text-on-surface-variant">Cupos</span>
                <span class="font-stat-mono text-stat-mono tabular">{{ t.registeredTeams }}/{{ t.maxTeams }}</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                <div class="h-full bg-secondary-container" :style="{ width: Math.min(100, (t.registeredTeams / t.maxTeams) * 100) + '%' }" />
              </div>
            </div>
            <router-link :to="`/torneo/${t.id}`" class="btn-secondary mt-auto">Ver torneo</router-link>
          </article>
        </div>
      </section>

      <!-- How it works: one card per role -->
      <section>
        <SectionHeader title="Cómo funciona" icon="sports" />
        <div class="grid gap-space-md md:grid-cols-3">
          <article v-for="r in roles" :key="r.title" class="card flex flex-col gap-space-sm p-space-lg">
            <span class="icon text-[32px] text-primary-container">{{ r.icon }}</span>
            <h3 class="m-0 font-headline-md text-headline-md uppercase">{{ r.title }}</h3>
            <p class="m-0 text-body-md text-on-surface-variant">{{ r.text }}</p>
          </article>
        </div>
      </section>
    </main>

    <footer class="border-0 border-t border-solid border-outline-variant/40">
      <div class="mx-auto flex max-w-[1200px] flex-col gap-space-sm px-gutter py-space-xl text-body-sm text-on-surface-variant md:flex-row md:justify-between md:px-margin-md">
        <span>Basketball MVP · CCS Streetball</span>
        <span class="flex gap-space-md">
          <router-link to="/auth/login" class="text-on-surface-variant no-underline hover:text-primary">Iniciar sesión</router-link>
          <router-link to="/auth/register" class="text-on-surface-variant no-underline hover:text-primary">Crear cuenta</router-link>
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import tournamentsService from '@/services/tournaments'
import Basketball3D from '@/components/Basketball3D.vue'
import PublicHeader from '@/components/PublicHeader.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'

const roles = [
  { icon: 'emoji_events', title: 'Organizador', text: 'Crea torneos en una cancha de tu zona, aprueba a los equipos y genera el fixture.' },
  { icon: 'groups', title: 'Capitán', text: 'Arma tu equipo fichando jugadores por cédula e inscríbelo en los torneos.' },
  { icon: 'sports_basketball', title: 'Jugador', text: 'Sigue tu calendario, tus equipos y tus estadísticas partido a partido.' }
]

const tournaments = ref([])
const loading = ref(true)
const open = computed(() => tournaments.value.filter(t => t.status === 'REGISTRATION'))
const formatDate = d => (d ? new Date(d).toLocaleDateString() : '-')

onMounted(async () => {
  try {
    const res = await tournamentsService.getAll({ status: 'REGISTRATION', limit: 6 })
    tournaments.value = res.data.tournaments || []
  } catch {
    tournaments.value = []
  } finally {
    loading.value = false
  }
})
</script>
