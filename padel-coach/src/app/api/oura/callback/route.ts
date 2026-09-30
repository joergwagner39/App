import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/oura'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const back = (result: string) => NextResponse.redirect(`${req.nextUrl.origin}/?oura=${encodeURIComponent(result)}`)

  if (!code || !state || state !== req.cookies.get('oura_state')?.value) return back('state_mismatch')
  try {
    await exchangeCode(code, `${req.nextUrl.origin}/api/oura/callback`)
  } catch (e) {
    console.error(e)
    return back('token_error')
  }
  const res = back('connected')
  res.cookies.delete('oura_state')
  return res
}
