<template>
  <div class="flex flex-col gap-space-lg">
    <router-link to="/app/organizer" class="btn-ghost self-start px-0">
      <span class="icon">arrow_back</span> Panel
    </router-link>

    <p v-if="loading" class="text-body-md text-on-surface-variant">Cargando torneo…</p>

    <template v-else-if="tournament">
      <!-- Header -->
      <header class="card flex flex-col gap-space-md overflow-hidden p-space-lg">
        <TournamentCover :src="tournament.coverPhoto" :alt="`Cancha de ${tournament.name}`" class="-mx-space-lg -mt-space-lg h-48 md:h-64">
          <StatusChip :status="tournament.status" class="absolute right-space-md top-space-md" />
          <label class="btn-secondary absolute left-space-md top-space-md cursor-pointer bg-surface/80 py-1 text-body-sm">
            <span class="icon text-[18px]">photo_camera</span>
            {{ uploadingBanner ? 'Subiendo…' : tournament.coverPhoto ? 'Cambiar portada' : 'Subir foto de la cancha' }}
            <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" :disabled="uploadingBanner" @change="changeBanner" />
          </label>
          <h1 class="m-0 font-headline-lg-mobile text-headline-lg-mobile uppercase text-white md:font-headline-lg md:text-headline-lg">
            {{ tournament.name }}
          </h1>
        </TournamentCover>
        <div class="flex flex-wrap gap-x-space-lg gap-y-1 text-body-sm text-on-surface-variant">
          <span class="flex items-center gap-space-xs"><span class="icon text-[18px]">location_on</span>{{ tournament.location }}</span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">calendar_month</span>{{ formatDate(tournament.startDate) }} – {{ formatDate(tournament.endDate) }}
          </span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">groups</span>
            <span class="font-stat-mono tabular">{{ registrations.length }}/{{ tournament.maxTeams }}</span> equipos
          </span>
          <span class="flex items-center gap-space-xs">
            <span class="icon text-[18px]">payments</span>
            <span class="font-stat-mono tabular text-on-surface">{{ Number(tournament.entryFee) > 0 ? `$${tournament.entryFee}` : 'Gratis' }}</span>
          </span>
          <label class="flex cursor-pointer items-center gap-1.5 text-on-surface">
            <input
              type="checkbox"
              :checked="Boolean(tournament.requireIdVerification)"
              :disabled="busy"
              class="h-4 w-4 accent-primary"
              @change="toggleRequireIdVerification($event.target.checked)"
            />
            <span>Exigir documento de identidad verificado</span>
          </label>
          <label class="flex items-center gap-1.5 text-on-surface">
            <span class="icon text-[18px]">account_tree</span>
            <select
              class="input w-auto py-1"
              :value="tournament.playoffTeams || 0"
              :disabled="busy || tournament.status !== 'REGISTRATION'"
              aria-label="Playoffs"
              @change="setPlayoffs(Number($event.target.value))"
            >
              <option v-for="o in PLAYOFF_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
        </div>
      </header>

      <!-- General data: editable until the tournament starts (backend rule) -->
      <details v-if="canEditData" class="card p-space-md" @toggle="$event.target.open && fillEditForm()">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-space-sm [&::-webkit-details-marker]:hidden">
          <span class="label-tactical flex items-center gap-space-xs text-on-surface">
            <span class="icon text-[18px] text-secondary">edit</span> Editar datos del torneo
          </span>
        </summary>
        <form class="mt-space-md grid gap-space-md md:grid-cols-2" @submit.prevent="saveData">
          <div class="md:col-span-2">
            <label class="field-label" for="e-name">Nombre</label>
            <input id="e-name" v-model.trim="editForm.name" class="input" required maxlength="100" />
          </div>
          <div class="md:col-span-2">
            <label class="field-label" for="e-desc">Descripción</label>
            <textarea id="e-desc" v-model.trim="editForm.description" class="input" rows="2" />
          </div>
          <div class="md:col-span-2">
            <label class="field-label" for="e-loc">Ubicación</label>
            <input id="e-loc" v-model.trim="editForm.location" class="input" required />
          </div>
          <div>
            <label class="field-label" for="e-start">Inicio</label>
            <input id="e-start" v-model="editForm.startDate" type="date" class="input" required />
          </div>
          <div>
            <label class="field-label" for="e-end">Fin</label>
            <input id="e-end" v-model="editForm.endDate" type="date" class="input" required :min="editForm.startDate" />
          </div>
          <div>
            <label class="field-label" for="e-min">Mínimo de equipos</label>
            <input id="e-min" v-model.number="editForm.minTeams" type="number" min="2" max="32" class="input" required />
          </div>
          <div>
            <label class="field-label" for="e-max">Máximo de equipos</label>
            <input id="e-max" v-model.number="editForm.maxTeams" type="number" :min="Math.max(editForm.minTeams || 2, registrations.length)" max="32" class="input" required />
          </div>
          <div>
            <label class="field-label" for="e-fee">Inscripción ($)</label>
            <input id="e-fee" v-model.number="editForm.entryFee" type="number" min="0" step="0.01" class="input" required />
          </div>
          <div>
            <label class="field-label" for="e-quarter">Minutos por cuarto</label>
            <input id="e-quarter" v-model.number="editForm.quarterDuration" type="number" min="8" max="12" class="input" required />
          </div>
          <button type="submit" class="btn-primary self-end justify-self-end md:col-start-2" :disabled="busy">
            <span class="icon">save</span> Guardar cambios
          </button>
        </form>
      </details>

      <!-- Organizer payment details (what captains see in "Pagar inscripción") -->
      <details v-if="tournament.entryFee > 0" class="card p-space-md">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-space-sm [&::-webkit-details-marker]:hidden">
          <span class="label-tactical flex items-center gap-space-xs text-on-surface">
            <span class="icon text-[18px] text-secondary">account_balance_wallet</span> Datos de pago · ${{ tournament.entryFee }}
          </span>
          <span class="text-body-sm text-on-surface-variant">{{ tournament.paymentInfo ? 'Publicados' : 'Sin publicar' }}</span>
        </summary>
        <form class="mt-space-md flex flex-col gap-space-md" @submit.prevent="savePaymentInfo">
          <PaymentInfoFields v-model="paymentInfoForm" id-prefix="m-pay" />
          <button type="submit" class="btn-primary self-end" :disabled="busy || ['IN_PROGRESS', 'FINISHED'].includes(tournament.status)">
            <span class="icon">save</span> Guardar datos de pago
          </button>
        </form>
      </details>

      <!-- Tournament ratings summary from participating teams/players -->
      <details v-if="ratingSummary && ratingSummary.totalRatings > 0" class="card p-space-md">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-space-sm [&::-webkit-details-marker]:hidden">
          <span class="label-tactical flex items-center gap-space-xs text-on-surface">
            <span class="icon icon-fill text-[18px] text-secondary">star</span> Calificaciones del torneo · {{ ratingSummary.averageOverallRating.toFixed(1) }} / 5
          </span>
          <span class="text-body-sm text-on-surface-variant">
            {{ ratingSummary.totalRatings }} {{ ratingSummary.totalRatings === 1 ? 'evaluación' : 'evaluaciones' }} · {{ Math.round(ratingSummary.recommendationPercentage) }}% lo recomienda
          </span>
        </summary>
        <div class="mt-space-md flex flex-col gap-space-sm">
          <div class="grid grid-cols-2 gap-space-xs text-body-sm sm:grid-cols-5">
            <div class="rounded bg-surface-container-low p-space-xs">Organización: <strong>{{ ratingSummary.averageOrganization.toFixed(1) }}</strong></div>
            <div class="rounded bg-surface-container-low p-space-xs">Puntualidad: <strong>{{ ratingSummary.averagePunctuality.toFixed(1) }}</strong></div>
            <div class="rounded bg-surface-container-low p-space-xs">Justicia: <strong>{{ ratingSummary.averageFairness.toFixed(1) }}</strong></div>
            <div class="rounded bg-surface-container-low p-space-xs">Instalaciones: <strong>{{ ratingSummary.averageFacilities.toFixed(1) }}</strong></div>
            <div class="rounded bg-surface-container-low p-space-xs">Comunicación: <strong>{{ ratingSummary.averageCommunication.toFixed(1) }}</strong></div>
          </div>
          <div v-if="ratingSummary.recentRatings?.length" class="flex flex-col gap-space-xs">
            <article v-for="(r, idx) in ratingSummary.recentRatings" :key="idx" class="rounded bg-surface-container-low p-space-sm text-body-sm">
              <div class="flex items-center justify-between">
                <strong>{{ r.userName }}</strong>
                <span class="font-mono text-secondary">★ {{ r.overallRating }}/5</span>
              </div>
              <p v-if="r.comment" class="m-0 mt-1 text-on-surface-variant">{{ r.comment }}</p>
            </article>
          </div>
        </div>
      </details>

      <!-- Closing the tournament: champion = leader of the standings once every game is decided -->
      <section v-if="tournament.status === 'IN_PROGRESS'" class="close">
        <div class="close__info">
          <span class="close__label">Cierre del torneo</span>
          <span class="close__progress">{{ decidedCount }}/{{ matches.length }} partidos decididos</span>
          <span class="close__track"><span class="close__fill" :style="{ width: matches.length ? (decidedCount / matches.length) * 100 + '%' : '0%' }" /></span>
          <span v-if="pendingCount" class="close__note">{{ pendingCount > 1 ? 'Faltan' : 'Falta' }} {{ pendingCount }} partido{{ pendingCount > 1 ? 's' : '' }} por jugar o resolver (W.O.) para poder cerrar.</span>
          <span v-else-if="needsPlayoffs" class="close__note">Fase regular terminada: genera los playoffs con los {{ tournament.playoffTeams }} primeros de la tabla.</span>
          <span v-else-if="champion" class="close__note">Campeón: <strong>{{ champion.teamName }}</strong>{{ tournament.playoffTeams ? ' · ganó la final' : ` · ${champion.points} pts` }}</span>
        </div>
        <button v-if="needsPlayoffs" type="button" class="btn-primary" :disabled="busy" @click="generatePlayoffs">
          <span class="icon">account_tree</span> Generar playoffs
        </button>
        <button v-else type="button" class="btn-primary" :disabled="busy || pendingCount > 0 || !champion" @click="finishTournament">
          <span class="icon">emoji_events</span> Finalizar y coronar campeón
        </button>
      </section>
      <PlayoffBracket v-if="bracket" :bracket="bracket" subtitle="Playoffs" :title="tournament.name" />
      <section v-else-if="tournament.status === 'FINISHED' && tournament.winner" class="close close--done">
        <span class="icon close__crown">workspace_premium</span>
        <div class="close__info">
          <span class="close__label">Campeón</span>
          <span class="close__champ">{{ tournament.winner.name }}</span>
        </div>
      </section>

      <!-- Tabs -->
      <div class="flex gap-space-xs overflow-x-auto border-b border-solid border-x-0 border-t-0 border-outline-variant/40" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.value"
          type="button"
          role="tab"
          :aria-selected="tab === t.value"
          class="label-tactical flex shrink-0 cursor-pointer whitespace-nowrap items-center gap-1.5 border-0 border-b-2 border-solid bg-transparent px-space-md py-space-sm text-[14px]"
          :class="tab === t.value ? 'border-primary-container text-primary' : 'border-transparent text-on-surface-variant'"
          @click="tab = t.value"
        >
          {{ t.label }}
          <span
            v-if="t.value === 'fixture' && pendingReschedulesCount > 0"
            class="rounded-full bg-primary-container px-1.5 py-0.5 font-stat-mono text-[11px] text-white"
          >{{ pendingReschedulesCount }}</span>
        </button>
      </div>

      <!-- Registrations -->
      <section v-if="tab === 'registrations'" class="flex flex-col gap-space-sm">
        <p v-if="!registrations.length" class="text-body-md text-on-surface-variant">Todavía no hay equipos inscritos.</p>
        <article
          v-for="reg in registrations"
          :key="reg.id"
          class="card flex flex-col gap-space-sm p-space-md md:flex-row md:flex-wrap md:items-center md:justify-between"
        >
          <div class="min-w-0">
            <h3 class="m-0 font-title-sm text-title-sm">{{ reg.team.name }}</h3>
            <p class="m-0 text-body-sm text-on-surface-variant">Capitán: {{ reg.captain.fullName }}</p>
            <div class="mt-space-xs flex flex-wrap gap-space-xs">
              <StatusChip :status="reg.status" />
              <RosterChip v-if="reg.roster" :roster="reg.roster" />
            </div>
          </div>
          <div v-if="reg.status === 'PENDING'" class="flex gap-space-sm">
            <button type="button" class="btn-danger flex-1" :disabled="busy" @click="review(reg, 'REJECTED')">Rechazar</button>
            <button type="button" class="btn-primary flex-1" :disabled="busy" @click="review(reg, 'APPROVED')">Aprobar</button>
          </div>

          <!-- Registration payment (separate from approval, visible before approving) -->
          <div v-if="tournament.entryFee > 0" class="flex w-full flex-col gap-space-xs border-0 border-t border-solid border-outline-variant/40 pt-space-sm md:basis-full">
            <div class="flex flex-wrap items-center gap-space-xs">
              <StatusChip :status="reg.payment?.status || 'UNPAID'" :label="reg.payment ? PAYMENT_STATUS[reg.payment.status] : 'Sin pago reportado'" />
              <span v-if="reg.payment" class="text-body-sm text-on-surface-variant">{{ PAYMENT_METHODS[reg.payment.method] }}</span>
            </div>
            <dl v-if="reg.payment" class="m-0 grid grid-cols-2 gap-x-space-md gap-y-1 text-body-sm sm:grid-cols-4">
              <div><dt class="label-tactical text-on-surface-variant">Referencia</dt><dd class="m-0 break-all font-stat-mono">{{ reg.payment.reference }}</dd></div>
              <div><dt class="label-tactical text-on-surface-variant">Monto</dt><dd class="m-0 font-stat-mono" :class="{ 'text-error': reg.payment.amount < tournament.entryFee }">${{ reg.payment.amount }}</dd></div>
              <div><dt class="label-tactical text-on-surface-variant">Fecha</dt><dd class="m-0">{{ formatDate(reg.payment.paidAt) }}</dd></div>
              <div><dt class="label-tactical text-on-surface-variant">Banco</dt><dd class="m-0">{{ reg.payment.payerBank }}</dd></div>
              <div><dt class="label-tactical text-on-surface-variant">Cédula / RIF</dt><dd class="m-0 font-stat-mono">{{ reg.payment.payerId }}</dd></div>
              <div v-if="reg.payment.payerPhone"><dt class="label-tactical text-on-surface-variant">Teléfono</dt><dd class="m-0 font-stat-mono">{{ reg.payment.payerPhone }}</dd></div>
            </dl>
            <p v-if="reg.payment?.reviewNote" class="m-0 text-body-sm text-on-surface-variant">Nota: {{ reg.payment.reviewNote }}</p>
            <div v-if="reg.payment" class="flex flex-wrap gap-space-sm">
              <button v-if="reg.payment.hasReceipt" type="button" class="btn-ghost" @click="viewReceipt(reg.payment)">
                <span class="icon">receipt_long</span> Ver comprobante
              </button>
              <span v-else class="self-center text-body-sm text-on-surface-variant">Sin comprobante</span>
              <template v-if="reg.payment.status === 'PENDING_REVIEW'">
                <button type="button" class="btn-danger" :disabled="busy" @click="reviewPayment(reg, 'REJECTED')">Rechazar pago</button>
                <button type="button" class="btn-primary" :disabled="busy" @click="reviewPayment(reg, 'VERIFIED')">
                  <span class="icon">verified</span> Verificar pago
                </button>
              </template>
            </div>
          </div>
        </article>
      </section>

      <!-- Fixture -->
      <section v-if="tab === 'fixture'" class="flex flex-col gap-space-md">
        <div v-if="tournament.status === 'REGISTRATION' && !matches.some(m => !m.phase)" class="card flex flex-col gap-space-sm p-space-md">
          <p class="m-0 text-body-md">
            <strong>Atajo:</strong> generar todo automático, todos contra todos{{ tournament.format === 'GROUPS' ? ' dentro de cada grupo' : '' }}, con los
            <strong class="font-stat-mono">{{ approved.length }}</strong> equipos aprobados. O ármalo tú abajo, jornada por jornada.
          </p>
          <p v-if="fixtureBlocker" class="m-0 flex items-center gap-space-xs text-body-sm text-error">
            <span class="icon text-[18px]">warning</span>{{ fixtureBlocker }}
          </p>
          <button type="button" class="btn-primary self-start" :disabled="!!fixtureBlocker || busy" @click="generateFixture">
            <span class="icon">account_tree</span> Generar fixture
          </button>
        </div>

        <FixtureBuilder
          v-if="tournament.status === 'REGISTRATION' || (tournament.status === 'IN_PROGRESS' && !hasPlayoffGames)"
          :tournament="tournament"
          :registrations="registrations"
          :matches="matches"
          @changed="load"
        />

        <!-- Reschedule requests -->
        <div v-if="rescheduleRequests.length" class="flex flex-col gap-space-sm">
          <h2 class="label-tactical m-0 flex items-center gap-space-xs text-secondary">
            <span class="icon text-[18px]">edit_calendar</span> Solicitudes de reprogramación ({{ rescheduleRequests.length }})
          </h2>
          <article
            v-for="req in rescheduleRequests"
            :key="req.id"
            class="card flex flex-col gap-space-sm p-space-md md:flex-row md:items-center md:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-space-xs">
                <StatusChip :status="req.status" :label="RESCHEDULE_STATUS[req.status]" />
                <span class="label-tactical text-on-surface-variant">J{{ req.match.round }}</span>
                <span class="font-title-sm text-title-sm">{{ req.match.homeTeam.name }} vs {{ req.match.awayTeam.name }}</span>
              </div>
              <p class="m-0 mt-1 text-body-sm">
                Solicita <strong>{{ req.team.name }}</strong> · Propuesta:
                <strong class="font-stat-mono">{{ formatDate(req.proposedDate) }} · {{ req.proposedTime }}</strong>
                <span class="text-on-surface-variant">(actual: {{ formatDate(req.match.matchDate) }} · {{ req.match.matchTime }})</span>
              </p>
              <p class="m-0 mt-0.5 text-body-sm text-on-surface-variant">Motivo: {{ req.reason }}</p>
              <p v-if="req.responseNote" class="m-0 mt-0.5 text-body-sm text-secondary">Respuesta: {{ req.responseNote }}</p>
            </div>
            <div v-if="req.status === 'PENDING'" class="flex shrink-0 gap-space-sm">
              <button type="button" class="btn-danger" :disabled="busy" @click="resolveReschedule(req, 'REJECTED')">
                Rechazar
              </button>
              <button type="button" class="btn-primary" :disabled="busy" @click="resolveReschedule(req, 'APPROVED')">
                <span class="icon">event_available</span> Aprobar
              </button>
            </div>
          </article>
        </div>

        <form v-if="editingMatch" class="card flex flex-col gap-space-md p-space-md" @submit.prevent="saveMatch">
          <h2 class="label-tactical m-0 text-on-surface">
            Editar partido · {{ editingMatch.homeTeam.name }} vs {{ editingMatch.awayTeam.name }}
          </h2>
          <div class="grid gap-space-md md:grid-cols-4">
            <div>
              <label class="field-label" for="m-date">Fecha</label>
              <input id="m-date" v-model="matchForm.matchDate" type="date" class="input" required />
            </div>
            <div>
              <label class="field-label" for="m-time">Hora</label>
              <input id="m-time" v-model="matchForm.matchTime" type="time" class="input" required />
            </div>
            <div>
              <label class="field-label" for="m-venue">Cancha</label>
              <input id="m-venue" v-model.trim="matchForm.venue" class="input" required />
            </div>
            <div>
              <label class="field-label" for="m-status">Estado</label>
              <select id="m-status" v-model="matchForm.status" class="input">
                <option value="SCHEDULED">Programado</option>
                <option value="SUSPENDED">Suspendido</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
          <p v-if="matchForm.status === 'CANCELLED'" class="m-0 text-body-sm text-error">Un partido cancelado no se juega y no suma a la tabla.</p>
          <div class="flex justify-end gap-space-sm">
            <button type="button" class="btn-ghost" @click="editingMatch = null">Cerrar</button>
            <button type="submit" class="btn-primary" :disabled="busy"><span class="icon">save</span> Guardar partido</button>
          </div>
        </form>

        <FixtureList
          :matches="matches"
          :link-for="m => `/app/organizer/match/${m.id}`"
          :editable="['REGISTRATION', 'IN_PROGRESS'].includes(tournament.status)"
          @edit="editMatch"
        />

        <button
          v-if="!['FINISHED', 'CANCELLED'].includes(tournament.status)"
          type="button"
          class="btn-danger self-start"
          :disabled="busy"
          @click="cancelTournament"
        >
          <span class="icon">block</span> Cancelar torneo
        </button>
      </section>

      <!-- Standings -->
      <StandingsTable v-if="tab === 'standings'" :standings="standings" />

      <!-- Sanctions -->
      <TournamentSanctions
        v-if="tab === 'sanctions'"
        :tournament-id="id"
        :players="tournamentPlayers"
        :matches="matches"
        :preselect-player-id="sanctionFor"
        @changed="load"
      />

      <!-- Players (Task 10, 16, 17) -->
      <section v-if="tab === 'players'" class="flex flex-col gap-space-md">
        <div class="flex flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-between">
          <p class="m-0 text-body-sm text-on-surface-variant">
            Listado de jugadores inscritos ({{ filteredTournamentPlayers.length }}). Revisa elegibilidad por edad/categoría, sanciones, reglamento y cédula.
          </p>
          <div class="sm:w-64">
            <label class="sr-only" for="tp-team-filter">Filtrar por equipo</label>
            <select id="tp-team-filter" v-model="playerTeamFilter" class="input">
              <option value="ALL">Todos los equipos</option>
              <option v-for="tm in playerTeamOptions" :key="tm.id" :value="tm.id">{{ tm.name }}</option>
            </select>
          </div>
        </div>

        <p v-if="!filteredTournamentPlayers.length" class="text-body-md text-on-surface-variant">
          No hay jugadores registrados para este filtro.
        </p>

        <div v-else class="card overflow-x-auto">
          <table class="w-full border-collapse text-left text-body-sm">
            <thead>
              <tr class="label-tactical text-on-surface-variant">
                <th class="px-space-md py-space-sm">#</th>
                <th class="px-space-md py-space-sm">Jugador</th>
                <th class="px-space-md py-space-sm">Equipo</th>
                <th class="px-space-md py-space-sm">CI / Edad</th>
                <th class="px-space-md py-space-sm">Categoría</th>
                <th class="px-space-md py-space-sm">Menor / Reglamento</th>
                <th class="px-space-md py-space-sm">Sanciones</th>
                <th class="px-space-md py-space-sm">Documento ID</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in filteredTournamentPlayers"
                :key="`${p.teamId}-${p.playerId}`"
                class="border-0 border-t border-solid border-outline-variant/30"
              >
                <td class="px-space-md py-space-sm font-scoreboard-num text-[18px] tabular">#{{ p.jerseyNumber }}</td>
                <td class="px-space-md py-space-sm">
                  <div class="font-bold">{{ p.fullName }}</div>
                  <div class="text-label-sm text-on-surface-variant">{{ p.position }}</div>
                </td>
                <td class="px-space-md py-space-sm">{{ p.teamName }}</td>
                <td class="px-space-md py-space-sm font-stat-mono">
                  <div>{{ p.ci || 'Sin CI' }}</div>
                  <div class="text-on-surface-variant">{{ p.ageAtStart != null ? `${p.ageAtStart} años` : 'Sin fecha nac.' }}</div>
                </td>
                <td class="px-space-md py-space-sm">
                  <span
                    v-if="p.categoryEligible"
                    class="inline-flex items-center gap-1 rounded bg-secondary-container/30 px-2 py-0.5 text-label-sm font-bold text-secondary"
                  >
                    Apto
                  </span>
                  <div v-else class="flex flex-col gap-0.5">
                    <span class="inline-flex self-start rounded bg-error/20 px-2 py-0.5 text-label-sm font-bold text-error">
                      Observado
                    </span>
                    <span v-for="(iss, idx) in p.categoryIssues" :key="idx" class="text-[11px] text-error">{{ iss }}</span>
                  </div>
                </td>
                <td class="px-space-md py-space-sm">
                  <div class="flex flex-col gap-0.5 text-[12px]">
                    <span :class="p.waiverAcceptedAt ? 'text-secondary' : 'text-on-surface-variant'">
                      {{ p.waiverAcceptedAt ? 'Reglamento aceptado' : 'Reglamento pendiente' }}
                    </span>
                    <template v-if="p.isMinor">
                      <span v-if="!p.minorIssues?.length" class="text-secondary">Menor: Rep. OK ({{ p.guardian?.name }})</span>
                      <span v-else class="text-error">Menor: Falta representante</span>
                    </template>
                  </div>
                </td>
                <td class="px-space-md py-space-sm">
                  <div class="flex flex-col items-start gap-1">
                    <span v-if="!p.activeSanctions?.length" class="text-on-surface-variant">Ninguna</span>
                    <span
                      v-for="s in p.activeSanctions"
                      :key="s.id"
                      class="rounded bg-error/20 px-1.5 py-0.5 text-[11px] text-error"
                    >
                      {{ SANCTION_TYPES[s.type] || s.type }}{{ s.gamesSuspended ? ` · ${s.gamesSuspended} PJ` : '' }}
                    </span>
                    <button type="button" class="btn-ghost px-2 py-0.5 text-[11px]" @click="sanctionPlayer(p.playerId)">Sancionar</button>
                  </div>
                </td>
                <td class="px-space-md py-space-sm">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-1">
                      <StatusChip v-if="p.identityDocument" :status="p.identityDocument.status" />
                      <span v-else class="text-[12px] text-on-surface-variant">Sin subir</span>
                    </div>
                    <div v-if="p.identityDocument && p.userId" class="flex flex-wrap gap-1">
                      <button type="button" class="btn-ghost px-2 py-0.5 text-[11px]" @click="openPlayerIdDoc(p.userId)">
                        Ver
                      </button>
                      <button
                        v-if="p.identityDocument.status !== 'VERIFIED'"
                        type="button"
                        class="btn-secondary px-2 py-0.5 text-[11px]"
                        :disabled="busy"
                        @click="reviewPlayerIdDoc(p, 'VERIFIED')"
                      >
                        Verificar
                      </button>
                      <button
                        v-if="p.identityDocument.status !== 'REJECTED'"
                        type="button"
                        class="btn-danger px-2 py-0.5 text-[11px]"
                        :disabled="busy"
                        @click="reviewPlayerIdDoc(p, 'REJECTED')"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Danger zone, at the very end: deleting is only possible while no game has a result (backend rule) -->
      <section v-if="canDelete" class="card mt-space-xl flex flex-col gap-space-sm border-error/40 p-space-md md:flex-row md:items-center md:justify-between">
        <p class="m-0 text-body-sm text-on-surface-variant">
          <strong class="text-error">Eliminar torneo:</strong> se borran sus inscripciones y partidos. No se puede deshacer.
        </p>
        <button type="button" class="btn-danger shrink-0" :disabled="busy" @click="deleteTournament">
          <span class="icon">delete</span> Eliminar torneo
        </button>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import tournamentsService from '@/services/tournaments'
