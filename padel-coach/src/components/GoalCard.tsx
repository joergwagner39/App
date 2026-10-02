'use client'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Target } from 'lucide-react'
import { useState } from 'react'
import type { CoachSettings } from '@/lib/coach/types'
import { Sparkline } from './charts'
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
  levels = [],
  onAddLevel,
}: {
  phase: Phase
  settings: CoachSettings
  padelDone: number
  onOpenSettings: () => void
  levels?: { date: string; level: number }[]
  onAddLevel?: (level: number) => void
}) {
  const [levelInput, setLevelInput] = useState('')
  const [editLevel, setEditLevel] = useState(false)
  const current = levels[levels.length - 1]
  const first = levels[0]
  const target = settings.padelLevelTarget
  const fmtL = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
        <div className="mt-3 rounded-xl bg-gray-900/50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-gray-400">Playtomic-Level</p>
              <p className="text-2xl font-bold text-white leading-tight">
                {current ? fmtL(current.level) : '–'}
                {target !== undefined && <span className="text-sm font-normal text-gray-400"> → Ziel {fmtL(target)}</span>}
              </p>
              <p className="text-[11px] text-gray-500">
                {current && target !== undefined && target > current.level && `noch ${fmtL(target - current.level)} · `}
                {current && target !== undefined && target <= current.level && '🎉 Ziel erreicht · '}
                {current && first && current.date !== first.date && `${current.level >= first.level ? '+' : ''}${fmtL(current.level - first.level)} seit ${new Date(`${first.date}T12:00:00`).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`}
                {!current && 'Noch kein Level eingetragen'}
              </p>
            </div>
            {levels.length > 1 && (
              <div className="w-20 shrink-0 pt-2">
                <Sparkline points={levels.slice(-12).map((l) => ({ date: l.date, value: l.level }))} />
              </div>
            )}
          </div>
          {onAddLevel &&
            (editLevel ? (
              <div className="flex gap-2 mt-2">
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  min="0"
                  max="7"
                  inputMode="decimal"
                  value={levelInput}
                  onChange={(e) => setLevelInput(e.target.value)}
                  placeholder="z. B. 2,85"
                  className="min-w-0 flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-lime-400"
                />
                <button
                  disabled={!levelInput}
                  onClick={() => {
                    const v = Number(levelInput.replace(',', '.'))
                    if (v > 0 && v <= 7) onAddLevel(Math.round(v * 100) / 100)
                    setLevelInput('')
                    setEditLevel(false)
                  }}
                  className="shrink-0 px-3 rounded-lg bg-lime-400 text-gray-950 text-sm font-semibold disabled:bg-gray-700 disabled:text-gray-400"
                >
                  Speichern
                </button>
              </div>
            ) : (
              <button onClick={() => setEditLevel(true)} className="mt-2 text-xs text-lime-300 underline">
                {current ? 'Neues Level eintragen' : 'Aktuelles Level eintragen'}
              </button>
            ))}
          {target === undefined && (
            <button onClick={onOpenSettings} className="mt-2 ml-3 text-xs text-gray-400 underline">
              Ziel-Level festlegen
            </button>
          )}
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
