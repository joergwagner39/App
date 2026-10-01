'use client'

import { Footprints } from 'lucide-react'
import type { CoachState } from '@/lib/coach/types'
import { addDays } from '@/lib/coach/engine'
import { mobilityRoutine } from '@/lib/coach/mobility'
import { DrillItem } from './NeuroCard'
import { Card, SectionTitle } from './ui'

/** Täglicher Kurzblock: Sprunggelenk-Mobilität + Hüftbeuger-Kräftigung. */
export default function MobilityCard({
  state,
  update,
  today,
}: {
  state: CoachState
  update: (fn: (s: CoachState) => CoachState) => void
  today: string
}) {
  const drills = mobilityRoutine(today)
  const done = Boolean(state.days[today]?.mobilityDone)
  let week = 0
  for (let i = 0; i < 7; i++) if (state.days[addDays(today, -i)]?.mobilityDone) week++

  function toggle() {
    update((s) => ({
      ...s,
      days: { ...s.days, [today]: { ...(s.days[today] ?? { date: today }), date: today, mobilityDone: !done, updatedAt: Date.now() } },
    }))
  }

  function saveScore(id: string, value: number) {
    update((s) => {
      const cur = s.records?.[id]
      if (cur && cur.best >= value) return s
      return { ...s, records: { ...(s.records ?? {}), [id]: { best: value, date: today } } }
    })
  }

  return (
    <Card className="border-orange-500/20">
      <SectionTitle
        icon={<Footprints className="w-4 h-4 text-orange-400" />}
        title="Sprunggelenk & Hüfte · 7 Min."
        right={<span className={`text-[11px] ${week >= 5 ? 'text-emerald-300' : 'text-gray-400'}`}>{week}/7 Woche</span>}
      />
      <p className="text-sm text-gray-400 mb-3">Täglich, ohne Geräte – morgens, abends oder als Aufwärmen vor dem Padel.</p>
      <ul className="space-y-2">
        {drills.map((d) => (
          <DrillItem key={d.id} d={d} best={state.records?.[d.id]?.best} onScore={(v) => saveScore(d.id, v)} />
        ))}
      </ul>
      <button
        onClick={toggle}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold ${
          done ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40' : 'bg-orange-400 text-gray-950'
        }`}
      >
        {done ? '✅ Heute erledigt' : 'Block erledigt'}
      </button>
    </Card>
  )
}