import TournamentCover from '@/components/tournament/TournamentCover.vue'
import matchesService from '@/services/matches'
import usersService from '@/services/users'
import StatusChip from '@/components/ui/StatusChip.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import FixtureList from '@/components/tournament/FixtureList.vue'
import StandingsTable from '@/components/tournament/StandingsTable.vue'
import PaymentInfoFields from '@/components/tournament/PaymentInfoFields.vue'
import paymentsService from '@/services/payments'
import ratingsService from '@/services/ratings'
import { handleApiError } from '@/services/api'
import { useConfirm } from '@/composables/useConfirm'
import PlayoffBracket from '@/components/PlayoffBracket.vue'
import TournamentSanctions from '@/components/organizer/TournamentSanctions.vue'
import FixtureBuilder from '@/components/organizer/FixtureBuilder.vue'
import { PAYMENT_METHODS, PAYMENT_STATUS, RESCHEDULE_STATUS, emptyPaymentInfo, paymentInfoPayload, formatDate, PLAYOFF_OPTIONS, SANCTION_TYPES } from '@/utils/labels'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const id = route.params.id

const tabs = [
  { value: 'registrations', label: 'Inscripciones' },
  { value: 'fixture', label: 'Fixture' },
  { value: 'standings', label: 'Tabla' },
  { value: 'players', label: 'Jugadores' },
  { value: 'sanctions', label: 'Sanciones' }
]
const tab = ref('registrations')
const loading = ref(true)
const busy = ref(false)
const tournament = ref(null)
const uploadingBanner = ref(false)

