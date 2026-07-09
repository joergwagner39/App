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

export function insuranceStatus(player: Player): 'green' | 'red' {
  const { private: p, liability, sickPay, disability } = player.insurance
  return p && liability && sickPay && disability ? 'green' : 'red'
}

export function taxStatus(player: Player): 'green' | 'red' {
  if (!player.tax.managedByUs) return 'red'
  if (player.tax.years.length === 0) return 'red'
  return player.tax.years.every((y) => y.done) ? 'green' : 'red'
}

// Zufriedenheit bis 5 gilt als kritisch.
export function satisfactionStatus(player: Player): 'green' | 'red' {
  return player.satisfaction <= 5 ? 'red' : 'green'
}

export function isCriticalSatisfaction(value: number): boolean {
  return value <= 5
}

export function lastContactStatus(player: Player): 'green' | 'red' {
  if (!player.lastContact) return 'red'
  const date = parseISO(player.lastContact)
  if (!isValid(date)) return 'red'
  const days = differenceInCalendarDays(new Date(), date)
  return days <= 7 ? 'green' : 'red'
}

export function lastPersonalVisitStatus(player: Player): 'green' | 'red' {
  if (!player.lastPersonalVisit) return 'red'
  const date = parseISO(player.lastPersonalVisit)
  if (!isValid(date)) return 'red'
  const days = differenceInCalendarDays(new Date(), date)
  return days <= 30 ? 'green' : 'red'
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
