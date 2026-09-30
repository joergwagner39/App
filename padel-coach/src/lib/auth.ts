import type { NextRequest } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { kvEnabled, kvGetJson, kvSetJsonIfAbsent } from './kv'

/**
 * PIN-Schutz für alle API-Routen mit persönlichen Daten.
 * Die PIN kommt aus COACH_PIN (Vercel) oder wird beim ersten Öffnen in der App
 * festgelegt und als Hash im KV gespeichert. Ohne KV und ohne COACH_PIN
 * (z. B. lokal) sind die Routen offen.
 */
const PIN_KEY = 'coach:pinhash'

const hash = (pin: string) => createHash('sha256').update(`padel-coach:${pin}`).digest('hex')

async function storedHash(): Promise<string | null> {
  if (process.env.COACH_PIN) return hash(process.env.COACH_PIN)
  if (!kvEnabled()) return null
  return (await kvGetJson<string>(PIN_KEY).catch(() => null)) ?? null
}

export type PinState = 'open' | 'setup' | 'set'

/** open = kein Schutz möglich (lokal), setup = PIN muss noch festgelegt werden, set = PIN aktiv */
export async function pinState(): Promise<PinState> {
  if (await storedHash()) return 'set'
  return kvEnabled() ? 'setup' : 'open'
}

export async function hasValidPin(req: NextRequest): Promise<boolean> {
  const expected = await storedHash()
  if (!expected) return !kvEnabled()
  const given = req.headers.get('x-coach-pin') ?? req.nextUrl.searchParams.get('pin') ?? ''
  const a = Buffer.from(hash(given))
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Legt die PIN fest – nur möglich, solange noch keine existiert. */
export async function setupPin(pin: string): Promise<boolean> {
  if (process.env.COACH_PIN) return false
  // atomar: nur der erste Aufruf kann die PIN festlegen
  return kvSetJsonIfAbsent(PIN_KEY, hash(pin))
}
