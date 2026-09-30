'use client'

import type { Dose } from '@/lib/coach/types'

const btn = (active: boolean) =>
  `flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-emerald-500 text-gray-950' : 'text-gray-300 hover:bg-gray-700/60'}`

/** Vor dem Workout: weniger (Zeit oder Kraft/Gefühl), normal oder mehr trainieren. */
export default function DosePicker({ dose, onChange }: { dose: Dose; onChange: (d: Dose) => void }) {
  return (
    <div className="mb-4 space-y-2">
      <p className="text-xs text-gray-400">Wie viel willst du heute trainieren?</p>
      <div className="flex gap-1 bg-gray-800/60 border border-gray-700 rounded-xl p-1">
        <button className={btn(dose.level === 'less')} onClick={() => onChange({ level: 'less', reason: dose.reason ?? 'time' })}>
          ➖ Weniger
        </button>
        <button className={btn(dose.level === 'normal')} onClick={() => onChange({ level: 'normal' })}>
          Normal
        </button>
        <button className={btn(dose.level === 'more')} onClick={() => onChange({ level: 'more' })}>
          ➕ Mehr
        </button>
      </div>
      {dose.level === 'less' && (
        <div className="flex gap-2">
          {(
            [
              ['time', '⏱️ Wenig Zeit', 'kürzer, gleiche Intensität'],
              ['energy', '🔋 Wenig Kraft / Gefühl', 'leichtere Einheit'],
            ] as const
          ).map(([reason, label, hint]) => (
            <button
              key={reason}
              onClick={() => onChange({ level: 'less', reason })}
              className={`flex-1 text-left px-3 py-2 rounded-xl border text-sm ${
                dose.reason === reason ? 'bg-amber-500/15 border-amber-400 text-amber-100' : 'border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              {label}
              <span className="block text-[11px] text-gray-500">{hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
