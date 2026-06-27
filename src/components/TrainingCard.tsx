'use client'

import type { TrainingRecommendation } from '@/types'
import { Activity, Battery, Moon, Zap, Coffee, TrendingDown } from 'lucide-react'

const levelConfig = {
  peak: {
    bg: 'from-emerald-900/50 to-emerald-800/30',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500',
    icon: Zap,
  },
  hard: {
    bg: 'from-blue-900/50 to-blue-800/30',
    border: 'border-blue-500',
    text: 'text-blue-400',
    badge: 'bg-blue-500',
    icon: Activity,
  },
  moderate: {
    bg: 'from-amber-900/50 to-amber-800/30',
    border: 'border-amber-500',
    text: 'text-amber-400',
    badge: 'bg-amber-500',
    icon: TrendingDown,
  },
  easy: {
    bg: 'from-orange-900/50 to-orange-800/30',
    border: 'border-orange-500',
    text: 'text-orange-400',
    badge: 'bg-orange-500',
    icon: Battery,
  },
  rest: {
    bg: 'from-red-900/50 to-red-800/30',
    border: 'border-red-500',
    text: 'text-red-400',
    badge: 'bg-red-500',
    icon: Coffee,
  },
}

interface TrainingCardProps {
  recommendation: TrainingRecommendation
}

export default function TrainingCard({ recommendation }: TrainingCardProps) {
  const config = levelConfig[recommendation.level]
  const Icon = config.icon

  return (
    <div className={`rounded-2xl border ${config.border} bg-gradient-to-br ${config.bg} p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`${config.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide`}>
              {recommendation.level === 'peak' ? 'Spitzenleistung'
                : recommendation.level === 'hard' ? 'Intensiv'
                : recommendation.level === 'moderate' ? 'Moderat'
                : recommendation.level === 'easy' ? 'Leicht'
                : 'Ruhetag'}
            </span>
          </div>
          <h2 className={`text-2xl font-bold ${config.text}`}>{recommendation.title}</h2>
          <p className="text-gray-300 mt-1 text-sm">{recommendation.description}</p>
        </div>
        <Icon className={`${config.text} w-10 h-10 flex-shrink-0`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {recommendation.suggestedActivities.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Empfohlene Aktivitäten</h3>
            <ul className="space-y-1">
              {recommendation.suggestedActivities.map((a) => (
                <li key={a} className="flex items-center gap-2 text-sm text-gray-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${config.badge} flex-shrink-0`} />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {recommendation.targetHRZone && (
            <div>
              <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Herzfrequenzzone</h3>
              <p className={`text-sm font-medium ${config.text}`}>{recommendation.targetHRZone}</p>
            </div>
          )}
          {recommendation.targetDuration && (
            <div>
              <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Dauer</h3>
              <p className={`text-sm font-medium ${config.text}`}>{recommendation.targetDuration}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Warum diese Empfehlung?</h3>
        <ul className="space-y-1">
          {recommendation.reasoning.map((r, i) => (
            <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
              <Moon className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-500" />
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
