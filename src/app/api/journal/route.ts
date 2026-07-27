import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

import { normalize, type JournalEntry } from '@/lib/journal'
import { deleteEntry, listEntries, saveEntry, storageMode } from '@/lib/journalStore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Das Tagebuch ist privat. Ohne gesetztes JOURNAL_TOKEN antwortet die API
 * bewusst gar nicht – lieber kein Sync als ein offen lesbares Tagebuch.
 */
function authorized(request: Request): boolean {
  const expected = process.env.JOURNAL_TOKEN
  if (!expected) return false
  const provided = request.headers.get('x-journal-token') ?? ''
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function guard(request: Request): NextResponse | null {
  if (!process.env.JOURNAL_TOKEN) {
    return NextResponse.json(
      { error: 'Sync ist nicht eingerichtet: JOURNAL_TOKEN fehlt auf dem Server.' },
      { status: 501 },
    )
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Falsches oder fehlendes Kennwort.' }, { status: 401 })
  }
  return null
}

export async function GET(request: Request) {
  const denied = guard(request)
  if (denied) return denied
  try {
    const entries = await listEntries()
    return NextResponse.json({ entries, storage: storageMode() })
  } catch (err) {
    console.error('Journal GET fehlgeschlagen', err)
    return NextResponse.json({ error: 'Einträge konnten nicht geladen werden.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const denied = guard(request)
  if (denied) return denied
  try {
    const body = await request.json()
    const incoming: unknown[] = Array.isArray(body?.entries)
      ? body.entries
      : [body?.entry ?? body]
    const valid = incoming
      .map(normalize)
      .filter((e): e is JournalEntry => e !== null)
    if (!valid.length) {
      return NextResponse.json({ error: 'Kein gültiger Eintrag im Aufruf.' }, { status: 400 })
    }
    for (const entry of valid) await saveEntry(entry)
    return NextResponse.json({ saved: valid.length })
  } catch (err) {
    console.error('Journal PUT fehlgeschlagen', err)
    return NextResponse.json({ error: 'Eintrag konnte nicht gespeichert werden.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const denied = guard(request)
  if (denied) return denied
  const date = new URL(request.url).searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Datum fehlt oder ist ungültig.' }, { status: 400 })
  }
  try {
    await deleteEntry(date)
    return NextResponse.json({ deleted: date })
  } catch (err) {
    console.error('Journal DELETE fehlgeschlagen', err)
    return NextResponse.json({ error: 'Eintrag konnte nicht gelöscht werden.' }, { status: 500 })
  }
}
