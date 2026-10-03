import { differenceInCalendarDays, isPast, isValid, parseISO } from 'date-fns'
import { Player } from './types'

export function idCardStatus(player: Player): 'green' | 'red' {
  const { fileDataUrl, validUntil } = player.idCard
  if (!fileDataUrl) return 'red'
  if (!validUntil) return 'red'
  const date = parseISO(validUntil)
  if (!isValid(date)) return 'red'
  return isPast(date) ? 'red' : 'green'
}

// Erklärt, warum der Ausweis-Status rot ist (null wenn grün).
export function idCardReason(player: Player): string | null {
  const { fileDataUrl, validUntil } = player.idCard
  if (!fileDataUrl) return 'Kein Ausweis hochgeladen'
  if (!validUntil) return 'Kein Ablaufdatum eingetragen'
  const date = parseISO(validUntil)
  if (!isValid(date)) return 'Ablaufdatum ungültig'
  if (isPast(date)) return 'Ausweis abgelaufen'
  return null
}

// Rot nur, wenn wirklich nichts ausgewählt wurde. "Keine Versicherung" ist
// eine bewusste Auswahl (z.B. Jugendspieler) und zählt als grün.
export function insuranceStatus(player: Player): 'green' | 'red' {
  const { none, private: p, liability, sickPay, disability } = player.insurance
  return none || p || liability || sickPay || disability ? 'green' : 'red'
}

export function insuranceReason(player: Player): string | null {
  return insuranceStatus(player) === 'red' ? 'Keine Auswahl getroffen' : null
}

// Grün, wenn "noch nicht benötigt" gewählt ist, oder wenn für das
// zuletzt erfasste Jahr die Steuer als erledigt markiert ist – unabhängig
// davon, ob sie über uns läuft.
export function taxStatus(player: Player): 'green' | 'red' {
  if (player.tax.notNeeded) return 'green'
  if (player.tax.years.length === 0) return 'red'
  const latestYear = [...player.tax.years].sort((a, b) => b.year - a.year)[0]
  return latestYear.done ? 'green' : 'red'
}

export function taxReason(player: Player): string | null {
  if (player.tax.notNeeded) return null
  if (player.tax.years.length === 0) return 'Keine Auswahl getroffen – noch kein Jahr erfasst'
  const latestYear = [...player.tax.years].sort((a, b) => b.year - a.year)[0]
  return latestYear.done ? null : `Steuer ${latestYear.year} noch nicht erledigt`
}

// Zufriedenheit bis 5 gilt als kritisch.
export function satisfactionStatus(player: Player): 'green' | 'red' {
  return player.satisfaction <= 5 ? 'red' : 'green'
}

export function isCriticalSatisfaction(value: number): boolean {
  return value <= 5
}

export const CONTACT_THRESHOLD_DAYS = 14
export const VISIT_THRESHOLD_DAYS = 30

export function lastContactStatus(player: Player): 'green' | 'red' {
  if (!player.lastContact) return 'red'
  const date = parseISO(player.lastContact)
  if (!isValid(date)) return 'red'
  const days = differenceInCalendarDays(new Date(), date)
  return days <= CONTACT_THRESHOLD_DAYS ? 'green' : 'red'
}

export function lastPersonalVisitStatus(player: Player): 'green' | 'red' {
  if (!player.lastPersonalVisit) return 'red'
  const date = parseISO(player.lastPersonalVisit)
  if (!isValid(date)) return 'red'
  const days = differenceInCalendarDays(new Date(), date)
  return days <= VISIT_THRESHOLD_DAYS ? 'green' : 'red'
}

// Human-readable recency info: how many days since the last date, and how
// many days remain before it turns red (negative once already overdue).
export function describeRecency(
  isoDate: string | undefined,
  thresholdDays: number
): { daysAgo: number; daysRemaining: number } | null {
  if (!isoDate) return null
  const date = parseISO(isoDate)
  if (!isValid(date)) return null
  const daysAgo = differenceInCalendarDays(new Date(), date)
  return { daysAgo, daysRemaining: thresholdDays - daysAgo }
}

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function satisfactionCheckInDoneThisMonth(player: Player): boolean {
  return player.satisfactionHistory.some((h) => h.month === currentMonthKey())
}

// Days remaining until the 1st of the next month, when the next
// monthly satisfaction check-in is due.
export function daysUntilNextSatisfactionCheckIn(): number {
  const today = new Date()
  const nextFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  return differenceInCalendarDays(nextFirst, today)
}

export function openTodoCount(player: Player): number {
  return player.todos.filter((t) => !t.done).length
}

export function dueReminderCount(player: Player): number {
  const today = new Date()
  return player.todos.filter((t) => {
    if (t.done || !t.reminderDate) return false
    const d = parseISO(t.reminderDate)
    return isValid(d) && differenceInCalendarDays(d, today) <= 0
  }).length
}
