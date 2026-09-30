import { NextRequest, NextResponse } from 'next/server'
import { hasValidPin } from '@/lib/auth'
import { ouraOAuthConfigured } from '@/lib/oura'

export const dynamic = 'force-dynamic'

// Startet den Oura-Login. Aufruf aus der App: /api/oura/auth?pin=…
export async function GET(req: NextRequest) {
  if (!hasValidPin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!ouraOAuthConfigured()) return NextResponse.json({ error: 'OURA_CLIENT_ID/SECRET fehlen' }, { status: 501 })

  const state = crypto.randomUUID()
  const url = new URL('https://cloud.ouraring.com/oauth/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', process.env.OURA_CLIENT_ID!)
  url.searchParams.set('redirect_uri', `${req.nextUrl.origin}/api/oura/callback`)
  url.searchParams.set('scope', 'personal daily heartrate session workout')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url)
  res.cookies.set('oura_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' })
  return res
}
