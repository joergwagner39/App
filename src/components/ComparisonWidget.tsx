'use client'

interface ComparisonRow {
  label: string
  ouraValue: string | number
  garminValue: string | number
  unit?: string
  better?: 'oura' | 'garmin' | 'equal'
}

interface ComparisonWidgetProps {
  rows: ComparisonRow[]
  title: string
}

export default function ComparisonWidget({ rows, title }: ComparisonWidgetProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center text-xs text-gray-500 mb-1">
          <span className="flex-1 text-center">Oura</span>
          <span className="w-32 text-center text-gray-400 font-medium">Metrik</span>
          <span className="flex-1 text-center">Garmin</span>
        </div>

        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <div className={`flex-1 text-right text-sm font-medium ${
              row.better === 'oura' ? 'text-emerald-400' : 'text-gray-200'
            }`}>
              {row.ouraValue}{row.unit ? ` ${row.unit}` : ''}
            </div>
            <div className="w-32 text-center">
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                {row.label}
              </span>
            </div>
            <div className={`flex-1 text-left text-sm font-medium ${
              row.better === 'garmin' ? 'text-emerald-400' : 'text-gray-200'
            }`}>
              {row.garminValue}{row.unit ? ` ${row.unit}` : ''}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Oura Ring
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Garmin
        </span>
      </div>
    </div>
  )
}
