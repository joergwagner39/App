'use client'

import { format, parse } from 'date-fns'
import { de } from 'date-fns/locale'
import { isCriticalSatisfaction } from '@/lib/status'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function CriticalDot(props: any) {
  const { cx, cy, value } = props
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={isCriticalSatisfaction(value) ? '#ef4444' : '#8dc63f'}
      stroke="none"
    />
  )
}

export default function SatisfactionChart({
  history,
}: {
  history: { month: string; value: number; reason?: string }[]
}) {
  if (history.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        Noch nicht genug Daten für ein Diagramm – ab dem zweiten Monat wird hier der Verlauf
        angezeigt.
      </p>
    )
  }

  const data = [...history]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((h) => ({
      month: h.month,
      label: format(parse(h.month, 'yyyy-MM', new Date()), 'MMM yy', { locale: de }),
      value: h.value,
      reason: h.reason,
    }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
          <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
          <Tooltip
            formatter={(value: number, _name, props: any) => [
              `${value} / 10${props.payload.reason ? ` – ${props.payload.reason}` : ''}`,
              'Zufriedenheit',
            ]}
            labelStyle={{ color: '#0d1622' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8dc63f"
            strokeWidth={2}
            dot={<CriticalDot />}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
