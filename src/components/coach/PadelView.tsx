'use client'

import { useState } from 'react'
import { ChevronLeft, CheckCircle2, Footprints } from 'lucide-react'
import type { CoachState } from '@/lib/coach/types'
import { PADEL_TACTICS, PADEL_DRILLS, type PadelTactic } from '@/lib/coach/padel'
import PadelCourt, { CourtLegend } from './PadelCourt'
import QuizCard from './QuizCard'
import { Card, SectionTitle } from './ui'

function tacticStats(state: CoachState) {
  const byId: Record<string, { right: number; wrong: number }> = {}
  for (const d of Object.values(state.days)) {
    if (!d.tacticAnswer) continue
    const s = (byId[d.tacticAnswer.id] ??= { right: 0, wrong: 0 })
    if (d.tacticAnswer.correct) s.right++
    else s.wrong++
  }
  return byId
}

function Detail({ t, onBack }: { t: PadelTactic; onBack: () => void }) {
  return (
    <Card>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-3">
        <ChevronLeft className="w-4 h-4" /> Alle Taktiken
      </button>
      <p className="text-xs text-lime-400 font-semibold uppercase tracking-wider">{t.category}</p>
      <h2 className="text-xl font-bold text-white mb-4">{t.title}</h2>
      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <div className="mx-auto w-full max-w-[280px]">
          <PadelCourt diagram={t.diagram} />
          <div className="mt-2">
            <CourtLegend />
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">{t.summary}</p>
          <ul className="space-y-1.5">
            {t.keyPoints.map((k) => (
              <li key={k} className="flex gap-2 text-sm text-gray-200">
                <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                {k}
              </li>
            ))}
          </ul>
          <div className="text-sm bg-lime-500/10 border border-lime-500/30 rounded-xl p-3 text-lime-100">
            <span className="font-semibold">Übung: </span>
            {t.drill}
          </div>
          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs text-gray-500 mb-2">Teste dich (zählt nicht in die Statistik):</p>
            <QuizCard id={t.id} question={t.question} options={t.options} correct={t.correct} explanation={t.explanation} />
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function PadelView({ state }: { state: CoachState }) {
  const [open, setOpen] = useState<string | null>(null)
  const stats = tacticStats(state)
  const answered = Object.values(stats).reduce((n, s) => n + s.right + s.wrong, 0)
  const right = Object.values(stats).reduce((n, s) => n + s.right, 0)
  const selected = PADEL_TACTICS.find((t) => t.id === open)

  if (selected) return <Detail t={selected} onBack={() => setOpen(null)} />

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-xs text-gray-500">Taktik-Fragen beantwortet</p>
          <p className="text-2xl font-bold text-white">{answered}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Trefferquote</p>
          <p className="text-2xl font-bold text-lime-300">{answered ? Math.round((right / answered) * 100) : 0}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Taktiken gemeistert</p>
          <p className="text-2xl font-bold text-white">
            {Object.values(stats).filter((s) => s.right > 0).length}
            <span className="text-sm text-gray-500"> / {PADEL_TACTICS.length}</span>
          </p>
        </div>
      </Card>

      <div>
        <SectionTitle title="Taktik-Bibliothek" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PADEL_TACTICS.map((t) => {
            const s = stats[t.id]
            return (
              <button
                key={t.id}
                onClick={() => setOpen(t.id)}
                className="text-left bg-gray-900/60 border border-gray-800 hover:border-lime-500/50 rounded-2xl p-2.5 transition-colors"
              >
                <div className="rounded-xl overflow-hidden bg-gray-950/60 p-1.5">
                  <PadelCourt diagram={t.diagram} className="max-h-40" />
                </div>
                <p className="text-[10px] text-lime-400 font-semibold uppercase tracking-wider mt-2">{t.category}</p>
                <p className="text-sm font-semibold text-gray-100 leading-snug">{t.title}</p>
                {s && (
                  <p className={`text-[11px] mt-1 ${s.right ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {s.right ? '✓ gewusst' : '↻ wiederholen'}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionTitle icon={<Footprints className="w-4 h-4 text-lime-400" />} title="Übungen & Athletik" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PADEL_DRILLS.map((d) => (
            <Card key={d.id} className="!p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-lime-400">{d.focus}</span>
                <span className="text-[11px] text-gray-500">{d.duration}</span>
              </div>
              <h3 className="font-semibold text-white leading-snug">{d.title}</h3>
              <p className="text-xs text-gray-400 mt-1 mb-2">{d.description}</p>
              <ol className="space-y-1 text-sm text-gray-300 list-decimal pl-4">
                {d.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
