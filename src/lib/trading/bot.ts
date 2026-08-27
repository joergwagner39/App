import type {
  AlpacaAccount, AlpacaOrder, AlpacaPosition, Bar, BotConfig,
  JournalEntry, RiskConfig, Signal, TradingCredentials, TradingSnapshot,
} from '@/types/trading'
import * as alpaca from './alpaca'
import { generateCommentary } from './commentary'
import { demoAccount, demoEquityCurve, demoOrders, demoPositions, generateDemoBars } from './demoMarket'
import { appendJournal, makeEntryId, readJournal } from './journal'
import { analyze, positionSize } from './strategy'

export const DEFAULT_RISK: RiskConfig = {
  maxPositions: 5,
  riskPerTradePct: 1,      // höchstens 1 % des Depots pro Trade riskieren
  stopLossAtrFactor: 2,    // Stop 2 ATR unter dem Einstieg
  takeProfitAtrFactor: 3,  // Ziel 3 ATR über dem Einstieg → Chance/Risiko 1,5:1
  minConfidence: 50,
  maxPositionPct: 20,
}

export const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'SPY', 'QQQ', 'AMD']

export function defaultConfig(dryRun: boolean): BotConfig {
  return { watchlist: DEFAULT_WATCHLIST, risk: { ...DEFAULT_RISK }, dryRun }
}

export function credentialsFromEnv(overrides?: Partial<TradingCredentials>): TradingCredentials {
  return {
    alpacaKeyId: overrides?.alpacaKeyId || process.env.ALPACA_API_KEY_ID || '',
    alpacaSecretKey: overrides?.alpacaSecretKey || process.env.ALPACA_API_SECRET_KEY || '',
    anthropicApiKey: overrides?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
  }
}

interface MarketState {
  account: AlpacaAccount
  positions: AlpacaPosition[]
  orders: AlpacaOrder[]
  equityCurve: { date: string; equity: number }[]
  bars: Record<string, Bar[]>
  marketOpen: boolean
  isDemoData: boolean
}

/** Holt Depot und Kurse — echt bei vorhandenen Keys, sonst simuliert. */
export async function loadMarketState(creds: TradingCredentials, watchlist: string[]): Promise<MarketState> {
  const alpacaCreds = { keyId: creds.alpacaKeyId, secretKey: creds.alpacaSecretKey }

  if (alpaca.hasCredentials(alpacaCreds)) {
    try {
      const [account, positions, orders, equityCurve, bars, marketOpen] = await Promise.all([
        alpaca.getAccount(alpacaCreds),
        alpaca.getPositions(alpacaCreds),
        alpaca.getOrders(alpacaCreds),
        alpaca.getEquityCurve(alpacaCreds).catch(() => []),
        alpaca.getDailyBars(alpacaCreds, watchlist),
        alpaca.isMarketOpen(alpacaCreds).catch(() => false),
      ])
      return { account, positions, orders, equityCurve, bars, marketOpen, isDemoData: false }
    } catch (error) {
      console.error('Alpaca nicht erreichbar, es wird auf Simulation umgeschaltet:', error)
    }
  }

  const bars = generateDemoBars(watchlist)
  return {
    account: demoAccount(),
    positions: demoPositions(bars),
    orders: demoOrders(),
    equityCurve: demoEquityCurve(),
    bars,
    marketOpen: false,
    isDemoData: true,
  }
}

function analyzeAll(bars: Record<string, Bar[]>, risk: RiskConfig): Signal[] {
  return Object.entries(bars)
    .filter(([, series]) => series.length >= 60) // zu kurze Historie → keine belastbaren Indikatoren
    .map(([symbol, series]) => analyze(symbol, series, risk))
    .sort((a, b) => b.score - a.score)
}

export async function getSnapshot(
  creds: TradingCredentials,
  config: BotConfig,
): Promise<TradingSnapshot> {
  const state = await loadMarketState(creds, config.watchlist)
  const signals = analyzeAll(state.bars, config.risk)
  const journal = await readJournal()

  return {
    account: state.account,
    positions: state.positions,
    signals,
    orders: state.orders,
    equityCurve: state.equityCurve,
    journal,
    isDemoData: state.isDemoData,
    marketOpen: state.marketOpen,
    config,
  }
}

interface Decision {
  signal: Signal
  qty: number
  execute: boolean
  note: string | null
}

