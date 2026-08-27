import type { Bar, RiskConfig, Signal, StrategyReason } from '@/types/trading'
import { buildSnapshot, crossedAbove, crossedBelow, emaSeries, smaSeries } from './indicators'

// Regelwerk des Bots. Jede Regel liefert eine Begründung im Klartext und ein
// Gewicht: positiv spricht für einen Kauf, negativ für einen Verkauf.
// Die Summe aller Gewichte ergibt den Score, aus dem die Entscheidung folgt.

export const BUY_THRESHOLD = 25
export const SELL_THRESHOLD = -25

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)} %`
const usd = (v: number) => `${v.toFixed(2)} $`

function trendRules(closes: number[]): StrategyReason[] {
  const reasons: StrategyReason[] = []
  const sma20 = smaSeries(closes, 20)
  const sma50 = smaSeries(closes, 50)
  if (sma20.length < 2 || sma50.length < 2) return reasons

  // Auf gleiche Länge bringen, damit die Kreuzung am selben Tag verglichen wird
  const len = Math.min(sma20.length, sma50.length)
  const fast = sma20.slice(-len)
  const slow = sma50.slice(-len)

  if (crossedAbove(fast, slow)) {
    reasons.push({
      rule: 'Goldenes Kreuz (SMA20/SMA50)',
      detail: `Der 20-Tage-Schnitt (${usd(fast[len - 1])}) hat den 50-Tage-Schnitt (${usd(slow[len - 1])}) von unten nach oben gekreuzt — klassisches Startsignal für einen Aufwärtstrend.`,
      weight: 30,
    })
  } else if (crossedBelow(fast, slow)) {
    reasons.push({
      rule: 'Todeskreuz (SMA20/SMA50)',
      detail: `Der 20-Tage-Schnitt (${usd(fast[len - 1])}) ist unter den 50-Tage-Schnitt (${usd(slow[len - 1])}) gefallen — der Trend dreht nach unten.`,
      weight: -30,
    })
  } else if (fast[len - 1] > slow[len - 1]) {
    const distance = ((fast[len - 1] - slow[len - 1]) / slow[len - 1]) * 100
    reasons.push({
      rule: 'Aufwärtstrend intakt',
      detail: `SMA20 liegt ${pct(distance)} über SMA50. Der Trend zeigt nach oben, ist aber kein frisches Einstiegssignal.`,
      weight: 12,
    })
  } else {
    const distance = ((fast[len - 1] - slow[len - 1]) / slow[len - 1]) * 100
    reasons.push({
      rule: 'Abwärtstrend intakt',
      detail: `SMA20 liegt ${pct(distance)} unter SMA50. Solange das so bleibt, kauft der Bot hier nicht nach.`,
      weight: -12,
    })
  }

  const sma200 = smaSeries(closes, 200)
  if (sma200.length > 0) {
    const price = closes[closes.length - 1]
    const value = sma200[sma200.length - 1]
    if (price > value) {
      reasons.push({
        rule: 'Über der 200-Tage-Linie',
        detail: `Kurs ${usd(price)} liegt über dem 200-Tage-Schnitt (${usd(value)}) — langfristig ist der Wert in guter Verfassung.`,
        weight: 10,
      })
    } else {
      reasons.push({
        rule: 'Unter der 200-Tage-Linie',
        detail: `Kurs ${usd(price)} liegt unter dem 200-Tage-Schnitt (${usd(value)}) — langfristiger Trend ist angeschlagen.`,
        weight: -10,
      })
    }
  }

  return reasons
}

function rsiRules(rsiValue: number | null): StrategyReason[] {
  if (rsiValue === null) return []
  if (rsiValue < 30) {
    return [{
      rule: 'RSI überverkauft',
      detail: `RSI(14) steht bei ${rsiValue.toFixed(1)}. Unter 30 gilt ein Wert als überverkauft — viele Verkäufer sind bereits raus, eine Gegenbewegung ist wahrscheinlicher.`,
      weight: 22,
    }]
  }
  if (rsiValue > 70) {
    return [{
      rule: 'RSI überkauft',
      detail: `RSI(14) steht bei ${rsiValue.toFixed(1)}. Über 70 ist der Wert heiß gelaufen — das Rückschlagrisiko steigt.`,
      weight: -22,
    }]
  }
  if (rsiValue < 45) {
    return [{
      rule: 'RSI im unteren Mittelfeld',
      detail: `RSI(14) bei ${rsiValue.toFixed(1)} — leicht schwach, aber kein Extremwert.`,
      weight: 6,
    }]
  }
  if (rsiValue > 60) {
    return [{
      rule: 'RSI im oberen Mittelfeld',
      detail: `RSI(14) bei ${rsiValue.toFixed(1)} — Momentum ist da, viel Luft nach oben bleibt aber nicht.`,
      weight: -6,
    }]
  }
  return [{
    rule: 'RSI neutral',
    detail: `RSI(14) bei ${rsiValue.toFixed(1)} — weder überkauft noch überverkauft.`,
    weight: 0,
  }]
}

function macdRules(closes: number[]): StrategyReason[] {
  if (closes.length < 35) return []
  const fastSeries = emaSeries(closes, 12)
  const slowSeries = emaSeries(closes, 26)
  const macdSeries = fastSeries.map((v, i) => v - slowSeries[i]).slice(25)
  const signalSeries = emaSeries(macdSeries, 9)
  const last = macdSeries[macdSeries.length - 1]
  const lastSignal = signalSeries[signalSeries.length - 1]

  if (crossedAbove(macdSeries, signalSeries)) {
    return [{
      rule: 'MACD-Kaufkreuzung',
      detail: `Die MACD-Linie (${last.toFixed(2)}) hat ihre Signallinie (${lastSignal.toFixed(2)}) nach oben gekreuzt — das Momentum dreht ins Positive.`,
      weight: 25,
    }]
  }
  if (crossedBelow(macdSeries, signalSeries)) {
    return [{
      rule: 'MACD-Verkaufskreuzung',
      detail: `Die MACD-Linie (${last.toFixed(2)}) ist unter ihre Signallinie (${lastSignal.toFixed(2)}) gefallen — das Momentum kippt.`,
      weight: -25,
    }]
  }
  const histogram = last - lastSignal
  return [{
    rule: histogram >= 0 ? 'MACD positiv' : 'MACD negativ',
    detail: `Das MACD-Histogramm liegt bei ${histogram.toFixed(2)} — ${histogram >= 0 ? 'Momentum trägt noch' : 'Momentum bremst'}, ohne frische Kreuzung.`,
    weight: histogram >= 0 ? 8 : -8,
  }]
}

function bollingerRules(price: number, upper: number | null, lower: number | null): StrategyReason[] {
  if (upper === null || lower === null) return []
  if (price < lower) {
    return [{
      rule: 'Unter dem unteren Bollinger-Band',
      detail: `Kurs ${usd(price)} liegt unter dem unteren Band (${usd(lower)}) — statistisch ein Ausreißer nach unten, oft gefolgt von einer Rückkehr zum Mittelwert.`,
      weight: 15,
    }]
  }
  if (price > upper) {
    return [{
      rule: 'Über dem oberen Bollinger-Band',
      detail: `Kurs ${usd(price)} liegt über dem oberen Band (${usd(upper)}) — die Bewegung ist überdehnt.`,
      weight: -15,
    }]
  }
  return []
}

function momentumRules(changePct5d: number | null): StrategyReason[] {
  if (changePct5d === null) return []
  if (changePct5d < -8) {
    return [{
      rule: 'Scharfer Rücksetzer',
      detail: `${pct(changePct5d)} in fünf Handelstagen. Der Bot wertet das als mögliche Übertreibung nach unten.`,
      weight: 10,
    }]
  }
  if (changePct5d > 10) {
    return [{
      rule: 'Sehr schneller Anstieg',
      detail: `${pct(changePct5d)} in fünf Handelstagen — solche Sprünge werden häufig teilweise wieder abgegeben.`,
      weight: -10,
    }]
  }
  return []
}

export function analyze(symbol: string, bars: Bar[], risk: RiskConfig): Signal {
  const indicators = buildSnapshot(bars)
  const closes = bars.map(b => b.c)

  const reasons: StrategyReason[] = [
    ...trendRules(closes),
    ...rsiRules(indicators.rsi14),
    ...macdRules(closes),
    ...bollingerRules(indicators.price, indicators.bbUpper, indicators.bbLower),
    ...momentumRules(indicators.changePct5d),
  ]

  const rawScore = reasons.reduce((sum, r) => sum + r.weight, 0)
  const score = Math.max(-100, Math.min(100, rawScore))

  let action: Signal['action'] = 'hold'
  if (score >= BUY_THRESHOLD) action = 'buy'
  else if (score <= SELL_THRESHOLD) action = 'sell'

  // Vertrauen wächst mit dem Abstand zur Schwelle, gedeckelt bei 100
  const confidence = Math.min(100, Math.round((Math.abs(score) / 60) * 100))

  const atrValue = indicators.atr14
  const stopLoss = atrValue ? Number((indicators.price - atrValue * risk.stopLossAtrFactor).toFixed(2)) : null
  const takeProfit = atrValue ? Number((indicators.price + atrValue * risk.takeProfitAtrFactor).toFixed(2)) : null

  return {
    symbol,
    action,
    score,
    confidence,
    reasons: reasons.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
    indicators,
    stopLoss,
    takeProfit,
    asOf: bars[bars.length - 1]?.t ?? new Date().toISOString(),
  }
}

/**
 * Positionsgröße nach Risiko pro Trade: Wie viele Stücke darf ich kaufen, damit
 * ein Auslösen des Stop-Loss höchstens `riskPerTradePct` des Depots kostet?
 */
export function positionSize(
  equity: number,
  buyingPower: number,
  price: number,
  stopLoss: number | null,
  risk: RiskConfig,
): { qty: number; explanation: string } {
  if (price <= 0) return { qty: 0, explanation: 'Kein gültiger Kurs vorhanden.' }

  const riskBudget = equity * (risk.riskPerTradePct / 100)
  const perShareRisk = stopLoss && stopLoss < price ? price - stopLoss : price * 0.05
  const qtyByRisk = Math.floor(riskBudget / perShareRisk)
  const qtyByPositionCap = Math.floor((equity * (risk.maxPositionPct / 100)) / price)
  const qtyByCash = Math.floor(buyingPower / price)

  const qty = Math.max(0, Math.min(qtyByRisk, qtyByPositionCap, qtyByCash))
  const explanation = `Risikobudget ${usd(riskBudget)} (${risk.riskPerTradePct} % vom Depot) ÷ ${usd(perShareRisk)} Risiko je Aktie = ${qtyByRisk} Stück; `
    + `Positionsdeckel ${risk.maxPositionPct} % erlaubt ${qtyByPositionCap} Stück; Kaufkraft reicht für ${qtyByCash} Stück. `
    + `Gewählt: ${qty} Stück.`

  return { qty, explanation }
}
