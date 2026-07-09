'use client'

import { format, parse } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function SatisfactionChart({
  history,
}: {
  history: { month: string; value: number }[]
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
    }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
          <Tooltip
            formatter={(value: number) => [`${value} / 10`, 'Zufriedenheit']}
            labelStyle={{ color: '#0d1622' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8dc63f"
            strokeWidth={2}
            dot={{ r: 3, fill: '#8dc63f' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
