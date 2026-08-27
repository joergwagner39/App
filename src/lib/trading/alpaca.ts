import type { AlpacaAccount, AlpacaOrder, AlpacaPosition, Bar, Side } from '@/types/trading'

// Alpaca Paper Trading — ein kostenloses Demo-Depot mit 100.000 $ Spielgeld.
// Keys anlegen unter https://app.alpaca.markets/paper/dashboard/overview
const TRADING_BASE = 'https://paper-api.alpaca.markets/v2'
const DATA_BASE = 'https://data.alpaca.markets/v2'

export class AlpacaError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AlpacaError'
    this.status = status
  }
}

export interface AlpacaCredentials {
  keyId: string
  secretKey: string
}

export function hasCredentials(creds: Partial<AlpacaCredentials> | undefined): creds is AlpacaCredentials {
  return Boolean(creds?.keyId && creds?.secretKey)
}

async function request<T>(creds: AlpacaCredentials, url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      'APCA-API-KEY-ID': creds.keyId,
      'APCA-API-SECRET-KEY': creds.secretKey,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new AlpacaError(`Alpaca ${res.status}: ${body.slice(0, 300)}`, res.status)
  }
  return res.json() as Promise<T>
}

const num = (v: unknown): number => {
  const parsed = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export async function getAccount(creds: AlpacaCredentials): Promise<AlpacaAccount> {
  const raw = await request<Record<string, unknown>>(creds, `${TRADING_BASE}/account`)
  return {
    equity: num(raw.equity),
    cash: num(raw.cash),
    buyingPower: num(raw.buying_power),
    portfolioValue: num(raw.portfolio_value),
    lastEquity: num(raw.last_equity),
    currency: String(raw.currency ?? 'USD'),
    status: String(raw.status ?? 'UNKNOWN'),
    patternDayTrader: Boolean(raw.pattern_day_trader),
  }
}

export async function getPositions(creds: AlpacaCredentials): Promise<AlpacaPosition[]> {
  const raw = await request<Record<string, unknown>[]>(creds, `${TRADING_BASE}/positions`)
  return raw.map(p => ({
    symbol: String(p.symbol),
    qty: num(p.qty),
    avgEntryPrice: num(p.avg_entry_price),
    currentPrice: num(p.current_price),
    marketValue: num(p.market_value),
    unrealizedPl: num(p.unrealized_pl),
    unrealizedPlPct: num(p.unrealized_plpc) * 100,
  }))
}

export async function getOrders(creds: AlpacaCredentials, limit = 20): Promise<AlpacaOrder[]> {
  const raw = await request<Record<string, unknown>[]>(
    creds,
    `${TRADING_BASE}/orders?status=all&limit=${limit}&direction=desc`,
  )
  return raw.map(o => ({
    id: String(o.id),
    symbol: String(o.symbol),
    side: String(o.side) as Side,
    qty: num(o.qty),
    type: String(o.type),
    status: String(o.status),
    submittedAt: String(o.submitted_at),
    filledAvgPrice: o.filled_avg_price ? num(o.filled_avg_price) : null,
  }))
}

export async function isMarketOpen(creds: AlpacaCredentials): Promise<boolean> {
  const raw = await request<{ is_open: boolean }>(creds, `${TRADING_BASE}/clock`)
  return Boolean(raw.is_open)
}

export interface PlaceOrderParams {
  symbol: string
  qty: number
  side: Side
  stopLoss?: number | null
  takeProfit?: number | null
}

export async function placeOrder(creds: AlpacaCredentials, params: PlaceOrderParams): Promise<AlpacaOrder> {
  // Kauf als Bracket-Order: Stop-Loss und Take-Profit hängen direkt am Einstieg.
  // Verkauf schließt nur die Position, deshalb ohne Klammer.
  const useBracket = params.side === 'buy' && params.stopLoss != null && params.takeProfit != null
  const body: Record<string, unknown> = {
    symbol: params.symbol,
    qty: String(params.qty),
    side: params.side,
    type: 'market',
    time_in_force: 'day',
  }
  if (useBracket) {
    body.order_class = 'bracket'
    body.stop_loss = { stop_price: params.stopLoss!.toFixed(2) }
    body.take_profit = { limit_price: params.takeProfit!.toFixed(2) }
  }

  const raw = await request<Record<string, unknown>>(creds, `${TRADING_BASE}/orders`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return {
    id: String(raw.id),
    symbol: String(raw.symbol),
    side: String(raw.side) as Side,
    qty: num(raw.qty),
    type: String(raw.type),
    status: String(raw.status),
    submittedAt: String(raw.submitted_at),
    filledAvgPrice: raw.filled_avg_price ? num(raw.filled_avg_price) : null,
  }
}

export async function getEquityCurve(
  creds: AlpacaCredentials,
  period = '1M',
): Promise<{ date: string; equity: number }[]> {
  const raw = await request<{ timestamp: number[]; equity: number[] }>(
    creds,
    `${TRADING_BASE}/account/portfolio/history?period=${period}&timeframe=1D`,
  )
  return (raw.timestamp ?? []).map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    equity: num(raw.equity?.[i]),
  })).filter(point => point.equity > 0)
}

/** Tageskerzen für mehrere Symbole. Der kostenlose IEX-Feed reicht für Tagesdaten. */
export async function getDailyBars(
  creds: AlpacaCredentials,
  symbols: string[],
  days = 200,
): Promise<Record<string, Bar[]>> {
  if (symbols.length === 0) return {}
  const start = new Date()
  start.setDate(start.getDate() - Math.ceil(days * 1.6)) // Puffer für Wochenenden/Feiertage

  const url = `${DATA_BASE}/stocks/bars?symbols=${symbols.join(',')}`
    + `&timeframe=1Day&start=${start.toISOString().split('T')[0]}`
    + `&limit=10000&adjustment=split&feed=iex&sort=asc`

  const raw = await request<{ bars: Record<string, Record<string, unknown>[]> }>(creds, url)
  const out: Record<string, Bar[]> = {}
  for (const [symbol, bars] of Object.entries(raw.bars ?? {})) {
    out[symbol] = bars.map(b => ({
      t: String(b.t),
      o: num(b.o),
      h: num(b.h),
      l: num(b.l),
      c: num(b.c),
      v: num(b.v),
    }))
  }
  return out
}
