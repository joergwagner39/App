import { NextRequest, NextResponse } from 'next/server'
import { hasValidPin, pinState } from '@/lib/auth'
import { kvEnabled, kvGetJson } from '@/lib/kv'
import { fetchOura, ouraConfigured, ouraOAuthConfigured } from '@/lib/oura'
import { demoData } from '@/lib/demo'
import type { WearableData } from '@/lib/wearables'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const pin = await pinState()
  if (pin === 'setup') return NextResponse.json({ error: 'pin_setup' }, { status: 401 })
  if (!(await hasValidPin(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const oura = await ouraConfigured()
  const status = { kv: kvEnabled(), pinRequired: pin === 'set', ouraConfigured: oura, ouraOAuth: ouraOAuthConfigured() }
  const demo = demoData()
  let ouraError: string | undefined
  const [ouraData, garmin] = await Promise.all([
    oura
      ? fetchOura().catch((e: Error) => {
          console.error(e)
          ouraError = e.message
          return null
        })
      : Promise.resolve(null),
    status.kv ? kvGetJson<Omit<WearableData['garmin'], 'connected'>>('garmin:summary').catch(() => null) : Promise.resolve(null),
  ])

  const body: WearableData = {
    demo: !ouraData && !garmin,
    oura: ouraData ? { connected: true, ...ouraData } : { ...demo.oura, sleep: [], readiness: [], error: ouraError },
    garmin: garmin ? { ...garmin, connected: true } : { connected: false, daily: [], activities: [] },
    status,
  }
  // Ganz ohne echte Daten Beispielwerte zeigen, damit die App nicht leer ist
  if (body.demo) {
    body.oura = { ...demo.oura, error: ouraError }
    body.garmin = demo.garmin
  }
  return NextResponse.json(body)
}
