import { NextRequest, NextResponse } from 'next/server'
import { pinState, setupPin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ state: await pinState() })
}

// Erste Einrichtung: PIN festlegen (nur solange noch keine gesetzt ist)
export async function POST(req: NextRequest) {
  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string }
  if (!pin || !/^\d{4,8}$/.test(pin)) return NextResponse.json({ error: 'PIN muss 4–8 Ziffern haben' }, { status: 400 })
  if ((await pinState()) !== 'setup') return NextResponse.json({ error: 'PIN ist bereits festgelegt' }, { status: 409 })
  const ok = await setupPin(pin)
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'PIN ist bereits festgelegt' }, { status: 409 })
}
