'use client'

import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, HeartPulse } from 'lucide-react'
import type { WearableData } from '@/lib/wearables'
import type { CoachState, Signals } from '@/lib/coach/types'
import { buildMetric, buildMetrics, formSeries, vo2Summary, weeklyLoad, type Metric, type Status } from '@/lib/coach/metrics'
import { computeReadiness } from '@/lib/coach/engine'
import { LineChart, Sparkline, WeekBars, VIZ } from './charts'
import { Card, SectionTitle } from './ui'

const fmt = (v: number | undefined, d = 0) => (v === undefined ? '–' : v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }))

const STATUS: Record<Status, { label: string; color: string; Icon: typeof ArrowUpRight }> = {
  good: { label: 'besser', color: VIZ.good, Icon: ArrowUpRight },
  neutral: { label: 'stabil', color: VIZ.text, Icon: ArrowRight },
  warning: { label: 'etwas schlechter', color: VIZ.warning, Icon: ArrowDownRight },
  critical: { label: 'deutlich schlechter', color: VIZ.critical, Icon: ArrowDownRight },
}

function Delta({ value, decimals, unit, goodWhenUp }: { value?: number; decimals: number; unit?: string; goodWhenUp: boolean }) {
  if (value === undefined) return null
  const good = value === 0 ? undefined : value > 0 === goodWhenUp
  const color = good === undefined ? VIZ.text : good ? VIZ.good : VIZ.critical
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : ArrowRight
  return (
    <span className="inline-flex items-center gap-0.5 text-sm font-medium" style={{ color }}>
      <Icon className="w-4 h-4" />
      {value > 0 ? '+' : ''}
      {fmt(value, decimals)}
      {unit ? ` ${unit}` : ''}
    </span>
  )
}

function Tile({ m, active, onClick }: { m: Metric; active: boolean; onClick: () => void }) {
  const st = STATUS[m.status]
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border p-3 transition-colors ${active ? 'border-sky-500/70 bg-sky-500/10' : 'border-gray-800 bg-gray-900/60 hover:border-gray-600'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400">{m.label}</span>
        <span className="text-[10px] text-gray-500">{m.source}</span>
      </div>
      <p className="text-2xl font-semibold text-white mt-0.5">
        {fmt(m.avg7 ?? m.value, m.decimals)}
        {m.unit && <span className="text-sm font-normal text-gray-500 ml-1">{m.unit}</span>}
      </p>
      <p className="text-[11px] text-gray-500">Ø 7 Tage · vorher Ø {fmt(m.avg30, m.decimals)}</p>
      <p className="flex items-center gap-1 text-xs mt-1" style={{ color: st.color }}>
        <st.Icon className="w-3.5 h-3.5" /> {st.label}
      </p>
      <div className="mt-1.5">
        <Sparkline points={m.series.slice(-14)} />
      </div>
    </button>
  )
}

