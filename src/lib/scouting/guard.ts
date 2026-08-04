import { redirect } from 'next/navigation'
import { getCurrentUser, userCount } from './auth'
import { User } from './types'

/**
 * Sichert eine Seite ab. Ohne angelegten Benutzer geht es zur Ersteinrichtung,
 * ohne Anmeldung zum Login.
 */
export function requireUser(): User {
  if (userCount() === 0) redirect('/scouting/einrichten')
  const user = getCurrentUser()
  if (!user) redirect('/scouting/login')
  return user
}

export function requireAdmin(): User {
  const user = requireUser()
  if (user.role !== 'admin') redirect('/scouting')
  return user
}