const changeBanner = async e => {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  uploadingBanner.value = true
  try {
    const { data } = await tournamentsService.uploadBanner(file)
    tournament.value = { ...tournament.value, ...(await tournamentsService.setBanner(tournament.value.id, data.url)).data }
    toast.success('Portada actualizada')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo subir la portada'))
  } finally {
    uploadingBanner.value = false
  }
}
const registrations = ref([])
const matches = ref([])
const standings = ref([])
const rescheduleRequests = ref([])
const tournamentPlayers = ref([])
const playerTeamFilter = ref('ALL')
const paymentInfoForm = ref(emptyPaymentInfo())
const ratingSummary = ref(null)

const playerTeamOptions = computed(() => {
  const map = new Map()
  for (const p of tournamentPlayers.value) {
    if (p.teamId && !map.has(p.teamId)) {
      map.set(p.teamId, { id: p.teamId, name: p.teamName })
    }
  }
  return Array.from(map.values())
})

const filteredTournamentPlayers = computed(() => {
  if (playerTeamFilter.value === 'ALL') return tournamentPlayers.value
  return tournamentPlayers.value.filter(p => p.teamId === playerTeamFilter.value)
})

const approved = computed(() => registrations.value.filter(r => r.status === 'APPROVED'))
const pendingReschedulesCount = computed(() => rescheduleRequests.value.filter(r => r.status === 'PENDING').length)

