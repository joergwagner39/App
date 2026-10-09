'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react'
import { SIGNAL_LABELS, type ScreenerData, type ScreenerStock, type SignalKey } from '@/lib/screener'

const SIGNALS = Object.keys(SIGNAL_LABELS) as SignalKey[]

type SortKey = 'signals' | 'drawdown' | 'rsiD' | 'sma50d' | 'sma200d' | 'sma200w' | 'fib618' | 'name'

function fmtPct(v: number | null | undefined, digits = 1) {
  if (v === null || v === undefined) return '–'
  return `${v > 0 ? '+' : ''}${v.toFixed(digits).replace('.', ',')} %`
}

function fmtPrice(v: number | null | undefined, currency: string | null) {
  if (v === null || v === undefined) return '–'
  return `${v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency ?? ''}`
}

/** Farbe für den Abstand zu einem Niveau: grün = im Kaufbereich, grau = weit weg. */
function distClass(v: number | null, band: [number, number] | undefined) {
  if (v === null || !band) return 'text-gray-600'
  if (v >= band[0] && v <= band[1]) return 'bg-emerald-500/15 text-emerald-300 font-semibold'
  if (v < band[0]) return 'text-red-400'
  return 'text-gray-400'
}

function rsiClass(v: number | null, oversold: number) {
  if (v === null) return 'text-gray-600'
  if (v < oversold) return 'bg-emerald-500/15 text-emerald-300 font-semibold'
  if (v < 40) return 'text-amber-300'
  if (v > 70) return 'text-red-400'
  return 'text-gray-400'
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const w = 96
  const h = 28
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`)
    .join(' ')
  const up = values[values.length - 1] >= values[0]
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <polyline points={pts} fill="none" strokeWidth={1.5} stroke={up ? '#34d399' : '#f87171'} />
    </svg>
  )
}

function sortValue(s: ScreenerStock, key: SortKey): number | string {
  switch (key) {
    case 'signals':
      return -s.signals.length
    case 'name':
      return s.name
    case 'drawdown':
      return s.drawdown
    case 'rsiD':
      return s.rsiD ?? 999
    default:
      // Abstand zum Niveau: der kleinste Betrag steht oben
      return Math.abs(s.dist[key] ?? 999)
  }
}

export default function ScreenerTable({ data }: { data: ScreenerData }) {
  const [active, setActive] = useState<SignalKey[]>([])
  const [style, setStyle] = useState<'alle' | 'Qualität' | 'Wachstum'>('alle')
  const [onlyHits, setOnlyHits] = useState(true)
  const [sort, setSort] = useState<SortKey>('signals')
  const [asc, setAsc] = useState(true)

  const counts = useMemo(() => {
    const c = Object.fromEntries(SIGNALS.map((k) => [k, 0])) as Record<SignalKey, number>
    for (const s of data.stocks) for (const k of s.signals) c[k]++
    return c
  }, [data.stocks])

  const rows = useMemo(() => {
    const filtered = data.stocks.filter(
      (s) =>
        (style === 'alle' || s.style === style) &&
        (!onlyHits || s.signals.length > 0) &&
        active.every((k) => s.signals.includes(k)),
    )
    return filtered.sort((a, b) => {
      const va = sortValue(a, sort)
      const vb = sortValue(b, sort)
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)
      return asc ? cmp : -cmp
    })
  }, [data.stocks, style, onlyHits, active, sort, asc])

  const toggle = (k: SignalKey) => setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]))

  const header = (key: SortKey, label: string, title?: string) => (
    <th className="px-3 py-2 font-medium" title={title}>
      <button
        onClick={() => {
          if (sort === key) setAsc(!asc)
          else {
            setSort(key)
            setAsc(true)
          }
        }}
        className="inline-flex items-center gap-1 hover:text-white"
      >
        {label}
        {sort === key && (asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  )

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {SIGNALS.map((k) => (
          <button
            key={k}
            onClick={() => toggle(k)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              active.includes(k)
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                : 'border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {SIGNAL_LABELS[k]} <span className="text-gray-500">{counts[k]}</span>
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-gray-700" />
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as typeof style)}
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1 text-sm text-gray-200"
        >
          <option value="alle">Qualität + Wachstum</option>
          <option value="Qualität">nur Qualität</option>
          <option value="Wachstum">nur Wachstum</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={onlyHits} onChange={(e) => setOnlyHits(e.target.checked)} />
          nur Treffer
        </label>
        <span className="ml-auto text-sm text-gray-500">
          {rows.length} von {data.stocks.length} Aktien
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-400">
            <tr>
              {header('name', 'Aktie')}
              <th className="px-3 py-2 font-medium">Kurs</th>
              <th className="px-3 py-2 font-medium">2 Jahre</th>
              {header('drawdown', 'vom Hoch', 'Abstand zum 52-Wochen-Hoch')}
              {header('sma50d', 'SMA 50 T', 'Abstand zum 50-Tage-Durchschnitt')}
              {header('sma200d', 'SMA 200 T', 'Abstand zum 200-Tage-Durchschnitt')}
              {header('sma200w', 'SMA 200 W', 'Abstand zum 200-Wochen-Durchschnitt')}
              {header('fib618', 'Fibo 61,8', 'Abstand zum 61,8 %-Retracement der letzten Aufwärtswelle')}
              {header('rsiD', 'RSI T / W')}
              {header('signals', 'Signale')}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/70">
            {rows.map((s) => (
              <tr key={s.ticker} className="hover:bg-gray-900/60">
                <td className="px-3 py-2">
                  <a
                    href={`https://finance.yahoo.com/quote/${encodeURIComponent(s.ticker)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-white hover:underline"
                  >
                    {s.name}
                  </a>
                  <div className="text-xs text-gray-500">
                    {s.ticker} · {s.sector} · {s.style}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-200">
                  {fmtPrice(s.price, s.currency)}
                  <div className={`text-xs ${(s.change1d ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtPct(s.change1d, 2)}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Sparkline values={s.spark} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-300">{fmtPct(s.drawdown)}</td>
                {(['sma50d', 'sma200d', 'sma200w', 'fib618'] as const).map((k) => (
                  <td key={k} className="whitespace-nowrap px-3 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 ${distClass(s.dist[k], data.bands[k])}`}
                      title={
                        k === 'fib618' && s.fib
                          ? `61,8 % bei ${fmtPrice(s.fib.fib618, s.currency)} (Welle ${s.fib.swingLowDate} → ${s.fib.swingHighDate})`
                          : k !== 'fib618' && s[k] !== null
                            ? fmtPrice(s[k], s.currency)
                            : undefined
                      }
                    >
                      {fmtPct(s.dist[k])}
                    </span>
                    {k === 'sma200d' && s.sma200dRising !== null && (
                      <span title={s.sma200dRising ? '200er steigt' : '200er fällt'} className="ml-1 inline-block align-middle">
                        {s.sma200dRising ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </span>
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 ${rsiClass(s.rsiD, data.rsiOversold)}`}>{s.rsiD?.toFixed(0) ?? '–'}</span>
                  <span className="text-gray-600"> / </span>
                  <span className={`rounded px-1.5 py-0.5 ${rsiClass(s.rsiW, data.rsiOversold)}`}>{s.rsiW?.toFixed(0) ?? '–'}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {s.signals.map((k) => (
                      <span key={k} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                        {SIGNAL_LABELS[k]}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                  Keine Aktie erfüllt alle gewählten Signale.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Grün = Kurs liegt im Rücksetzer-Bereich des Niveaus (SMA 50 T ±{data.bands.sma50d?.[1]} %, SMA 200 T ±
        {data.bands.sma200d?.[1]} %, SMA 200 W ±{data.bands.sma200w?.[1]} %, Fibo ±{data.bands.fib618?.[1]} %). Rot = Kurs
        darunter. Fibonacci: 61,8 % der Welle vom tiefsten Tief bis zum höchsten Hoch der letzten 12 Monate.
        {data.errors.length > 0 && ` Nicht geladen: ${data.errors.map((e) => e.ticker).join(', ')}.`}
      </p>
    </section>
  )
}
