import { NextRequest, NextResponse } from 'next/server'
import { hasValidPin } from '@/lib/auth'
import { saveOuraPat } from '@/lib/oura'
import { kvEnabled } from '@/lib/kv'

export const dynamic = 'force-dynamic'

// Oura Personal Access Token in der App hinterlegen (statt über Vercel)
export async function POST(req: NextRequest) {
  if (!(await hasValidPin(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!kvEnabled()) return NextResponse.json({ error: 'Server-Speicher fehlt' }, { status: 501 })
  const { token } = (await req.json().catch(() => ({}))) as { token?: string }
  const t = token?.trim()
  if (!t || t.length < 20) return NextResponse.json({ error: 'Token sieht ungültig aus' }, { status: 400 })
  // Token prüfen, bevor er gespeichert wird
  const res = await fetch('https://api.ouraring.com/v2/usercollection/personal_info', {
    headers: { Authorization: `Bearer ${t}` },
    signal: AbortSignal.timeout(8000),
  }).catch(() => null)
  if (!res || !res.ok) return NextResponse.json({ error: `Oura lehnt den Token ab (${res?.status ?? 'keine Verbindung'})` }, { status: 400 })
  await saveOuraPat(t)
  return NextResponse.json({ ok: true })
}
