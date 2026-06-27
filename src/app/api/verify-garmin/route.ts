import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ valid: false, error: 'Email und Passwort erforderlich' }, { status: 400 })
    }

    const { GarminConnect } = await import('garmin-connect')
    const garmin = new GarminConnect({ username: email, password })
    await garmin.login()

    let displayName = email
    try {
      const profile = await garmin.getUserProfile()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      displayName = (profile as any)?.displayName ?? (profile as any)?.userName ?? email
    } catch { /* profile optional */ }

    return NextResponse.json({ valid: true, displayName })
  } catch (e) {
    console.error('Garmin login error:', e)
    return NextResponse.json({
      valid: false,
      error: 'Login fehlgeschlagen — bitte Email und Passwort prüfen',
    })
  }
}
