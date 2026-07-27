import { format, parseISO, differenceInCalendarDays, subDays } from 'date-fns'

export interface JournalEntry {
  /** ISO-Datum (yyyy-MM-dd) – gleichzeitig der Primärschlüssel */
  date: string
  /** Stimmung des Tages von 1 (mies) bis 10 (großartig) */
  mood: number
  /** Drei Dinge, für die ich heute dankbar bin */
  gratitude: string[]
  /** Was heute gut geklappt hat */
  wins: string
  /** "Das Leben ist schön, weil ..." */
  lifeIsBeautiful: string
  /** Was ich heute gelernt habe */
  learned: string
  /** Worauf ich mich morgen freue */
  tomorrow: string
  /** Freies Feld für alles Übrige */
  notes: string
  updatedAt: string
}

export const STORAGE_KEY = 'gratitude_journal_entries'

export const MOOD_LABELS: Record<number, string> = {
  1: 'Sehr schwer',
  2: 'Schwer',
  3: 'Mau',
  4: 'Durchwachsen',
  5: 'Okay',
  6: 'Ganz gut',
  7: 'Gut',
  8: 'Richtig gut',
  9: 'Stark',
  10: 'Großartig',
}

export const MOOD_EMOJI: Record<number, string> = {
  1: '😞', 2: '😔', 3: '😕', 4: '😐', 5: '🙂',
  6: '😊', 7: '😃', 8: '😄', 9: '🤩', 10: '🥳',
}

/** Farbverlauf rot → gelb → grün für die Stimmungsskala */
export function moodColor(mood: number): string {
  const scale = [
    '#ef4444', '#f04f36', '#f97316', '#fb923c', '#facc15',
    '#eab308', '#a3e635', '#84cc16', '#4ade80', '#22c55e',
  ]
  return scale[Math.min(10, Math.max(1, Math.round(mood))) - 1]
}

export function emptyEntry(date: string): JournalEntry {
  return {
    date,
    mood: 7,
    gratitude: ['', '', ''],
    wins: '',
    lifeIsBeautiful: '',
    learned: '',
    tomorrow: '',
    notes: '',
    updatedAt: new Date().toISOString(),
  }
}

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isEntryEmpty(entry: JournalEntry): boolean {
  const texts = [
    ...entry.gratitude,
    entry.wins,
    entry.lifeIsBeautiful,
    entry.learned,
    entry.tomorrow,
    entry.notes,
  ]
  return texts.every((t) => !t.trim())
}

/** Migriert unbekannte/ältere Datensätze auf die aktuelle Form. */
export function normalize(raw: unknown): JournalEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Partial<JournalEntry>
  if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return null
  const gratitude = Array.isArray(e.gratitude) ? e.gratitude.map(String) : []
  while (gratitude.length < 3) gratitude.push('')
  return {
    date: e.date,
    mood: typeof e.mood === 'number' ? Math.min(10, Math.max(1, e.mood)) : 5,
    gratitude,
    wins: typeof e.wins === 'string' ? e.wins : '',
    lifeIsBeautiful: typeof e.lifeIsBeautiful === 'string' ? e.lifeIsBeautiful : '',
    learned: typeof e.learned === 'string' ? e.learned : '',
    tomorrow: typeof e.tomorrow === 'string' ? e.tomorrow : '',
    notes: typeof e.notes === 'string' ? e.notes : '',
    updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : new Date().toISOString(),
  }
}

export function loadEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalize)
      .filter((e): e is JournalEntry => e !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

export function saveEntries(entries: JournalEntry[]): void {
  if (typeof window === 'undefined') return
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))
}

export function upsertEntry(entries: JournalEntry[], entry: JournalEntry): JournalEntry[] {
  const next = entries.filter((e) => e.date !== entry.date)
  next.push({ ...entry, updatedAt: new Date().toISOString() })
  return next.sort((a, b) => a.date.localeCompare(b.date))
}

export function parseImport(json: string): JournalEntry[] {
  const parsed = JSON.parse(json)
  const list = Array.isArray(parsed) ? parsed : parsed?.entries
  if (!Array.isArray(list)) throw new Error('Kein gültiges Journal-Backup')
  const entries = list.map(normalize).filter((e): e is JournalEntry => e !== null)
  if (!entries.length) throw new Error('Keine Einträge in der Datei gefunden')
  return entries
}

/** Anzahl aufeinanderfolgender Tage bis heute (bzw. gestern, wenn heute noch offen). */
export function currentStreak(entries: JournalEntry[], today = todayKey()): number {
  const dates = new Set(entries.map((e) => e.date))
  let streak = 0
  let cursor = parseISO(today)
  if (!dates.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = subDays(cursor, 1)
    if (!dates.has(format(cursor, 'yyyy-MM-dd'))) return 0
  }
  while (dates.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }
  return streak
}

export function averageMood(entries: JournalEntry[]): number | null {
  if (!entries.length) return null
  return entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
}

export interface MoodPoint {
  date: string
  mood: number
  avg7: number | null
}

/**
 * Punkte für den Stimmungsverlauf inkl. 7-Tage-Schnitt.
 * Tage ohne Eintrag werden ausgelassen (die Linie verbindet die vorhandenen Punkte).
 */
export function moodSeries(entries: JournalEntry[], days: number | null): MoodPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const cutoff = days === null ? null : subDays(new Date(), days - 1)
  return sorted
    .map((entry, index) => {
      const window = sorted
        .slice(0, index + 1)
        .filter((e) => differenceInCalendarDays(parseISO(entry.date), parseISO(e.date)) < 7)
      const avg = window.length
        ? window.reduce((sum, e) => sum + e.mood, 0) / window.length
        : null
      return {
        date: entry.date,
        mood: entry.mood,
        avg7: avg === null ? null : Math.round(avg * 10) / 10,
      }
    })
    .filter((p) => cutoff === null || parseISO(p.date) >= cutoff)
}

/** Sammelt alle Dankbarkeits-Stichworte für die Wortwolke / "Häufig dankbar für". */
export function gratitudeHighlights(entries: JournalEntry[], limit = 12): { text: string; count: number }[] {
  const counts = new Map<string, { text: string; count: number }>()
  for (const entry of entries) {
    for (const item of entry.gratitude) {
      const text = item.trim()
      if (!text) continue
      const key = text.toLowerCase()
      const existing = counts.get(key)
      if (existing) existing.count += 1
      else counts.set(key, { text, count: 1 })
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
    .slice(0, limit)
}
