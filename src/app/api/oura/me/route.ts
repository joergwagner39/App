import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('oura_token')?.value
  if (!token) return NextResponse.json({ connected: false })

  try {
    const res = await fetch('https://api.ouraring.com/v2/usercollection/personal_info', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return NextResponse.json({ connected: false })
    const data = await res.json()
    return NextResponse.json({ connected: true, email: data.email })
  } catch {
    return NextResponse.json({ connected: false })
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ disconnected: true })
  response.cookies.delete('oura_token')
  return response
}
