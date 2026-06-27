'use client'

import type { WellnessScore, FitnessScore } from '@/lib/scores'
import ScoreRing from './ScoreRing'
import { Info } from 'lucide-react'
import { useState } from 'react'

interface HomeScoresProps {
  wellness: WellnessScore
  fitness: FitnessScore
}

function ComponentBar({ label, score, source, unit, value }: {
  label: string
  score: number
  source?: 'oura' | 'garmin'
  unit?: string
  value?: string | number
}) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0">
        <span className="text-xs text-gray-400">{label}</span>
        {source && (
          <span className={`ml-1 text-[10px] ${source === 'oura' ? 'text-purple-500' : 'text-blue-500'}`}>
            {source === 'oura' ? 'Oura' : 'Garmin'}
          </span>
        )}
      </div>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-16 text-right">
        <span className="text-xs font-medium" style={{ color }}>
          {value !== undefined ? value : `${score.toFixed(0)}%`}
        </span>
      </div>
    </div>
  )
}

export default function HomeScores({ wellness, fitness }: HomeScoresProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="space-y-4">
      {/* Score Rings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex flex-col items-center">
          <ScoreRing
            score={wellness.total}
            grade={wellness.grade}
            label="Wellness Score"
            sublabel={wellness.label}
            color={wellness.color}
            size="lg"
          />
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex flex-col items-center">
          <ScoreRing
            score={fitness.total}
            grade={fitness.grade}
            label="Fitness Score"
            sublabel={fitness.label}
            color={fitness.color}
            size="lg"
          />
        </div>
      </div>

      {/* Details toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-200 py-2 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        {showDetails ? 'Details ausblenden' : 'Wie berechnet sich das?'}
      </button>

      {showDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wellness Breakdown */}
          <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Wellness Score — Erholung
            </h4>
            {wellness.components.map((c) => (
              <ComponentBar
                key={c.label}
                label={c.label}
                score={c.score}
                source={c.source}
                value={c.label === 'HRV' ? `${c.value.toFixed(0)} ms` : c.label === 'Stressresistenz' ? `${c.value.toFixed(0)}%` : c.value.toFixed(0)}
              />
            ))}
            <p className="text-[10px] text-gray-600 pt-1">
              Schlaf 28% · Readiness 25% · HRV 22% · Body Battery 15% · Stress 10%
            </p>
          </div>

          {/* Fitness Breakdown */}
          <div className="bg-gray-900/50 border border-blue-500/20 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Fitness Score — Leistung
            </h4>
            {fitness.components.map((c) => (
              <ComponentBar
                key={c.label}
                label={c.label}
                score={c.score}
                value={c.value}
              />
            ))}
            <p className="text-[10px] text-gray-600 pt-1">
              VO2max 30% · Ruhepuls 25% · Konsistenz 20% · Training-Eff. 15% · HRV-Trend 10%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