// Same rules the backend enforces in generateFixtures, shown before the click
const fixtureBlocker = computed(() => {
  const min = tournament.value?.minTeams ?? 2
  if (approved.value.length < min) return `Se necesitan al menos ${min} equipos aprobados (hay ${approved.value.length}).`
  const notValid = approved.value.filter(r => r.roster?.status === 'NOT_VALIDATED')
  if (notValid.length) return `Planteles sin validar: ${notValid.map(r => r.team.name).join(', ')}.`
  const loose = tournament.value?.format === 'GROUPS' ? approved.value.filter(r => !r.groupName) : []
  if (loose.length) return `Equipos sin grupo: ${loose.map(r => r.team.name).join(', ')}.`
  return ''
})


const load = async () => {
  try {
    const [t, regs, ms, st, rr, pls] = await Promise.allSettled([
      tournamentsService.getById(id),
      tournamentsService.getRegistrations(id),
      matchesService.getByTournament(id),
      matchesService.getStandings(id),
      matchesService.getRescheduleRequests(id),
      tournamentsService.getPlayers(id)
    ])
    if (t.status === 'rejected') throw t.reason
    tournament.value = t.value.data
    paymentInfoForm.value = emptyPaymentInfo(tournament.value.paymentInfo)
    registrations.value = regs.status === 'fulfilled' ? regs.value.data : []
    matches.value = ms.status === 'fulfilled' ? ms.value.data.matches || [] : []
    standings.value = st.status === 'fulfilled' ? st.value.data.standings || [] : []
    rescheduleRequests.value = rr.status === 'fulfilled' ? rr.value.data || [] : []
    // The API nests the team; the table, the team filter and the sanctions form read flat fields
    tournamentPlayers.value = (pls.status === 'fulfilled' ? pls.value.data.players || [] : []).map(p => ({ ...p, playerId: p.id, teamId: p.team?.id, teamName: p.team?.name }))
    bracket.value = tournament.value.playoffTeams ? (await tournamentsService.getBracket(id).catch(() => ({ data: null }))).data : null
    ratingsService.getTournamentSummary(id).then(({ data }) => (ratingSummary.value = data)).catch(() => (ratingSummary.value = null))
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo cargar el torneo'))
  } finally {
    loading.value = false
  }
}

