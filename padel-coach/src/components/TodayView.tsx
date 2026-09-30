'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Brain, Lightbulb, Pencil, Sparkles, Swords, Dumbbell, CheckCircle2 } from 'lucide-react'
import type { CheckIn, CoachState, Signals } from '@/lib/coach/types'
import { addDays, factOfDay, planDay, quizOfDay, tacticOfDay } from '@/lib/coach/engine'
import { WORKOUTS, workoutById, SESSION_LABEL } from '@/lib/coach/workouts'
import CheckInForm from './CheckInForm'
import WorkoutCard from './WorkoutCard'
import QuizCard from './QuizCard'
import PadelCourt, { CourtLegend } from './PadelCourt'
import { Card, SectionTitle } from './ui'

function Stat({ label, value, unit, hint, tone }: { label: string; value?: string | number; unit?: string; hint?: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-3 py-2 min-w-[92px]">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${tone === 'bad' ? 'text-rose-300' : tone === 'good' ? 'text-emerald-300' : 'text-white'}`}>
        {value ?? '–'}
        {value !== undefined && unit && <span className="text-xs font-normal text-gray-500 ml-0.5">{unit}</span>}
      </p>
      {hint && <p className="text-[10px] text-gray-500">{hint}</p>}
    </div>
  )
}

export function SignalStrip({ s }: { s: Signals }) {
  const hrvTone = s.hrv && s.hrvBaseline ? (s.hrv < s.hrvBaseline * 0.85 ? 'bad' : s.hrv > s.hrvBaseline * 1.05 ? 'good' : undefined) : undefined
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      <Stat label="Readiness" value={s.readiness} hint="Oura" tone={s.readiness !== undefined ? (s.readiness >= 80 ? 'good' : s.readiness < 60 ? 'bad' : undefined) : undefined} />
      <Stat label="HRV" value={s.hrv ? Math.round(s.hrv) : undefined} unit="ms" hint={s.hrvBaseline ? `Ø ${Math.round(s.hrvBaseline)}` : 'Oura'} tone={hrvTone} />
      <Stat label="Schlaf" value={s.sleepHours ? s.sleepHours.toFixed(1) : undefined} unit="h" hint={s.sleepScore ? `Score ${s.sleepScore}` : 'Oura'} />
      <Stat label="Ruhepuls" value={s.restingHr} unit="bpm" hint={s.restingHrBaseline ? `Ø ${Math.round(s.restingHrBaseline)}` : undefined} />
      <Stat label="Body Battery" value={s.bodyBattery} hint="Garmin" />
      <Stat label="VO2max" value={s.vo2max} hint="Garmin" />
    </div>
  )
}

