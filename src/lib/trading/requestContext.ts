import type { NextRequest } from 'next/server'
import type { BotConfig, TradingCredentials } from '@/types/trading'

// Schlüssel kommen entweder aus den Server-Umgebungsvariablen oder — wie beim
// Oura-/Garmin-Teil dieser App — aus dem Browser des Nutzers. Sie werden als
// Header übertragen, nicht als Query-Parameter, damit sie nicht in URLs und
// Server-Logs landen.
export function credentialsFromRequest(request: NextRequest): Partial<TradingCredentials> {
  return {
    alpacaKeyId: request.headers.get('x-alpaca-key-id') ?? '',
    alpacaSecretKey: request.headers.get('x-alpaca-secret-key') ?? '',
    anthropicApiKey: request.headers.get('x-anthropic-api-key') ?? '',
  }
}

export function configFromRequest(request: NextRequest, fallback: BotConfig): BotConfig {
  const watchlistHeader = request.headers.get('x-watchlist')
  const watchlist = watchlistHeader
    ? watchlistHeader.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 20)
    : fallback.watchlist

  const dryRunHeader = request.headers.get('x-dry-run')
  const dryRun = dryRunHeader === null ? fallback.dryRun : dryRunHeader !== 'false'

  return { ...fallback, watchlist: watchlist.length > 0 ? watchlist : fallback.watchlist, dryRun }
}
