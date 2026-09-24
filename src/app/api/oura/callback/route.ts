import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?oura_error=no_code`)
  }

  const clientId = process.env.OURA_CLIENT_ID!
  const clientSecret = process.env.OURA_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oura/callback`

  try {
    const res = await fetch('https://api.ouraring.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Oura token exchange failed:', err)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?oura_error=token_failed`)
    }

    const data = await res.json()
    const accessToken: string = data.access_token

    // Store token in httpOnly cookie (30 days)
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?oura_connected=1`)
    response.cookies.set('oura_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return response
  } catch (e) {
    console.error('Oura OAuth callback error:', e)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?oura_error=exception`)
  }
}
