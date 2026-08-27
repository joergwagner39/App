'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, BookOpen, LineChart, Loader2, Play, RefreshCw,
  Settings, AlertCircle, Wallet, TrendingUp, Layers, Activity,
} from 'lucide-react'

import type { CycleResult } from '@/lib/trading/bot'
import type { TradingSnapshot } from '@/types/trading'
import EquityChart from '@/components/trading/EquityChart'
import JournalFeed from '@/components/trading/JournalFeed'
import PositionsTable from '@/components/trading/PositionsTable'
import SignalCard from '@/components/trading/SignalCard'
import TradingSetup, { type TradingSettings } from '@/components/trading/TradingSetup'

const STORAGE_KEY = 'trading_settings'

const DEFAULT_SETTINGS: TradingSettings = {
  alpacaKeyId: '',
  alpacaSecretKey: '',
  anthropicApiKey: '',
  watchlist: 'AAPL, MSFT, NVDA, GOOGL, AMZN, SPY, QQQ, AMD',
  dryRun: true,
}

type Tab = 'uebersicht' | 'signale' | 'tagebuch' | 'setup'

const TABS: { id: Tab; label: string; Icon: typeof LineChart }[] = [
  { id: 'uebersicht', label: 'Übersicht', Icon: Wallet },
  { id: 'signale', label: 'Signale', Icon: LineChart },
  { id: 'tagebuch', label: 'Tagebuch', Icon: BookOpen },
  { id: 'setup', label: 'Setup', Icon: Settings },
]

function settingsToHeaders(settings: TradingSettings): Record<string, string> {
  return {
    'x-alpaca-key-id': settings.alpacaKeyId,
    'x-alpaca-secret-key': settings.alpacaSecretKey,
    'x-anthropic-api-key': settings.anthropicApiKey,
    'x-watchlist': settings.watchlist,
    'x-dry-run': String(settings.dryRun),
  }
}

function StatCard({ label, value, sub, Icon, tone = 'neutral' }: {
  label: string
  value: string
  sub?: string
  Icon: typeof Wallet
  tone?: 'neutral' | 'up' | 'down'
}) {
  const toneClass = tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-red-400' : 'text-white'
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
          {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <Icon className="w-5 h-5 text-gray-500" />
      </div>
    </div>
  )
}

export default function TradingPage() {
  const [settings, setSettings] = useState<TradingSettings>(DEFAULT_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [snapshot, setSnapshot] = useState<TradingSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<CycleResult['entries'] | null>(null)
  const [tab, setTab] = useState<Tab>('uebersicht')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
    } catch {
      // Beschädigter Eintrag — die Standardeinstellungen greifen.
    }
    setSettingsLoaded(true)
  }, [])

  const loadSnapshot = useCallback(async (current: TradingSettings) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/trading', { headers: settingsToHeaders(current) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Daten konnten nicht geladen werden')
      setSnapshot(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (settingsLoaded) loadSnapshot(settings)
  }, [settingsLoaded, settings, loadSnapshot])

  function saveSettings(next: TradingSettings) {
    setSettings(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Privater Modus o. Ä. — dann gelten die Einstellungen nur für diese Sitzung.
    }
  }

  async function runBot() {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch('/api/trading/run', { method: 'POST', headers: settingsToHeaders(settings) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Durchlauf fehlgeschlagen')
      const result = data as CycleResult
      setSnapshot(result.snapshot)
      setLastRun(result.entries)
      setTab('tagebuch')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setRunning(false)
    }
  }

  const account = snapshot?.account
  const dayChange = account ? account.equity - account.lastEquity : 0
  const dayChangePct = account && account.lastEquity > 0 ? (dayChange / account.lastEquity) * 100 : 0
  const openPl = snapshot?.positions.reduce((sum, p) => sum + p.unrealizedPl, 0) ?? 0
  const actionable = snapshot?.signals.filter(s => s.action !== 'hold') ?? []

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <header className="mb-6">
        <Link href="/" className="text-xs text-gray-500 hover:text-white inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> Zurück zum Gesundheits-Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">Trading-Bot</h1>
            <p className="text-sm text-gray-400 mt-1">
              Regelbasierte Signale auf einem Demo-Depot — jede Entscheidung wird erklärt.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadSnapshot(settings)}
              disabled={loading || running}
              className="border border-gray-700 hover:border-gray-500 disabled:opacity-50 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Aktualisieren
            </button>
            <button
              onClick={runBot}
              disabled={running || loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? 'Bot rechnet…' : 'Durchlauf starten'}
            </button>
          </div>
        </div>
      </header>

      {snapshot?.isDemoData && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-start gap-2 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Simulationsmodus: Ohne Alpaca-Keys arbeitet der Bot mit erzeugten Kursen und einem fiktiven Depot.
            Unter <button onClick={() => setTab('setup')} className="underline">Setup</button> verbindest du ein echtes Paper-Depot.
          </span>
        </div>
      )}

      {snapshot && !snapshot.isDemoData && settings.dryRun && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4 flex items-start gap-2 text-xs text-blue-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Trockenlauf aktiv — der Bot rechnet, schickt aber keine Orders ans Demo-Depot.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-start gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <nav className="flex gap-1 mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors ${
              tab === id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </nav>

      {loading && !snapshot ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : snapshot ? (
        <>
          {tab === 'uebersicht' && account && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  label="Depotwert"
                  value={`${account.equity.toLocaleString('de-DE', { maximumFractionDigits: 0 })} $`}
                  sub={`Cash ${account.cash.toLocaleString('de-DE', { maximumFractionDigits: 0 })} $`}
                  Icon={Wallet}
                />
                <StatCard
                  label="Heute"
                  value={`${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)} $`}
                  sub={`${dayChangePct >= 0 ? '+' : ''}${dayChangePct.toFixed(2)} %`}
                  Icon={TrendingUp}
                  tone={dayChange >= 0 ? 'up' : 'down'}
                />
                <StatCard
                  label="Offene Positionen"
                  value={String(snapshot.positions.length)}
                  sub={`Buchgewinn ${openPl >= 0 ? '+' : ''}${openPl.toFixed(2)} $`}
                  Icon={Layers}
                  tone={openPl >= 0 ? 'up' : 'down'}
                />
                <StatCard
                  label="Aktive Signale"
                  value={String(actionable.length)}
                  sub={snapshot.marketOpen ? 'Börse geöffnet' : 'Börse geschlossen'}
                  Icon={Activity}
                />
              </div>

              <EquityChart data={snapshot.equityCurve} />

              <div>
                <h2 className="text-sm font-medium text-white mb-3">Positionen</h2>
                <PositionsTable positions={snapshot.positions} />
              </div>
            </div>
          )}

          {tab === 'signale' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                {snapshot.signals.length} Werte ausgewertet, sortiert nach Score. Klick auf „Warum?“ zeigt jede
                einzelne Regel, die zur Entscheidung beigetragen hat.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {snapshot.signals.map(signal => <SignalCard key={signal.symbol} signal={signal} />)}
              </div>
            </div>
          )}

          {tab === 'tagebuch' && (
            <div className="space-y-4">
              {lastRun && (
                <p className="text-xs text-gray-500">
                  Letzter Durchlauf: {lastRun.length === 0
                    ? 'kein handelbares Signal — der Bot bleibt an der Seitenlinie.'
                    : `${lastRun.length} Entscheidung(en) protokolliert.`}
                </p>
              )}
              <JournalFeed entries={snapshot.journal} />
            </div>
          )}

          {tab === 'setup' && <TradingSetup settings={settings} onSave={saveSettings} />}
        </>
      ) : null}
    </main>
  )
}
