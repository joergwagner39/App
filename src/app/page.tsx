'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO, addDays, subDays, subYears, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  BookHeart, LineChart as LineChartIcon, CalendarDays, Check, Loader2,
  Download, Upload, Flame, Sparkles, ArrowLeft, ArrowRight,
} from 'lucide-react'

import JournalEditor from '@/components/journal/JournalEditor'
import JournalTimeline from '@/components/journal/JournalTimeline'
import MoodTrendChart from '@/components/journal/MoodTrendChart'
import {
  MOOD_EMOJI, averageMood, currentStreak, emptyEntry, gratitudeHighlights,
  isEntryEmpty, loadEntries, moodColor, moodSeries, parseImport, saveEntries,
  todayKey, upsertEntry, type JournalEntry,
} from '@/lib/journal'
import {
  deleteRemote, fetchRemote, flushPending, getToken, merge, pushEntries,
  rememberPending, setToken, type SyncState,
} from '@/lib/journalSync'

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
  const [syncState, setSyncState] = useState<SyncState>('off')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [token, setTokenState] = useState('')
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
    setTokenState(getToken())
    setLoaded(true)
  }, [])

  /** Holt den Serverstand und führt ihn mit dem lokalen zusammen. */
  const syncNow = useCallback(async (activeToken: string) => {
    if (!activeToken) {
      setSyncState('off')
      return
    }
    setSyncState('syncing')
    setSyncError(null)
    try {
      const remote = await fetchRemote(activeToken)
      const local = loadEntries()
      const { merged, toPush } = merge(local, remote)
      saveEntries(merged)
      setEntries(merged)
      setDraft((current) => merged.find((e) => e.date === current.date) ?? current)
      await pushEntries(activeToken, toPush)
      await flushPending(activeToken, merged)
      setSyncState('ok')
    } catch (err) {
      setSyncState('error')
      setSyncError(err instanceof Error ? err.message : 'Abgleich fehlgeschlagen')
    }
  }, [])

  // Beim Start abgleichen und immer, wenn das Gerät wieder online geht
  useEffect(() => {
    if (!loaded || !token) return
    void syncNow(token)
    const onOnline = () => void syncNow(token)
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [loaded, token, syncNow])

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
  const handleDraftChange = useCallback(
    (next: JournalEntry) => {
      setDraft(next)
      setSaveState('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const stamped = { ...next, updatedAt: new Date().toISOString() }
        const removed = isEntryEmpty(stamped)
        setEntries((prev) => {
          const merged = removed
            ? prev.filter((e) => e.date !== stamped.date)
            : upsertEntry(prev, stamped)
          saveEntries(merged)
          return merged
        })
        setSaveState('saved')
        if (savedTimer.current) clearTimeout(savedTimer.current)
        savedTimer.current = setTimeout(() => setSaveState('idle'), 2500)

        // Der Server bekommt es danach – schlägt das fehl, wird es gemerkt
        if (token) {
          const request = removed
            ? deleteRemote(token, stamped.date)
            : pushEntries(token, [stamped])
          request.catch(() => {
            if (!removed) rememberPending(stamped.date)
            setSyncState('error')
          })
        }
      }, 800)
    },
    [token],
  )

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
      if (token) deleteRemote(token, date).catch(() => setSyncState('error'))
    },
    [activeDate, token],
  )

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `heute-war-schoen-${todayKey()}.json`
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
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
            Notizen bei Lampenlicht
          </p>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-gray-100 sm:text-3xl">
            <BookHeart className="text-emerald-400" size={28} />
            Heute war schön
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ein paar ruhige Minuten für den Tag – und eine Kurve, die zeigt, wohin es geht.
          </p>
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
                        f.entry.notes ||
                        f.entry.wins ||
                        'Eintrag ansehen'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* key: beim Tageswechsel startet der Editor mit frischem Aufklapp-Zustand */}
          <JournalEditor key={activeDate} entry={draft} onChange={handleDraftChange} />
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-100">Auf allen Geräten</h2>
              <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                <span
                  className={`h-2 w-2 rounded-full ${
                    syncState === 'ok'
                      ? 'bg-emerald-400'
                      : syncState === 'syncing'
                        ? 'bg-amber-400'
                        : syncState === 'error'
                          ? 'bg-red-400'
                          : 'bg-gray-600'
                  }`}
                />
                {syncState === 'ok' && 'abgeglichen'}
                {syncState === 'syncing' && 'gleicht ab …'}
                {syncState === 'error' && 'Abgleich gestört'}
                {syncState === 'off' && 'nur dieses Gerät'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Mit dem Kennwort aus den Servereinstellungen liegen deine Einträge auch in der
              Datenbank – dann siehst du auf dem iPad, was du am Laptop geschrieben hast.
              Ohne Kennwort bleibt alles wie bisher nur in diesem Browser.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <input
                type="password"
                value={token}
                onChange={(e) => setTokenState(e.target.value)}
                placeholder="Kennwort für den Abgleich"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 text-base text-gray-100 outline-none transition focus:border-emerald-500/60"
              />
              <button
                type="button"
                onClick={() => {
                  setToken(token)
                  void syncNow(token)
                }}
                className="rounded-xl border border-gray-700 px-4 py-3 text-sm text-gray-200 transition hover:border-emerald-500/60"
              >
                {token ? 'Verbinden & abgleichen' : 'Trennen'}
              </button>
            </div>
            {syncError && <p className="mt-3 text-sm text-red-400">{syncError}</p>}
          </section>

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
