'use client'

import { Moon, Zap, Waves, Clock } from 'lucide-react'

interface SleepBreakdownProps {
  deepSleep: number
  remSleep: number
  lightSleep: number
  totalSleep: number
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export default function SleepBreakdown({ deepSleep, remSleep, lightSleep, totalSleep }: SleepBreakdownProps) {
  const stages = [
    { label: 'Tiefschlaf', value: deepSleep, color: '#7e22ce', icon: Zap, ideal: '13–23%' },
    { label: 'REM', value: remSleep, color: '#a855f7', icon: Waves, ideal: '20–25%' },
    { label: 'Leichtschlaf', value: lightSleep, color: '#6366f1', icon: Moon, ideal: '45–55%' },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">
          Gesamt: <span className="font-semibold text-white">{formatDuration(totalSleep)}</span>
        </span>
      </div>

      {/* Bar visualization */}
      <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-gray-800">
        {stages.map((s) => (
          <div
            key={s.label}
            style={{
              width: `${(s.value / totalSleep) * 100}%`,
              backgroundColor: s.color,
            }}
          />
        ))}
      </div>

      <div className="space-y-2">
        {stages.map((s) => {
          const Icon = s.icon
          const pct = ((s.value / totalSleep) * 100).toFixed(0)
          return (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                <Icon className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-300">{s.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Ideal: {s.ideal}</span>
                <span className="text-xs font-medium text-white">{formatDuration(s.value)}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
