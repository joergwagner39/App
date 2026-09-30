/**
 * Minimaler Client für Upstash Redis / Vercel KV über die REST-API.
 * Aktiv, sobald KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV / Upstash-Integration)
 * oder UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN gesetzt sind.
 * Ohne diese Variablen gibt es keinen Server-Speicher; der Coach arbeitet dann
 * nur mit dem lokalen Speicher des jeweiligen Geräts.
 */

function config() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url: url.replace(/\/$/, ''), token } : null
}

export function kvEnabled(): boolean {
  return config() !== null
}

async function command<T>(args: string[]): Promise<T | null> {
  const cfg = config()
  if (!cfg) return null
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`KV ${args[0]} failed: ${res.status}`)
  const json = (await res.json()) as { result: T }
  return json.result
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const raw = await command<string | null>(['GET', key])
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function kvSetJson(key: string, value: unknown): Promise<void> {
  await command(['SET', key, JSON.stringify(value)])
}
