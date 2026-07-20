'use client'

import { isCriticalSatisfaction } from '@/lib/status'

const colorClasses = {
  green: 'text-green-600 border-green-400 bg-green-50',
  red: 'text-red-600 border-red-400 bg-red-50',
}

export default function SatisfactionScore({
  value,
  onChange,
  readOnly = false,
}: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
}) {
  const critical = isCriticalSatisfaction(value)
  const status = critical ? 'red' : 'green'

  return (
    <div className="flex items-center gap-3">
      <div className="flex max-w-sm flex-1 items-end gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = n === value
          return (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => onChange?.(n)}
              title={`${n}`}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className={`h-12 w-full rounded-t-sm transition-all ${
                  n <= value
                    ? isCriticalSatisfaction(n)
                      ? 'bg-red-500'
                      : 'bg-green-500'
                    : 'bg-slate-200'
                } ${selected ? 'ring-2 ring-offset-1 ring-navy-600' : ''}`}
                style={{ height: `${16 + n * 3.6}px` }}
              />
              <span
                className={`text-[10px] leading-none ${
                  selected ? 'font-bold text-navy-700' : 'text-slate-400'
                }`}
              >
                {n}
              </span>
            </button>
          )
        })}
      </div>
      <div
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClasses[status]}`}
      >
        Ausgewählt: {value}/10
        {critical && <span className="font-normal">· kritisch</span>}
      </div>
    </div>
  )
}
