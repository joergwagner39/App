import type { NextRequest } from 'next/server'

/**
 * Einfacher PIN-Schutz für alle API-Routen mit persönlichen Daten.
 * Ohne gesetzte COACH_PIN (z. B. lokal) sind die Routen offen.
 */
export function pinRequired(): boolean {
  return Boolean(process.env.COACH_PIN)
}

export function hasValidPin(req: NextRequest): boolean {
  const pin = process.env.COACH_PIN
  if (!pin) return true
  const given = req.headers.get('x-coach-pin') ?? req.nextUrl.searchParams.get('pin')
  return given === pin
}
