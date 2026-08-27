import Anthropic from '@anthropic-ai/sdk'
import type { AlpacaPosition, Signal } from '@/types/trading'

// Die Entscheidung trifft immer das Regelwerk in strategy.ts.
// Claude bekommt das fertige Ergebnis und formuliert daraus die Erklärung,
// wie sie im Podcast vorgelesen würde — er darf die Entscheidung nicht ändern.

const SYSTEM_PROMPT = `Du bist der Erklärbär eines Börsen-Podcasts und kommentierst die Trades eines Demo-Depots.
Du bekommst eine bereits getroffene Entscheidung eines regelbasierten Handelssystems samt aller Kennzahlen.

Regeln für deine Antwort:
- Schreibe auf Deutsch, 3 bis 5 Sätze, gesprochene Podcast-Sprache, per "wir".
- Erkläre WARUM die Regeln so entschieden haben, und was die wichtigste Kennzahl im Klartext bedeutet.
- Nenne konkrete Zahlen aus den Daten, erfinde niemals welche dazu.
- Bewerte die Entscheidung nicht um: Wenn das System "kaufen" sagt, erklärst du den Kauf.
- Nenne genau ein Risiko oder eine Sache, die das Signal kippen würde.
- Keine Anlageberatung, keine Kursprognosen, keine Emojis, keine Überschriften.`

function formatSignal(signal: Signal, qty: number, position: AlpacaPosition | undefined): string {
  const ind = signal.indicators
  const lines = [
    `Symbol: ${signal.symbol}`,
    `Entscheidung des Regelwerks: ${signal.action.toUpperCase()} (Score ${signal.score}, Vertrauen ${signal.confidence} %)`,
    `Stückzahl: ${qty}`,
    `Kurs: ${ind.price.toFixed(2)} USD`,
    `SMA20: ${ind.sma20?.toFixed(2) ?? 'n/a'} | SMA50: ${ind.sma50?.toFixed(2) ?? 'n/a'}`,
    `RSI(14): ${ind.rsi14?.toFixed(1) ?? 'n/a'}`,
    `MACD: ${ind.macd?.toFixed(2) ?? 'n/a'} | Signallinie: ${ind.macdSignal?.toFixed(2) ?? 'n/a'}`,
    `ATR(14): ${ind.atr14?.toFixed(2) ?? 'n/a'}`,
    `Veränderung 1 Tag: ${ind.changePct1d?.toFixed(2) ?? 'n/a'} % | 5 Tage: ${ind.changePct5d?.toFixed(2) ?? 'n/a'} %`,
    `Stop-Loss: ${signal.stopLoss?.toFixed(2) ?? 'n/a'} | Take-Profit: ${signal.takeProfit?.toFixed(2) ?? 'n/a'}`,
    position
      ? `Bestehende Position: ${position.qty} Stück zu ${position.avgEntryPrice.toFixed(2)} USD, aktuell ${position.unrealizedPlPct.toFixed(2)} % Buchgewinn/-verlust`
      : 'Bestehende Position: keine',
    '',
    'Ausgelöste Regeln:',
    ...signal.reasons.map(r => `- ${r.rule} (Gewicht ${r.weight}): ${r.detail}`),
  ]
  return lines.join('\n')
}

/** Erklärung ohne KI — reicht als Fallback und kostet nichts. */
export function ruleBasedCommentary(signal: Signal, qty: number): string {
  const top = signal.reasons.slice(0, 2)
  const verb = signal.action === 'buy' ? 'kaufen' : signal.action === 'sell' ? 'verkaufen' : 'abwarten'
  const head = signal.action === 'hold'
    ? `Bei ${signal.symbol} bleibt der Bot bei ${signal.indicators.price.toFixed(2)} USD an der Seitenlinie (Score ${signal.score}).`
    : `Der Bot will ${qty} Stück ${signal.symbol} zu ${signal.indicators.price.toFixed(2)} USD ${verb} (Score ${signal.score}, Vertrauen ${signal.confidence} %).`
  const body = top.map(r => `${r.rule}: ${r.detail}`).join(' ')
  const risk = signal.stopLoss && signal.action === 'buy'
    ? ` Der Stop-Loss liegt bei ${signal.stopLoss.toFixed(2)} USD — dort steigt der Bot ohne Diskussion wieder aus.`
    : ''
  return `${head} ${body}${risk}`
}

export interface CommentaryResult {
  text: string
  source: 'claude' | 'regeln'
}

export async function generateCommentary(
  signal: Signal,
  qty: number,
  position: AlpacaPosition | undefined,
  apiKey: string,
): Promise<CommentaryResult> {
  if (!apiKey) {
    return { text: ruleBasedCommentary(signal, qty), source: 'regeln' }
  }

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: formatSignal(signal, qty, position) }],
    })

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim()

    if (!text) return { text: ruleBasedCommentary(signal, qty), source: 'regeln' }
    return { text, source: 'claude' }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('Anthropic: API-Key ungültig')
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error('Anthropic: Rate-Limit erreicht')
    } else if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API-Fehler ${error.status}:`, error.message)
    } else {
      console.error('Kommentar konnte nicht erzeugt werden:', error)
    }
    // Der Handel läuft weiter — nur die Erklärung fällt auf das Regelwerk zurück.
    return { text: ruleBasedCommentary(signal, qty), source: 'regeln' }
  }
}
