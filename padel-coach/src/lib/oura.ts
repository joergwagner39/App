// Oura API v2 über OAuth. Tokens liegen im KV, damit jedes Gerät dieselben Daten sieht.
import { kvGetJson, kvSetJson } from './kv'
import type { OuraReadiness, OuraSleep } from './wearables'

const TOKEN_KEY = 'oura:token'
const API = 'https://api.ouraring.com/v2/usercollection'

interface StoredToken {
  access_token: string
  refresh_token?: string
  expires_at: number // ms
}

export function ouraConfigured(): boolean {
  return Boolean(process.env.OURA_CLIENT_ID && process.env.OURA_CLIENT_SECRET)
}

export async function exchangeCode(code: string, redirectUri: string): Promise<void> {
  const res = await fetch('https://api.ouraring.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.OURA_CLIENT_ID!,
      client_secret: process.env.OURA_CLIENT_SECRET!,
    }),
  })
  if (!res.ok) throw new Error(`Oura token exchange ${res.status}: ${(await res.text()).slice(0, 200)}`)
  await storeToken(await res.json())
}

async function storeToken(t: { access_token: string; refresh_token?: string; expires_in?: number }) {
  const stored: StoredToken = {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: Date.now() + (t.expires_in ?? 86_400) * 1000,
  }
  await kvSetJson(TOKEN_KEY, stored)
}

async function refresh(t: StoredToken): Promise<StoredToken | null> {
  if (!t.refresh_token) return null
  const res = await fetch('https://api.ouraring.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: t.refresh_token,
      client_id: process.env.OURA_CLIENT_ID!,
      client_secret: process.env.OURA_CLIENT_SECRET!,
    }),
  })
  if (!res.ok) return null
  const json = await res.json()
  // Oura gibt bei jedem Refresh einen neuen Refresh-Token aus – sofort speichern
  await storeToken(json)
  return kvGetJson<StoredToken>(TOKEN_KEY)
}

async function accessToken(): Promise<string | null> {
  let t = await kvGetJson<StoredToken>(TOKEN_KEY)
  if (!t) return null
  if (t.expires_at - Date.now() < 5 * 60_000) t = await refresh(t)
  return t?.access_token ?? null
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export async function fetchOura(): Promise<{ sleep: OuraSleep[]; readiness: OuraReadiness[] } | null> {
  const token = await accessToken()
  if (!token) return null
  // end_date ist exklusiv → morgen, damit die letzte Nacht dabei ist
  const q = `start_date=${isoDaysAgo(60)}&end_date=${isoDaysAgo(-1)}`
  const get = async (path: string) => {
    const res = await fetch(`${API}/${path}?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`Oura ${path} ${res.status}`)
    return ((await res.json()).data ?? []) as Record<string, unknown>[]
  }
  const [sleepPeriods, dailySleep, readiness] = await Promise.all([get('sleep'), get('daily_sleep'), get('daily_readiness')])

  const scoreByDay = new Map(dailySleep.map((d) => [d.day as string, d.score as number]))
  // Pro Tag die Hauptschlafphase (längste) verwenden
  const longest = new Map<string, Record<string, unknown>>()
  for (const s of sleepPeriods) {
    const day = s.day as string
    const cur = longest.get(day)
    if (!cur || ((s.total_sleep_duration as number) ?? 0) > ((cur.total_sleep_duration as number) ?? 0)) longest.set(day, s)
  }
  const sleep: OuraSleep[] = Array.from(longest.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, s]) => ({
      date: day,
      score: scoreByDay.get(day),
      totalSleepSeconds: s.total_sleep_duration as number | undefined,
      averageHrv: s.average_hrv as number | undefined,
      lowestHeartRate: s.lowest_heart_rate as number | undefined,
    }))

  return {
    sleep,
    readiness: readiness
      .map((r) => ({ date: r.day as string, score: r.score as number | undefined, temperatureDeviation: r.temperature_deviation as number | undefined }))
      .sort((a, b) => (a.date < b.date ? -1 : 1)),
  }
}
