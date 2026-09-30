'use client'

import { Clock, Target } from 'lucide-react'
import type { Workout, WorkoutContext } from '@/lib/coach/workouts'
import { SESSION_LABEL, MODALITY_LABEL } from '@/lib/coach/workouts'
import { SESSION_STYLE } from './ui'

export default function WorkoutCard({ workout, ctx, compact = false }: { workout: Workout; ctx: WorkoutContext; compact?: boolean }) {
  const st = SESSION_STYLE[workout.type]
  const blocks = workout.blocks(ctx)
  const showModality = ['vo2max', 'zone2'].includes(workout.type)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${st.badge}`}>
          {st.emoji} {SESSION_LABEL[workout.type]}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          {workout.duration}
        </span>
        {showModality && <span className="text-xs text-gray-400">· {MODALITY_LABEL[ctx.modality]}</span>}
      </div>
      <div>
        <h3 className={`font-bold text-white ${compact ? 'text-base' : 'text-xl'}`}>{workout.title}</h3>
        <p className="text-sm text-gray-400 flex items-start gap-1.5 mt-1">
          <Target className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
          {workout.goal}
        </p>
      </div>
      <ol className="space-y-2">
        {blocks.map((b, i) => (
          <li key={i} className="flex gap-3 bg-gray-800/40 rounded-xl p-3">
            <span className="text-xs font-bold text-gray-500 w-5 shrink-0 pt-0.5">{i + 1}</span>
            <div className="min-w-0">
              {!/^\d+$/.test(b.name) && <p className="text-sm font-semibold text-gray-100">{b.name}</p>}
              <p className="text-sm text-gray-300 leading-relaxed">
                {b.detail.split(' · ').map((part, j, arr) => (
                  <span key={j} className={arr.length > 1 ? 'block' : undefined}>
                    {part}
                  </span>
                ))}
              </p>
              {b.note && <p className="text-xs text-gray-500 mt-1">💡 {b.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
