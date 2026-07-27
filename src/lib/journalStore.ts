import { promises as fs } from 'fs'
import path from 'path'

import { neon } from '@neondatabase/serverless'

import type { JournalEntry } from './journal'

/**
 * Serverseitige Ablage der Tagebucheinträge.
 *
 * Auf Vercel läuft das gegen Postgres (Vercel/Neon), lokal ohne DATABASE_URL
 * gegen eine JSON-Datei – so lässt sich alles ohne Datenbank ausprobieren.
 */

const LOCAL_FILE = path.join(process.cwd(), '.journal-data', 'entries.json')

function connectionString(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  )
}

export function storageMode(): 'postgres' | 'file' {
  return connectionString() ? 'postgres' : 'file'
}

/** Zeile, wie sie aus der Datenbank kommt. */
interface Row {
  date: string
  mood: number
  gratitude: unknown
  wins: string | null
  life_is_beautiful: string | null
  learned: string | null
  tomorrow: string | null
  notes: string | null
  updated_at: string | Date
}

function rowToEntry(row: Row): JournalEntry {
  const gratitude = Array.isArray(row.gratitude) ? row.gratitude.map(String) : []
  while (gratitude.length < 3) gratitude.push('')
  return {
    date: typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().slice(0, 10),
    mood: Number(row.mood),
    gratitude: gratitude.slice(0, 3),
    wins: row.wins ?? '',
    lifeIsBeautiful: row.life_is_beautiful ?? '',
    learned: row.learned ?? '',
    tomorrow: row.tomorrow ?? '',
    notes: row.notes ?? '',
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}

let schemaReady: Promise<void> | null = null

function sqlClient() {
  const url = connectionString()
  if (!url) throw new Error('Keine Datenbank konfiguriert')
  return neon(url)
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = sqlClient()
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS journal_entries (
        date DATE PRIMARY KEY,
        mood SMALLINT NOT NULL,
        gratitude JSONB NOT NULL DEFAULT '[]'::jsonb,
        wins TEXT NOT NULL DEFAULT '',
        life_is_beautiful TEXT NOT NULL DEFAULT '',
        learned TEXT NOT NULL DEFAULT '',
        tomorrow TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `.then(() => undefined)
  }
  await schemaReady
}

async function readFileEntries(): Promise<JournalEntry[]> {
  try {
    const raw = await fs.readFile(LOCAL_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as JournalEntry[]) : []
  } catch {
    return []
  }
}

async function writeFileEntries(entries: JournalEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
  await fs.writeFile(LOCAL_FILE, JSON.stringify(entries, null, 2), 'utf8')
}

export async function listEntries(): Promise<JournalEntry[]> {
  if (storageMode() === 'file') {
    const entries = await readFileEntries()
    return entries.sort((a, b) => a.date.localeCompare(b.date))
  }
  await ensureSchema()
  const sql = sqlClient()
  const rows = (await sql`
    SELECT to_char(date, 'YYYY-MM-DD') AS date, mood, gratitude, wins,
           life_is_beautiful, learned, tomorrow, notes, updated_at
    FROM journal_entries
    ORDER BY date ASC
  `) as unknown as Row[]
  return rows.map(rowToEntry)
}

export async function saveEntry(entry: JournalEntry): Promise<JournalEntry> {
  const stored: JournalEntry = { ...entry, updatedAt: new Date().toISOString() }

  if (storageMode() === 'file') {
    const entries = await readFileEntries()
    const next = entries.filter((e) => e.date !== stored.date)
    next.push(stored)
    next.sort((a, b) => a.date.localeCompare(b.date))
    await writeFileEntries(next)
    return stored
  }

  await ensureSchema()
  const sql = sqlClient()
  await sql`
    INSERT INTO journal_entries
      (date, mood, gratitude, wins, life_is_beautiful, learned, tomorrow, notes, updated_at)
    VALUES (
      ${stored.date}, ${stored.mood}, ${JSON.stringify(stored.gratitude)}::jsonb,
      ${stored.wins}, ${stored.lifeIsBeautiful}, ${stored.learned},
      ${stored.tomorrow}, ${stored.notes}, ${stored.updatedAt}
    )
    ON CONFLICT (date) DO UPDATE SET
      mood = EXCLUDED.mood,
      gratitude = EXCLUDED.gratitude,
      wins = EXCLUDED.wins,
      life_is_beautiful = EXCLUDED.life_is_beautiful,
      learned = EXCLUDED.learned,
      tomorrow = EXCLUDED.tomorrow,
      notes = EXCLUDED.notes,
      updated_at = EXCLUDED.updated_at
  `
  return stored
}

export async function deleteEntry(date: string): Promise<void> {
  if (storageMode() === 'file') {
    const entries = await readFileEntries()
    await writeFileEntries(entries.filter((e) => e.date !== date))
    return
  }
  await ensureSchema()
  const sql = sqlClient()
  await sql`DELETE FROM journal_entries WHERE date = ${date}`
}
