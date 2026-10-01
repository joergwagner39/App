import { NextRequest, NextResponse } from 'next/server'
import { hasValidPin } from '@/lib/auth'
import { kvEnabled } from '@/lib/kv'
import { saveOAuthApp } from '@/lib/oura'

export const dynamic = 'force-dynamic'

// Client ID / Secret der Oura-App in der App hinterlegen (statt über Vercel)
export async function POST(req: NextRequest) {
  if (!(await hasValidPin(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!kvEnabled()) return NextResponse.json({ error: 'Server-Speicher fehlt' }, { status: 501 })
  const { clientId, clientSecret } = (await req.json().catch(() => ({}))) as { clientId?: string; clientSecret?: string }
  const id = clientId?.trim()
  const secret = clientSecret?.trim()
  if (!id || !secret || id.length < 8 || secret.length < 8) return NextResponse.json({ error: 'Client ID und Secret prüfen' }, { status: 400 })
  await saveOAuthApp({ clientId: id, clientSecret: secret })
  return NextResponse.json({ ok: true })
}
