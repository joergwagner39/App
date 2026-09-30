'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Point } from '@/lib/coach/metrics'

// Farben (dunkles Theme): Serie = Blau, Nebensachen = Grau, Status fest reserviert
export const VIZ = {
  series: '#3987e5',
  seriesSoft: '#1c5cab',
  muted: '#64748b',
  grid: '#1f2937',
  text: '#94a3b8',
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
}

const fmtDate = (d: string, pattern = 'dd. MMM') => format(new Date(`${d}T12:00:00`), pattern, { locale: de })
const fmt = (v: number, decimals: number) => v.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/** Mini-Verlauf für Kacheln: grau, letzter Punkt in der Akzentfarbe. */
export function Sparkline({ points, height = 28 }: { points: Point[]; height?: number }) {
  if (points.length < 2) return <div style={{ height }} />
  const W = 100
  const vals = points.map((p) => p.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const x = (i: number) => (i / (points.length - 1)) * (W - 4) + 2
  const y = (v: number) => height - 3 - ((v - min) / span) * (height - 6)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden>
      <path d={d} fill="none" stroke={VIZ.muted} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(last.value)} r="2.5" fill={VIZ.series} />
    </svg>
  )
}

/** Liniendiagramm mit Fadenkreuz-Tooltip. Eine Serie, optionale Ziellinie. */
export function LineChart({
  points,
  unit,
  decimals = 0,
  target,
  targetLabel = 'Ziel',
  height = 180,
  label,
}: {
  points: Point[]
  unit?: string
  decimals?: number
  target?: number
  targetLabel?: string
  height?: number
  label: string
}) {
  const ref = useRef<SVGSVGElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [W, setW] = useState(600)
  // In echter Pixelbreite zeichnen, damit Schrift und Linien nicht verzerrt werden
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  if (points.length < 2)
    return <p className="text-sm text-gray-500 py-6 text-center">Noch zu wenige Daten für einen Verlauf.</p>

  const PAD = { l: 36, r: 12, t: 12, b: 22 }
  const vals = points.map((p) => p.value).concat(target !== undefined ? [target] : [])
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  const pad = (max - min) * 0.15 || 1
  min -= pad
  max += pad
  const t0 = new Date(`${points[0].date}T12:00:00`).getTime()
  const t1 = new Date(`${points[points.length - 1].date}T12:00:00`).getTime()
  const x = (d: string) => PAD.l + ((new Date(`${d}T12:00:00`).getTime() - t0) / (t1 - t0 || 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (height - PAD.t - PAD.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const ticks = [min + pad, (min + max) / 2, max - pad]

  function onMove(e: React.PointerEvent) {
    const rect = ref.current!.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    points.forEach((p, i) => {
      if (Math.abs(x(p.date) - px) < Math.abs(x(points[best].date) - px)) best = i
    })
    setHover(best)
  }

  const h = hover !== null ? points[hover] : null
  const hx = h ? (x(h.date) / W) * 100 : 0

  return (
    <div className="relative" ref={wrap}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${height}`}
        className="w-full touch-none"
        style={{ height }}
        role="img"
        aria-label={`${label}: Verlauf von ${fmtDate(points[0].date)} bis ${fmtDate(points[points.length - 1].date)}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={VIZ.grid} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill={VIZ.text}>
              {fmt(t, decimals)}
            </text>
          </g>
        ))}
        {target !== undefined && (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(target)} y2={y(target)} stroke={VIZ.good} strokeDasharray="6 5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <text x={W - PAD.r} y={y(target) - 5} textAnchor="end" fontSize="11" fill={VIZ.text}>
              {targetLabel} {fmt(target, decimals)}
            </text>
          </g>
        )}
        <path d={path} fill="none" stroke={VIZ.series} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {h && <line x1={x(h.date)} x2={x(h.date)} y1={PAD.t} y2={height - PAD.b} stroke={VIZ.text} strokeWidth="1" vectorEffect="non-scaling-stroke" />}
        <text x={PAD.l} y={height - 5} fontSize="11" fill={VIZ.text}>
          {fmtDate(points[0].date)}
        </text>
        <text x={W - PAD.r} y={height - 5} textAnchor="end" fontSize="11" fill={VIZ.text}>
          {fmtDate(points[points.length - 1].date)}
        </text>
      </svg>
      {/* Punkte als HTML, damit sie trotz preserveAspectRatio rund bleiben */}
      {h && (
        <>
          <span
            className="pointer-events-none absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 ring-2 ring-[#0a0f1e]"
            style={{ left: `${hx}%`, top: y(h.value), background: VIZ.series }}
          />
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-gray-950/95 border border-gray-700 px-2 py-1 text-xs text-gray-100 whitespace-nowrap"
            style={{ left: `${Math.min(88, Math.max(12, hx))}%` }}
          >
            <span className="text-gray-400">{fmtDate(h.date, 'EE dd. MMM')}</span> · <span className="font-semibold">{fmt(h.value, decimals)}</span>
            {unit && <span className="text-gray-400"> {unit}</span>}
          </div>
        </>
      )}
    </div>
  )
}

/** Wochen-Balken: Gesamtminuten, davon intensive Minuten (gestapelt). */
export function WeekBars({ weeks }: { weeks: { weekStart: string; minutes: number; intenseMinutes: number; sessions: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(60, ...weeks.map((w) => w.minutes))
  const H = 140
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: H }}>
        {weeks.map((w, i) => {
          const total = (w.minutes / max) * (H - 20)
          const intense = (w.intenseMinutes / max) * (H - 20)
          const current = i === weeks.length - 1
          return (
            <button
              key={w.weekStart}
              className="relative flex-1 h-full flex flex-col justify-end items-stretch focus:outline-none"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`Woche ab ${fmtDate(w.weekStart)}: ${w.minutes} Minuten, davon ${w.intenseMinutes} intensiv, ${w.sessions} Einheiten`}
            >
              {hover === i && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full z-10 rounded-lg bg-gray-950/95 border border-gray-700 px-2 py-1 text-xs text-gray-100 whitespace-nowrap">
                  ab {fmtDate(w.weekStart)} · {w.minutes} min · {w.intenseMinutes} intensiv · {w.sessions}×
                </span>
              )}
              <span
                className="rounded-t-[4px]"
                style={{ height: Math.max(0, total - intense - (intense > 0 ? 2 : 0)), background: VIZ.seriesSoft, opacity: hover === null || hover === i ? 1 : 0.6 }}
              />
              {intense > 0 && <span style={{ height: 2 }} />}
              <span
                className={total - intense <= 0 ? 'rounded-t-[4px]' : ''}
                style={{ height: intense, background: VIZ.series, opacity: hover === null || hover === i ? 1 : 0.6 }}
              />
              <span className={`mt-1 text-[10px] ${current ? 'text-gray-200 font-semibold' : 'text-gray-500'}`}>{current ? 'jetzt' : fmtDate(w.weekStart, 'dd.MM')}</span>
            </button>
          )
        })}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: VIZ.series }} /> intensiv (TE ≥ 3,5 bzw. anaerob ≥ 2)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: VIZ.seriesSoft }} /> locker/moderat
        </span>
      </div>
    </div>
  )
}
