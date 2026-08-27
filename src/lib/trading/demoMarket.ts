import type { AlpacaAccount, AlpacaOrder, AlpacaPosition, Bar } from '@/types/trading'

// Ohne Alpaca-Keys läuft der Bot gegen realistisch simulierte Kurse.
// Alles hier ist deterministisch (fester Seed), damit die Oberfläche bei jedem
// Aufruf dieselben Daten zeigt und Erklärungen nachvollziehbar bleiben.

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function hashSymbol(symbol: string): number {
  let hash = 7
  for (let i = 0; i < symbol.length; i++) hash = hash * 31 + symbol.charCodeAt(i)
  return Math.abs(hash)
}

const START_PRICES: Record<string, number> = {
  AAPL: 214, MSFT: 425, NVDA: 118, GOOGL: 168, AMZN: 186,
  SPY: 545, QQQ: 470, TSLA: 245, META: 505, AMD: 148,
}

export function generateBars(symbol: string, days = 320): Bar[] {
  const rand = seededRandom(hashSymbol(symbol))
  let price = START_PRICES[symbol] ?? 50 + (hashSymbol(symbol) % 400)
  // Werte im Bereich echter Tagesrenditen: ~0,02 % Drift, 0,8–1,4 % Schwankung
  const drift = 0.0001 + (hashSymbol(symbol) % 5) * 0.00003
  const volatility = 0.006 + (hashSymbol(symbol) % 7) * 0.0008

  const bars: Bar[] = []
  const date = new Date()
  date.setDate(date.getDate() - days)

  for (let i = 0; i < days; i++) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() === 0 || date.getDay() === 6) continue // keine Wochenendkurse

    // Box-Muller für normalverteilte Tagesrenditen
    const u1 = Math.max(rand(), 1e-9)
    const u2 = rand()
    const shock = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const ret = drift + volatility * shock

    const open = price
    price = Math.max(1, price * (1 + ret))
    const high = Math.max(open, price) * (1 + rand() * 0.006)
    const low = Math.min(open, price) * (1 - rand() * 0.006)

    bars.push({
      t: new Date(date).toISOString(),
      o: Number(open.toFixed(2)),
      h: Number(high.toFixed(2)),
      l: Number(low.toFixed(2)),
      c: Number(price.toFixed(2)),
      v: Math.round(1_000_000 + rand() * 4_000_000),
    })
  }

  return bars
}

export function generateDemoBars(symbols: string[], days = 320): Record<string, Bar[]> {
  return Object.fromEntries(symbols.map(s => [s, generateBars(s, days)]))
}

export function demoAccount(): AlpacaAccount {
  return {
    equity: 103_412.55,
    cash: 41_880.20,
    buyingPower: 83_760.40,
    portfolioValue: 103_412.55,
    lastEquity: 102_940.11,
    currency: 'USD',
    status: 'DEMO',
    patternDayTrader: false,
  }
}

export function demoPositions(bars: Record<string, Bar[]>): AlpacaPosition[] {
  const holdings: { symbol: string; qty: number; entryFactor: number }[] = [
    { symbol: 'AAPL', qty: 120, entryFactor: 0.94 },
    { symbol: 'MSFT', qty: 45, entryFactor: 1.03 },
    { symbol: 'SPY', qty: 30, entryFactor: 0.97 },
  ]

  return holdings
    .filter(h => bars[h.symbol]?.length)
    .map(h => {
      const series = bars[h.symbol]
      const currentPrice = series[series.length - 1].c
      const avgEntryPrice = Number((currentPrice * h.entryFactor).toFixed(2))
      const marketValue = Number((currentPrice * h.qty).toFixed(2))
      const unrealizedPl = Number(((currentPrice - avgEntryPrice) * h.qty).toFixed(2))
      return {
        symbol: h.symbol,
        qty: h.qty,
        avgEntryPrice,
        currentPrice,
        marketValue,
        unrealizedPl,
        unrealizedPlPct: Number((((currentPrice - avgEntryPrice) / avgEntryPrice) * 100).toFixed(2)),
      }
    })
}

export function demoEquityCurve(days = 30): { date: string; equity: number }[] {
  const rand = seededRandom(4711)
  let equity = 100_000
  const out: { date: string; equity: number }[] = []
  const date = new Date()
  date.setDate(date.getDate() - days)

  for (let i = 0; i < days; i++) {
    date.setDate(date.getDate() + 1)
    equity *= 1 + (rand() - 0.45) * 0.012
    out.push({ date: new Date(date).toISOString().split('T')[0], equity: Number(equity.toFixed(2)) })
  }
  return out
}

export function demoOrders(): AlpacaOrder[] {
  return []
}
