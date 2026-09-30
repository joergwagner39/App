'use client'

import type { CourtDiagram, Pt } from '@/lib/coach/padel'

const S = 22 // Pixel pro Meter
const PAD = 16
const W = 10 * S + PAD * 2
const H = 20 * S + PAD * 2

const px = ([x, y]: Pt): [number, number] => [PAD + x * S, PAD + y * S]

const TEAM_COLOR = { A: '#34d399', B: '#fb7185' }

const ZONE_FILL = {
  good: 'rgba(52, 211, 153, 0.22)',
  bad: 'rgba(251, 113, 133, 0.22)',
  info: 'rgba(147, 197, 253, 0.18)',
}
const ZONE_STROKE = { good: '#34d399', bad: '#fb7185', info: '#93c5fd' }

const SHOT_STYLE = {
  drive: { stroke: '#facc15', width: 2.5, dash: undefined as string | undefined },
  soft: { stroke: '#fde68a', width: 2, dash: '2 4' },
  lob: { stroke: '#facc15', width: 2.2, dash: '7 5' },
  smash: { stroke: '#f97316', width: 3.5, dash: undefined as string | undefined },
}

/** Pfad durch alle Punkte; beim Lob wird das erste Segment als Bogen gezeichnet. */
function shotPath(points: Pt[], kind: keyof typeof SHOT_STYLE): string {
  const p = points.map(px)
  let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1]
    const [x1, y1] = p[i]
    const curved = (kind === 'lob' && i === 1) || (kind === 'soft' && i === 1)
    if (curved) {
      const mx = (x0 + x1) / 2
      const my = (y0 + y1) / 2
      const len = Math.hypot(x1 - x0, y1 - y0)
      const bend = kind === 'lob' ? 0.28 : 0.1
      // Normalenvektor – Bogen zur Court-Mitte hin
      let nx = -(y1 - y0) / len
      let ny = (x1 - x0) / len
      if (nx * (W / 2 - mx) + ny * (H / 2 - my) < 0) {
        nx = -nx
        ny = -ny
      }
      d += ` Q ${mx + nx * len * bend} ${my + ny * len * bend} ${x1} ${y1}`
    } else {
      d += ` L ${x1} ${y1}`
    }
  }
  return d
}

