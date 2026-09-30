'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { CoachState, SessionType, Signals } from '@/lib/coach/types'
import { addDays, resolveMaxHr } from '@/lib/coach/engine'
import { WORKOUTS, SESSION_LABEL, type WorkoutContext } from '@/lib/coach/workouts'
import WorkoutCard from './WorkoutCard'
import { Card, SectionTitle, SESSION_STYLE } from './ui'

const TARGETS: { t: SessionType; target: number }[] = [
  { t: 'vo2max', target: 2 },
  { t: 'hyrox', target: 1 },
  { t: 'strength', target: 1 },
  { t: 'zone2', target: 1 },
]

export default function TrainingView({ state, signals, today }: { state: CoachState; signals: Signals; today: string }) {
  const [filter, setFilter] = useState<SessionType | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, -13 + i))
  const last7 = days.slice(-7)

  const doneOf = (t: SessionType) =>
    last7.filter((d) => {
      const r = state.days[d]
      return r?.plannedSession?.type === t && (r.completed === 'yes' || r.completed === 'partly')
    }).length
  const padelCount = last7.filter((d) => {
    const p = state.days[d]?.padelPlayed
    return p && p !== 'none'
  }).length

  const ctx: WorkoutContext = {
    maxHr: resolveMaxHr(state.settings, signals),
    modality: state.settings.equipment.bike ? 'bike' : 'rower',
    knee: 0,
    canRun: state.settings.allowRunning,
    equipment: state.settings.equipment,
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="Letzte 7 Tage – Wochenziele" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {TARGETS.map(({ t, target }) => {
            const n = doneOf(t)
            return (
              <div key={t} className="bg-gray-800/40 rounded-xl p-3">
                <p className="text-xs text-gray-400">
                  {SESSION_STYLE[t].emoji} {SESSION_LABEL[t]}
                </p>
                <p className="text-xl font-bold text-white">
                  {n}
                  <span className="text-sm text-gray-500">/{target}</span>
                </p>
                <div className="h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, (n / target) * 100)}%` }} />
                </div>
              </div>
            )
          })}
          <div className="bg-gray-800/40 rounded-xl p-3">
            <p className="text-xs text-gray-400">🎾 Padel</p>
            <p className="text-xl font-bold text-white">{padelCount}×</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Verlauf (14 Tage)" />
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const r = state.days[d]
            const type = r?.plannedSession?.type
            const st = type ? SESSION_STYLE[type] : null
            const done = r?.completed
            const padel = r?.padelPlayed && r.padelPlayed !== 'none'
            return (
              <div
                key={d}
                title={r?.plannedSession?.title}
                className={`rounded-xl border p-1.5 text-center min-h-[72px] ${d === today ? 'border-emerald-500/60' : 'border-gray-800'} ${
                  done === 'no' ? 'opacity-50' : ''
                }`}
              >
                <p className="text-[10px] text-gray-500">{format(new Date(`${d}T12:00:00`), 'EEEEEE dd.', { locale: de })}</p>
                <p className="text-lg leading-tight">{st?.emoji ?? '·'}</p>
                <p className="text-[9px] text-gray-400 truncate">{type ? SESSION_LABEL[type] : ''}</p>
                <p className="text-[10px]">
                  {done === 'yes' ? '✅' : done === 'partly' ? '½' : done === 'no' ? '✗' : ''}
                  {padel ? '🎾' : ''}
                </p>
              </div>
            )
          })}
        </div>
        {signals.recentActivities.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Garmin-Aktivitäten (7 Tage)</p>
            <div className="flex flex-wrap gap-2">
              {signals.recentActivities.map((a, i) => (
                <span key={i} className="text-xs bg-gray-800/60 rounded-lg px-2 py-1 text-gray-300">
                  {format(new Date(`${a.date}T12:00:00`), 'EE', { locale: de })} · {a.type.replace(/_/g, ' ')} · {a.minutes} min
                  {a.aerobicTE ? ` · TE ${a.aerobicTE.toFixed(1)}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div>
        <SectionTitle title="Einheiten-Bibliothek" />
        <div className="flex flex-wrap gap-2 mb-3">
          {(['all', 'vo2max', 'hyrox', 'strength', 'zone2', 'recovery', 'padel'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs border ${
                filter === f ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {f === 'all' ? 'Alle' : SESSION_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {WORKOUTS.filter((w) => filter === 'all' || w.type === filter).map((w) => (
            <Card key={w.id} className="!p-4">
              {openId === w.id ? (
                <>
                  <WorkoutCard workout={w} ctx={ctx} compact />
                  <button onClick={() => setOpenId(null)} className="mt-3 text-xs text-gray-400 underline">
                    Zuklappen
                  </button>
                </>
              ) : (
                <button onClick={() => setOpenId(w.id)} className="w-full text-left">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${SESSION_STYLE[w.type].badge}`}>
                    {SESSION_STYLE[w.type].emoji} {SESSION_LABEL[w.type]}
                  </span>
                  <p className="font-semibold text-white mt-2">{w.title}</p>
                  <p className="text-sm text-gray-400">{w.goal}</p>
                  <p className="text-xs text-gray-500 mt-1">{w.duration}</p>
                </button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