const run = async (action, okMessage) => {
  busy.value = true
  try {
    await action()
    toast.success(okMessage)
    await load()
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo completar la acción'))
  } finally {
    busy.value = false
  }
}

const review = (reg, decision) =>
  run(
    () => tournamentsService.processRegistration(id, { registrationId: reg.id, decision }),
    `${reg.team.name}: ${decision === 'APPROVED' ? 'aprobado' : 'rechazado'}`
  )

const savePaymentInfo = () => {
  const paymentInfo = paymentInfoPayload(paymentInfoForm.value)
  if (!paymentInfo) return toast.error('Llena los datos de al menos un método de pago')
  return run(() => tournamentsService.update(id, { paymentInfo }), 'Datos de pago guardados')
}

const viewReceipt = async payment => {
  try {
    await paymentsService.openReceipt(payment.id)
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo abrir el comprobante'))
  }
}

const reviewPayment = async (reg, status) => {
  const verified = status === 'VERIFIED'
  const note = await confirm({
    title: verified ? 'Verificar pago' : 'Rechazar pago',
    message: verified
      ? `Confirma que recibiste $${reg.payment.amount} de ${reg.team.name} (ref. ${reg.payment.reference}).`
      : `El capitán de ${reg.team.name} será notificado y podrá reenviar el pago.`,
    confirmText: verified ? 'Verificar' : 'Rechazar',
    danger: !verified,
    inputLabel: verified ? 'Nota (opcional)' : 'Motivo del rechazo (opcional)'
  })
  if (note === false) return
  await run(
    () => paymentsService.review(reg.payment.id, { status, ...(note && { note }) }),
    `Pago de ${reg.team.name} ${verified ? 'verificado' : 'rechazado'}`
  )
}