function Arrowheads() {
  return (
    <defs>
      {Object.entries({ ball: '#facc15', smash: '#f97316', move: '#a7f3d0' }).map(([id, color]) => (
        <marker key={id} id={`ah-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      ))}
      <linearGradient id="court-floor" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#1e3a8a" />
        <stop offset="1" stopColor="#1e40af" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

export default function PadelCourt({ diagram, className = '' }: { diagram: CourtDiagram; className?: string }) {
  const [l, t] = px([0, 0])
  const [r, b] = px([10, 20])
  const netY = px([0, 10])[1]
  const svc1 = px([0, 3.05])[1]
  const svc2 = px([0, 16.95])[1]
  const mid = px([5, 0])[0]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`w-full h-auto ${className}`} role="img" aria-label="Padel-Court-Skizze">
      <Arrowheads />
      {/* Boden */}
      <rect x={l} y={t} width={r - l} height={b - t} fill="url(#court-floor)" rx="2" />

      {/* Wände: Glas an Rückwänden und die ersten 4 m der Seiten, sonst Gitter */}
      <g strokeLinecap="round">
        <line x1={l} y1={t} x2={r} y2={t} stroke="#a5f3fc" strokeWidth="5" opacity="0.8" />
        <line x1={l} y1={b} x2={r} y2={b} stroke="#a5f3fc" strokeWidth="5" opacity="0.8" />
        {[l, r].map((x) => (
          <g key={x}>
            <line x1={x} y1={t} x2={x} y2={px([0, 4])[1]} stroke="#a5f3fc" strokeWidth="5" opacity="0.8" />
            <line x1={x} y1={px([0, 16])[1]} x2={x} y2={b} stroke="#a5f3fc" strokeWidth="5" opacity="0.8" />
            <line x1={x} y1={px([0, 4])[1]} x2={x} y2={px([0, 16])[1]} stroke="#64748b" strokeWidth="3" strokeDasharray="2 3" />
          </g>
        ))}
      </g>

      {/* Linien */}
      <g stroke="#e2e8f0" strokeWidth="1.5" opacity="0.85">
        <line x1={l} y1={svc1} x2={r} y2={svc1} />
        <line x1={l} y1={svc2} x2={r} y2={svc2} />
        <line x1={mid} y1={svc1} x2={mid} y2={svc2} />
      </g>

      {/* Zonen */}
      {diagram.zones?.map((z, i) => {
        const [zx, zy] = px([z.x, z.y])
        return (
          <g key={`z${i}`}>
            <rect x={zx} y={zy} width={z.w * S} height={z.h * S} fill={ZONE_FILL[z.tone]} stroke={ZONE_STROKE[z.tone]} strokeDasharray="4 3" rx="4" />
            {z.label && (
              <text x={zx + (z.w * S) / 2} y={zy + (z.h * S) / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill={ZONE_STROKE[z.tone]}>
                {z.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Netz */}
      <line x1={l - 4} y1={netY} x2={r + 4} y2={netY} stroke="#f8fafc" strokeWidth="3" />
      <line x1={l - 4} y1={netY} x2={r + 4} y2={netY} stroke="#0f172a" strokeWidth="1" strokeDasharray="1 3" />
      <circle cx={l - 4} cy={netY} r="3" fill="#f8fafc" />
      <circle cx={r + 4} cy={netY} r="3" fill="#f8fafc" />

      {/* Laufwege */}
      {diagram.moves?.map((m, i) => {
        const [x1, y1] = px(m.from)
        const [x2, y2] = px(m.to)
        return (
          <line
            key={`m${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#a7f3d0"
            strokeWidth="2"
            strokeDasharray="5 4"
            markerEnd="url(#ah-move)"
            className="coach-dash"
          />
        )
      })}

      {/* Ballwege */}
      {diagram.shots?.map((s, i) => {
        const st = SHOT_STYLE[s.kind]
        const d = shotPath(s.path, s.kind)
        return (
          <g key={`s${i}`}>
            <path d={d} fill="none" stroke={st.stroke} strokeWidth={st.width} strokeDasharray={st.dash} markerEnd={`url(#ah-${s.kind === 'smash' ? 'smash' : 'ball'})`} />
            {i === 0 && (
              <circle r="4.5" fill="#fef08a" stroke="#854d0e" strokeWidth="1" filter="url(#glow)">
                <animateMotion dur={`${1.6 + s.path.length * 0.5}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
              </circle>
            )}
          </g>
        )
      })}

      {/* Aufsprungpunkte */}
      {diagram.bounces?.map((p, i) => {
        const [x, y] = px(p)
        return (
          <g key={`b${i}`} stroke="#fde68a" strokeWidth="1.8">
            <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} />
            <line x1={x - 4} y1={y + 4} x2={x + 4} y2={y - 4} />
          </g>
        )
      })}

      {/* Zielpositionen */}
      {diagram.ghosts?.map((g, i) => {
        const [x, y] = px(g.at)
        const color = TEAM_COLOR[g.id[0] as 'A' | 'B']
        return <circle key={`g${i}`} cx={x} cy={y} r="11" fill="none" stroke={color} strokeWidth="1.8" strokeDasharray="3 3" opacity="0.9" />
      })}

      {/* Spieler */}
      {diagram.players.map((p) => {
        const [x, y] = px(p.at)
        const color = TEAM_COLOR[p.id[0] as 'A' | 'B']
        return (
          <g key={p.id}>
            {p.focus && <circle cx={x} cy={y} r="16" fill={color} opacity="0.25" className="coach-pulse" />}
            <circle cx={x} cy={y} r="11" fill={color} stroke="#0f172a" strokeWidth="2" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
              {p.id}
            </text>
          </g>
        )
      })}

      {/* Beschriftungen */}
      {diagram.labels?.map((lb, i) => {
        const [x, y] = px(lb.at)
        const w = lb.text.length * 5.6 + 10
        return (
          <g key={`l${i}`}>
            <rect x={x - w / 2} y={y - 9} width={w} height="16" rx="8" fill="#0f172a" opacity="0.85" />
            <text x={x} y={y + 3} textAnchor="middle" fontSize="10" fontWeight="600" fill="#f8fafc">
              {lb.text}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function CourtLegend() {
  const item = (el: React.ReactNode, label: string) => (
    <span className="flex items-center gap-1.5">
      {el}
      {label}
    </span>
  )
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-400">
      {item(<span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />, 'Euer Team (A)')}
      {item(<span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />, 'Gegner (B)')}
      {item(<span className="w-5 border-t-2 border-yellow-400 inline-block" />, 'Ball')}
      {item(<span className="w-5 border-t-2 border-dashed border-yellow-400 inline-block" />, 'Lob')}
      {item(<span className="w-5 border-t-2 border-dashed border-emerald-200 inline-block" />, 'Laufweg')}
      {item(<span className="text-yellow-200 font-bold leading-none">×</span>, 'Aufsprung')}
      {item(<span className="w-5 border-t-4 border-cyan-200/80 inline-block" />, 'Glas')}
    </div>
  )
}
