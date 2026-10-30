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
        <div class="grid gap-space-md sm:grid-cols-2">
          <div>
            <label class="field-label" for="team-home-color">Color uniforme local</label>
            <div class="flex items-center gap-space-xs">
              <input id="team-home-color" v-model="newTeam.homeColor" type="color" class="h-10 w-14 cursor-pointer rounded border border-solid border-outline-variant bg-transparent p-1" />
              <span class="font-stat-mono text-body-sm text-on-surface-variant">{{ newTeam.homeColor }}</span>
            </div>
          </div>
          <div>
            <label class="field-label" for="team-away-color">Color uniforme alterno</label>
            <div class="flex items-center gap-space-xs">
              <input id="team-away-color" v-model="newTeam.awayColor" type="color" class="h-10 w-14 cursor-pointer rounded border border-solid border-outline-variant bg-transparent p-1" />
              <span class="font-stat-mono text-body-sm text-on-surface-variant">{{ newTeam.awayColor }}</span>
            </div>
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
            <div class="mt-1 flex flex-wrap items-center gap-space-md text-body-sm text-on-surface-variant">
              <span>Capitán: <strong class="text-on-surface">{{ team.captain.fullName }}</strong></span>
              <span v-if="team.homeColor || team.awayColor" class="flex items-center gap-space-xs">
                <span class="icon text-[16px]">checkroom</span>
                <span v-if="team.homeColor" class="inline-flex items-center gap-1">
                  <span class="inline-block h-3.5 w-3.5 rounded-full border border-solid border-outline-variant" :style="{ backgroundColor: team.homeColor }" />
                  Local
                </span>
                <span v-if="team.awayColor" class="inline-flex items-center gap-1">
                  <span class="inline-block h-3.5 w-3.5 rounded-full border border-solid border-outline-variant" :style="{ backgroundColor: team.awayColor }" />
                  Alterno
                </span>
              </span>
            </div>
          </div>
          <div class=" flex shrink-0 flex-wrap items-center gap-space-xs">
            <button
              type="button"
              class="filter-chip"
              :aria-pressed="Boolean(team.lookingForPlayers)"
              :disabled="saving"
              @click="toggleRecruiting"
            >
              <span class="icon text-[18px]">person_search</span>
              {{ team.lookingForPlayers ? 'Buscando jugadores: Sí' : 'Buscando jugadores: No' }}
            </button>
            <button type="button" class="btn-secondary shrink-0" @click="openEdit">
              <span class="icon">edit</span> Editar equipo
            </button>
          </div>
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
          <div class="grid gap-space-md sm:grid-cols-2">
            <div>
              <label class="field-label" for="edit-home-color">Uniforme local</label>
              <div class="flex items-center gap-space-xs">
                <input id="edit-home-color" v-model="editTeam.homeColor" type="color" class="h-10 w-14 cursor-pointer rounded border border-solid border-outline-variant bg-transparent p-1" />
                <span class="font-stat-mono text-body-sm text-on-surface-variant">{{ editTeam.homeColor }}</span>
              </div>
            </div>
            <div>
              <label class="field-label" for="edit-away-color">Uniforme visitante / alterno</label>
              <div class="flex items-center gap-space-xs">
                <input id="edit-away-color" v-model="editTeam.awayColor" type="color" class="h-10 w-14 cursor-pointer rounded border border-solid border-outline-variant bg-transparent p-1" />
                <span class="font-stat-mono text-body-sm text-on-surface-variant">{{ editTeam.awayColor }}</span>
              </div>
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
            <div class="flex flex-wrap items-center gap-space-xs">
              <StatusChip :status="r.status" />
              <RosterChip v-if="team.roster" :roster="team.roster" />
              <StatusChip :status="r.tournament.status" />
              <button
                v-if="r.status === 'REJECTED' && r.tournament.status === 'REGISTRATION'"
                type="button"
                class="btn-secondary"
                :disabled="saving"
                @click="reRegister(r.tournament)"
              >
                <span class="icon">replay</span> Volver a inscribir
              </button>
            </div>
            <!-- Registration payment: only for tournaments with a fee and non-rejected registration -->
            <div
              v-if="Number(r.tournament.entryFee) > 0 && r.status !== 'REJECTED'"
              class="mt-space-xs flex flex-wrap items-center justify-between gap-space-xs border-0 border-t border-solid border-outline-variant/40 pt-space-sm"
            >
              <div class="flex flex-col gap-1">
                <StatusChip
                  :status="r.payment?.status || 'UNPAID'"
                  :label="r.payment ? PAYMENT_STATUS[r.payment.status] : `Pago pendiente · $${r.tournament.entryFee}`"
                />
                <span v-if="r.payment?.status === 'PENDING_REVIEW' && !r.payment.hasReceipt" class="text-body-sm text-on-surface-variant">Falta subir el comprobante</span>
                <span v-if="r.payment?.status === 'REJECTED' && r.payment.reviewNote" class="text-body-sm text-error">{{ r.payment.reviewNote }}</span>
              </div>
              <button
                v-if="r.payment?.status !== 'VERIFIED' && !['FINISHED', 'CANCELLED'].includes(r.tournament.status)"
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
        <div v-else class="flex flex-col gap-space-sm">
          <!-- Warning if suspended players exist for upcoming match -->
          <div
            v-if="suspendedPlayersList.length"
            role="alert"
            class="flex items-start gap-space-xs rounded border border-solid border-secondary/50 bg-secondary/10 p-space-sm text-body-sm text-secondary"
          >
            <span class="icon text-[18px]">gavel</span>
            <div>
              <strong>Jugadores suspendidos para el próximo partido:</strong>
              {{ suspendedPlayersList.map(p => `#${p.jerseyNumber} ${p.fullName}`).join(', ') }}.
            </div>
          </div>

          <div v-for="m in upcoming" :key="m.id" class="flex flex-col gap-1">
            <MatchCard :match="m" :mine="team.id" />

            <!-- Away captain uniform clash warning -->
            <div
              v-if="m.awayTeamId === team.id && hasUniformClash(m.homeTeam, m.awayTeam)"
              role="alert"
              class="flex items-center gap-space-xs rounded border border-solid border-secondary/50 bg-secondary/10 px-space-md py-space-xs text-body-sm text-secondary"
            >
              <span class="icon text-[18px]">checkroom</span>
              <span>
                Ambos equipos usan el mismo color principal ({{ m.homeTeam.homeColor }}). Como visitante debes usar tu
                <strong>uniforme alterno{{ team.awayColor ? ` (${team.awayColor})` : '' }}</strong>.
              </span>
            </div>

            <!-- Reschedule request bar -->
            <div class="card flex flex-wrap items-center justify-between gap-space-xs bg-surface-container-low px-space-md py-space-xs text-body-sm">
              <div v-if="latestReschedule(m)" class="flex flex-wrap items-center gap-space-xs">
                <StatusChip :status="latestReschedule(m).status" :label="RESCHEDULE_STATUS[latestReschedule(m).status]" />
                <span class="text-on-surface-variant">
                  Propuesta: <strong class="font-stat-mono text-on-surface">{{ formatDate(latestReschedule(m).proposedDate) }} · {{ latestReschedule(m).proposedTime }}</strong>
                </span>
                <span v-if="latestReschedule(m).responseNote" class="text-secondary">· {{ latestReschedule(m).responseNote }}</span>
              </div>
              <span v-else class="text-on-surface-variant">¿No pueden jugar en esta fecha u hora?</span>

              <button
                v-if="latestReschedule(m)?.status !== 'PENDING'"
                type="button"
                class="btn-ghost text-body-sm"
                @click="openReschedule(m)"
              >
                <span class="icon text-[18px]">edit_calendar</span> Pedir reprogramación
              </button>
            </div>

            <!-- Attendance list -->
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
                  <span class="flex min-w-0 items-center gap-space-xs truncate">
                    <strong v-if="pl.jerseyNumber != null" class="font-stat-mono">#{{ pl.jerseyNumber }}</strong>
                    <span class="truncate">{{ pl.fullName }}</span>
                    <StatusChip v-if="isPlayerSuspended(pl.playerId)" status="SUSPENDED" label="Suspendido" />
                  </span>
                  <span
                    class="label-tactical shrink-0 text-[11px]"
                    :class="attendanceBadgeClass(pl.status)"
                  >{{ attendanceStatusLabel(pl.status) }}</span>
                </div>
              </div>
            </details>
          </div>
        </div>

        <!-- Reschedule dialog -->
        <dialog ref="rescheduleDialog" class="card w-full max-w-md p-space-lg backdrop:bg-black/60">
          <form class="flex flex-col gap-space-md" @submit.prevent="submitReschedule">
            <h2 class="m-0 font-title-sm text-title-sm uppercase">Solicitar reprogramación</h2>
            <p v-if="rescheduleTarget" class="m-0 text-body-sm text-on-surface-variant">
              {{ rescheduleTarget.homeTeam.name }} vs {{ rescheduleTarget.awayTeam.name }} · J{{ rescheduleTarget.round }}
            </p>
            <div class="grid gap-space-md sm:grid-cols-2">
              <div>
                <label class="field-label" for="res-date">Nueva fecha *</label>
                <input id="res-date" v-model="rescheduleForm.proposedDate" type="date" class="input font-mono" :min="minRescheduleDate" required />
              </div>
              <div>
                <label class="field-label" for="res-time">Nueva hora *</label>
                <input id="res-time" v-model="rescheduleForm.proposedTime" type="time" class="input font-mono" required />
              </div>
            </div>
            <div>
              <label class="field-label" for="res-reason">Motivo *</label>
              <textarea
                id="res-reason"
                v-model.trim="rescheduleForm.reason"
                class="input"
                rows="3"
                required
                placeholder="Explica por qué solicitas cambiar la fecha u hora del partido…"
              />
            </div>
            <div class="flex justify-end gap-space-sm">
              <button type="button" class="btn-ghost" @click="rescheduleDialog.close()">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="saving || !rescheduleForm.proposedDate || !rescheduleForm.proposedTime || !rescheduleForm.reason">
                Enviar solicitud
              </button>
            </div>
          </form>
        </dialog>
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

      <!-- Join Requests from Free-Agent Players (Task 14) -->
      <section v-if="pendingJoinRequests.length">
        <SectionHeader title="Solicitudes para unirse" icon="person_add">
          <span class="label-tactical rounded bg-secondary-container px-space-sm py-1 text-on-secondary-container">
            {{ pendingJoinRequests.length }} pendiente(s)
          </span>
        </SectionHeader>
        <div class="grid gap-space-sm md:grid-cols-2">
          <article v-for="req in pendingJoinRequests" :key="req.id" class="card flex flex-col gap-space-sm p-space-md">
            <div class="flex items-start justify-between gap-space-sm">
              <div>
                <h3 class="m-0 font-title-sm text-title-sm">{{ req.playerUser?.fullName || 'Jugador' }}</h3>
                <p class="m-0 text-body-sm text-on-surface-variant">
                  {{ req.position ? positionLabel(req.position) : 'Sin posición' }}
                  <span v-if="req.jerseyNumber != null"> · Dorsal sugerido #{{ req.jerseyNumber }}</span>
                </p>
              </div>
              <StatusChip :status="req.status" />
            </div>
            <p v-if="req.message" class="m-0 text-body-sm italic text-on-surface-variant">"{{ req.message }}"</p>
            <div class="flex flex-wrap items-end gap-space-xs pt-1">
              <div class="w-24">
                <label class="field-label" :for="`jr-num-${req.id}`">Dorsal *</label>
                <input
                  :id="`jr-num-${req.id}`"
                  v-model.number="joinRequestNums[req.id]"
                  type="number"
                  min="0"
                  max="99"
                  class="input font-mono"
                />
              </div>
              <button
                type="button"
                class="btn-danger flex-1"
                :disabled="saving || rosterLocked"
                @click="resolveJoinReq(req, 'REJECTED')"
              >
                Rechazar
              </button>
              <button
                type="button"
                class="btn-primary flex-1"
                :disabled="saving || rosterLocked"
                @click="resolveJoinReq(req, 'APPROVED')"
              >
                Aceptar
              </button>
            </div>
          </article>
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
              <p class="m-0 flex flex-wrap items-center gap-space-xs truncate font-title-sm text-title-sm">
                {{ p.fullName }}
                <span v-if="p.isCaptain" class="label-tactical rounded bg-secondary-container/30 px-1 text-secondary">Cap</span>
                <span v-if="p.isUnclaimed" class="label-tactical rounded bg-tertiary/30 px-1.5 py-0.5 text-[11px] text-on-surface">
                  Sin reclamar
                </span>
                <StatusChip v-if="isPlayerSuspended(p.id)" status="SUSPENDED" label="Suspendido" />
              </p>
              <div class="flex flex-wrap items-center gap-x-space-md gap-y-0.5 text-body-sm text-on-surface-variant">
                <span class="label-tactical text-primary">{{ positionLabel(p.position) }}</span>
                <span v-if="p.jerseySize">Talla {{ p.jerseySize }}</span>
                <span v-if="p.phone">Tel: {{ p.phone }}</span>
                <span v-if="p.emergencyContactName || p.emergencyContactPhone">
                  Emergencia: {{ p.emergencyContactName || 'Contacto' }} {{ p.emergencyContactPhone || '' }}
                </span>
              </div>
              <p
                v-for="s in playerSanctionsOf(p.id)"
                :key="s.id"
                class="m-0 mt-0.5 text-body-sm text-secondary"
              >
                {{ SANCTION_TYPES[s.sanctionType] || s.sanctionType }}: {{ s.reason }}
                <span v-if="s.gamesSuspended"> ({{ s.gamesSuspended }} partido{{ s.gamesSuspended > 1 ? 's' : '' }})</span>
              </p>
            </div>
            <button
              v-if="p.isUnclaimed"
              type="button"
              class="btn-secondary text-body-sm"
              :disabled="saving"
              title="Generar link para que el jugador reclame su cuenta"
              @click="generateClaimLink(p)"
            >
              <span class="icon text-[18px]">vpn_key</span> Link cuenta
            </button>
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
import tournamentsService from '@/services/tournaments'
import matchesService from '@/services/matches'
import invitesService, { inviteUrl } from '@/services/invites'
import { CATEGORIES, PAYMENT_STATUS, POSITIONS, RESCHEDULE_STATUS, SANCTION_TYPES, formatDate, hasUniformClash, toOptions } from '@/utils/labels'
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
const activeSanctions = ref({ suspendedPlayerIds: [], sanctions: [] })
const editDialog = ref(null)
const editTeam = ref({ name: '', category: 'OPEN', city: '', homeColor: '#FF6B00', awayColor: '#FFFFFF' })
let logoFile = null
const editingPlayer = ref(null)
const playerForm = ref({ jerseyNumber: 0, position: 'BASE' })
const newTeam = ref({ name: '', category: 'OPEN', city: '', homeColor: '#FF6B00', awayColor: '#FFFFFF' })
const newStaff = ref({ fullName: '', role: 'COACH' })
const paymentDialog = ref(null)
const invites = ref([])
const newInvite = ref({ expiresInDays: 7, maxUses: null })
const joinRequests = ref([])
const joinRequestNums = ref({})