const resolveReschedule = async (req, status) => {
  const approved = status === 'APPROVED'
  const note = await confirm({
    title: approved ? 'Aprobar reprogramación' : 'Rechazar reprogramación',
    message: approved
      ? `El partido ${req.match.homeTeam.name} vs ${req.match.awayTeam.name} pasará al ${formatDate(req.proposedDate)} a las ${req.proposedTime}.`
      : `Se mantendrá la fecha y hora actuales del partido ${req.match.homeTeam.name} vs ${req.match.awayTeam.name}.`,
    confirmText: approved ? 'Aprobar' : 'Rechazar',
    danger: !approved,
    inputLabel: approved ? 'Nota para los capitanes (opcional)' : 'Motivo del rechazo (opcional)'
  })
  if (note === false) return
  await run(
    () => matchesService.resolveRescheduleRequest(req.id, { status, ...(note && { responseNote: note }) }),
    `Solicitud de reprogramación ${approved ? 'aprobada' : 'rechazada'}`
  )
}

const bracket = ref(null)
// "Sancionar" in the players tab opens the sanctions tab with that player chosen
const sanctionFor = ref('')
const sanctionPlayer = playerId => {
  sanctionFor.value = ''
  tab.value = 'sanctions'
  nextTick(() => (sanctionFor.value = playerId))
}
const hasPlayoffGames = computed(() => matches.value.some(x => x.phase))
// Regular season over, playoffs configured but not created yet
const needsPlayoffs = computed(() => Boolean(tournament.value?.playoffTeams) && !hasPlayoffGames.value && pendingCount.value === 0)
// With playoffs the champion is the winner of the final; without, the leader of the standings
const champion = computed(() => {
  if (!tournament.value?.playoffTeams) return standings.value[0] || null
  const id = bracket.value?.champion?.teamId
  return id ? standings.value.find(s => s.teamId === id) || { teamId: id, teamName: bracket.value.champion.name } : null
})
const generatePlayoffs = async () => {
  const ok = await confirm({
    title: 'Generar playoffs',
    message: `Clasifican los ${tournament.value.playoffTeams} primeros de la tabla y se crean los cruces (1.º vs último clasificado, y así). Las siguientes rondas se arman solas cuando se juegan las llaves.`,
    confirmText: 'Generar playoffs'
  })
  if (ok) run(() => tournamentsService.generatePlayoffs(id), 'Playoffs generados')
}
// ---------- General data (only before the tournament starts) ----------
const canEditData = computed(() => !['IN_PROGRESS', 'FINISHED', 'CANCELLED'].includes(tournament.value?.status))
const editForm = ref({})
const isoDay = d => (d ? new Date(d).toISOString().slice(0, 10) : '')
const fillEditForm = () => {
  const t = tournament.value
  editForm.value = {
    name: t.name,
    description: t.description || '',
    location: t.location,
    startDate: isoDay(t.startDate),
    endDate: isoDay(t.endDate),
    minTeams: t.minTeams,
    maxTeams: t.maxTeams,
    entryFee: Number(t.entryFee),
    quarterDuration: t.quarterDuration || 10
  }
}
const saveData = () => {
  const f = editForm.value
  if (f.minTeams > f.maxTeams) return toast.error('El mínimo de equipos no puede superar al máximo.')
  return run(
    () =>
      tournamentsService.update(id, {
        ...f,
        description: f.description || undefined,
        // Same as creation: the picked day at 00:00 UTC (dates render in UTC)
        startDate: new Date(f.startDate).toISOString(),
        endDate: new Date(f.endDate).toISOString()
      }),
    'Datos del torneo actualizados'
  )
}

