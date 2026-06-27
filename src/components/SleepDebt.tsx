'use client'

import { TrendingDown, TrendingUp, Minus, Moon, AlertTriangle, CheckCircle } from 'lucide-react'
import type { OuraSleepData } from '@/types'

interface SleepDebtProps {
  sleepData: OuraSleepData[]
  targetHours?: number
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function SleepDebt({ sleepData, targetHours = 8 }: SleepDebtProps) {
  if (sleepData.length < 3) return null

  const targetSeconds = targetHours * 3600
  const last7 = sleepData.slice(-7)
  const last30 = sleepData.slice(-30)

  // Sleep debt over last 7 days
  const debt7 = last7.reduce((sum, d) => {
    const deficit = targetSeconds - d.total_sleep_duration
    return sum + Math.max(0, deficit)
  }, 0)

  // Average sleep last 7 days
  const avg7 = last7.reduce((s, d) => s + d.total_sleep_duration, 0) / last7.length
  // Average sleep last 30 days
  const avg30 = last30.reduce((s, d) => s + d.total_sleep_duration, 0) / last30.length

  // Trend: is sleep duration improving?
  const firstHalf = last30.slice(0, 15).reduce((s, d) => s + d.total_sleep_duration, 0) / 15
  const secondHalf = last30.slice(15).reduce((s, d) => s + d.total_sleep_duration, 0) / 15
  const trendDiff = secondHalf - firstHalf

  // Score trend
  const scoreFirst = last30.slice(0, 15).reduce((s, d) => s + d.score, 0) / 15
  const scoreSecond = last30.slice(15).reduce((s, d) => s + d.score, 0) / 15
  const scoreTrend = scoreSecond - scoreFirst

  // Nights below threshold
  const badNights = last7.filter((d) => d.total_sleep_duration < targetSeconds * 0.85).length

  // Catch-up recommendation
  // Sleep science: you can realistically recover ~1h extra per night, max 2-3 nights
  const debtHours = debt7 / 3600
  const catchUpNights = Math.min(3, Math.ceil(debtHours / 1))
  const extraPerNight = catchUpNights > 0 ? Math.min(90 * 60, Math.ceil(debt7 / catchUpNights / 60) * 60) : 0

  const debtLevel = debtHours < 1 ? 'good' : debtHours < 3 ? 'moderate' : 'high'

  const debtConfig = {
    good: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle, label: 'Kein Schlafdefizit' },
    moderate: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle, label: 'Leichtes Defizit' },
    high: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: AlertTriangle, label: 'Deutliches Defizit' },
  }
  const config = debtConfig[debtLevel]
  const Icon = config.icon

  return (
    <div className="space-y-4">
      {/* Debt summary card */}
      <div className={`rounded-xl border ${config.bg} p-4`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
            </div>
            <div className={`text-3xl font-bold ${config.color}`}>
              {debtHours < 0.25 ? '0h' : formatDuration(debt7)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Schlafschuld der letzten 7 Nächte</p>
          </div>
          <Moon className={`w-8 h-8 ${config.color} opacity-50`} />
        </div>

        {debtLevel !== 'good' && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-300 font-medium mb-2">Empfehlung zum Aufholen:</p>
            <ul className="space-y-1.5">
              <li className="text-xs text-gray-300 flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text', 'bg')} flex-shrink-0 mt-1`} />
                Die nächsten <strong className="text-white">{catchUpNights} Nächte</strong> jeweils <strong className="text-white">{formatDuration(extraPerNight)} länger</strong> schlafen
              </li>
              <li className="text-xs text-gray-300 flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text', 'bg')} flex-shrink-0 mt-1`} />
                Ziel: <strong className="text-white">{targetHours}h</strong> pro Nacht — also um <strong className="text-white">{formatDuration(Math.max(0, targetSeconds - avg7))}</strong> früher ins Bett
              </li>
              {badNights > 0 && (
                <li className="text-xs text-gray-300 flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text', 'bg')} flex-shrink-0 mt-1`} />
                  <strong className="text-white">{badNights} von 7 Nächten</strong> unter dem Mindestschlaf von {formatDuration(targetSeconds * 0.85)}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{formatDuration(avg7)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Ø letzte 7 Nächte</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{formatDuration(avg30)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Ø letzte 30 Nächte</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl font-bold text-white">
              {Math.abs(trendDiff / 60).toFixed(0)} Min.
            </span>
            {trendDiff > 300
              ? <TrendingUp className="w-4 h-4 text-emerald-400" />
              : trendDiff < -300
              ? <TrendingDown className="w-4 h-4 text-red-400" />
              : <Minus className="w-4 h-4 text-gray-400" />}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {trendDiff > 300 ? 'mehr' : trendDiff < -300 ? 'weniger' : 'gleich'} als vor 2 Wo.
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className={`text-xl font-bold ${scoreTrend > 2 ? 'text-emerald-400' : scoreTrend < -2 ? 'text-red-400' : 'text-white'}`}>
              {scoreTrend > 0 ? '+' : ''}{scoreTrend.toFixed(0)}
            </span>
            {scoreTrend > 2
              ? <TrendingUp className="w-4 h-4 text-emerald-400" />
              : scoreTrend < -2
              ? <TrendingDown className="w-4 h-4 text-red-400" />
              : <Minus className="w-4 h-4 text-gray-400" />}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Score-Trend (30 Tage)</div>
        </div>
      </div>

      {/* Nightly sleep bars (last 14 days) */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Schlafdauer letzte 14 Nächte</h4>
        <div className="flex items-end gap-1.5 h-20">
          {sleepData.slice(-14).map((d, i) => {
            const pct = Math.min(1, d.total_sleep_duration / (10 * 3600))
            const targetPct = targetSeconds / (10 * 3600)
            const isShort = d.total_sleep_duration < targetSeconds * 0.9
            const date = new Date(d.date)
            const dayLabel = date.toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative flex items-end" style={{ height: 64 }}>
                  {/* Target line */}
                  <div
                    className="absolute w-full border-t border-dashed border-gray-600 opacity-50"
                    style={{ bottom: `${targetPct * 100}%` }}
                  />
                  <div
                    className={`w-full rounded-t transition-all ${isShort ? 'bg-amber-500/70' : 'bg-purple-500/70'}`}
                    style={{ height: `${pct * 100}%` }}
                    title={`${d.date}: ${formatDuration(d.total_sleep_duration)} (Score: ${d.score})`}
                  />
                </div>
                <span className="text-[9px] text-gray-500">{dayLabel}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-2 rounded-sm bg-purple-500/70" /> Ausreichend
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-2 rounded-sm bg-amber-500/70" /> Zu kurz
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="border-t border-dashed border-gray-500 w-4" /> Ziel ({targetHours}h)
          </div>
        </div>
      </div>
    </div>
  )
}
