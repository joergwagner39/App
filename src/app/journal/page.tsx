'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO, addDays, subDays, subYears, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  BookHeart, LineChart as LineChartIcon, CalendarDays, Check, Loader2,
  Download, Upload, Flame, Sparkles, ArrowLeft, ArrowRight, Home,
} from 'lucide-react'
import Link from 'next/link'

import JournalEditor from '@/components/journal/JournalEditor'
import JournalTimeline from '@/components/journal/JournalTimeline'
import MoodTrendChart from '@/components/journal/MoodTrendChart'
import {
  MOOD_EMOJI, averageMood, currentStreak, emptyEntry, gratitudeHighlights,
  isEntryEmpty, loadEntries, moodColor, moodSeries, parseImport, saveEntries,
  todayKey, upsertEntry, type JournalEntry,
} from '@/lib/journal'

type Tab = 'heute' | 'verlauf' | 'eintraege'
type Range = 14 | 30 | 90 | null

const RANGES: { value: Range; label: string }[] = [
  { value: 14, label: '14 Tage' },
  { value: 30, label: '30 Tage' },
  { value: 90, label: '90 Tage' },
  { value: null, label: 'Alles' },
]

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold sm:text-3xl" style={color ? { color } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [activeDate, setActiveDate] = useState<string>(todayKey())
  const [draft, setDraft] = useState<JournalEntry>(() => emptyEntry(todayKey()))
  const [tab, setTab] = useState<Tab>('heute')
  const [range, setRange] = useState<Range>(30)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Beim ersten Rendern aus dem localStorage laden
  useEffect(() => {
    const stored = loadEntries()
    setEntries(stored)
    const today = todayKey()
    setActiveDate(today)
    setDraft(stored.find((e) => e.date === today) ?? emptyEntry(today))
    setLoaded(true)
  }, [])

  const openDate = useCallback(
    (date: string, list?: JournalEntry[]) => {
      const source = list ?? entries
      setActiveDate(date)
      setDraft(source.find((e) => e.date === date) ?? emptyEntry(date))
      setTab('heute')
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [entries],
  )

  // Autosave: 800ms nachdem die Tastatur ruhig ist
  const handleDraftChange = useCallback((next: JournalEntry) => {
    setDraft(next)
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setEntries((prev) => {
        const merged = isEntryEmpty(next)
          ? prev.filter((e) => e.date !== next.date)
          : upsertEntry(prev, next)
        saveEntries(merged)
        return merged
      })
      setSaveState('saved')
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaveState('idle'), 2500)
    }, 800)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  const handleDelete = useCallback(
    (date: string) => {
      setEntries((prev) => {
        const next = prev.filter((e) => e.date !== date)
        saveEntries(next)
        return next
      })
      if (date === activeDate) setDraft(emptyEntry(date))
    },
    [activeDate],
  )

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dankbarkeits-tagebuch-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [entries])

  const handleImport = useCallback(async (file: File) => {
    setImportError(null)
    try {
      const imported = parseImport(await file.text())
      setEntries((prev) => {
        // Importierte Einträge gewinnen bei gleichem Datum
        let merged = prev
        for (const entry of imported) merged = upsertEntry(merged, entry)
        saveEntries(merged)
        return merged
      })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import fehlgeschlagen')
    }
  }, [])

  const series = useMemo(() => moodSeries(entries, range), [entries, range])
  const rangeEntries = useMemo(() => {
    if (range === null) return entries
    const cutoff = subDays(new Date(), range - 1)
    return entries.filter((e) => parseISO(e.date) >= cutoff)
  }, [entries, range])
  const avg = useMemo(() => averageMood(rangeEntries), [rangeEntries])
  const avgAll = useMemo(() => averageMood(entries), [entries])
  const streak = useMemo(() => currentStreak(entries), [entries])
  const highlights = useMemo(() => gratitudeHighlights(entries), [entries])
  const best = useMemo(
    () => [...rangeEntries].sort((a, b) => b.mood - a.mood || b.date.localeCompare(a.date))[0],
    [rangeEntries],
  )

  // Rückblick: gleicher Tag vor einem Monat bzw. vor einem Jahr
  const flashbacks = useMemo(() => {
    const targets = [
      { label: 'Vor einem Monat', date: format(subMonths(new Date(), 1), 'yyyy-MM-dd') },
      { label: 'Vor einem Jahr', date: format(subYears(new Date(), 1), 'yyyy-MM-dd') },
    ]
    return targets
      .map((t) => ({ ...t, entry: entries.find((e) => e.date === t.date) }))
      .filter((t): t is { label: string; date: string; entry: JournalEntry } => Boolean(t.entry))
  }, [entries])

  const pastEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  )

  const isToday = activeDate === todayKey()
  const activeLabel = format(parseISO(activeDate), 'EEEE, dd. MMMM yyyy', { locale: de })

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'heute', label: isToday ? 'Heute Abend' : 'Eintrag', icon: <BookHeart size={17} /> },
    { id: 'verlauf', label: 'Stimmungsverlauf', icon: <LineChartIcon size={17} /> },
    { id: 'eintraege', label: `Einträge (${entries.length})`, icon: <CalendarDays size={17} /> },
  ]

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center text-gray-500">
        <Loader2 className="animate-spin" size={22} />
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 pb-24 pt-8 sm:px-6">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-semibold text-gray-100 sm:text-3xl">
              <BookHeart className="text-emerald-400" size={28} />
              Abendrückblick
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Ein paar ruhige Minuten für den Tag – und eine Kurve, die zeigt, wohin es geht.
            </p>
          </div>
          <Link
            href="/"
            className="hidden shrink-0 items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-400 transition hover:border-gray-600 hover:text-gray-200 sm:inline-flex"
          >
            <Home size={15} /> Dashboard
          </Link>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'heute' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-gray-900/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openDate(format(subDays(parseISO(activeDate), 1), 'yyyy-MM-dd'))}
                aria-label="Vorheriger Tag"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-gray-100"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-[13rem] text-center">
                <p className="font-medium text-gray-100">{activeLabel}</p>
                {!isToday && (
                  <button
                    type="button"
                    onClick={() => openDate(todayKey())}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    zurück zu heute
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = format(addDays(parseISO(activeDate), 1), 'yyyy-MM-dd')
                  if (next <= todayKey()) openDate(next)
                }}
                disabled={isToday}
                aria-label="Nächster Tag"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ArrowRight size={18} />
              </button>
            </div>

            <span className="flex items-center gap-2 text-xs text-gray-500">
              {saveState === 'saving' && (
                <>
                  <Loader2 size={14} className="animate-spin" /> speichert …
                </>
              )}
              {saveState === 'saved' && (
                <>
                  <Check size={14} className="text-emerald-400" /> gespeichert
                </>
              )}
              {saveState === 'idle' && 'Automatisch gespeichert – nur auf diesem Gerät'}
            </span>
          </div>

          {flashbacks.length > 0 && (
            <div className="space-y-2">
              {flashbacks.map((f) => (
                <button
                  key={f.date}
                  type="button"
                  onClick={() => openDate(f.date)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/30 px-4 py-3 text-left transition hover:border-emerald-500/40"
                >
                  <Sparkles size={18} className="shrink-0 text-amber-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs uppercase tracking-wide text-gray-500">
                      {f.label} · {MOOD_EMOJI[f.entry.mood]} {f.entry.mood}/10
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-gray-300">
                      {f.entry.gratitude.find((g) => g.trim()) ||
                        f.entry.wins ||
                        f.entry.lifeIsBeautiful ||
                        'Eintrag ansehen'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <JournalEditor entry={draft} onChange={handleDraftChange} />
        </div>
      )}

      {tab === 'verlauf' && (
        <div className="space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRange(r.value)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm transition ${
                  range === r.value
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<LineChartIcon size={14} />}
              label="Ø Stimmung"
              value={avg === null ? '–' : avg.toFixed(1)}
              sub={avgAll === null ? undefined : `insgesamt ${avgAll.toFixed(1)}`}
              color={avg === null ? undefined : moodColor(avg)}
            />
            <StatCard
              icon={<Flame size={14} />}
              label="Streak"
              value={`${streak}`}
              sub={streak === 1 ? 'Tag am Stück' : 'Tage am Stück'}
              color={streak > 0 ? '#f59e0b' : undefined}
            />
            <StatCard
              icon={<CalendarDays size={14} />}
              label="Einträge"
              value={`${rangeEntries.length}`}
              sub={`von insgesamt ${entries.length}`}
            />
            <StatCard
              icon={<Sparkles size={14} />}
              label="Bester Tag"
              value={best ? `${MOOD_EMOJI[best.mood]} ${best.mood}` : '–'}
              sub={best ? format(parseISO(best.date), 'dd. MMM yyyy', { locale: de }) : undefined}
            />
          </div>

          <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-100">Stimmung im Verlauf</h2>
            <MoodTrendChart data={series} average={avg} />
            <p className="mt-3 text-xs text-gray-500">
              Grün: Tageswert · Lila gestrichelt: gleitender 7-Tage-Schnitt – der zeigt den Trend
              deutlicher als einzelne Ausreißer.
            </p>
          </section>

          {highlights.length > 0 && (
            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-100">Wofür du oft dankbar bist</h2>
              <div className="flex flex-wrap gap-2">
                {highlights.map((h) => (
                  <span
                    key={h.text}
                    className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200"
                  >
                    {h.text}
                    {h.count > 1 && <span className="ml-1.5 text-emerald-400/70">×{h.count}</span>}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {tab === 'eintraege' && (
        <div className="space-y-5">
          <JournalTimeline entries={pastEntries} onEdit={(d) => openDate(d)} onDelete={handleDelete} />

          <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-100">Daten sichern</h2>
            <p className="mt-1 text-sm text-gray-500">
              Alles liegt nur lokal in diesem Browser. Ein Backup ab und zu schadet nicht –
              die Datei lässt sich auch auf einem anderen Gerät wieder importieren.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExport}
                disabled={!entries.length}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-3 text-sm text-gray-200 transition hover:border-emerald-500/60 disabled:opacity-40"
              >
                <Download size={16} /> Export (JSON)
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-3 text-sm text-gray-200 transition hover:border-emerald-500/60"
              >
                <Upload size={16} /> Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImport(file)
                  e.target.value = ''
                }}
              />
            </div>
            {importError && <p className="mt-3 text-sm text-red-400">{importError}</p>}
          </section>
        </div>
      )}
    </main>
  )
}
