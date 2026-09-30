import { NextRequest, NextResponse } from 'next/server'
import { kvEnabled, kvGetJson, kvSetJson } from '@/lib/kv'
import { emptyState, type CoachState } from '@/lib/coach/types'
import { mergeStates } from '@/lib/coach/engine'

export const dynamic = 'force-dynamic'

const KEY = 'coach:state'

/**
 * Geräteübergreifender Speicher für Check-ins & Quiz-Antworten.
 * Schutz über COACH_PIN (Header x-coach-pin). Ohne KV-Konfiguration: 501,
 * der Client bleibt dann bei localStorage.
 */
function authorized(req: NextRequest): boolean {
  const pin = process.env.COACH_PIN
  if (!pin) return false
  return req.headers.get('x-coach-pin') === pin
}

function guard(req: NextRequest): NextResponse | null {
  if (!kvEnabled()) return NextResponse.json({ error: 'sync_disabled' }, { status: 501 })
  if (!process.env.COACH_PIN) return NextResponse.json({ error: 'pin_not_configured' }, { status: 501 })
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return null
}

export async function GET(req: NextRequest) {
  const blocked = guard(req)
  if (blocked) return blocked
  const state = (await kvGetJson<CoachState>(KEY)) ?? emptyState()
  return NextResponse.json(state)
}

export async function PUT(req: NextRequest) {
  const blocked = guard(req)
  if (blocked) return blocked
  let incoming: CoachState
  try {
    incoming = (await req.json()) as CoachState
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!incoming || incoming.version !== 1 || typeof incoming.days !== 'object') {
    return NextResponse.json({ error: 'invalid_state' }, { status: 400 })
  }
  const current = (await kvGetJson<CoachState>(KEY)) ?? emptyState()
  const merged = mergeStates(current, incoming)
  await kvSetJson(KEY, merged)
  return NextResponse.json(merged)
}
