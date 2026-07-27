'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

import { MOOD_EMOJI, MOOD_LABELS, type MoodPoint } from '@/lib/journal'

interface MoodTrendChartProps {
  data: MoodPoint[]
  average: number | null
  height?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MoodTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const mood = payload.find((p: { dataKey: string }) => p.dataKey === 'mood')?.value as number | undefined
  const avg = payload.find((p: { dataKey: string }) => p.dataKey === 'avg7')?.value as number | undefined
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs shadow-xl">
      <p className="mb-2 text-gray-400">
        {format(parseISO(label), 'EEEE, dd. MMM yyyy', { locale: de })}
      </p>
      {typeof mood === 'number' && (
        <p className="font-medium text-emerald-300">
          {MOOD_EMOJI[Math.round(mood)]} Stimmung: {mood}/10 – {MOOD_LABELS[Math.round(mood)]}
        </p>
      )}
      {typeof avg === 'number' && (
        <p className="mt-1 text-gray-400">Ø 7 Tage: {avg.toFixed(1)}</p>
      )}
    </div>
  )
}

export default function MoodTrendChart({ data, average, height = 300 }: MoodTrendChartProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-gray-800 text-center text-sm text-gray-500"
        style={{ height }}
      >
        <p className="px-6">
          Ab dem zweiten Eintrag zeichnet sich hier deine Stimmungskurve ab.
          <br />
          Bleib dran – der Verlauf ist der eigentliche Schatz.
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 48, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={(v: string) => format(parseISO(v), 'dd.MM')}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          domain={[1, 10]}
          ticks={[1, 3, 5, 7, 9, 10]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
        />
        <Tooltip content={<MoodTooltip />} />
        {average !== null && (
          <ReferenceLine
            y={average}
            stroke="#6b7280"
            strokeDasharray="4 4"
            label={{
              value: `Ø ${average.toFixed(1)}`,
              position: 'right',
              fill: '#6b7280',
              fontSize: 11,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="mood"
          stroke="#34d399"
          strokeWidth={2.5}
          fill="url(#moodFill)"
          dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          name="Stimmung"
        />
        <Line
          type="monotone"
          dataKey="avg7"
          stroke="#a855f7"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Ø 7 Tage"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
