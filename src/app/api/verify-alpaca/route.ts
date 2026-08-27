import { NextRequest, NextResponse } from 'next/server'
import { getAccount } from '@/lib/trading/alpaca'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const keyId = String(body.keyId ?? '')
  const secretKey = String(body.secretKey ?? '')
  if (!keyId || !secretKey) return NextResponse.json({ valid: false }, { status: 400 })

  try {
    const account = await getAccount({ keyId, secretKey })
    return NextResponse.json({
      valid: true,
      status: account.status,
      equity: account.equity,
      currency: account.currency,
    })
  } catch (error) {
    return NextResponse.json({
      valid: false,
      message: error instanceof Error ? error.message : 'Verbindung fehlgeschlagen',
    })
  }
}
