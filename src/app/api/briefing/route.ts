import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { BRIEFING_DIR, listBriefingDates, loadBriefing } from '@/lib/briefingStore'
import { sampleBriefing } from '@/lib/briefing'

export const dynamic = 'force-dynamic'

/** GET /api/briefing?date=YYYY-MM-DD – ohne date das neueste Briefing. */
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? undefined
  const found = await loadBriefing(date)
  return NextResponse.json({
    date: found?.date ?? null,
    dates: await listBriefingDates(),
    data: found?.data ?? sampleBriefing,
  })
}

/**
 * POST /api/briefing?date=YYYY-MM-DD – schreibt data/briefings/<date>.json.
 * Gedacht für die lokale Bearbeitung; im Automatik-Betrieb legt die
 * Claude-Routine die Datei direkt im Repo ab.
 */
export async function POST(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Ungültiges Datum' }, { status: 400 })
  }
  const body = await request.json()
  try {
    await fs.mkdir(BRIEFING_DIR, { recursive: true })
    await fs.writeFile(path.join(BRIEFING_DIR, `${date}.json`), JSON.stringify(body, null, 2) + '\n', 'utf8')
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, date })
}
