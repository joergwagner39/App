'use client'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Target } from 'lucide-react'
import { useState } from 'react'
import type { CoachSettings } from '@/lib/coach/types'
import { LineChart, VIZ } from './charts'
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
          🎾 Padel
        </p>
        <p className="mt-1 text-white font-bold text-lg">
          {padelDone}/{settings.padelPerWeek}
          <span className="ml-2 text-sm font-normal text-gray-400">Einheiten in den letzten 7 Tagen</span>
        </p>
        <div className="h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-lime-400 rounded-full" style={{ width: `${padelPct}%` }} />
        </div>
        <PadelLevelBox levels={levels} onAddLevel={onAddLevel} />
      </div>
    </section>
  )
}

const fmtL = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const parseLevel = (t: string) => {
  const v = Number(t.replace(',', '.'))
  return v > 0 && v <= 7 ? Math.round(v * 100) / 100 : undefined
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Letzter bekannter Wert an oder vor einem Datum */
function levelAt(levels: { date: string; level: number }[], date: string): number | undefined {
  const before = levels.filter((l) => l.date <= date)
  return before[before.length - 1]?.level
}

function DeltaChip({ label, delta }: { label: string; delta?: number }) {
  if (delta === undefined) return <span className="text-[11px] text-gray-500">{label}: –</span>
  const color = delta > 0 ? VIZ.good : delta < 0 ? VIZ.critical : VIZ.text
  return (
    <span className="text-[11px] text-gray-400">
      {label}:{' '}
      <span className="font-semibold" style={{ color }}>
        {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : '± '}
        {fmtL(Math.abs(delta) === 0 ? 0 : delta)}
      </span>
    </span>
  )
}

/** Playtomic-Level direkt auf der Startseite: eintragen, Entwicklung Woche/Monat, Verlauf */
function PadelLevelBox({
  levels,
  onAddLevel,
}: {
  levels: { date: string; level: number }[]
  onAddLevel?: (level: number) => void
}) {
  const [levelInput, setLevelInput] = useState('')
  const [showChart, setShowChart] = useState(false)
  const current = levels[levels.length - 1]
  const weekAgo = levelAt(levels, isoDaysAgo(7))
  const monthAgo = levelAt(levels, isoDaysAgo(30))
  const first = levels[0]

  return (
    <div className="mt-3 rounded-xl bg-gray-900/50 p-3 space-y-2">
      <p className="text-[11px] text-gray-400">Playtomic-Level</p>
      <p className="text-3xl font-bold text-white leading-none">{current ? fmtL(current.level) : '–'}</p>
      {current && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <DeltaChip label="zur Vorwoche" delta={weekAgo !== undefined ? current.level - weekAgo : undefined} />
          <DeltaChip label="zum Vormonat" delta={monthAgo !== undefined ? current.level - monthAgo : undefined} />
          {levels.length > 1 && <DeltaChip label="seit Start" delta={current.level - first.level} />}
        </div>
      )}

      {onAddLevel && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={levelInput}
            onChange={(e) => setLevelInput(e.target.value)}
            placeholder={current ? 'Neues Level' : 'Aktuelles Level, z. B. 2,85'}
            className="min-w-0 flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-lime-400"
          />
          <button
            disabled={parseLevel(levelInput) === undefined}
            onClick={() => {
              const v = parseLevel(levelInput)
              if (v !== undefined) onAddLevel(v)
              setLevelInput('')
            }}
            className="shrink-0 px-3 rounded-lg bg-lime-400 text-gray-950 text-sm font-semibold disabled:bg-gray-700 disabled:text-gray-400"
          >
            Speichern
          </button>
        </div>
      )}

      {levels.length > 1 && (
        <div>
          <button onClick={() => setShowChart((v) => !v)} className="text-[11px] text-lime-300 underline">
            {showChart ? 'Verlauf ausblenden' : `Verlauf anzeigen (${levels.length} Einträge)`}
          </button>
          {showChart && (
            <div className="mt-2">
              <LineChart points={levels.map((l) => ({ date: l.date, value: l.level }))} decimals={2} label="Playtomic-Level" height={150} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
