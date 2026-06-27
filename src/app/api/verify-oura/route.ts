import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false }, { status: 400 })

  try {
    const res = await fetch('https://api.ouraring.com/v2/usercollection/personal_info', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return NextResponse.json({ valid: false, status: res.status })
    const data = await res.json()
    return NextResponse.json({ valid: true, email: data.email })
  } catch {
    return NextResponse.json({ valid: false })
  }
}
