import { NextRequest, NextResponse } from 'next/server'
import { hasValidPin } from '@/lib/auth'
import { kvEnabled, kvGetJson, kvSetJson } from '@/lib/kv'
import { emptyState, type CoachState } from '@/lib/coach/types'
import { mergeStates } from '@/lib/coach/engine'

export const dynamic = 'force-dynamic'

const KEY = 'coach:state'

// Geräteübergreifender Speicher für Check-ins, Quiz-Antworten und Einstellungen.
function guard(req: NextRequest): NextResponse | null {
  if (!hasValidPin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!kvEnabled()) return NextResponse.json({ error: 'sync_disabled' }, { status: 501 })
  return null
}

export async function GET(req: NextRequest) {
  const blocked = guard(req)
  if (blocked) return blocked
  return NextResponse.json((await kvGetJson<CoachState>(KEY)) ?? emptyState())
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
  if (!incoming || incoming.version !== 1 || typeof incoming.days !== 'object' || !incoming.settings) {
    return NextResponse.json({ error: 'invalid_state' }, { status: 400 })
  }
  const merged = mergeStates((await kvGetJson<CoachState>(KEY)) ?? emptyState(), incoming)
  await kvSetJson(KEY, merged)
  return NextResponse.json(merged)
}