const pendingJoinRequests = computed(() => joinRequests.value.filter(r => r.status === 'PENDING'))

const rescheduleDialog = ref(null)
const rescheduleTarget = ref(null)
const rescheduleForm = ref({ proposedDate: '', proposedTime: '19:00', reason: '' })
const minRescheduleDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
})

const isPlayerSuspended = playerId => (activeSanctions.value.suspendedPlayerIds || []).includes(playerId)
const playerSanctionsOf = playerId => (activeSanctions.value.sanctions || []).filter(s => s.playerId === playerId)
const suspendedPlayersList = computed(() => players.value.filter(p => isPlayerSuspended(p.id)))
const latestReschedule = m => m.rescheduleRequests?.[0] || null

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
      teamsService
        .getTeamJoinRequests(team.value.id)
        .then(({ data }) => {
          joinRequests.value = data || []
          for (const r of joinRequests.value) {
            if (joinRequestNums.value[r.id] == null) {
              joinRequestNums.value[r.id] = r.jerseyNumber ?? 0
            }
          }
        })
        .catch(() => (joinRequests.value = []))
      teamsService
        .getActiveSanctions(team.value.id)
        .then(({ data }) => (activeSanctions.value = data || { suspendedPlayerIds: [], sanctions: [] }))
        .catch(() => (activeSanctions.value = { suspendedPlayerIds: [], sanctions: [] }))
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
  const { name, category, city, homeColor, awayColor } = newTeam.value
  return run(
    () => teamsService.create({ name, category, ...(city && { city }), ...(homeColor && { homeColor }), ...(awayColor && { awayColor }) }),
    'Equipo creado'
  )
}

