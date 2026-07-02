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
  return player.insurance.valid ? 'green' : 'red'
}

export function satisfactionStatus(player: Player): 'green' | 'yellow' | 'red' {
  if (player.satisfaction >= 7) return 'green'
  if (player.satisfaction >= 4) return 'yellow'
  return 'red'
}

export function lastContactStatus(player: Player): 'green' | 'red' {
  if (!player.lastContact) return 'red'
  const date = parseISO(player.lastContact)
  if (!isValid(date)) return 'red'
  const days = differenceInCalendarDays(new Date(), date)
  return days <= 7 ? 'green' : 'red'
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
