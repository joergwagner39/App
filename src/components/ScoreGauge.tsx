'use client'

interface ScoreGaugeProps {
  score: number
  label: string
  source: 'oura' | 'garmin'
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreGauge({ score, label, source, size = 'md' }: ScoreGaugeProps) {
  const radius = size === 'lg' ? 52 : size === 'md' ? 40 : 28
  const strokeWidth = size === 'lg' ? 8 : 6
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80
      ? source === 'oura' ? '#a855f7' : '#3b82f6'
      : score >= 60
      ? '#f59e0b'
      : '#ef4444'

  const svgSize = (radius + strokeWidth) * 2
  const cx = svgSize / 2
  const cy = svgSize / 2

  const textSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'
  const labelSize = size === 'lg' ? 'text-xs' : 'text-[10px]'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: radius - 12 }}>
      </div>
      <div className="-mt-1 flex flex-col items-center">
        <span className={`${textSize} font-bold`} style={{ color }}>{score}</span>
        <span className={`${labelSize} text-gray-400 text-center leading-tight`}>{label}</span>
      </div>
    </div>
  )
}