const reRegister = async tournament => {
  const ok = await confirm({
    title: 'Volver a inscribir equipo',
    message: `¿Deseas volver a enviar la inscripción de "${team.value.name}" en "${tournament.name}"?`,
    confirmText: 'Volver a inscribir'
  })
  if (!ok) return
  await run(() => tournamentsService.registerTeam({ tournamentId: tournament.id, teamId: team.value.id }), `Reinscrito en ${tournament.name}`)
}

const addStaff = async () => {
  await run(() => teamsService.addStaff(team.value.id, newStaff.value), 'Cuerpo técnico actualizado')
  newStaff.value = { fullName: '', role: 'COACH' }
}

const openEdit = () => {
  const { name, category, city, homeColor, awayColor } = team.value
  editTeam.value = {
    name,
    category,
    city: city || '',
    homeColor: homeColor?.startsWith('#') ? homeColor : '#FF6B00',
    awayColor: awayColor?.startsWith('#') ? awayColor : '#FFFFFF'
  }
  logoFile = null
  editDialog.value.showModal()
}

const saveTeam = async () => {
  const { name, category, city, homeColor, awayColor } = editTeam.value
  await run(async () => {
    await teamsService.update(team.value.id, {
      name,
      category,
      ...(city && { city }),
      ...(homeColor && { homeColor }),
      ...(awayColor && { awayColor })
    })
    if (logoFile) {
      const fd = new FormData()
      fd.append('logo', logoFile)
      await teamsService.updateLogo(team.value.id, fd)
    }
  }, 'Equipo actualizado')
  editDialog.value?.close()
}

