'use client'

import { MOOD_EMOJI, MOOD_LABELS, moodColor } from '@/lib/journal'

interface MoodScaleProps {
  value: number
  onChange: (mood: number) => void
}

/**
 * Große Touch-Ziele (min. 56px) – gedacht für den Finger auf dem iPad,
 * nicht für die Maus.
 */
export default function MoodScale({ value, onChange }: MoodScaleProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((mood) => {
          const active = mood === value
          return (
            <button
              key={mood}
              type="button"
              onClick={() => onChange(mood)}
              aria-label={`${mood} von 10 – ${MOOD_LABELS[mood]}`}
              aria-pressed={active}
              className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 transition-all sm:h-[4.5rem] sm:w-[4.5rem] ${
                active
                  ? 'scale-105 border-transparent shadow-lg'
                  : 'border-gray-800 bg-gray-900/60 hover:border-gray-600 active:scale-95'
              }`}
              style={active ? { backgroundColor: moodColor(mood), color: '#0a0f1e' } : undefined}
            >
              <span className="text-2xl leading-none">{MOOD_EMOJI[mood]}</span>
              <span className={`mt-1 text-xs font-semibold ${active ? '' : 'text-gray-400'}`}>
                {mood}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-sm text-gray-400">
        Heute:{' '}
        <span className="font-semibold" style={{ color: moodColor(value) }}>
          {value}/10 – {MOOD_LABELS[value]}
        </span>
      </p>
    </div>
  )
}