export default function StatsView({
  data,
  state,
  signals,
  today,
  onOpenSettings,
}: {
  data: WearableData | null
  state: CoachState
  signals: Signals
  today: string
  onOpenSettings: () => void
}) {
  const [selected, setSelected] = useState('form')
  const metrics = useMemo(() => {
    if (!data) return []
    const form = buildMetric('form', 'Tagesform', 'Oura + Garmin', formSeries(data, state, today), today, {
      higherIsBetter: true,
      hint: 'Deine Bereitschaft (0–100) aus Oura Readiness, Body Battery, HRV und Ruhepuls im Vergleich zu deinem Schnitt, Schlaf, Temperatur und Check-in. Danach richtet sich das Training.',
    })
    return [form, ...buildMetrics(data, today)]
  }, [data, state, today])
  const vo2 = useMemo(() => (data ? vo2Summary(data, state.settings, today) : null), [data, state.settings, today])
  const weeks = useMemo(() => (data ? weeklyLoad(data, today) : []), [data, today])
  const form = computeReadiness(signals, state.days[today]?.checkIn)

  if (!data) return <p className="text-gray-500 text-sm">Daten werden geladen …</p>
  const sel = metrics.find((m) => m.id === selected) ?? metrics[0]
  const visible = metrics.filter((m) => m.series.length > 0)

  return (
    <div className="space-y-5">
      {data.demo && (
        <p className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
          Beispieldaten – verbinde Oura und Garmin unter <button onClick={onOpenSettings} className="underline">Setup</button>, dann siehst du hier deine echten Werte.
        </p>
      )}

      {/* VO2max – der Hauptwert */}
      <Card className="border-sky-500/30">
        <SectionTitle
          icon={<HeartPulse className="w-4 h-4 text-sky-400" />}
          title="VO2max – dein Hauptziel"
          right={<span className="text-[11px] text-gray-500">Garmin</span>}
        />
        {vo2?.current === undefined ? (
          <p className="text-sm text-gray-400">Noch kein VO2max-Wert. Er kommt über den Garmin-Sync (nach Einheiten mit Herzfrequenz, z. B. Rad mit Leistungsmesser oder Laufen).</p>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,320px)_1fr] gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-6xl font-semibold text-white leading-none">
                  {fmt(vo2.current, 1)}
                  <span className="text-base font-normal text-gray-400 ml-2">ml/kg/min</span>
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                  <span className="text-sm text-gray-400">
                    4 Wochen <Delta value={vo2.change4w} decimals={1} goodWhenUp />
                  </span>
                  <span className="text-sm text-gray-400">
                    12 Wochen <Delta value={vo2.change12w} decimals={1} goodWhenUp />
                  </span>
                </div>
              </div>

              {vo2.category ? (
                <div>
                  <p className="text-sm text-gray-300">
                    Fitnessklasse: <span className="font-semibold text-white">{vo2.category.label}</span>
                    {vo2.category.next && (
                      <span className="text-gray-400">
                        {' '}
                        · noch {fmt(vo2.category.next.missing, 1)} bis „{vo2.category.next.label}“
                      </span>
                    )}
                  </p>
                  {/* Skala: Ausbaufähig → Superior, Marker = aktueller Wert */}
                  <div className="relative mt-2">
                    <div className="flex gap-0.5 h-2.5">
                      {['Ausbaufähig', 'Mittel', 'Gut', 'Exzellent', 'Superior'].map((l, i) => (
                        <span key={l} className="flex-1 first:rounded-l-full last:rounded-r-full" style={{ background: VIZ.series, opacity: 0.25 + i * 0.18 }} title={l} />
                      ))}
                    </div>
                    {(() => {
                      const th = [...vo2.category.thresholds].reverse() // fair, good, excellent, superior
                      const lo = th[0] - 5
                      const hi = th[3] + 5
                      const edges = [lo, ...th, hi]
                      let pos = 0
                      for (let i = 0; i < 5; i++) {
                        if (vo2.current! < edges[i + 1] || i === 4) {
                          pos = (i + Math.min(1, Math.max(0, (vo2.current! - edges[i]) / (edges[i + 1] - edges[i])))) / 5
                          break
                        }
                      }
                      return (
                        <span
                          className="absolute -top-1 w-1 rounded-full bg-white ring-2 ring-[#0a0f1e]"
                          style={{ left: `calc(${pos * 100}% - 2px)`, height: 18 }}
                          aria-label={`Aktueller Wert ${fmt(vo2.current, 1)}`}
                        />
                      )
                    })()}
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>Ausbaufähig</span>
                      <span>Gut</span>
                      <span>Superior</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">Richtwerte Cooper Institute ({state.settings.sex === 'f' ? 'Frauen' : 'Männer'}, {state.settings.age} J.)</p>
                </div>
              ) : (
                <button onClick={onOpenSettings} className="text-xs text-sky-300 underline">
                  Alter eintragen → Fitnessklasse anzeigen
                </button>
              )}

              {vo2.target ? (
                <div className="rounded-xl bg-gray-800/50 p-3">
                  <p className="text-sm text-gray-300">
                    Ziel <span className="font-semibold text-white">{fmt(vo2.target, 1)}</span>
                    {vo2.toTarget! > 0 ? (
                      <span className="text-gray-400"> · noch {fmt(vo2.toTarget, 1)}</span>
                    ) : (
                      <span style={{ color: VIZ.good }}> · erreicht 🎉</span>
                    )}
                  </p>
                  {vo2.weeksToTarget !== undefined && (
                    <p className="text-xs text-gray-500 mt-0.5">Beim aktuellen 12-Wochen-Trend in ca. {vo2.weeksToTarget} Wochen.</p>
                  )}
                  {vo2.toTarget! > 0 && vo2.weeksToTarget === undefined && (
                    <p className="text-xs text-gray-500 mt-0.5">Trend noch flach – 2 VO2max-Einheiten pro Woche bringen Bewegung rein.</p>
                  )}
                </div>
              ) : (
                <button onClick={onOpenSettings} className="text-xs text-sky-300 underline">
                  VO2max-Ziel festlegen
                </button>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Verlauf</p>
              <LineChart points={vo2.history} unit="ml/kg/min" decimals={1} target={vo2.target} label="VO2max" height={200} />
            </div>
          </div>
        )}
      </Card>

      {/* Scoreboard */}
      <div>
        <SectionTitle
          title="Scoreboard – Oura & Garmin"
          right={
            <span className="text-[11px] text-gray-500">
              Tagesform heute <span className="text-white font-semibold">{form.score}</span>/100
            </span>
          }
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {visible.map((m) => (
            <Tile key={m.id} m={m} active={sel?.id === m.id} onClick={() => setSelected(m.id)} />
          ))}
        </div>
      </div>

      {sel && (
        <Card>
          <SectionTitle title={`${sel.label} – 30 Tage`} right={<span className="text-[11px] text-gray-500">{sel.source}</span>} />
          <LineChart points={sel.series} unit={sel.unit} decimals={sel.decimals} label={sel.label} />
          <p className="text-xs text-gray-500 mt-2">{sel.hint}</p>
          {sel.id === 'form' && <FormExplainer score={form.score} reasons={form.reasons} warnings={form.warnings} />}
        </Card>
      )}

      <Card>
        <SectionTitle title="Trainingszeit pro Woche (Garmin)" />
        {weeks.some((w) => w.minutes > 0) ? (
          <WeekBars weeks={weeks} />
        ) : (
          <p className="text-sm text-gray-500">Noch keine Garmin-Aktivitäten.</p>
        )}
      </Card>
    </div>
  )
}

