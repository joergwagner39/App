import { NextRequest, NextResponse } from 'next/server'
import { hasValidPin, pinRequired } from '@/lib/auth'
import { kvEnabled, kvGetJson } from '@/lib/kv'
import { fetchOura, ouraConfigured } from '@/lib/oura'
import { demoData } from '@/lib/demo'
import type { WearableData } from '@/lib/wearables'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!hasValidPin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const status = { kv: kvEnabled(), pinRequired: pinRequired(), ouraConfigured: ouraConfigured() }
  const demo = demoData()
  if (!status.kv) return NextResponse.json({ ...demo, status } satisfies WearableData)

  let ouraError: string | undefined
  const [oura, garmin] = await Promise.all([
    ouraConfigured()
      ? fetchOura().catch((e: Error) => {
          console.error(e)
          ouraError = e.message
          return null
        })
      : Promise.resolve(null),
    kvGetJson<Omit<WearableData['garmin'], 'connected'>>('garmin:summary').catch(() => null),
  ])

  const body: WearableData = {
    demo: !oura && !garmin,
    oura: oura ? { connected: true, ...oura } : { ...demo.oura, sleep: [], readiness: [], error: ouraError },
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