const cancelTournament = async () => {
  const ok = await confirm({
    title: 'Cancelar torneo',
    message: `"${tournament.value.name}" pasa a Cancelado y los partidos sin jugar quedan cancelados. No se puede deshacer.`,
    confirmText: 'Cancelar torneo'
  })
  if (ok) run(() => tournamentsService.update(id, { status: 'CANCELLED' }), 'Torneo cancelado')
}

// ---------- Single match edit ----------
const editingMatch = ref(null)
const matchForm = ref({})
const editMatch = m => {
  editingMatch.value = m
  matchForm.value = { matchDate: isoDay(m.matchDate), matchTime: m.matchTime, venue: m.venue || '', status: ['SUSPENDED', 'CANCELLED'].includes(m.status) ? m.status : 'SCHEDULED' }
}
const saveMatch = async () => {
  const f = matchForm.value
  await run(
    () => matchesService.update(editingMatch.value.id, { ...f, matchDate: `${f.matchDate}T12:00:00.000Z` }),
    'Partido actualizado'
  )
  editingMatch.value = null
}

const setPlayoffs = value => run(() => tournamentsService.update(id, { playoffTeams: value }), 'Playoffs actualizados')

// Same rule as the backend: scheduled, live or suspended games keep the tournament open
const pendingCount = computed(() => matches.value.filter(x => ['SCHEDULED', 'IN_PROGRESS', 'SUSPENDED'].includes(x.status)).length)
const decidedCount = computed(() => matches.value.length - pendingCount.value)
const finishTournament = async () => {
  const champ = champion.value
  const ok = await confirm({
    title: 'Finalizar torneo',
    message: `${champ.teamName} queda campeón de "${tournament.value.name}"${tournament.value.playoffTeams ? ' (ganó la final)' : ` (1.º de la tabla con ${champ.points} pts)`}. El torneo pasa a Finalizado, se suma a su historial y a la zona, y se avisa a todos los equipos. No se puede deshacer.`,
    confirmText: 'Coronar campeón'
  })
  if (ok) run(() => tournamentsService.finish(id), `${champ.teamName} es campeón`)
}

