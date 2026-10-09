/** Signal-Schlüssel, wie sie scripts/screener/run_screener.py schreibt. */
export type SignalKey = 'sma50d' | 'sma200d' | 'sma200w' | 'fib618' | 'rsiD' | 'rsiW'

export const SIGNAL_LABELS: Record<SignalKey, string> = {
  sma50d: '50 Tage',
  sma200d: '200 Tage',
  sma200w: '200 Wochen',
  fib618: 'Fibo 61,8 %',
  rsiD: 'RSI Tag < 30',
  rsiW: 'RSI Woche < 30',
}

export interface ScreenerStock {
  ticker: string
  name: string
  sector: string
  style: 'Qualität' | 'Wachstum'
  currency: string | null
  price: number
  change1d: number | null
  high52w: number
  drawdown: number
  sma50d: number | null
  sma200d: number | null
  sma200w: number | null
  sma200dRising: boolean | null
  dist: Record<'sma50d' | 'sma200d' | 'sma200w' | 'fib618', number | null>
  rsiD: number | null
  rsiW: number | null
  fib: {
    swingHigh: number
    swingHighDate: string
    swingLow: number
    swingLowDate: string
    fib382: number
    fib500: number
    fib618: number
    fib786: number
  } | null
  signals: SignalKey[]
  spark: number[]
}

export interface ScreenerData {
  generatedAt: string
  bands: Record<string, [number, number]>
  rsiOversold: number
  stocks: ScreenerStock[]
  errors: { ticker: string; error: string }[]
}
