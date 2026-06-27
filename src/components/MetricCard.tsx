'use client'

import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  source: 'oura' | 'garmin' | 'combined'
  trend?: number
  subtitle?: string
}

export default function MetricCard({
  label, value, unit, icon: Icon, source, trend, subtitle,
}: MetricCardProps) {
  const sourceColor = source === 'oura'
    ? 'text-purple-400'
    : source === 'garmin'
    ? 'text-blue-400'
    : 'text-gray-400'

  const sourceBg = source === 'oura'
    ? 'bg-purple-500/10 border-purple-500/20'
    : source === 'garmin'
    ? 'bg-blue-500/10 border-blue-500/20'
    : 'bg-gray-500/10 border-gray-500/20'

  return (
    <div className={`rounded-xl border ${sourceBg} p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            {unit && <span className="text-xs text-gray-400">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(0)}% vs. gestern
            </p>
          )}
        </div>
        <Icon className={`${sourceColor} w-5 h-5 flex-shrink-0 ml-2`} />
      </div>
    </div>
  )
}