const canDelete = computed(() => !matches.value.some(m => ['FINISHED', 'FORFEIT'].includes(m.status)))
const deleteTournament = async () => {
  const t = tournament.value
  const ok = await confirm({
    title: 'Eliminar torneo',
    message: `¿Seguro que quieres eliminar "${t.name}"? Se borran ${registrations.value.length} inscripciones y ${matches.value.length} partidos. No se puede deshacer.`,
    confirmText: 'Eliminar',
    danger: true
  })
  if (!ok) return
  busy.value = true
  try {
    await tournamentsService.delete(id)
    toast.success('Torneo eliminado')
    router.push('/app/organizer')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo eliminar el torneo'))
  } finally {
    busy.value = false
  }
}

const generateFixture = () => run(() => tournamentsService.generateFixtures(id), 'Fixture generado')

const toggleRequireIdVerification = checked =>
  run(
    () => tournamentsService.update(id, { requireIdVerification: Boolean(checked) }),
    checked ? 'Verificación de documento activada' : 'Verificación de documento desactivada'
  )

const openPlayerIdDoc = async userId => {
  try {
    const res = await usersService.fetchIdentityDocumentBlob(userId)
    const url = URL.createObjectURL(res.data)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo abrir el documento de identidad'))
  }
}

const reviewPlayerIdDoc = async (player, status) => {
  const verified = status === 'VERIFIED'
  const note = await confirm({
    title: verified ? 'Verificar documento de identidad' : 'Rechazar documento de identidad',
    message: verified
      ? `¿Confirmas que el documento de identidad de ${player.fullName} coincide con sus datos?`
      : `Indica el motivo por el que rechazas el documento de ${player.fullName}.`,
    confirmText: verified ? 'Verificar' : 'Rechazar',
    danger: !verified,
    input: verified ? null : { label: 'Motivo del rechazo', placeholder: 'Ej. Imagen borrosa o cédula vencida' }
  })
  if (note === false) return
  await run(
    () =>
      usersService.reviewIdentityDocument(player.userId, {
        status,
        ...(typeof note === 'string' && note.trim() ? { reviewNote: note.trim() } : {})
      }),
    verified ? 'Documento verificado' : 'Documento rechazado'
  )
}

onMounted(load)
</script>

<style scoped>
.close {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid rgb(var(--c-outline-variant) / 0.6);
  border-left: 6px solid rgb(var(--c-secondary));
  background: rgb(var(--c-surface-container));
}

.close--done {
  justify-content: flex-start;
}

.close__info {
  display: flex;
  min-width: 240px;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.close__label {
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--c-secondary));
}

.close__progress {
  font-family: var(--f-mono);
  font-size: 16px;
  font-weight: 700;
}

.close__track {
  display: block;
  max-width: 420px;
  height: 6px;
  background: rgb(var(--c-surface-container-highest));
}

.close__fill {
  display: block;
  height: 6px;
  background: rgb(var(--c-secondary));
}

.close__note {
  font-size: 14px;
  color: rgb(var(--c-on-surface-variant));
}

.close__crown {
  font-size: 44px;
  color: rgb(var(--c-secondary));
}

.close__champ {
  font-family: var(--f-display);
  font-size: 36px;
  line-height: 1;
  text-transform: uppercase;
  color: rgb(var(--c-secondary));
}

</style>
