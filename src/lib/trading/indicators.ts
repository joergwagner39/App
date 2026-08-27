import type { Bar, IndicatorSnapshot } from '@/types/trading'

// Alle Funktionen erwarten Kurse in chronologischer Reihenfolge (ältester zuerst)
// und geben null zurück, solange nicht genug Daten für die Periode vorhanden sind.

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null
  const slice = values.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

export function emaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return []
  const k = 2 / (period + 1)
  const out: number[] = [values[0]]
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k))
  }
  return out
}

export function ema(values: number[], period: number): number | null {
  if (values.length < period) return null
  const series = emaSeries(values, period)
  return series[series.length - 1]
}

// RSI nach Wilder: geglätteter Durchschnitt von Gewinnen vs. Verlusten
export function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) gain += diff
    else loss -= diff
  }
  let avgGain = gain / period
  let avgLoss = loss / period

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export interface MacdResult {
  macd: number
  signal: number
  histogram: number
}

export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult | null {
  if (values.length < slow + signalPeriod) return null
  const fastSeries = emaSeries(values, fast)
  const slowSeries = emaSeries(values, slow)
  const macdSeries = fastSeries.map((v, i) => v - slowSeries[i]).slice(slow - 1)
  const signalSeries = emaSeries(macdSeries, signalPeriod)
  const macdValue = macdSeries[macdSeries.length - 1]
  const signalValue = signalSeries[signalSeries.length - 1]
  return { macd: macdValue, signal: signalValue, histogram: macdValue - signalValue }
}

// Average True Range — Basis für Stop-Loss-Abstände
export function atr(bars: Bar[], period = 14): number | null {
  if (bars.length < period + 1) return null
  const trueRanges: number[] = []
  for (let i = 1; i < bars.length; i++) {
    const prevClose = bars[i - 1].c
    trueRanges.push(Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - prevClose),
      Math.abs(bars[i].l - prevClose),
    ))
  }
  let value = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < trueRanges.length; i++) {
    value = (value * (period - 1) + trueRanges[i]) / period
  }
  return value
}

export interface BollingerBands {
  upper: number
  middle: number
  lower: number
}

export function bollinger(values: number[], period = 20, stdDevFactor = 2): BollingerBands | null {
  const middle = sma(values, period)
  if (middle === null) return null
  const slice = values.slice(-period)
  const variance = slice.reduce((acc, v) => acc + (v - middle) ** 2, 0) / period
  const sd = Math.sqrt(variance)
  return { upper: middle + stdDevFactor * sd, middle, lower: middle - stdDevFactor * sd }
}

function changePct(values: number[], lookback: number): number | null {
  if (values.length < lookback + 1) return null
  const past = values[values.length - 1 - lookback]
  if (past === 0) return null
  return ((values[values.length - 1] - past) / past) * 100
}

export function buildSnapshot(bars: Bar[]): IndicatorSnapshot {
  const closes = bars.map(b => b.c)
  const macdResult = macd(closes)
  const bb = bollinger(closes)

  return {
    price: closes[closes.length - 1],
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    ema12: ema(closes, 12),
    ema26: ema(closes, 26),
    rsi14: rsi(closes, 14),
    macd: macdResult?.macd ?? null,
    macdSignal: macdResult?.signal ?? null,
    macdHistogram: macdResult?.histogram ?? null,
    atr14: atr(bars, 14),
    bbUpper: bb?.upper ?? null,
    bbMiddle: bb?.middle ?? null,
    bbLower: bb?.lower ?? null,
    changePct1d: changePct(closes, 1),
    changePct5d: changePct(closes, 5),
  }
}

/** Erkennt, ob eine Linie die andere im letzten Bar von unten nach oben gekreuzt hat. */
export function crossedAbove(fast: number[], slow: number[]): boolean {
  const n = fast.length
  if (n < 2 || slow.length < 2) return false
  return fast[n - 2] <= slow[n - 2] && fast[n - 1] > slow[n - 1]
}

export function crossedBelow(fast: number[], slow: number[]): boolean {
  const n = fast.length
  if (n < 2 || slow.length < 2) return false
  return fast[n - 2] >= slow[n - 2] && fast[n - 1] < slow[n - 1]
}

/** SMA als Zeitreihe — für Kreuzungs-Erkennung und Charts. */
export function smaSeries(values: number[], period: number): number[] {
  const out: number[] = []
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < period) continue
    const slice = values.slice(i + 1 - period, i + 1)
    out.push(slice.reduce((a, b) => a + b, 0) / period)
  }
  return out
}
