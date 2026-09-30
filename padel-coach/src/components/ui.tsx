import type { SessionType } from '@/lib/coach/types'

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`bg-gray-900/60 border border-gray-800 rounded-2xl p-4 sm:p-5 ${className}`}>{children}</section>
}

export function SectionTitle({ icon, title, right }: { icon?: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {icon}
        {title}
      </h2>
      {right}
    </div>
  )
}

export const SESSION_STYLE: Record<SessionType, { badge: string; ring: string; emoji: string }> = {
  vo2max: { badge: 'bg-rose-500/20 text-rose-200 border-rose-400/40', ring: 'border-rose-500/50', emoji: '❤️‍🔥' },
  hyrox: { badge: 'bg-amber-500/20 text-amber-200 border-amber-400/40', ring: 'border-amber-500/50', emoji: '🏋️' },
  strength: { badge: 'bg-sky-500/20 text-sky-200 border-sky-400/40', ring: 'border-sky-500/50', emoji: '💪' },
  upper: { badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40', ring: 'border-cyan-500/50', emoji: '🦾' },
  zone2: { badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40', ring: 'border-emerald-500/50', emoji: '🚴' },
  recovery: { badge: 'bg-violet-500/20 text-violet-200 border-violet-400/40', ring: 'border-violet-500/50', emoji: '🧘' },
  rest: { badge: 'bg-gray-500/20 text-gray-200 border-gray-400/40', ring: 'border-gray-500/50', emoji: '😴' },
  padel: { badge: 'bg-lime-500/20 text-lime-200 border-lime-400/40', ring: 'border-lime-500/50', emoji: '🎾' },
}
