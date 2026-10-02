// Scoreboard: Oura + Garmin zu Kennzahlen mit Trend zusammenfassen.
import type { WearableData } from '@/lib/wearables'
import type { CoachSettings, CoachState } from './types'
import { addDays, buildSignals, computeReadiness } from './engine'

export interface Point {
  date: string
  value: number
}

export type Status = 'good' | 'warning' | 'critical' | 'neutral'

export interface Metric {
  id: string
  label: string
  unit?: string
  source: string
  value?: number
  /** Ø letzte 7 Tage vs. Ø der 30 Tage davor */
  avg7?: number
  avg30?: number
  delta?: number
  higherIsBetter: boolean
  decimals: number
  series: Point[]
  status: Status
  hint: string
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined)

function windowAvg(series: Point[], from: string, to: string) {
  return avg(series.filter((p) => p.date >= from && p.date < to).map((p) => p.value))
}

export function buildMetric(
  id: string,
  label: string,
  source: string,
  series: Point[],
  today: string,
  opts: { unit?: string; higherIsBetter: boolean; decimals?: number; hint: string },
): Metric {
  const clean = series.filter((p) => Number.isFinite(p.value) && p.value > 0)
  const avg7 = windowAvg(clean, addDays(today, -6), addDays(today, 1))
  const avg30 = windowAvg(clean, addDays(today, -36), addDays(today, -6))
  const delta = avg7 !== undefined && avg30 !== undefined ? avg7 - avg30 : undefined
  let status: Status = 'neutral'
  if (delta !== undefined && avg30) {
    const rel = (delta / avg30) * (opts.higherIsBetter ? 1 : -1)
    status = rel > 0.02 ? 'good' : rel < -0.08 ? 'critical' : rel < -0.03 ? 'warning' : 'neutral'
  }
  return {
    id,
    label,
    source,
    unit: opts.unit,
    value: clean[clean.length - 1]?.value,
    avg7,
    avg30,
    delta,
    higherIsBetter: opts.higherIsBetter,
    decimals: opts.decimals ?? 0,
    series: clean.filter((p) => p.date >= addDays(today, -29)),
    status,
    hint: opts.hint,
  }
}

export function buildMetrics(data: WearableData, today: string): Metric[] {
  const sleep = data.oura.sleep
  const g = data.garmin.daily
  const readiness = data.oura.readiness
  const pts = <T,>(rows: T[], date: (r: T) => string, v: (r: T) => number | undefined): Point[] =>
    rows.map((r) => ({ date: date(r), value: v(r) ?? NaN })).sort((a, b) => (a.date < b.date ? -1 : 1))

  // Ruhepuls: Oura (niedrigster Nachtwert) bevorzugt, sonst Garmin
  const rhr = sleep.some((s) => s.lowestHeartRate) ? pts(sleep, (s) => s.date, (s) => s.lowestHeartRate) : pts(g, (d) => d.date, (d) => d.restingHeartRate)

  return [
    buildMetric('readiness', 'Readiness', 'Oura', pts(readiness, (r) => r.date, (r) => r.score), today, {
      higherIsBetter: true,
      hint: 'Gesamtbild aus HRV, Ruhepuls, Temperatur, Schlaf und Belastung.',
    }),
    buildMetric('hrv', 'HRV', 'Oura', pts(sleep, (s) => s.date, (s) => s.averageHrv), today, {
      unit: 'ms',
      higherIsBetter: true,
      hint: 'Steigt mit guter Erholung und Ausdauer-Fitness. Nur mit dir selbst vergleichen.',
    }),
    buildMetric('rhr', 'Ruhepuls', sleep.some((s) => s.lowestHeartRate) ? 'Oura' : 'Garmin', rhr, today, {
      unit: 'bpm',
      higherIsBetter: false,
      hint: 'Sinkt, wenn das Herz pro Schlag mehr pumpt – ein Marker für aerobe Fitness.',
    }),
    buildMetric('sleep', 'Schlaf', 'Oura', pts(sleep, (s) => s.date, (s) => (s.totalSleepSeconds ? s.totalSleepSeconds / 3600 : undefined)), today, {
      unit: 'h',
      higherIsBetter: true,
      decimals: 1,
      hint: 'Ziel: 7–9 Stunden. Hier passiert die Anpassung an das Training.',
    }),
    buildMetric('sleepScore', 'Schlaf-Score', 'Oura', pts(sleep, (s) => s.date, (s) => s.score), today, {
      higherIsBetter: true,
      hint: 'Ouras Gesamtbewertung der Nacht aus Dauer, Tiefschlaf, REM, Effizienz, Ruhe und Timing.',
    }),
    buildMetric('battery', 'Body Battery', 'Garmin', pts(g, (d) => d.date, (d) => d.bodyBatteryHighestValue), today, {
      higherIsBetter: true,
      hint: 'Höchster Wert des Tages – wie voll der Akku nach der Nacht ist.',
    }),
    buildMetric('stress', 'Stress', 'Garmin', pts(g, (d) => d.date, (d) => d.averageStressLevel), today, {
      higherIsBetter: false,
      hint: 'Tagesdurchschnitt aus der Herzfrequenzvariabilität.',
    }),
  ]
}

// ── VO2max ────────────────────────────────────────────────────────────────

