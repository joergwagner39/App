'use client'

import { useEffect, useState } from 'react'
import { Brain, ChevronDown, Home, Trophy, Timer, Zap } from 'lucide-react'
import type { CoachState } from '@/lib/coach/types'
import { addDays } from '@/lib/coach/engine'
import { neuroRoutine, type NeuroDrill } from '@/lib/coach/neuro'
import { ReactionTest, ArrowDrill } from './ReactionTools'
import { Sparkline } from './charts'
import { Card, SectionTitle } from './ui'

const PLACE_KEY = 'coach_neuro_place'

const CAT_COLOR: Record<string, string> = {
  Augen: 'text-sky-300',
  Balance: 'text-violet-300',
  Koordination: 'text-amber-300',
  Ballgefühl: 'text-lime-300',
  Handgelenk: 'text-rose-300',
  Reaktion: 'text-emerald-300',
}

export function DrillItem({
  d,
  best,
  onScore,
  onArrows,
}: {
  d: NeuroDrill
  best?: number
  onScore?: (value: number) => void
  onArrows?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState('')
  return (
    <li className="rounded-xl bg-gray-800/40">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 p-3 text-left">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${CAT_COLOR[d.category]}`}>
            {d.category} · {d.duration}
          </p>
          <p className="text-sm font-semibold text-gray-100">{d.title}</p>
        </div>
        {best !== undefined && (
          <span className="flex items-center gap-1 text-xs text-amber-300 shrink-0">
            <Trophy className="w-3.5 h-3.5" /> {best}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-xs text-gray-400">{d.why}</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-200">
            {d.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {d.level && <p className="text-xs text-gray-500">💡 {d.level}</p>}
          {d.id === 'reaction-arrows' && onArrows && (
            <button onClick={onArrows} className="px-3 py-2 rounded-lg bg-emerald-500 text-gray-950 text-sm font-semibold">
              Reaktionspfeile starten
            </button>
          )}
          {d.score && onScore && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                inputMode="numeric"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={d.score.label}
                className="min-w-0 flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-lime-400"
              />
              <button
                disabled={!val}
                onClick={() => {
                  onScore(Number(val))
                  setVal('')
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-lime-500/80 text-gray-950 text-sm font-semibold disabled:bg-gray-700 disabled:text-gray-400"
              >
                Eintragen
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export default function NeuroCard({
  state,
  update,
  today,
}: {
  state: CoachState
  update: (fn: (s: CoachState) => CoachState) => void
  today: string
}) {
  const [place, setPlace] = useState<'home' | 'court'>('home')
  const [modal, setModal] = useState<'reaction' | 'arrows' | null>(null)
  const [newRecord, setNewRecord] = useState<string | null>(null)

  useEffect(() => {
    try {
      const p = localStorage.getItem(PLACE_KEY)
      if (p === 'home' || p === 'court') setPlace(p)
    } catch {
      /* ignore */
    }
  }, [])

  const drills = neuroRoutine(today, place)
  const done = Boolean(state.days[today]?.neuroDone)

  // Serie: aufeinanderfolgende Tage mit erledigter Routine (heute zählt, wenn erledigt)
  let streak = 0
  for (let i = done ? 0 : 1; i < 365; i++) {
    if (state.days[addDays(today, -i)]?.neuroDone) streak++
    else break
  }

  const reactions = Object.values(state.days)
    .filter((d) => d.reactionMs)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((d) => ({ date: d.date, value: d.reactionMs! }))
  const lastReaction = reactions[reactions.length - 1]
  const bestReaction = reactions.length ? Math.min(...reactions.map((r) => r.value)) : undefined

  function patchToday(patch: Partial<CoachState['days'][string]>) {
    update((s) => ({
      ...s,
      days: { ...s.days, [today]: { ...(s.days[today] ?? { date: today }), ...patch, date: today, updatedAt: Date.now() } },
    }))
  }

  function saveScore(id: string, value: number) {
    const prev = state.records?.[id]?.best
    if (prev === undefined || value > prev) setNewRecord(id)
    update((s) => {
      const cur = s.records?.[id]
      if (cur && cur.best >= value) return s
      return { ...s, records: { ...(s.records ?? {}), [id]: { best: value, date: today } } }
    })
  }

  return (
    <Card className="border-sky-500/20">
      <SectionTitle
        icon={<Brain className="w-4 h-4 text-sky-400" />}
        title="Neuro & Ballgefühl · ~12 Min."
        right={streak > 0 ? <span className="text-[11px] text-amber-300">🔥 {streak} {streak === 1 ? 'Tag' : 'Tage'}</span> : undefined}
      />
      <p className="text-sm text-gray-400 mb-3">Augen, Gleichgewicht, Koordination und Ballgefühl – jeden Tag, auch an Ruhetagen. Geht mit Schläger und Ball in der Wohnung.</p>

      <div className="flex gap-1 bg-gray-800/60 border border-gray-700 rounded-xl p-1 mb-3">
        {(
          [
            ['home', 'Wohnung', Home],
            ['court', 'Court / mit Wand', Zap],
          ] as const
        ).map(([p, label, Icon]) => (
          <button
            key={p}
            onClick={() => {
              setPlace(p)
              try {
                localStorage.setItem(PLACE_KEY, p)
              } catch {
                /* ignore */
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm ${place === p ? 'bg-sky-500 text-gray-950 font-semibold' : 'text-gray-300'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {drills.map((d) => (
          <DrillItem
            key={d.id}
            d={d}
            best={state.records?.[d.id]?.best}
            onScore={(v) => saveScore(d.id, v)}
            onArrows={() => setModal('arrows')}
          />
        ))}
      </ul>
      {newRecord && (
        <p className="mt-2 text-sm text-amber-200 bg-amber-500/10 rounded-xl px-3 py-2">
          🏆 Neuer Rekord! <button onClick={() => setNewRecord(null)} className="underline text-xs ml-1">ok</button>
        </p>
      )}

      <div className="mt-4 rounded-xl border border-gray-800 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> Reaktionszeit
            </p>
            <p className="text-lg font-semibold text-white">
              {lastReaction ? `${lastReaction.value} ms` : '–'}
              {bestReaction !== undefined && <span className="text-xs font-normal text-gray-500 ml-2">Bestwert {bestReaction} ms</span>}
            </p>
          </div>
          <button onClick={() => setModal('reaction')} className="shrink-0 px-3 py-2 rounded-lg bg-sky-500 text-gray-950 text-sm font-semibold">
            Test (30 s)
          </button>
        </div>
        {reactions.length > 1 && (
          <div className="mt-2">
            <Sparkline points={reactions.slice(-14)} />
            <p className="text-[10px] text-gray-500">niedriger = schneller</p>
          </div>
        )}
      </div>

      <button
        onClick={() => patchToday({ neuroDone: !done })}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold ${done ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40' : 'bg-emerald-500 text-gray-950'}`}
      >
        {done ? '✅ Heute erledigt' : 'Routine erledigt'}
      </button>

      {modal === 'reaction' && <ReactionTest onDone={(ms) => patchToday({ reactionMs: ms })} onClose={() => setModal(null)} />}
      {modal === 'arrows' && <ArrowDrill onClose={() => setModal(null)} />}
    </Card>
  )
}
