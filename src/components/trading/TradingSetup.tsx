'use client'

import { useState } from 'react'
import { CheckCircle, ExternalLink, Key, Loader2, Sparkles, ShieldAlert } from 'lucide-react'

export interface TradingSettings {
  alpacaKeyId: string
  alpacaSecretKey: string
  anthropicApiKey: string
  watchlist: string
  dryRun: boolean
}

interface TradingSetupProps {
  settings: TradingSettings
  onSave: (settings: TradingSettings) => void
}

export default function TradingSetup({ settings, onSave }: TradingSetupProps) {
  const [draft, setDraft] = useState<TradingSettings>(settings)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'error'; message: string }>({ kind: 'idle', message: '' })

  function update<K extends keyof TradingSettings>(key: K, value: TradingSettings[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setStatus({ kind: 'idle', message: '' })
  }

  async function testAndSave() {
    setTesting(true)
    try {
      if (draft.alpacaKeyId.trim() && draft.alpacaSecretKey.trim()) {
        const res = await fetch('/api/verify-alpaca', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyId: draft.alpacaKeyId.trim(), secretKey: draft.alpacaSecretKey.trim() }),
        })
        const data = await res.json()
        if (!data.valid) {
          setStatus({ kind: 'error', message: data.message ?? 'Zugangsdaten wurden abgelehnt.' })
          return
        }
        setStatus({
          kind: 'ok',
          message: `Verbunden — Demo-Depot mit ${Number(data.equity).toLocaleString('de-DE')} ${data.currency}.`,
        })
      } else {
        setStatus({ kind: 'ok', message: 'Ohne Alpaca-Keys gespeichert: Der Bot läuft in der Simulation.' })
      }

      onSave({
        alpacaKeyId: draft.alpacaKeyId.trim(),
        alpacaSecretKey: draft.alpacaSecretKey.trim(),
        anthropicApiKey: draft.anthropicApiKey.trim(),
        watchlist: draft.watchlist,
        dryRun: draft.dryRun,
      })
    } catch {
      setStatus({ kind: 'error', message: 'Verbindung fehlgeschlagen.' })
    } finally {
      setTesting(false)
    }
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500'

  return (
    <div className="space-y-4">
      <div className="bg-gray-900/50 border border-emerald-500/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-white">Alpaca Paper-Trading verbinden</h3>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-4 text-xs text-emerald-300 leading-relaxed">
          <strong>So bekommst du ein Demo-Depot:</strong><br />
          1. Kostenlos registrieren:{' '}
          <a href="https://alpaca.markets/" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
            alpaca.markets <ExternalLink className="w-3 h-3" />
          </a><br />
          2. Oben links auf <em>Paper Trading</em> umschalten (100.000 $ Spielgeld)<br />
          3. Rechts unter <em>API Keys</em> → <em>Generate New Key</em> → beide Werte hier eintragen
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={draft.alpacaKeyId}
            onChange={e => update('alpacaKeyId', e.target.value)}
            placeholder="API Key ID (PK...)"
            className={inputClass}
          />
          <input
            type="password"
            value={draft.alpacaSecretKey}
            onChange={e => update('alpacaSecretKey', e.target.value)}
            placeholder="Secret Key"
            className={inputClass}
          />
        </div>
      </div>

      <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-white">Claude-Kommentar (optional)</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          Mit einem Anthropic-API-Key schreibt Claude zu jedem Trade eine ausführliche Erklärung im Podcast-Ton.
          Ohne Key erklärt der Bot seine Trades weiterhin — nur kürzer, direkt aus dem Regelwerk.
        </p>
        <input
          type="password"
          value={draft.anthropicApiKey}
          onChange={e => update('anthropicApiKey', e.target.value)}
          placeholder="sk-ant-..."
          className={inputClass}
        />
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-white block mb-2">Beobachtungsliste</label>
          <input
            type="text"
            value={draft.watchlist}
            onChange={e => update('watchlist', e.target.value)}
            placeholder="AAPL, MSFT, NVDA"
            className={inputClass}
          />
          <p className="text-[11px] text-gray-500 mt-1">Symbole mit Komma trennen, maximal 20.</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.dryRun}
            onChange={e => update('dryRun', e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-500"
          />
          <span>
            <span className="text-sm text-white block">Trockenlauf</span>
            <span className="text-[11px] text-gray-500">
              Signale und Ordergrößen werden berechnet, aber keine Order abgeschickt — auch nicht ans Demo-Depot.
            </span>
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={testAndSave}
          disabled={testing}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Prüfen &amp; speichern
        </button>
        {status.kind !== 'idle' && (
          <span className={`text-xs ${status.kind === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{status.message}</span>
        )}
      </div>

      <div className="flex gap-2 text-[11px] text-gray-500 bg-gray-900/40 border border-gray-800 rounded-lg p-3">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
        <span>
          Die Schlüssel liegen nur in deinem Browser und werden bei jeder Anfrage an den eigenen Server dieser App
          geschickt. Nutze ausschließlich <strong>Paper-Trading-Keys</strong> — mit Live-Keys würde derselbe Code
          echtes Geld bewegen. Das Ganze ist ein Lernprojekt und keine Anlageberatung.
        </span>
      </div>
    </div>
  )
}
