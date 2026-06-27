'use client'

interface ScoreRingProps {
  score: number
  grade: string
  label: string
  sublabel: string
  color: string
  size?: 'lg' | 'md'
}

export default function ScoreRing({ score, grade, label, sublabel, color, size = 'lg' }: ScoreRingProps) {
  const r = size === 'lg' ? 70 : 50
  const sw = size === 'lg' ? 10 : 8
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const dim = (r + sw) * 2

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={sw} />
          <circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`${size === 'lg' ? 'text-4xl' : 'text-2xl'} font-black`} style={{ color }}>
            {score}
          </span>
          <span className={`${size === 'lg' ? 'text-lg' : 'text-sm'} font-bold text-white`}>{grade}</span>
        </div>
      </div>
      <div className="text-center mt-2">
        <div className={`${size === 'lg' ? 'text-base' : 'text-sm'} font-semibold text-white`}>{label}</div>
        <div className="text-xs text-gray-400">{sublabel}</div>
      </div>
    </div>
  )
}
