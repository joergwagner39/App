'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarCheck, Swords, Dumbbell, Settings, LayoutDashboard, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import type { DashboardData } from '@/types'
import { buildSignals, isoDate } from '@/lib/coach/engine'
import { useCoachState } from '@/lib/coach/useCoachState'
import TodayView from '@/components/coach/TodayView'
import PadelView from '@/components/coach/PadelView'
import TrainingView from '@/components/coach/TrainingView'
import SettingsView from '@/components/coach/SettingsView'

type Tab = 'today' | 'padel' | 'training' | 'settings'

const TABS: { id: Tab; label: string; icon: typeof Swords }[] = [
  { id: 'today', label: 'Heute', icon: CalendarCheck },
  { id: 'padel', label: 'Padel', icon: Swords },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'settings', label: 'Setup', icon: Settings },
]

type ApiData = DashboardData & { isMockData?: boolean; garminIsMock?: boolean }

export default function CoachPage() {
  const [tab, setTab] = useState<Tab>('today')
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const { state, update, replace, sync, resync } = useCoachState()
  const [today, setToday] = useState(() => isoDate(new Date()))

  async function load() {
    setLoading(true)
    try {
      const token = localStorage.getItem('oura_token')
      const res = await fetch(`/api/dashboard${token ? `?oura_token=${encodeURIComponent(token)}` : ''}`, { cache: 'no-store' })
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    // Datum aktualisieren, wenn die App über Nacht offen bleibt
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signals = useMemo(
    () =>
      data
        ? buildSignals(data, today)
        : { date: today, recentActivities: [], sources: { oura: false, garmin: false } },
    [data, today],
  )

  return (
    <div className="min-h-screen bg-[#0a0f1e] pb-24 sm:pb-10">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-[#0a0f1e]/95 backdrop-blur-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">🎾</span> Padel & Fitness Coach
            </h1>
            <p className="text-xs text-gray-400 truncate">
              {format(new Date(`${today}T12:00:00`), 'EEEE, dd. MMMM', { locale: de })}
              {data && !signals.sources.oura && !signals.sources.garmin && <span className="ml-2 text-amber-400">· ohne Wearable-Daten</span>}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span title={sync === 'synced' ? 'Synchronisiert' : 'Nur lokal'} className="p-2">
              {sync === 'synced' ? <Cloud className="w-4 h-4 text-emerald-400" /> : <CloudOff className="w-4 h-4 text-gray-600" />}
            </span>
            <button onClick={() => void load()} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white" aria-label="Daten neu laden">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white" aria-label="Health Dashboard">
              <LayoutDashboard className="w-4 h-4" />
            </Link>
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
        {!state ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : tab === 'today' ? (
          <TodayView state={state} update={update} signals={signals} today={today} />
        ) : tab === 'padel' ? (
          <PadelView state={state} />
        ) : tab === 'training' ? (
          <TrainingView state={state} signals={signals} today={today} />
        ) : (
          <SettingsView state={state} update={update} replace={replace} sync={sync} resync={resync} signals={signals} />
        )}
      </main>

      {/* Mobile Tab-Bar */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t border-gray-800 bg-[#0a0f1e]/95 backdrop-blur-sm grid grid-cols-4"
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
