import { promises as fs } from 'fs'
import path from 'path'
import type { JournalEntry } from '@/types/trading'

// Das Handelstagebuch ist bewusst eine einfache JSON-Datei: keine Datenbank nötig,
// und man kann jederzeit reinschauen, was der Bot wann warum gemacht hat.
const JOURNAL_DIR = path.join(process.cwd(), 'data')
const JOURNAL_FILE = path.join(JOURNAL_DIR, 'trading-journal.json')
const MAX_ENTRIES = 500

export async function readJournal(): Promise<JournalEntry[]> {
  try {
    const raw = await fs.readFile(JOURNAL_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as JournalEntry[]) : []
  } catch {
    // Datei existiert noch nicht — beim ersten Lauf ist das der Normalfall.
    return []
  }
}

export async function appendJournal(entries: JournalEntry[]): Promise<JournalEntry[]> {
  if (entries.length === 0) return readJournal()
  const existing = await readJournal()
  const merged = [...entries, ...existing].slice(0, MAX_ENTRIES)
  try {
    await fs.mkdir(JOURNAL_DIR, { recursive: true })
    await fs.writeFile(JOURNAL_FILE, JSON.stringify(merged, null, 2), 'utf-8')
  } catch (error) {
    // Auf schreibgeschützten Hostings (z. B. serverless) fehlt der Schreibzugriff.
    console.error('Handelstagebuch konnte nicht gespeichert werden:', error)
  }
  return merged
}

export function makeEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
