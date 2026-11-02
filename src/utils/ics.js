// iCalendar export of matches so players can add them to their phone calendar.
// Times are "floating" (no timezone): the device shows them at the local hour the organizer set.

const escape = text => String(text ?? '').replace(/\\/g, '\\\\').replace(/([;,])/g, '\\$1').replace(/\r?\n/g, '\\n')

// ponytail: fixed 2h slot; use a real end time if matches ever store one
const MATCH_HOURS = 2

const stamp = (day, time, addHours = 0) => {
  const [h, m] = (time || '00:00').split(':').map(Number)
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10), h + addHours, m))
  return d.toISOString().replace(/[-:]/g, '').slice(0, 15)
}

export const buildIcs = matches => {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Basketball//Partidos//ES', 'CALSCALE:GREGORIAN']
  for (const m of matches) {
    const day = m.matchDate.slice(0, 10)
    lines.push(
      'BEGIN:VEVENT',
      `UID:match-${m.id}@basketball`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART:${stamp(day, m.matchTime)}`,
      `DTEND:${stamp(day, m.matchTime, MATCH_HOURS)}`,
      `SUMMARY:${escape(`${m.homeTeam?.name} vs ${m.awayTeam?.name}`)}`,
      `LOCATION:${escape(m.venue || 'Cancha por definir')}`,
      `DESCRIPTION:${escape(`${m.tournament?.name || ''} · Jornada ${m.round}`)}`,
      'END:VEVENT'
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export const downloadIcs = (filename, matches) => {
  const url = URL.createObjectURL(new Blob([buildIcs(matches)], { type: 'text/calendar;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
