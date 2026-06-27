'use client'

import { Moon, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle } from 'lucide-react'
import type { OuraSleepData } from '@/types'

interface SleepRecommendationProps {
  sleepData: OuraSleepData[]
  targetHours?: number
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function SleepRecommendation({ sleepData, targetHours = 8 }: SleepRecommendationProps) {
  if (sleepData.length < 2) return null

  const targetSeconds = targetHours * 3600
  const last7 = sleepData.slice(-7)
  const today = sleepData[sleepData.length - 1]

  const avg7 = last7.reduce((s, d) => s + d.total_sleep_duration, 0) / last7.length
  const debt7 = last7.reduce((sum, d) => sum + Math.max(0, targetSeconds - d.total_sleep_duration), 0)
  const debtHours = debt7 / 3600

  // Trend: last 3 vs previous 3 nights
  const recentAvg = last7.slice(-3).reduce((s, d) => s + d.total_sleep_duration, 0) / 3
  const prevAvg = last7.slice(0, 3).reduce((s, d) => s + d.total_sleep_duration, 0) / 3
  const trendDiff = (recentAvg - prevAvg) / 60 // in minutes

  const deficit = targetSeconds - today.total_sleep_duration
  const deficitMin = Math.round(deficit / 60)

  let status: 'great' | 'ok' | 'warn' | 'critical'
  if (today.score >= 80 && debtHours < 1) status = 'great'
  else if (today.score >= 65 && debtHours < 2) status = 'ok'
  else if (debtHours < 4) status = 'warn'
  else status = 'critical'

  const statusConfig = {
    great: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle, headline: 'Ausgezeichnet geschlafen' },
    ok: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: CheckCircle, headline: 'Guter Schlaf' },
    warn: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle, headline: 'Schlaf nachholen' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: AlertTriangle, headline: 'Deutliches Schlafdefizit' },
  }

  const cfg = statusConfig[status]
  const Icon = cfg.icon

  // Build recommendation text
  const lines: string[] = []
  if (deficitMin > 15) {
    const catchUpNights = Math.min(3, Math.ceil(debtHours))
    const extraPerNight = Math.min(90, Math.ceil((debt7 / catchUpNights) / 60))
    lines.push(`Heute ${formatDuration(today.total_sleep_duration)} — ${deficitMin} Min. unter dem Ziel von ${targetHours}h`)
    lines.push(`Empfehlung: Nächste ${catchUpNights} Nächte je ~${extraPerNight} Min. früher schlafen`)
  } else {
    lines.push(`Heute ${formatDuration(today.total_sleep_duration)} — Ziel erreicht`)
  }

  if (today.score < 70) lines.push(`Schlafqualität verbesserungswürdig (Score ${today.score}) — auf Koffein & Bildschirme vor dem Schlafen achten`)
  if (today.average_hrv && today.average_hrv < 35) lines.push('Niedriger HRV deutet auf unvollständige Erholung hin')

  return (
    <div className={`rounded-xl border ${cfg.bg} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${cfg.color}`} />
        <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.headline}</span>
        <div className="ml-auto flex items-center gap-1">
          {trendDiff > 10
            ? <><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs text-emerald-400">+{trendDiff.toFixed(0)} Min. Trend</span></>
            : trendDiff < -10
            ? <><TrendingDown className="w-3.5 h-3.5 text-red-400" /><span className="text-xs text-red-400">{trendDiff.toFixed(0)} Min. Trend</span></>
            : <><Minus className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-400">Stabil</span></>}
        </div>
      </div>

      {/* Mini sleep bar visual */}
      <div className="flex items-end gap-1 h-10 mb-3">
        {last7.map((d, i) => {
          const pct = Math.min(1, d.total_sleep_duration / (10 * 3600))
          const isShort = d.total_sleep_duration < targetSeconds * 0.9
          const isToday = i === last7.length - 1
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full relative" style={{ height: 32 }}>
                <div
                  className={`absolute bottom-0 w-full rounded-t transition-all ${
                    isToday
                      ? isShort ? 'bg-amber-400' : 'bg-emerald-400'
                      : isShort ? 'bg-amber-500/50' : 'bg-purple-500/50'
                  }`}
                  style={{ height: `${pct * 100}%` }}
                />
                {/* Target line */}
                <div
                  className="absolute w-full border-t border-dashed border-gray-600 opacity-60"
                  style={{ bottom: `${(targetSeconds / (10 * 3600)) * 100}%` }}
                />
              </div>
              <span className={`text-[9px] ${isToday ? 'text-white font-bold' : 'text-gray-600'}`}>
                {isToday ? 'H' : new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 1)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="space-y-1">
        {lines.map((l, i) => (
          <p key={i} className={`text-xs ${i === 0 ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
            {i > 0 && '· '}{l}
          </p>
        ))}
      </div>

      <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{today.score}</div>
          <div className="text-[10px] text-gray-400">Score heute</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">{formatDuration(avg7)}</div>
          <div className="text-[10px] text-gray-400">Ø 7 Nächte</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${debtHours < 1 ? 'text-emerald-400' : debtHours < 3 ? 'text-amber-400' : 'text-red-400'}`}>
            {debtHours < 0.25 ? '0h' : formatDuration(debt7)}
          </div>
          <div className="text-[10px] text-gray-400">Schuld (7T)</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">{today.average_hrv?.toFixed(0) ?? '–'}</div>
          <div className="text-[10px] text-gray-400">HRV (ms)</div>
        </div>
      </div>
    </div>
  )
}
