import { NextRequest, NextResponse } from 'next/server'
import { credentialsFromEnv, defaultConfig, runCycle } from '@/lib/trading/bot'
import { credentialsFromRequest, configFromRequest } from '@/lib/trading/requestContext'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Ein Durchlauf ruft pro Signal einmal Claude auf — das darf ein paar Sekunden dauern.
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const creds = credentialsFromEnv(credentialsFromRequest(request))
  const config = configFromRequest(request, defaultConfig(true))

  try {
    const result = await runCycle(creds, config)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Bot-Durchlauf fehlgeschlagen:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 },
    )
  }
}
