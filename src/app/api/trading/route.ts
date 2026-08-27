import { NextRequest, NextResponse } from 'next/server'
import { credentialsFromEnv, defaultConfig, getSnapshot } from '@/lib/trading/bot'
import { credentialsFromRequest, configFromRequest } from '@/lib/trading/requestContext'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const creds = credentialsFromEnv(credentialsFromRequest(request))
  const config = configFromRequest(request, defaultConfig(true))

  try {
    const snapshot = await getSnapshot(creds, config)
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('Trading-Snapshot fehlgeschlagen:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 },
    )
  }
}
