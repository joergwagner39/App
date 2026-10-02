import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { kvEnabled, kvGetJson, kvSetJson, kvSetJsonIfAbsent } from '@/lib/kv'
import type { GarminActivity, GarminDaily, WearableData } from '@/lib/wearables'

export const dynamic = 'force-dynamic'

/**
 * Garmin-Daten von außen einspielen (z. B. tägliche Claude-Routine mit Garmin-Connector).
 * Nur Schreiben: Mit dem Schlüssel lassen sich keine Daten lesen.
 * Der Schlüssel wird einmalig festgelegt (PUT, nur solange noch keiner existiert)
 * und nur als Hash im KV gespeichert.
 */
const SUMMARY_KEY = 'garmin:summary'
const KEY_HASH = 'garmin:ingesthash'

type Summary = Omit<WearableData['garmin'], 'connected'>

const hash = (k: string) => createHash('sha256').update(`garmin-ingest:${k}`).digest('hex')

async function authorized(req: NextRequest): Promise<boolean> {
  const stored = await kvGetJson<string>(KEY_HASH).catch(() => null)
  const given = req.headers.get('x-ingest-key') ?? ''
  if (!stored || !given) return false
  const a = Buffer.from(hash(given))
  const b = Buffer.from(stored)
  return a.length === b.length && timingSafeEqual(a, b)
}

function mergeByDate<T extends { date: string }>(old: T[] = [], incoming: T[] = [], keep = 400): T[] {
  const map = new Map(old.map((d) => [d.date, d]))
  for (const d of incoming) if (d?.date) map.set(d.date, { ...map.get(d.date), ...d })
  return Array.from(map.values())
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-keep)
}

function mergeActivities(old: GarminActivity[] = [], incoming: GarminActivity[] = []): GarminActivity[] {
  const key = (a: GarminActivity) => `${a.date}|${a.activityType}|${Math.round(a.duration ?? 0)}`
  const map = new Map(old.map((a) => [key(a), a]))
  for (const a of incoming) if (a?.date) map.set(key(a), a)
  return Array.from(map.values())
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-300)
}

// Schlüssel einmalig festlegen
export async function PUT(req: NextRequest) {
  if (!kvEnabled()) return NextResponse.json({ error: 'Server-Speicher fehlt' }, { status: 501 })
  const { key } = (await req.json().catch(() => ({}))) as { key?: string }
  if (!key || key.length < 32) return NextResponse.json({ error: 'Schlüssel zu kurz' }, { status: 400 })
  const ok = await kvSetJsonIfAbsent(KEY_HASH, hash(key))
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Schlüssel existiert bereits' }, { status: 409 })
}

// Daten einspielen (wird mit dem Bestand zusammengeführt)
export async function POST(req: NextRequest) {
  if (!kvEnabled()) return NextResponse.json({ error: 'Server-Speicher fehlt' }, { status: 501 })
  if (!(await authorized(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: Partial<Summary>
  try {
    body = (await req.json()) as Partial<Summary>
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const prev = (await kvGetJson<Summary>(SUMMARY_KEY).catch(() => null)) ?? { daily: [], activities: [] }
  const next: Summary = {
    ...prev,
    daily: mergeByDate<GarminDaily>(prev.daily, Array.isArray(body.daily) ? body.daily : [], 90),
    activities: mergeActivities(prev.activities, Array.isArray(body.activities) ? body.activities : []),
    vo2history: mergeByDate(prev.vo2history, Array.isArray(body.vo2history) ? body.vo2history : []),
    vo2max: typeof body.vo2max === 'number' ? body.vo2max : prev.vo2max,
    trainingReadiness: typeof body.trainingReadiness === 'number' ? body.trainingReadiness : prev.trainingReadiness,
    syncedAt: new Date().toISOString(),
  }
  await kvSetJson(SUMMARY_KEY, next)
  return NextResponse.json({
    ok: true,
    daily: next.daily.length,
    activities: next.activities.length,
    vo2history: next.vo2history?.length ?? 0,
    vo2max: next.vo2max,
  })
}
