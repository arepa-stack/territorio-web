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
            Encuentra torneos en las canchas de tu zona, súmate a un equipo o inscribe el tuyo. Tus puntos, rebotes y asistencias quedan registrados partido a partido.
          </p>
          <div class="flex flex-col gap-space-sm sm:flex-row">
            <router-link to="/torneos" class="btn-primary"><span class="icon">search</span> Buscar torneos</router-link>
            <router-link to="/equipos" class="btn-secondary"><span class="icon">person_search</span> Busco equipo</router-link>
          </div>
          <p class="m-0 text-body-sm text-on-surface-variant">Ver torneos y equipos no requiere cuenta.</p>
        </div>
        <div class="hidden h-[360px] md:block">
          <Basketball3D />
        </div>
      </section>

      <!-- Open tournaments -->
      <section>
        <SectionHeader title="Inscripciones abiertas" icon="emoji_events">
          <router-link to="/torneos" class="text-body-sm text-primary">Ver todos los torneos</router-link>
        </SectionHeader>
        <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando torneos…</p>
        <div v-else-if="!tournaments.length" class="card flex flex-col gap-space-sm p-space-lg">
          <p class="m-0 text-body-md text-on-surface-variant">No hay torneos con inscripciones abiertas ahora mismo.</p>
          <router-link to="/torneos?estado=IN_PROGRESS" class="btn-secondary self-start">Ver torneos en curso</router-link>
        </div>
        <div v-else class="grid gap-space-md md:grid-cols-2 lg:grid-cols-3">
          <TournamentCard v-for="t in tournaments" :key="t.id" :tournament="t" />
        </div>
      </section>

      <!-- One path per profile -->
      <section>
        <SectionHeader title="¿Cómo quieres jugar?" icon="sports" />
        <div class="grid gap-space-md md:grid-cols-3">
          <article v-for="r in paths" :key="r.title" class="card flex flex-col gap-space-sm p-space-lg">
            <span class="icon text-[32px] text-primary-container">{{ r.icon }}</span>
            <h3 class="m-0 font-headline-md text-headline-md uppercase">{{ r.title }}</h3>
            <ul class="m-0 flex flex-col gap-1 pl-5 text-body-md text-on-surface-variant">
              <li v-for="s in r.steps" :key="s">{{ s }}</li>
            </ul>
            <router-link :to="r.to" class="btn-secondary mt-auto">{{ r.cta }}</router-link>
          </article>
        </div>
      </section>
    </main>

    <footer class="border-0 border-t border-solid border-outline-variant/40">
      <div class="mx-auto flex max-w-[1200px] flex-col gap-space-sm px-gutter py-space-xl text-body-sm text-on-surface-variant md:flex-row md:justify-between md:px-margin-md">
        <span>Basketball MVP · CCS Streetball</span>
        <span class="flex gap-space-md">
          <router-link to="/torneos" class="text-on-surface-variant no-underline hover:text-primary">Torneos</router-link>
          <router-link to="/equipos" class="text-on-surface-variant no-underline hover:text-primary">Equipos</router-link>
          <router-link to="/auth/login" class="text-on-surface-variant no-underline hover:text-primary">Iniciar sesión</router-link>
          <router-link to="/auth/register" class="text-on-surface-variant no-underline hover:text-primary">Crear cuenta</router-link>
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import tournamentsService from '@/services/tournaments'
import Basketball3D from '@/components/Basketball3D.vue'
import PublicHeader from '@/components/PublicHeader.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import TournamentCard from '@/components/tournament/TournamentCard.vue'

const paths = [
  {
    icon: 'sports_basketball',
    title: 'Busco equipo',
    steps: ['Mira qué equipos buscan jugadores', 'Crea tu cuenta de jugador', 'Postúlate y el capitán te acepta'],
    cta: 'Ver equipos que buscan jugadores',
    to: '/equipos'
  },
  {
    icon: 'groups',
    title: 'Tengo equipo',
    steps: ['Elige un torneo con cupos', 'Crea tu cuenta de capitán', 'Ficha a tu gente e inscríbete'],
    cta: 'Elegir torneo',
    to: '/torneos'
  },
  {
    icon: 'emoji_events',
    title: 'Organizo torneos',
    steps: ['Crea el torneo en una cancha de tu zona', 'Aprueba equipos y pagos', 'Genera el fixture y carga resultados'],
    cta: 'Crear cuenta de organizador',
    to: { path: '/auth/register', query: { role: 'ORGANIZER' } }
  }
]

const tournaments = ref([])
const loading = ref(true)

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
