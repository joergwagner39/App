export type Side = 'buy' | 'sell'
export type SignalAction = 'buy' | 'sell' | 'hold'

export interface Bar {
  t: string   // ISO Zeitstempel (Tagesschluss)
  o: number
  h: number
  l: number
  c: number
  v: number
}

export interface IndicatorSnapshot {
  price: number
  sma20: number | null
  sma50: number | null
  ema12: number | null
  ema26: number | null
  rsi14: number | null
  macd: number | null
  macdSignal: number | null
  macdHistogram: number | null
  atr14: number | null
  bbUpper: number | null
  bbLower: number | null
  bbMiddle: number | null
  changePct1d: number | null
  changePct5d: number | null
}

/** Ein einzelner Regel-Treffer der Strategie, im Klartext erklärt. */
export interface StrategyReason {
  rule: string
  detail: string
  weight: number          // positiv = bullish, negativ = bearish
}

export interface Signal {
  symbol: string
  action: SignalAction
  score: number           // Summe der Gewichte, -100..100
  confidence: number      // 0..100
  reasons: StrategyReason[]
  indicators: IndicatorSnapshot
  stopLoss: number | null
  takeProfit: number | null
  asOf: string
}

export interface AlpacaAccount {
  equity: number
  cash: number
  buyingPower: number
  portfolioValue: number
  lastEquity: number
  currency: string
  status: string
  patternDayTrader: boolean
}

export interface AlpacaPosition {
  symbol: string
  qty: number
  avgEntryPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPl: number
  unrealizedPlPct: number
}

export interface AlpacaOrder {
  id: string
  symbol: string
  side: Side
  qty: number
  type: string
  status: string
  submittedAt: string
  filledAvgPrice: number | null
}

export interface JournalEntry {
  id: string
  timestamp: string
  symbol: string
  action: SignalAction
  executed: boolean
  qty: number
  price: number
  score: number
  confidence: number
  reasons: StrategyReason[]
  commentary: string
  commentarySource: 'claude' | 'regeln'
  orderId: string | null
  note: string | null
}

export interface RiskConfig {
  maxPositions: number
  riskPerTradePct: number     // % des Depotwerts pro Trade als Risiko
  stopLossAtrFactor: number
  takeProfitAtrFactor: number
  minConfidence: number
  maxPositionPct: number      // max. Anteil einer Position am Depot
}

export interface BotConfig {
  watchlist: string[]
  risk: RiskConfig
  dryRun: boolean
}

export interface TradingCredentials {
  alpacaKeyId: string
  alpacaSecretKey: string
  anthropicApiKey: string
}

export interface TradingSnapshot {
  account: AlpacaAccount
  positions: AlpacaPosition[]
  signals: Signal[]
  orders: AlpacaOrder[]
  equityCurve: { date: string; equity: number }[]
  journal: JournalEntry[]
  isDemoData: boolean
  marketOpen: boolean
  config: BotConfig
}