/** Richtwerte nach Cooper Institute (wie in Garmin verwendet): Schwellen für Superior/Exzellent/Gut/Mittel */
const NORMS: Record<'m' | 'f', [number, number, number, number, number][]> = {
  // [maxAlter, superior, excellent, good, fair]
  m: [
    [29, 55.4, 51.1, 45.4, 41.7],
    [39, 54.0, 48.3, 44.0, 40.5],
    [49, 52.5, 46.4, 42.4, 38.5],
    [59, 48.9, 43.4, 39.2, 35.6],
    [69, 45.7, 39.5, 35.5, 32.3],
    [120, 42.1, 36.7, 32.3, 29.4],
  ],
  f: [
    [29, 49.6, 43.9, 39.5, 36.1],
    [39, 47.4, 42.4, 37.8, 34.4],
    [49, 45.3, 39.7, 36.3, 33.0],
    [59, 41.1, 36.7, 33.0, 30.1],
    [69, 37.8, 33.0, 30.0, 27.5],
    [120, 36.7, 30.9, 28.1, 25.9],
  ],
}
const CLASS_LABELS = ['Superior', 'Exzellent', 'Gut', 'Mittel', 'Ausbaufähig']

export interface Vo2Summary {
  current?: number
  history: Point[]
  change4w?: number
  change12w?: number
  target?: number
  toTarget?: number
  category?: { label: string; index: number; next?: { label: string; threshold: number; missing: number }; thresholds: number[] }
  /** grobe Prognose: Wochen bis zum Ziel bei aktuellem 12-Wochen-Trend */
  weeksToTarget?: number
}

function valueAt(history: Point[], date: string): number | undefined {
  const before = history.filter((p) => p.date <= date)
  return before[before.length - 1]?.value
}

export function vo2Summary(data: WearableData, settings: CoachSettings, today: string): Vo2Summary {
  const fromActs = data.garmin.activities.filter((a) => a.vo2max).map((a) => ({ date: a.date, value: a.vo2max! }))
  const map = new Map<string, number>()
  for (const p of [...fromActs, ...(data.garmin.vo2history ?? [])]) map.set(p.date, p.value)
  if (data.garmin.vo2max) map.set(today, Math.round(data.garmin.vo2max * 10) / 10)
  const history = Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  const current = history[history.length - 1]?.value
  const res: Vo2Summary = { current, history }
  if (current === undefined) return res

  const v4 = valueAt(history, addDays(today, -28))
  const v12 = valueAt(history, addDays(today, -84))
  if (v4 !== undefined) res.change4w = Math.round((current - v4) * 10) / 10
  if (v12 !== undefined) res.change12w = Math.round((current - v12) * 10) / 10

  if (settings.vo2maxTarget) {
    res.target = settings.vo2maxTarget
    res.toTarget = Math.round((settings.vo2maxTarget - current) * 10) / 10
    if (res.toTarget > 0 && res.change12w && res.change12w > 0) res.weeksToTarget = Math.ceil(res.toTarget / (res.change12w / 12))
  }

  if (settings.age) {
    const row = NORMS[settings.sex ?? 'm'].find((r) => settings.age! <= r[0])!
    const thresholds = row.slice(1) as number[]
    const index = thresholds.findIndex((t) => current >= t)
    const idx = index === -1 ? 4 : index
    const next = idx > 0 ? { label: CLASS_LABELS[idx - 1], threshold: thresholds[idx - 1], missing: Math.round((thresholds[idx - 1] - current) * 10) / 10 } : undefined
    res.category = { label: CLASS_LABELS[idx], index: idx, next, thresholds }
  }
  return res
}

// ── Training ──────────────────────────────────────────────────────────────

export interface WeekLoad {
  weekStart: string
  minutes: number
  intenseMinutes: number
  sessions: number
}

/** Trainingsminuten pro Woche (Garmin-Aktivitäten), letzte 8 Wochen, Montag als Wochenstart */
export function weeklyLoad(data: WearableData, today: string): WeekLoad[] {
  const d = new Date(`${today}T12:00:00`)
  const monday = addDays(today, -((d.getDay() + 6) % 7))
  return Array.from({ length: 8 }, (_, i) => {
    const start = addDays(monday, -7 * (7 - i))
    const end = addDays(start, 7)
    const acts = data.garmin.activities.filter((a) => a.date >= start && a.date < end)
    const minutes = Math.round(acts.reduce((s, a) => s + (a.duration ?? 0), 0) / 60)
    const intenseMinutes = Math.round(
      acts.filter((a) => (a.anaerobicTrainingEffect ?? 0) >= 2 || (a.trainingEffect ?? 0) >= 3.5).reduce((s, a) => s + (a.duration ?? 0), 0) / 60,
    )
    return { weekStart: start, minutes, intenseMinutes, sessions: acts.length }
  })
}

/** Tagesform (0–100) für jeden der letzten 30 Tage – gleiche Berechnung wie im Tagesplan. */
export function formSeries(data: WearableData, state: CoachState, today: string): Point[] {
  const out: Point[] = []
  for (let i = 29; i >= 0; i--) {
    const d = addDays(today, -i)
    const upTo = <T extends { date: string }>(rows: T[]) => rows.filter((r) => r.date <= d)
    const sliced: WearableData = {
      ...data,
      oura: { ...data.oura, sleep: upTo(data.oura.sleep), readiness: upTo(data.oura.readiness) },
      garmin: { ...data.garmin, daily: upTo(data.garmin.daily), activities: upTo(data.garmin.activities) },
    }
    const sig = buildSignals(sliced, d)
    // Nur Tage mit echten Messwerten für genau diesen Tag
    const hasDay = sliced.oura.readiness.some((r) => r.date === d) || sliced.garmin.daily.some((g) => g.date === d)
    if (!hasDay) continue
    out.push({ date: d, value: computeReadiness(sig, state.days[d]?.checkIn).score })
  }
  return out
}
