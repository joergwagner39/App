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
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : '',
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
