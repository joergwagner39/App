'use client'

import { satisfactionStatus } from '@/lib/status'

const colorClasses = {
  green: 'text-green-600 border-green-400 bg-green-50',
  yellow: 'text-yellow-600 border-yellow-400 bg-yellow-50',
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
  const status = satisfactionStatus({ satisfaction: value } as any)

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
                ? status === 'green'
                  ? 'bg-green-500'
                  : status === 'yellow'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
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
      </div>
    </div>
  )
}
