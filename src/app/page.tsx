'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Heart, Moon, Activity, Zap, Battery, Thermometer,
  RefreshCw, AlertCircle, TrendingUp, Timer, Flame, Footprints, Settings
} from 'lucide-react'

import type { DashboardData, GarminActivityData, GarminDailyData } from '@/types'
import { calculateTrainingRecommendation } from '@/lib/trainingRecommendation'
import TrainingCard from '@/components/TrainingCard'
import MetricCard from '@/components/MetricCard'
import TrendChart from '@/components/TrendChart'
import SleepBreakdown from '@/components/SleepBreakdown'
import ComparisonWidget from '@/components/ComparisonWidget'
import FitUpload from '@/components/FitUpload'
import OuraSetup from '@/components/OuraSetup'
import SleepDebt from '@/components/SleepDebt'

const OURA_TOKEN_KEY = 'oura_token'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function formatPace(secondsPerMeter: number): string {
  const secondsPer1000m = secondsPerMeter * 1000
  const min = Math.floor(secondsPer1000m / 60)
  const sec = Math.round(secondsPer1000m % 60)
  return `${min}:${sec.toString().padStart(2, '0')}/km`
}

export default function Dashboard() {
  const [data, setData] = useState<(DashboardData & { isMockData?: boolean }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'sleep' | 'training' | 'trends' | 'setup'>('overview')
  const [ouraToken, setOuraToken] = useState<string>('')
  const [garminOverride, setGarminOverride] = useState<{ activities: GarminActivityData[]; daily: GarminDailyData[] } | null>(null)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(OURA_TOKEN_KEY) : null
    if (saved) setOuraToken(saved)
  }, [])

  const loadData = useCallback(async (token?: string) => {
    setLoading(true)
    setError(null)
    try {
      const t = token ?? ouraToken
      const url = t ? `/api/dashboard?oura_token=${encodeURIComponent(t)}` : '/api/dashboard'
      const res = await fetch(url)
      if (!res.ok) throw new Error('API-Fehler')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Daten konnten nicht geladen werden')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [ouraToken])

  useEffect(() => { loadData() }, [loadData])

  function handleTokenSaved(token: string) {
    setOuraToken(token)
    localStorage.setItem(OURA_TOKEN_KEY, token)
    loadData(token)
    setActiveTab('overview')
  }

  function handleFitData(activities: GarminActivityData[], daily: GarminDailyData[]) {
    setGarminOverride({ activities, daily })
    setActiveTab('overview')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Daten werden geladen…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400">{error}</p>
          <button onClick={() => loadData()} className="mt-4 text-sm text-gray-400 hover:text-white underline">
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  // Merge FIT-uploaded Garmin data with dashboard data
  const effectiveGarmin = garminOverride ?? data.garmin

  const todaySleep = data.oura.sleep[data.oura.sleep.length - 1]
  const todayReadiness = data.oura.readiness[data.oura.readiness.length - 1]
  const todayActivity = data.oura.activity[data.oura.activity.length - 1]
  const todayGarmin = effectiveGarmin.daily[effectiveGarmin.daily.length - 1]
  const recentActivities = effectiveGarmin.activities.slice(-10)
  const lastActivity = recentActivities[recentActivities.length - 1]

  const recommendation = calculateTrainingRecommendation(
    todaySleep, todayReadiness, todayGarmin, recentActivities
  )

  const trendData = data.oura.sleep.map((s, i) => {
    const readiness = data.oura.readiness[i]
    const garmin = effectiveGarmin.daily[i]
    return {
      date: s.date,
      oura_sleep: s.score,
      oura_readiness: readiness?.score,
      oura_hrv: s.average_hrv,
      garmin_rhr: garmin?.restingHeartRate,
      garmin_battery: garmin?.bodyBatteryHighestValue,
      garmin_stress: garmin?.averageStressLevel,
      steps: garmin?.steps ? Math.round(garmin.steps / 100) : undefined,
    }
  })

  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'sleep', label: 'Schlaf' },
    { id: 'training', label: 'Training' },
    { id: 'trends', label: 'Trends' },
    { id: 'setup', label: '', icon: Settings },
  ] as const

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-[#0a0f1e]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">Health Dashboard</h1>
              <p className="text-xs text-gray-400">
                {format(new Date(), "EEEE, dd. MMMM yyyy", { locale: de })}
                {data.isMockData && !ouraToken && (
                  <span className="ml-2 text-amber-400 font-medium">· Demo-Daten</span>
                )}
                {garminOverride && (
                  <span className="ml-2 text-blue-400 font-medium">· FIT-Daten aktiv</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${ouraToken ? 'bg-purple-400' : 'bg-gray-600'}`} />
                  Oura
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${garminOverride ? 'bg-blue-400' : 'bg-gray-600'}`} />
                  Garmin
                </div>
              </div>
              <button
                onClick={() => loadData()}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-3">
            {tabs.map((tab) => {
              const Icon = 'icon' in tab ? tab.icon : null
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            <TrainingCard recommendation={recommendation} />

            <div>
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                Heute · {format(new Date(), 'dd.MM.yyyy')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <MetricCard label="Bereitschaft" value={todayReadiness?.score ?? '–'} icon={Zap} source="oura" subtitle="Oura Readiness" />
                <MetricCard label="Schlafqualität" value={todaySleep?.score ?? '–'} icon={Moon} source="oura" subtitle={todaySleep ? formatDuration(todaySleep.total_sleep_duration) : undefined} />
                <MetricCard label="HRV" value={todaySleep?.average_hrv?.toFixed(0) ?? '–'} unit="ms" icon={Heart} source="oura" subtitle="Durchschnitt Nacht" />
                <MetricCard label="Ruhepuls" value={todayGarmin?.restingHeartRate ?? todaySleep?.lowest_heart_rate ?? '–'} unit="bpm" icon={Heart} source="garmin" />
                <MetricCard label="Body Battery" value={todayGarmin?.bodyBatteryHighestValue ?? '–'} unit="%" icon={Battery} source="garmin" subtitle="Max heute" />
                <MetricCard label="Stresslevel" value={todayGarmin?.averageStressLevel?.toFixed(0) ?? '–'} unit="/100" icon={Thermometer} source="garmin" />
                <MetricCard label="Schritte" value={todayGarmin?.steps?.toLocaleString('de-DE') ?? todayActivity?.steps?.toLocaleString('de-DE') ?? '–'} icon={Footprints} source="garmin" />
                <MetricCard label="Aktive Kalorien" value={todayGarmin?.activeKilocalories ?? todayActivity?.active_calories ?? '–'} unit="kcal" icon={Flame} source="garmin" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <TrendChart title="Bereitschaft & Schlaf (30 Tage)" data={trendData} lines={[
                  { key: 'oura_readiness', label: 'Oura Readiness', color: '#a855f7' },
                  { key: 'oura_sleep', label: 'Schlaf Score', color: '#6366f1', dashed: true },
                ]} height={180} />
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <TrendChart title="Body Battery & Stress (30 Tage)" data={trendData} lines={[
                  { key: 'garmin_battery', label: 'Body Battery', color: '#3b82f6' },
                  { key: 'garmin_stress', label: 'Stress', color: '#f59e0b', dashed: true },
                ]} height={180} />
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <ComparisonWidget
                title="Oura vs. Garmin — Herzfrequenz Vergleich"
                rows={[
                  { label: 'Ruhepuls', ouraValue: todaySleep?.lowest_heart_rate ?? '–', garminValue: todayGarmin?.restingHeartRate ?? '–', unit: 'bpm', better: (todaySleep?.lowest_heart_rate ?? 99) < (todayGarmin?.restingHeartRate ?? 99) ? 'oura' : 'garmin' },
                  { label: 'HRV', ouraValue: todaySleep?.average_hrv?.toFixed(0) ?? '–', garminValue: '–', unit: 'ms', better: 'oura' },
                  { label: 'Schritte', ouraValue: todayActivity?.steps?.toLocaleString('de-DE') ?? '–', garminValue: todayGarmin?.steps?.toLocaleString('de-DE') ?? '–', better: 'equal' },
                  { label: 'Akt. Kalorien', ouraValue: todayActivity?.active_calories ?? '–', garminValue: todayGarmin?.activeKilocalories ?? '–', unit: 'kcal', better: 'equal' },
                ]}
              />
            </div>
          </>
        )}

        {/* SLEEP */}
        {activeTab === 'sleep' && todaySleep && (
          <>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Letzte Nacht</h2>
                <span className="text-xs text-gray-400">{format(new Date(todaySleep.date), 'dd. MMM yyyy', { locale: de })}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{todaySleep.score}</div>
                  <div className="text-xs text-gray-400">Schlaf Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{todaySleep.efficiency.toFixed(0)}%</div>
                  <div className="text-xs text-gray-400">Effizienz</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{todaySleep.average_hrv?.toFixed(0)}</div>
                  <div className="text-xs text-gray-400">HRV (ms)</div>
                </div>
              </div>
              <SleepBreakdown totalSleep={todaySleep.total_sleep_duration} deepSleep={todaySleep.deep_sleep_duration} remSleep={todaySleep.rem_sleep_duration} lightSleep={todaySleep.light_sleep_duration} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Einschlafzeit" value={todaySleep.latency} unit="Min." icon={Timer} source="oura" />
              <MetricCard label="Niedrigster Puls" value={todaySleep.lowest_heart_rate} unit="bpm" icon={Heart} source="oura" />
              <MetricCard label="Atemfrequenz" value={todaySleep.breath_average?.toFixed(1)} unit="/min" icon={Activity} source="oura" />
              <MetricCard label="Körpertemp. Δ" value={todayReadiness?.temperature_deviation ?? '–'} unit="°C" icon={Thermometer} source="oura" />
            </div>

            <SleepDebt sleepData={data.oura.sleep} targetHours={8} />

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <TrendChart title="Schlaf Score & Schlafdauer (30 Tage)" data={trendData} lines={[
                { key: 'oura_sleep', label: 'Schlaf Score', color: '#a855f7' },
                { key: 'oura_hrv', label: 'HRV', color: '#6366f1', dashed: true },
              ]} height={220} />
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <TrendChart title="HRV vs. Ruhepuls (30 Tage)" data={trendData} lines={[
                { key: 'oura_hrv', label: 'Oura HRV', color: '#a855f7' },
                { key: 'garmin_rhr', label: 'Garmin Ruhepuls', color: '#3b82f6', dashed: true },
              ]} height={220} />
            </div>
          </>
        )}

        {/* TRAINING */}
        {activeTab === 'training' && (
          <>
            <TrainingCard recommendation={recommendation} />

            <div>
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Letzte Aktivitäten</h2>
              <div className="space-y-2">
                {recentActivities.slice().reverse().slice(0, 8).map((act, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white capitalize">{act.activityType?.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">{act.date}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                        {act.duration > 0 && <span>{formatDuration(act.duration)}</span>}
                        {act.distance > 0 && <span>{(act.distance / 1000).toFixed(2)} km</span>}
                        {act.averageHR > 0 && <span>{act.averageHR} bpm Ø</span>}
                        {act.calories > 0 && <span>{act.calories} kcal</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {act.trainingEffect && (
                        <div>
                          <div className="text-sm font-bold text-blue-400">{act.trainingEffect.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">Training</div>
                        </div>
                      )}
                      {act.vo2max && <div className="text-xs text-gray-400 mt-1">VO2max {act.vo2max.toFixed(0)}</div>}
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">
                    Keine Aktivitäten — FIT-Dateien im Setup-Tab hochladen
                  </p>
                )}
              </div>
            </div>

            {lastActivity && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard label="Trainingswirkung" value={lastActivity.trainingEffect?.toFixed(1) ?? '–'} unit="/5" icon={TrendingUp} source="garmin" subtitle="Letztes Training" />
                <MetricCard label="VO2max" value={lastActivity.vo2max?.toFixed(0) ?? '–'} unit="ml/kg/min" icon={Activity} source="garmin" />
                <MetricCard label="Max. Puls" value={lastActivity.maxHR ?? '–'} unit="bpm" icon={Heart} source="garmin" />
                {lastActivity.averagePace && <MetricCard label="Ø Tempo" value={formatPace(lastActivity.averagePace)} icon={Timer} source="garmin" />}
                {lastActivity.elevationGain && <MetricCard label="Höhenmeter" value={lastActivity.elevationGain?.toFixed(0)} unit="m" icon={TrendingUp} source="garmin" />}
              </div>
            )}
          </>
        )}

        {/* TRENDS */}
        {activeTab === 'trends' && (
          <>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <TrendChart title="Bereitschaft, Schlaf & Body Battery" data={trendData} lines={[
                  { key: 'oura_readiness', label: 'Oura Readiness', color: '#a855f7' },
                  { key: 'oura_sleep', label: 'Schlaf Score', color: '#6366f1', dashed: true },
                  { key: 'garmin_battery', label: 'Body Battery', color: '#3b82f6' },
                ]} height={240} />
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <TrendChart title="HRV & Ruhepuls — Erholungsindikator" data={trendData} lines={[
                  { key: 'oura_hrv', label: 'HRV (ms)', color: '#10b981' },
                  { key: 'garmin_rhr', label: 'Ruhepuls Garmin', color: '#f59e0b', dashed: true },
                ]} height={220} />
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <TrendChart title="Stress & Schritte (×100)" data={trendData} lines={[
                  { key: 'garmin_stress', label: 'Stress', color: '#ef4444' },
                  { key: 'steps', label: 'Schritte (×100)', color: '#22d3ee', dashed: true },
                ]} height={220} />
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Insights der letzten 30 Tage</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-purple-500/10 rounded-xl">
                  <div className="text-2xl font-bold text-purple-400">
                    {(data.oura.readiness.reduce((s, r) => s + r.score, 0) / data.oura.readiness.length).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Ø Readiness</div>
                </div>
                <div className="text-center p-3 bg-indigo-500/10 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-400">
                    {(data.oura.sleep.reduce((s, r) => s + r.score, 0) / data.oura.sleep.length).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Ø Schlaf Score</div>
                </div>
                <div className="text-center p-3 bg-blue-500/10 rounded-xl">
                  <div className="text-2xl font-bold text-blue-400">
                    {(data.oura.sleep.reduce((s, r) => s + r.average_hrv, 0) / data.oura.sleep.length).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Ø HRV (ms)</div>
                </div>
                <div className="text-center p-3 bg-emerald-500/10 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-400">{effectiveGarmin.activities.length}</div>
                  <div className="text-xs text-gray-400 mt-1">Aktivitäten</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SETUP */}
        {activeTab === 'setup' && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Geräte verbinden</h2>
              <p className="text-sm text-gray-400 mb-5">
                Verbinde deine Geräte — alles bleibt in deinem Browser.
              </p>
            </div>

            <OuraSetup onTokenSaved={handleTokenSaved} currentToken={ouraToken} />

            <FitUpload onDataLoaded={handleFitData} />

            {(ouraToken || garminOverride) && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Verbindungsstatus</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Oura Ring</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ouraToken ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-700 text-gray-500'}`}>
                      {ouraToken ? 'Verbunden' : 'Nicht verbunden'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Garmin (FIT)</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${garminOverride ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-700 text-gray-500'}`}>
                      {garminOverride ? `${garminOverride.activities.length} Aktivitäten` : 'Keine FIT-Daten'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <footer className="text-center text-xs text-gray-600 pb-4">
          {data.isMockData && !ouraToken
            ? 'Demo-Daten — verbinde Oura und Garmin im Setup-Tab'
            : `Zuletzt aktualisiert: ${format(new Date(data.lastUpdated), 'HH:mm dd.MM.yyyy')}`}
        </footer>
      </main>
    </div>
  )
}
