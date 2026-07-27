import { normalize, type JournalEntry } from './journal'

/**
 * Abgleich mit der Ablage auf dem Server.
 *
 * Der Browser bleibt die schnelle Quelle: geschrieben wird immer zuerst
 * lokal, der Server bekommt es danach. Geht das schief (Funkloch, iPad im
 * Flugmodus), merkt sich `pending` das Datum und schickt es später nach.
 */

export const TOKEN_KEY = 'journal_sync_token'
const PENDING_KEY = 'journal_sync_pending'

export type SyncState = 'off' | 'syncing' | 'ok' | 'error'

export function getToken(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

function pending(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PENDING_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function setPending(dates: string[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(Array.from(new Set(dates))))
}

export function pendingCount(): number {
  return pending().length
}

function headers(token: string): HeadersInit {
  return { 'content-type': 'application/json', 'x-journal-token': token }
}

async function fail(res: Response): Promise<never> {
  let message = `Server antwortete mit ${res.status}`
  try {
    const body = await res.json()
    if (body?.error) message = body.error
  } catch {
    /* Antwort ohne JSON – dann bleibt die Standardmeldung */
  }
  throw new Error(message)
}

/** Holt alle Einträge vom Server. */
export async function fetchRemote(token: string): Promise<JournalEntry[]> {
  const res = await fetch('/api/journal', { headers: headers(token), cache: 'no-store' })
  if (!res.ok) await fail(res)
  const body = await res.json()
  const list = Array.isArray(body?.entries) ? body.entries : []
  return list.map(normalize).filter((e: JournalEntry | null): e is JournalEntry => e !== null)
}

/** Schickt Einträge zum Server. */
export async function pushEntries(token: string, entries: JournalEntry[]): Promise<void> {
  if (!entries.length) return
  const res = await fetch('/api/journal', {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ entries }),
  })
  if (!res.ok) await fail(res)
}

export async function deleteRemote(token: string, date: string): Promise<void> {
  const res = await fetch(`/api/journal?date=${date}`, {
    method: 'DELETE',
    headers: headers(token),
  })
  if (!res.ok) await fail(res)
}

/** Merkt sich einen Eintrag für den nächsten Versuch. */
export function rememberPending(date: string): void {
  setPending([...pending(), date])
}

/** Schickt liegengebliebene Einträge nach. Gibt zurück, wie viele offen blieben. */
export async function flushPending(token: string, entries: JournalEntry[]): Promise<number> {
  const dates = pending()
  if (!dates.length) return 0
  const toSend = entries.filter((e) => dates.includes(e.date))
  try {
    await pushEntries(token, toSend)
    // Einträge, die inzwischen gelöscht wurden, gelten ebenfalls als erledigt
    setPending([])
    return 0
  } catch {
    return dates.length
  }
}

/**
 * Führt lokale und entfernte Einträge zusammen: pro Tag gewinnt die zuletzt
 * geänderte Fassung. Zurück kommt die Zusammenführung und die Liste der
 * Einträge, die der Server noch nicht kennt.
 */
export function merge(
  local: JournalEntry[],
  remote: JournalEntry[],
): { merged: JournalEntry[]; toPush: JournalEntry[] } {
  const byDate = new Map<string, JournalEntry>()
  for (const entry of remote) byDate.set(entry.date, entry)

  const toPush: JournalEntry[] = []
  for (const entry of local) {
    const known = byDate.get(entry.date)
    if (!known) {
      byDate.set(entry.date, entry)
      toPush.push(entry)
    } else if (entry.updatedAt > known.updatedAt) {
      byDate.set(entry.date, entry)
      toPush.push(entry)
    }
  }

  const merged = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
  return { merged, toPush }
}
