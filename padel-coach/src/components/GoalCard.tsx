'use client'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Target } from 'lucide-react'
import type { CoachSettings } from '@/lib/coach/types'
import type { Phase } from '@/lib/coach/engine'

const DIVISION: Record<NonNullable<CoachSettings['hyroxDivision']>, string> = {
  open: 'Open',
  pro: 'Pro',
  doubles: 'Doubles',
  relay: 'Relay',
}

/** Zielkarte: Hyrox-Wettkampf mit Countdown und Phase, Padel-Wochenziel. */
export default function GoalCard({
  phase,
  settings,
  padelDone,
  onOpenSettings,
}: {
  phase: Phase
  settings: CoachSettings
  padelDone: number
  onOpenSettings: () => void
}) {
  const race = settings.hyroxRaceDate
  const days = phase.daysLeft
  const padelPct = Math.min(100, (padelDone / Math.max(1, settings.padelPerWeek)) * 100)

  return (
    <section className="grid sm:grid-cols-2 gap-3">
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/30 to-gray-900/60 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
          <Target className="w-4 h-4" /> Ziel Hyrox
        </p>
        {race && days !== undefined && days >= 0 ? (
          <>
            <p className="mt-1 text-white font-bold text-lg">
              {days === 0 ? 'Heute ist Renntag! 🔥' : `Noch ${days} Tage`}
              <span className="ml-2 text-sm font-normal text-gray-400">
                {format(new Date(`${race}T12:00:00`), 'dd. MMM yyyy', { locale: de })}
                {settings.hyroxDivision && ` · ${DIVISION[settings.hyroxDivision]}`}
                {settings.hyroxTargetTime && ` · Ziel ${settings.hyroxTargetTime}`}
              </span>
            </p>
            <p className="text-sm text-amber-100 mt-1">
              Phase: <span className="font-semibold">{phase.name}</span>
            </p>
            <p className="text-xs text-gray-400">{phase.description}</p>
          </>
        ) : (
          <>
            <p className="mt-1 text-white font-semibold">Phase: {phase.name}</p>
            <p className="text-xs text-gray-400 mb-2">{phase.description}</p>
            <button onClick={onOpenSettings} className="text-xs text-amber-300 underline">
              Hyrox-Wettkampf eintragen → Plan richtet sich danach aus
            </button>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-lime-500/30 bg-gradient-to-br from-lime-900/25 to-gray-900/60 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-300">
          🎾 Ziel Padel
        </p>
        <p className="mt-1 text-white font-bold text-lg">
          {padelDone}/{settings.padelPerWeek}
          <span className="ml-2 text-sm font-normal text-gray-400">Einheiten in den letzten 7 Tagen</span>
        </p>
        <div className="h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-lime-400 rounded-full" style={{ width: `${padelPct}%` }} />
        </div>
        {settings.padelGoal ? (
          <p className="text-sm text-lime-100 mt-2">{settings.padelGoal}</p>
        ) : (
          <button onClick={onOpenSettings} className="text-xs text-lime-300 underline mt-2">
            Padel-Ziel eintragen (z. B. Turnier, Level)
          </button>
        )}
      </div>
    </section>
  )
}
