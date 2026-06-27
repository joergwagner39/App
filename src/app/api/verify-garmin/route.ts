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
    const profile = await garmin.getUserProfile()

    return NextResponse.json({
      valid: true,
      displayName: profile?.displayName ?? email,
    })
  } catch (e) {
    console.error('Garmin login error:', e)
    return NextResponse.json({
      valid: false,
      error: 'Login fehlgeschlagen — bitte Email und Passwort prüfen',
    })
  }
}