/** Erklärung der Tagesform + Aufschlüsselung für heute */
function FormExplainer({ score, reasons, warnings }: { score: number; reasons: string[]; warnings: string[] }) {
  const rows: [string, string][] = [
    ['HRV > 15 % unter deinem Schnitt', '−8'],
    ['HRV > 10 % über deinem Schnitt', '+3'],
    ['Ruhepuls ≥ 5 Schläge über Schnitt', '−6'],
    ['Körpertemperatur ≥ +0,5 °C', '−12 + Warnung'],
    ['Weniger als 6 h Schlaf', '−6'],
    ['Befinden im Check-in (1–5)', '−14 … +14'],
    ['Deutlicher / starker Muskelkater', '−6 / −9'],
  ]
  const bands: [string, string][] = [
    ['unter 40', 'Ruhetag oder Recovery'],
    ['40–54', 'Recovery'],
    ['55–67', 'moderat: Kraft, Oberkörper oder Zone 2'],
    ['ab ~70', 'Qualitätstag: VO2max oder Hyrox'],
  ]
  return (
    <div className="mt-4 space-y-4 border-t border-gray-800 pt-4">
      <div className="rounded-xl bg-gray-800/40 p-3">
        <p className="text-sm text-gray-200">
          Heute: <span className="font-semibold text-white">{score}</span>/100
        </p>
        <ul className="mt-1 space-y-0.5 text-xs text-gray-400 list-disc pl-4">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
          {warnings.map((w) => (
            <li key={w} className="text-amber-300">
              {w}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-gray-300 space-y-3">
        <p className="font-semibold text-white">So entsteht die Tagesform</p>
        <p className="text-xs text-gray-400">
          Eine eigene Kennzahl der App (kein offizieller Oura- oder Garmin-Wert). Sie fasst deine Daten zu 0–100 zusammen – danach richtet sich, wie hart dein Training ausfällt.
        </p>
        <p className="text-xs">
          <span className="text-gray-200 font-medium">1. Startwert:</span> Oura Readiness. Mit Garmin Body Battery: 75 % Readiness + 25 % Body Battery. Ohne Oura: Garmin Training Readiness, sonst Body Battery.
        </p>
        <div>
          <p className="text-xs text-gray-200 font-medium mb-1">2. Zu- und Abschläge</p>
          <table className="w-full text-xs">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-t border-gray-800">
                  <td className="py-1 pr-2 text-gray-400">{k}</td>
                  <td className="py-1 text-right text-gray-200 tabular-nums whitespace-nowrap">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-gray-500 mt-1">Das Knie verändert die Zahl nicht, bestimmt aber, welche Übungen erlaubt sind. Ergebnis wird auf 0–100 begrenzt.</p>
        </div>
        <div>
          <p className="text-xs text-gray-200 font-medium mb-1">3. Was die App daraus macht</p>
          <table className="w-full text-xs">
            <tbody>
              {bands.map(([k, v]) => (
                <tr key={k} className="border-t border-gray-800">
                  <td className="py-1 pr-2 text-gray-400 whitespace-nowrap">{k}</td>
                  <td className="py-1 text-gray-200">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-500">
          Gewichte und Schwellen sind praxisnahe Faustregeln, keine wissenschaftlich validierte Formel. Passt die Tagesform oft nicht zu deinem Gefühl, lässt sich die Gewichtung anpassen.
        </p>
      </div>
    </div>
  )
}
