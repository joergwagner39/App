'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Download, RotateCcw, Save } from 'lucide-react'
import MarktBriefing, { CARD_HEIGHT, CARD_WIDTH } from '@/components/MarktBriefing'
import { sampleBriefing, type Briefing } from '@/lib/briefing'

const today = () => new Date().toISOString().slice(0, 10)

export default function BriefingPage() {
  const cardRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [json, setJson] = useState(() => JSON.stringify(sampleBriefing, null, 2))
  const [dates, setDates] = useState<string[]>([])
  const [date, setDate] = useState(today)
  const [scale, setScale] = useState(0.3)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  const parsed = useMemo(() => {
    try {
      return { data: JSON.parse(json) as Briefing, error: null as string | null }
    } catch (e) {
      return { data: null, error: (e as Error).message }
    }
  }, [json])

  const [data, setData] = useState<Briefing>(sampleBriefing)
  useEffect(() => {
    if (parsed.data) setData(parsed.data)
  }, [parsed.data])

  const load = useCallback(async (wanted?: string) => {
    const res = await fetch(`/api/briefing${wanted ? `?date=${wanted}` : ''}`)
    const body = await res.json()
    setDates(body.dates ?? [])
    if (body.date) setDate(body.date)
    setJson(JSON.stringify(body.data, null, 2))
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  // Vorschau an die Breite der Bühne anpassen
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const fit = () => setScale(Math.min(stage.clientWidth / CARD_WIDTH, 0.55))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  async function download() {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const { toPng } = await import('html-to-image')
      const url = await toPng(cardRef.current, {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        pixelRatio: 1,
        cacheBust: true,
        style: { transform: 'none' },
      })
      const a = document.createElement('a')
      a.href = url
      a.download = `markt-briefing-${date}.png`
      a.click()
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!parsed.data) return
    const res = await fetch(`/api/briefing?date=${date}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    if (res.ok) {
      setSaved(date)
      setTimeout(() => setSaved(null), 2500)
      await load(date)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Markt Briefing</h1>
        <p className="mt-1 text-sm text-gray-400">
          Tages-Briefings aus <code className="text-gray-300">data/briefings/</code> – bearbeiten,
          speichern, als 1080 × 1920 PNG exportieren.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <section className="order-2 lg:order-1">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <select
              value={dates.includes(date) ? date : ''}
              onChange={(e) => {
                setDate(e.target.value || today())
                if (e.target.value) load(e.target.value)
              }}
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200"
            >
              <option value="">{date} (neu)</option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              onClick={download}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {busy ? 'Exportiere …' : 'PNG herunterladen'}
            </button>

            <button
              onClick={save}
              disabled={!parsed.data}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              {saved ? <Check className="h-4 w-4 text-emerald-400" /> : <Save className="h-4 w-4" />}
              {saved ? `Gespeichert (${saved})` : 'Speichern'}
            </button>

            <button
              onClick={() => setJson(JSON.stringify(sampleBriefing, null, 2))}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              Vorlage
            </button>
          </div>

          {parsed.error && (
            <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              JSON-Fehler: {parsed.error} – die Vorschau zeigt den letzten gültigen Stand.
            </p>
          )}

          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            spellCheck={false}
            className="h-[70vh] w-full resize-none rounded-xl border border-gray-800 bg-gray-950 p-4 font-mono text-xs leading-relaxed text-gray-200 outline-none focus:border-teal-600"
          />
        </section>

        <section ref={stageRef} className="order-1 lg:order-2">
          <div
            style={{ width: CARD_WIDTH * scale, height: CARD_HEIGHT * scale }}
            className="mx-auto overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10"
          >
            <div style={{ transform: `scale(${scale})` }} className="origin-top-left">
              <div ref={cardRef}>
                <MarktBriefing data={data} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
