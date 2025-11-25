<template>
    <div class="player-schedule">
        <v-row>
            <!-- Calendar Column -->
            <v-col cols="12" md="8">
                <v-card elevation="2" class="mb-6">
                    <v-toolbar color="surface" density="compact">
                        <v-btn icon @click="changeMonth(-1)">
                            <v-icon>mdi-chevron-left</v-icon>
                        </v-btn>
                        <v-toolbar-title class="text-center font-weight-bold">
                            {{ currentMonthName }} {{ currentYear }}
                        </v-toolbar-title>
                        <v-btn icon @click="changeMonth(1)">
                            <v-icon>mdi-chevron-right</v-icon>
                        </v-btn>
                    </v-toolbar>

                    <v-card-text>
                        <!-- Simple Calendar Grid Implementation -->
                        <div class="calendar-grid">
                            <div v-for="day in weekDays" :key="day"
                                class="text-center text-caption font-weight-bold py-2">
                                {{ day }}
                            </div>

                            <div v-for="(date, index) in calendarDays" :key="index" class="calendar-day" :class="{
                                'other-month': !date.isCurrentMonth,
                                'today': date.isToday,
                                'has-event': date.events.length > 0
                            }" @click="selectDate(date)">
                                <div class="day-number">{{ date.day }}</div>
                                <div v-if="date.events.length > 0" class="event-dots">
                                    <div v-for="event in date.events" :key="event.id" class="event-dot"
                                        :class="`bg-${event.color}`"></div>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Events List Column -->
            <v-col cols="12" md="4">
                <v-card elevation="2" class="h-100">
                    <v-card-title class="d-flex align-center">
                        Próximos Partidos
                        <v-spacer />
                        <v-chip size="small" color="primary" variant="outlined">
                            {{ selectedDate ? formatDate(selectedDate) : 'Todos' }}
                        </v-chip>
                    </v-card-title>

                    <v-card-text class="pa-0">
                        <v-list lines="two">
                            <template v-if="filteredEvents.length > 0">
                                <v-list-item v-for="event in filteredEvents" :key="event.id" :value="event"
                                    color="primary" class="py-3">
                                    <template #prepend>
                                        <div class="d-flex flex-column align-center mr-4 date-box">
                                            <span class="text-caption font-weight-bold text-uppercase">
                                                {{ getMonthShort(event.date) }}
                                            </span>
                                            <span class="text-h6 font-weight-bold">
                                                {{ getDayNumber(event.date) }}
                                            </span>
                                        </div>
                                    </template>

                                    <v-list-item-title class="font-weight-bold mb-1">
                                        {{ event.title }}
                                    </v-list-item-title>

                                    <v-list-item-subtitle class="d-flex align-center mb-1">
                                        <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                                        {{ event.time }}
                                    </v-list-item-subtitle>

                                    <v-list-item-subtitle class="d-flex align-center">
                                        <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                                        {{ event.location }}
                                    </v-list-item-subtitle>

                                    <template #append>
                                        <v-chip size="small" :color="event.color" variant="tonal">
                                            {{ event.type }}
                                        </v-chip>
                                    </template>
                                </v-list-item>
                            </template>

                            <div v-else class="text-center py-8 text-medium-emphasis">
                                <v-icon size="48" class="mb-2">mdi-calendar-blank</v-icon>
                                <p>No hay eventos programados</p>
                            </div>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { format, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

// State
const currentDate = ref(new Date())
const selectedDate = ref(null)

// Mock Events
const events = [
    {
        id: 1,
        title: 'vs Águilas Doradas',
        date: new Date(2025, 10, 20), // Nov 20 2025
        time: '15:00',
        location: 'Cancha Central',
        type: 'Partido',
        color: 'primary'
    },
    {
        id: 2,
        title: 'Entrenamiento',
        date: new Date(2025, 10, 22),
        time: '18:00',
        location: 'Gimnasio Norte',
        type: 'Práctica',
        color: 'success'
    }
]

// Calendar Logic
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const currentMonthName = computed(() => {
    return format(currentDate.value, 'MMMM', { locale: es })
        .charAt(0).toUpperCase() + format(currentDate.value, 'MMMM', { locale: es }).slice(1)
})

const currentYear = computed(() => format(currentDate.value, 'yyyy'))

const calendarDays = computed(() => {
    const start = startOfWeek(startOfMonth(currentDate.value))
    const end = endOfWeek(endOfMonth(currentDate.value))

    return eachDayOfInterval({ start, end }).map(date => ({
        date,
        day: format(date, 'd'),
        isCurrentMonth: isSameMonth(date, currentDate.value),
        isToday: isToday(date),
        events: events.filter(e => isSameDay(e.date, date))
    }))
})

const filteredEvents = computed(() => {
    if (selectedDate.value) {
        return events.filter(e => isSameDay(e.date, selectedDate.value))
    }
    // If no date selected, show upcoming events from current month
    return events.filter(e => isSameMonth(e.date, currentDate.value))
        .sort((a, b) => a.date - b.date)
})

// Methods
const changeMonth = (delta) => {
    currentDate.value = addMonths(currentDate.value, delta)
}

const selectDate = (dateObj) => {
    selectedDate.value = dateObj.date
}

const formatDate = (date) => {
    return format(date, "d 'de' MMMM", { locale: es })
}

const getMonthShort = (date) => {
    return format(date, 'MMM', { locale: es }).toUpperCase()
}

const getDayNumber = (date) => {
    return format(date, 'd')
}
</script>

<style scoped>
.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.calendar-day {
    aspect-ratio: 1;
    border-radius: 8px;
    padding: 4px;
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}

.calendar-day:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
}

.calendar-day.other-month {
    opacity: 0.3;
}

.calendar-day.today {
    border: 2px solid rgb(var(--v-theme-primary));
    font-weight: bold;
}

.day-number {
    font-size: 0.9rem;
}

.event-dots {
    display: flex;
    gap: 2px;
    margin-top: 4px;
}

.event-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

.date-box {
    background: rgba(var(--v-theme-surface-variant), 0.5);
    padding: 8px;
    border-radius: 8px;
    min-width: 60px;
}
</style>
