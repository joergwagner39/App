import { redirect } from 'next/navigation'
import { getCurrentUser, userCount } from './auth'
import { User } from './types'

/**
 * Sichert eine Seite ab. Ohne angelegten Benutzer geht es zur Ersteinrichtung,
 * ohne Anmeldung zum Login.
 */
export async function requireUser(): Promise<User> {
  if ((await userCount()) === 0) redirect('/scouting/einrichten')
  const user = await getCurrentUser()
  if (!user) redirect('/scouting/login')
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/scouting')
  return user
}
