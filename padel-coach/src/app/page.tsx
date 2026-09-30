'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarCheck, Swords, Dumbbell, Settings, BarChart3, Cloud, CloudOff, RefreshCw, Lock } from 'lucide-react'
import type { WearableData } from '@/lib/wearables'
import { buildSignals, isoDate } from '@/lib/coach/engine'
import { getPin, setPin, useCoachState } from '@/lib/coach/useCoachState'
import TodayView from '@/components/TodayView'
import PadelView from '@/components/PadelView'
import TrainingView from '@/components/TrainingView'
import SettingsView from '@/components/SettingsView'
import StatsView from '@/components/StatsView'

type Tab = 'today' | 'stats' | 'padel' | 'training' | 'settings'

const TABS: { id: Tab; label: string; icon: typeof Swords }[] = [
  { id: 'today', label: 'Heute', icon: CalendarCheck },
  { id: 'stats', label: 'Werte', icon: BarChart3 },
  { id: 'padel', label: 'Padel', icon: Swords },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'settings', label: 'Setup', icon: Settings },
]

function PinGate({ setup, onDone }: { setup: boolean; onDone: () => void }) {
  const [pin, setValue] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const input =
    'w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-3 text-white tracking-widest focus:outline-none focus:border-emerald-400'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const p = pin.trim()
    if (setup) {
      if (!/^\d{4,8}$/.test(p)) return setError('Bitte 4–8 Ziffern verwenden.')
      if (p !== pin2.trim()) return setError('Die beiden PINs stimmen nicht überein.')
      const res = await fetch('/api/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: p }) })
      if (!res.ok) return setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Fehler beim Speichern')
    }
    setPin(p)
    onDone()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form className="w-full max-w-xs space-y-4 text-center" onSubmit={submit}>
        <div className="text-5xl">🎾</div>
        <h1 className="text-xl font-bold text-white">Padel & Hyrox Coach</h1>
        <p className="text-sm text-gray-400">
          {setup
            ? 'Willkommen! Lege eine PIN fest (4–8 Ziffern). Sie schützt deine Gesundheitsdaten – auf jedem weiteren Gerät gibst du sie einmal ein.'
            : 'Bitte deine Coach-PIN eingeben. Sie wird auf diesem Gerät gespeichert.'}
        </p>
        <div className="relative">
          <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input autoFocus type="password" inputMode="numeric" placeholder="PIN" value={pin} onChange={(e) => setValue(e.target.value)} className={input} />
        </div>
        {setup && (
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="password" inputMode="numeric" placeholder="PIN wiederholen" value={pin2} onChange={(e) => setPin2(e.target.value)} className={input} />
          </div>
        )}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button className="w-full py-3 rounded-xl font-semibold bg-emerald-500 text-gray-950">{setup ? 'PIN festlegen' : 'Weiter'}</button>
      </form>
    </div>
  )
}

export default function CoachPage() {
  const [tab, setTab] = useState<Tab>('today')
  const [data, setData] = useState<WearableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [needPin, setNeedPin] = useState<false | 'enter' | 'setup'>(false)
  const [notice, setNotice] = useState<string | null>(null)
  const { state, update, replace, sync, resync } = useCoachState()
  const [today, setToday] = useState(() => isoDate(new Date()))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data', { headers: { 'x-coach-pin': getPin() }, cache: 'no-store' })
      if (res.status === 401) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setNeedPin(body.error === 'pin_setup' ? 'setup' : 'enter')
        return
      }
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})

    const params = new URLSearchParams(window.location.search)
    const oura = params.get('oura')
    if (oura) {
      setNotice(oura === 'connected' ? 'Oura ist verbunden ✅' : `Oura-Verbindung fehlgeschlagen (${oura})`)
      setTab('settings')
      window.history.replaceState(null, '', '/')
    }

    // Neuer Tag, wenn die App über Nacht offen bleibt
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const now = isoDate(new Date())
      setToday((prev) => {
        if (prev !== now) {
          void load()
          void resync()
        }
        return now
      })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load, resync])

  const signals = useMemo(
    () => (data ? buildSignals(data, today) : { date: today, recentActivities: [], sources: { oura: false, garmin: false } }),
    [data, today],
  )

  if (needPin)
    return (
      <PinGate
        setup={needPin === 'setup'}
        onDone={() => {
          setNeedPin(false)
          void load()
          void resync()
        }}
      />
    )

  return (
    <div className="min-h-screen pb-24 sm:pb-10">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-[#0a0f1e]/95 backdrop-blur-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">🎾</span> Padel & Hyrox Coach
            </h1>
            <p className="text-xs text-gray-400 truncate">
              {format(new Date(`${today}T12:00:00`), 'EEEE, dd. MMMM', { locale: de })}
              {data?.demo && (
                <button onClick={() => setTab('settings')} className="ml-2 text-amber-400 underline">
                  Beispieldaten – Oura/Garmin verbinden
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span title={sync === 'synced' ? 'Mit allen Geräten synchronisiert' : 'Nur auf diesem Gerät'} className="p-2">
              {sync === 'synced' ? <Cloud className="w-4 h-4 text-emerald-400" /> : <CloudOff className="w-4 h-4 text-gray-600" />}
            </span>
            <button onClick={() => void load()} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white" aria-label="Daten neu laden">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <nav className="hidden sm:flex max-w-6xl mx-auto px-4 pb-3 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                tab === t.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5">
        {notice && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
            {notice}
            <button onClick={() => setNotice(null)} className="text-emerald-300">
              ✕
            </button>
          </div>
        )}
        {!state ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : tab === 'today' ? (
          <TodayView state={state} update={update} signals={signals} today={today} onOpenSettings={() => setTab('settings')} />
        ) : tab === 'stats' ? (
          <StatsView data={data} state={state} signals={signals} today={today} onOpenSettings={() => setTab('settings')} />
        ) : tab === 'padel' ? (
          <PadelView state={state} />
        ) : tab === 'training' ? (
          <TrainingView state={state} signals={signals} today={today} />
        ) : (
          <SettingsView state={state} update={update} replace={replace} sync={sync} resync={resync} signals={signals} data={data} />
        )}
      </main>

      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t border-gray-800 bg-[#0a0f1e]/95 backdrop-blur-sm grid grid-cols-5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              window.scrollTo({ top: 0 })
            }}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${tab === t.id ? 'text-emerald-400' : 'text-gray-500'}`}
          >
            <t.icon className="w-5 h-5" />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
