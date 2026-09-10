'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, RotateCcw } from 'lucide-react'
import MarktBriefing, { CARD_HEIGHT, CARD_WIDTH } from '@/components/MarktBriefing'
import { sampleBriefing, type Briefing } from '@/lib/briefing'

export default function BriefingPage() {
  const cardRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [json, setJson] = useState(() => JSON.stringify(sampleBriefing, null, 2))
  const [scale, setScale] = useState(0.3)
  const [busy, setBusy] = useState(false)

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
      a.download = `markt-briefing-${new Date().toISOString().slice(0, 10)}.png`
      a.click()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Markt Briefing Generator</h1>
        <p className="mt-1 text-sm text-gray-400">
          Inhalte links bearbeiten, rechts live sehen, als 1080 × 1920 PNG für die Story exportieren.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        {/* Editor */}
        <section className="order-2 lg:order-1">
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={download}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {busy ? 'Exportiere …' : 'PNG herunterladen'}
            </button>
            <button
              onClick={() => setJson(JSON.stringify(sampleBriefing, null, 2))}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              Beispiel zurücksetzen
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

        {/* Vorschau */}
        <section ref={stageRef} className="order-1 lg:order-2">
          <div
            style={{ width: CARD_WIDTH * scale, height: CARD_HEIGHT * scale }}
            className="mx-auto overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10"
          >
            <div
              style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
              className="origin-top-left"
            >
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