const openReschedule = m => {
  rescheduleTarget.value = m
  rescheduleForm.value = {
    proposedDate: minRescheduleDate.value,
    proposedTime: m.matchTime || '19:00',
    reason: ''
  }
  rescheduleDialog.value.showModal()
}

const submitReschedule = async () => {
  const m = rescheduleTarget.value
  if (!m) return
  await run(
    () => matchesService.requestReschedule(m.id, rescheduleForm.value),
    'Solicitud de reprogramación enviada al organizador'
  )
  rescheduleDialog.value?.close()
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

const toggleRecruiting = () =>
  run(
    () => teamsService.update(team.value.id, { lookingForPlayers: !team.value.lookingForPlayers }),
    !team.value.lookingForPlayers ? 'Equipo visible en búsqueda de jugadores' : 'Búsqueda de jugadores desactivada'
  )

const resolveJoinReq = async (req, status) => {
  const jerseyNumber = Number(joinRequestNums.value[req.id] ?? req.jerseyNumber ?? 0)
  await run(
    () =>
      teamsService.resolveJoinRequest(req.id, {
        status,
        ...(status === 'APPROVED' ? { jerseyNumber, position: req.position || 'BASE' } : {})
      }),
    status === 'APPROVED' ? 'Jugador incorporado al equipo' : 'Solicitud rechazada'
  )
}

const generateClaimLink = async p => {
  saving.value = true
  try {
    const res = await teamsService.createClaimLink(team.value.id, p.id)
    const link = `${window.location.origin}/claim/${res.data.token}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success(`Link de reclamación copiado para ${p.fullName}`)
    } catch {
      toast.info(`Link de reclamación: ${link}`)
    }
  } catch (error) {
    toast.error(handleApiError(error, 'No se pudo generar el link de reclamación'))
  } finally {
    saving.value = false
  }
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