export default function TodayView({
  state,
  update,
  signals,
  today,
}: {
  state: CoachState
  update: (fn: (s: CoachState) => CoachState) => void
  signals: Signals
  today: string
}) {
  const record = state.days[today]
  const yesterday = addDays(today, -1)
  const yRecord = state.days[yesterday]
  const [editing, setEditing] = useState(false)
  const [swap, setSwap] = useState(false)

  const plan = useMemo(() => {
    const p = planDay(state, signals, record?.checkIn, today)
    const chosen = record?.plannedSession && workoutById(record.plannedSession.workoutId)
    return chosen ? { ...p, workout: chosen, type: chosen.type } : p
  }, [state, signals, record, today])

  const { tactic, repeat } = tacticOfDay(state, today)
  const quiz = quizOfDay(today)
  const fact = factOfDay(today)

  function submitCheckIn(c: CheckIn) {
    update((s) => {
      const now = Date.now()
      const days = { ...s.days }
      const y = days[yesterday]
      days[yesterday] = {
        ...(y ?? { date: yesterday }),
        completed: y?.plannedSession && c.yesterdayDone !== 'none-planned' ? c.yesterdayDone : y?.completed,
        padelPlayed: c.padelYesterday,
        padelMinutes: c.padelYesterdayMinutes,
        updatedAt: now,
      } as (typeof days)[string]
      const withYesterday = { ...s, days }
      const p = planDay(withYesterday, signals, c, today)
      days[today] = {
        ...(days[today] ?? { date: today }),
        date: today,
        checkIn: c,
        plannedSession: { type: p.type, workoutId: p.workout.id, title: p.workout.title },
        updatedAt: now,
      }
      return { ...s, days }
    })
    setEditing(false)
  }

  function chooseWorkout(id: string) {
    const w = workoutById(id)
    if (!w) return
    update((s) => ({
      ...s,
      days: {
        ...s.days,
        [today]: { ...(s.days[today] ?? { date: today }), plannedSession: { type: w.type, workoutId: w.id, title: w.title }, updatedAt: Date.now() },
      },
    }))
    setSwap(false)
  }

  function markToday(v: 'yes' | 'partly' | 'no') {
    update((s) => ({
      ...s,
      days: { ...s.days, [today]: { ...(s.days[today] ?? { date: today }), completed: v, updatedAt: Date.now() } },
    }))
  }

  function answer(kind: 'tacticAnswer' | 'quizAnswer', id: string, index: number, correct: boolean) {
    update((s) => ({
      ...s,
      days: { ...s.days, [today]: { ...(s.days[today] ?? { date: today }), [kind]: { id, correct, index }, updatedAt: Date.now() } },
    }))
  }

  const needsCheckIn = !record?.checkIn || editing
  const garminPadel = signals.recentActivities.find((a) => a.date === yesterday && /padel|tennis|racket|squash/i.test(a.type))
  const padelSuggestion = garminPadel
    ? {
        intensity: ((garminPadel.aerobicTE ?? 0) >= 3 || garminPadel.minutes >= 75 ? 'match' : 'light') as 'match' | 'light',
        minutes: garminPadel.minutes >= 105 ? 120 : garminPadel.minutes >= 75 ? 90 : 60,
      }
    : undefined
  const tacticAnswered = record?.tacticAnswer?.id === tactic.id ? record.tacticAnswer.index : undefined
  const quizAnswered = record?.quizAnswer?.id === quiz.id ? record.quizAnswer.index : undefined

  return (
    <div className="space-y-5">
      <SignalStrip s={signals} />

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-5">
          {needsCheckIn ? (
            <Card className="border-emerald-500/30">
              <SectionTitle icon={<Sparkles className="w-4 h-4 text-emerald-400" />} title="Morgen-Check-in" />
              <p className="text-sm text-gray-400 mb-4">Kurz ehrlich antworten – daraus und aus deinen Oura/Garmin-Daten entsteht dein Training für heute.</p>
              <CheckInForm initial={record?.checkIn} yesterdayTitle={yRecord?.plannedSession?.title}
                padelYesterdaySuggestion={padelSuggestion}
                onSubmit={submitCheckIn}
              />
            </Card>
          ) : (
            <Card>
              <SectionTitle
                icon={<Dumbbell className="w-4 h-4 text-emerald-400" />}
                title="Dein Training heute"
                right={
                  <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                    <Pencil className="w-3.5 h-3.5" /> Check-in
                  </button>
                }
              />
              {plan.readiness.warnings.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  {plan.readiness.warnings.map((w) => (
                    <p key={w} className="flex items-start gap-2 text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-14 h-14 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1f2937" strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={plan.readiness.score >= 70 ? '#34d399' : plan.readiness.score >= 55 ? '#fbbf24' : '#fb7185'}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${(plan.readiness.score / 100) * 97.4} 97.4`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{plan.readiness.score}</span>
                </div>
                <div className="text-xs text-gray-400 leading-relaxed">
                  <p className="text-gray-300 font-medium">Bereitschaft heute</p>
                  {plan.readiness.reasons.slice(0, 3).join(' · ')}
                </div>
              </div>

              <WorkoutCard workout={plan.workout} ctx={plan.ctx} />

              {plan.optional && <p className="mt-3 text-sm text-sky-200 bg-sky-500/10 rounded-xl px-3 py-2">➕ {plan.optional}</p>}

              <details className="mt-4 group">
                <summary className="text-xs text-gray-400 cursor-pointer select-none hover:text-gray-200">Warum diese Einheit?</summary>
                <ul className="mt-2 space-y-1 text-sm text-gray-300 list-disc pl-5">
                  {plan.why.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </details>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center mr-1">Heute erledigt?</span>
                {(['yes', 'partly', 'no'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => markToday(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs border ${
                      record?.completed === v ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'border-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {v === 'yes' ? '✅ Ja' : v === 'partly' ? '½ Teilweise' : '✗ Nein'}
                  </button>
                ))}
                <button onClick={() => setSwap((x) => !x)} className="ml-auto text-xs text-gray-400 hover:text-white underline">
                  Andere Einheit
                </button>
              </div>
              {swap && (
                <select
                  className="mt-3 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200"
                  value={plan.workout.id}
                  onChange={(e) => chooseWorkout(e.target.value)}
                >
                  {WORKOUTS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {SESSION_LABEL[w.type]} – {w.title}
                    </option>
                  ))}
                </select>
              )}
            </Card>
          )}

          <Card>
            <SectionTitle icon={<Brain className="w-4 h-4 text-sky-400" />} title={`Quiz · ${quiz.topic}`} />
            <QuizCard
              key={quiz.id}
              id={quiz.id}
              question={quiz.question}
              options={quiz.options}
              correct={quiz.correct}
              explanation={quiz.explanation}
              answered={quizAnswered}
              onAnswer={(i, ok) => answer('quizAnswer', quiz.id, i, ok)}
            />
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900/40 to-gray-900/60">
            <SectionTitle icon={<Lightbulb className="w-4 h-4 text-yellow-300" />} title={`Fakt des Tages · ${fact.topic}`} />
            <p className="text-gray-100 leading-relaxed">{fact.text}</p>
          </Card>
        </div>

        <Card>
          <SectionTitle
            icon={<Swords className="w-4 h-4 text-lime-400" />}
            title="Padel-Taktik des Tages"
            right={repeat ? <span className="text-[11px] text-amber-300">Wiederholung</span> : <span className="text-[11px] text-gray-500">{tactic.category}</span>}
          />
          <h3 className="text-lg font-bold text-white mb-3">{tactic.title}</h3>
          <div className="grid sm:grid-cols-[minmax(0,240px)_1fr] lg:grid-cols-1 xl:grid-cols-[minmax(0,240px)_1fr] gap-4">
            <div className="mx-auto w-full max-w-[240px]">
              <PadelCourt diagram={tactic.diagram} />
              <div className="mt-2">
                <CourtLegend />
              </div>
            </div>
            <div className="space-y-4 min-w-0">
              <QuizCard
                key={tactic.id}
                id={tactic.id}
                question={tactic.question}
                options={tactic.options}
                correct={tactic.correct}
                explanation={tactic.explanation}
                answered={tacticAnswered}
                onAnswer={(i, ok) => answer('tacticAnswer', tactic.id, i, ok)}
              />
              {tacticAnswered !== undefined && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-300 leading-relaxed">{tactic.summary}</p>
                  <ul className="space-y-1.5">
                    {tactic.keyPoints.map((k) => (
                      <li key={k} className="flex gap-2 text-sm text-gray-200">
                        <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                        {k}
                      </li>
                    ))}
                  </ul>
                  <div className="text-sm bg-lime-500/10 border border-lime-500/30 rounded-xl p-3 text-lime-100">
                    <span className="font-semibold">Übung dazu: </span>
                    {tactic.drill}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