/** Entscheidet je Signal, ob und wie groß gehandelt wird — die Prüfkette ist die Risikokontrolle. */
function decide(
  signal: Signal,
  state: MarketState,
  config: BotConfig,
  openedThisCycle: number,
): Decision {
  const position = state.positions.find(p => p.symbol === signal.symbol)

  if (signal.action === 'hold') {
    return { signal, qty: 0, execute: false, note: 'Kein Signal stark genug — der Bot wartet ab.' }
  }

  if (signal.action === 'sell') {
    if (!position || position.qty <= 0) {
      return { signal, qty: 0, execute: false, note: 'Verkaufssignal, aber der Bot hält diese Aktie gar nicht. Leerverkäufe macht er nicht.' }
    }
    return { signal, qty: position.qty, execute: true, note: null }
  }

  if (position) {
    return { signal, qty: 0, execute: false, note: `Kaufsignal, aber ${signal.symbol} liegt bereits mit ${position.qty} Stück im Depot. Nachkaufen ist ausgeschaltet.` }
  }
  if (signal.confidence < config.risk.minConfidence) {
    return { signal, qty: 0, execute: false, note: `Vertrauen ${signal.confidence} % liegt unter der Mindestschwelle von ${config.risk.minConfidence} %.` }
  }
  if (state.positions.length + openedThisCycle >= config.risk.maxPositions) {
    return { signal, qty: 0, execute: false, note: `Depot ist mit ${config.risk.maxPositions} Positionen voll — Streuung geht vor Nachschlag.` }
  }

  const { qty, explanation } = positionSize(
    state.account.equity,
    state.account.buyingPower,
    signal.indicators.price,
    signal.stopLoss,
    config.risk,
  )
  if (qty <= 0) {
    return { signal, qty: 0, execute: false, note: `Positionsgröße wäre 0 Stück. ${explanation}` }
  }

  return { signal, qty, execute: true, note: explanation }
}

export interface CycleResult {
  entries: JournalEntry[]
  snapshot: TradingSnapshot
}

/**
 * Ein Durchlauf des Bots: Daten holen, Signale rechnen, Orders stellen,
 * jede Entscheidung mit Erklärung ins Tagebuch schreiben.
 */
export async function runCycle(creds: TradingCredentials, config: BotConfig): Promise<CycleResult> {
  const state = await loadMarketState(creds, config.watchlist)
  const signals = analyzeAll(state.bars, config.risk)
  const alpacaCreds = { keyId: creds.alpacaKeyId, secretKey: creds.alpacaSecretKey }
  const canTrade = alpaca.hasCredentials(alpacaCreds) && !state.isDemoData && !config.dryRun

  const entries: JournalEntry[] = []
  let openedThisCycle = 0

  for (const signal of signals) {
    const decision = decide(signal, state, config, openedThisCycle)
    // Nur handlungsrelevante Signale kommen ins Tagebuch — sonst geht es im Rauschen unter.
    if (signal.action === 'hold') continue

    const position = state.positions.find(p => p.symbol === signal.symbol)
    const commentary = await generateCommentary(signal, decision.qty, position, creds.anthropicApiKey)

    let orderId: string | null = null
    let executed = false
    let note = decision.note

    if (decision.execute && canTrade) {
      try {
        const order = await alpaca.placeOrder(alpacaCreds, {
          symbol: signal.symbol,
          qty: decision.qty,
          side: signal.action,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
        })
        orderId = order.id
        executed = true
        if (signal.action === 'buy') openedThisCycle += 1
      } catch (error) {
        note = `Order abgelehnt: ${error instanceof Error ? error.message : String(error)}`
      }
    } else if (decision.execute) {
      note = state.isDemoData
        ? 'Simulationsmodus: Ohne Alpaca-Keys wird die Order nur berechnet, nicht gestellt.'
        : 'Trockenlauf aktiv: Order wurde berechnet, aber nicht abgeschickt.'
    }

    entries.push({
      id: makeEntryId(),
      timestamp: new Date().toISOString(),
      symbol: signal.symbol,
      action: signal.action,
      executed,
      qty: decision.qty,
      price: signal.indicators.price,
      score: signal.score,
      confidence: signal.confidence,
      reasons: signal.reasons,
      commentary: commentary.text,
      commentarySource: commentary.source,
      orderId,
      note,
    })
  }

  const journal = await appendJournal(entries)

  return {
    entries,
    snapshot: {
      account: state.account,
      positions: state.positions,
      signals,
      orders: state.orders,
      equityCurve: state.equityCurve,
      journal,
      isDemoData: state.isDemoData,
      marketOpen: state.marketOpen,
      config,
    },
  }
}
