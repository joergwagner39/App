'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface EquityChartProps {
  data: { date: string; equity: number }[]
}

export default function EquityChart({ data }: EquityChartProps) {
  if (data.length < 2) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center text-sm text-gray-500">
        Noch zu wenig Verlauf für einen Chart.
      </div>
    )
  }

  const values = data.map(d => d.equity)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = (max - min) * 0.1 || 100
  const positive = values[values.length - 1] >= values[0]
  const color = positive ? '#10b981' : '#ef4444'

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-white mb-4">Depotwert</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: string) => format(parseISO(value), 'dd.MM.', { locale: de })}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={[min - padding, max + padding]}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            width={40}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(value: string) => format(parseISO(value), 'EEEE, dd.MM.yyyy', { locale: de })}
            formatter={(value: number) => [`${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`, 'Depotwert']}
          />
          <Area type="monotone" dataKey="equity" stroke={color} strokeWidth={2} fill="url(#equityGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
