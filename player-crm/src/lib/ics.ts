import { Todo } from './types'

function formatIcsDate(dateStr: string): string {
  // all-day event: YYYYMMDD
  return dateStr.replace(/-/g, '')
}

function escapeIcsText(text: string): string {
  return text.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
}

export function downloadTodoAsIcs(todo: Todo, playerName: string) {
  const date = todo.reminderDate || todo.dueDate
  if (!date) return

  const uid = `${todo.id}@player-relations-crm`
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const dtstart = formatIcsDate(date)
  const summary = escapeIcsText(`${playerName}: ${todo.text}`)
  const description = escapeIcsText(todo.details || '')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Player Relations CRM//DE',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : '',
    // Mit Empfänger wird der Termin beim Import zur Einladung, die das
    // Kalenderprogramm (Outlook/Google) per Mail verschickt.
    todo.reminderEmail
      ? `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${todo.reminderEmail}`
      : '',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT9H', // reminder at 9:00 on the day
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${todo.text.slice(0, 40).replace(/[^\w\-]+/g, '_')}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Öffnet das Mailprogramm mit vorausgefüllter Erinnerung. Ein echter
// zeitgesteuerter Versand wäre nur mit Server/Mail-Dienst möglich.
export function openReminderMail(todo: Todo, playerName: string) {
  const subject = `Erinnerung: ${playerName} – ${todo.text}`
  const lines = [
    `Erinnerung zu ${playerName}:`,
    '',
    todo.text,
    todo.details ? `\n${todo.details}` : '',
    todo.dueDate ? `\nZu erledigen bis: ${todo.dueDate}` : '',
    todo.reminderDate ? `Erinnerung am: ${todo.reminderDate}` : '',
  ].filter(Boolean)

  const href = `mailto:${encodeURIComponent(todo.reminderEmail ?? '')}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(lines.join('\n'))}`
  window.location.href = href
}
