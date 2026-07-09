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
    <div>
      <div className="flex items-end gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            className={`flex-1 rounded-t-sm transition-all ${
              n <= value
                ? isCriticalSatisfaction(n)
                  ? 'bg-red-500'
                  : 'bg-green-500'
                : 'bg-slate-200'
            }`}
            style={{ height: `${16 + n * 3}px` }}
            title={`${n}`}
          />
        ))}
      </div>
      <div
        className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${colorClasses[status]}`}
      >
        {value} / 10
        {critical && <span className="text-xs font-normal">· kritisch</span>}
      </div>
    </div>
  )
}
