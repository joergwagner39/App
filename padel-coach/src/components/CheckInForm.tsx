'use client'

import { useEffect, useState } from 'react'
import type { CheckIn, Feeling, PadelIntensity } from '@/lib/coach/types'

const FEELINGS: { v: Feeling; emoji: string; label: string }[] = [
  { v: 1, emoji: '😫', label: 'mies' },
  { v: 2, emoji: '😕', label: 'müde' },
  { v: 3, emoji: '😐', label: 'okay' },
  { v: 4, emoji: '🙂', label: 'gut' },
  { v: 5, emoji: '💪', label: 'top' },
]

function Chips<T extends string | number | boolean>({
  value,
  onChange,
  options,
}: {
  value: T | undefined
  onChange: (v: T) => void
  options: { v: T; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
            value === o.v
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
              : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Q({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-200">
        <span className="text-gray-500 mr-1.5">{n}.</span>
        {title}
      </p>
      {children}
    </div>
  )
}

const PADEL_OPTS: { v: PadelIntensity; label: string }[] = [
  { v: 'none', label: 'Nein' },
  { v: 'light', label: 'Ja, locker/Training' },
  { v: 'match', label: 'Ja, Match/intensiv' },
]

export default function CheckInForm({
  initial,
  yesterdayTitle,
  padelYesterdaySuggestion,
  onSubmit,
}: {
  initial?: CheckIn
  yesterdayTitle?: string
  /** Von Garmin erkannte Padel-Aktivität gestern */
  padelYesterdaySuggestion?: { intensity: PadelIntensity; minutes: number }
  onSubmit: (c: CheckIn) => void
}) {
  const [c, setC] = useState<Partial<CheckIn>>(
    initial ?? {
      knee: 0,
      soreness: 0,
      yesterdayDone: yesterdayTitle ? undefined : 'none-planned',
      padelTomorrow: false,
      padelYesterday: padelYesterdaySuggestion?.intensity,
      padelYesterdayMinutes: padelYesterdaySuggestion?.minutes,
    },
  )
  // Garmin-Daten kommen oft erst nach dem ersten Rendern – dann nachträglich vorbelegen
  useEffect(() => {
    if (!padelYesterdaySuggestion || initial) return
    setC((p) =>
      p.padelYesterday !== undefined
        ? p
        : { ...p, padelYesterday: padelYesterdaySuggestion.intensity, padelYesterdayMinutes: padelYesterdaySuggestion.minutes },
    )
  }, [padelYesterdaySuggestion?.intensity, padelYesterdaySuggestion?.minutes, initial])

  const set = <K extends keyof CheckIn>(k: K, v: CheckIn[K]) => setC((p) => ({ ...p, [k]: v }))

  const complete =
    c.feeling !== undefined && c.yesterdayDone !== undefined && c.padelYesterday !== undefined && c.padelToday !== undefined

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (complete) onSubmit(c as CheckIn)
      }}
    >
      <Q n={1} title="Wie geht es dir heute?">
        <div className="grid grid-cols-5 gap-2">
          {FEELINGS.map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => set('feeling', f.v)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-colors ${
                c.feeling === f.v ? 'bg-emerald-500/20 border-emerald-400' : 'bg-gray-800/60 border-gray-700 hover:border-gray-500'
              }`}
            >
              <span className="text-2xl leading-none">{f.emoji}</span>
              <span className="text-[11px] text-gray-300">{f.label}</span>
            </button>
          ))}
        </div>
      </Q>

      <Q n={2} title={`Wie fühlt sich dein Knie an? ${c.knee ?? 0}/10`}>
        <input
          type="range"
          min={0}
          max={10}
          value={c.knee ?? 0}
          onChange={(e) => set('knee', Number(e.target.value))}
          className="w-full accent-emerald-400"
          aria-label="Knieschmerz 0 bis 10"
        />
        <div className="flex justify-between text-[11px] text-gray-500">
          <span>0 = kein Thema</span>
          <span>10 = starke Schmerzen</span>
        </div>
      </Q>

      <Q n={3} title="Muskelkater / schwere Beine?">
        <Chips
          value={c.soreness}
          onChange={(v) => set('soreness', v)}
          options={[
            { v: 0, label: 'Nein' },
            { v: 1, label: 'Etwas' },
            { v: 2, label: 'Deutlich' },
            { v: 3, label: 'Stark' },
          ]}
        />
      </Q>

      <Q n={4} title={yesterdayTitle ? `Hast du gestern „${yesterdayTitle}“ gemacht?` : 'Hast du gestern trainiert?'}>
        <Chips
          value={c.yesterdayDone}
          onChange={(v) => set('yesterdayDone', v)}
          options={
            yesterdayTitle
              ? [
                  { v: 'yes' as const, label: 'Ja, komplett' },
                  { v: 'partly' as const, label: 'Teilweise' },
                  { v: 'no' as const, label: 'Nein' },
                ]
              : [
                  { v: 'yes' as const, label: 'Ja' },
                  { v: 'none-planned' as const, label: 'Nein / nichts geplant' },
                ]
          }
        />
      </Q>

      <Q n={5} title="Hast du gestern Padel gespielt?">
        {padelYesterdaySuggestion && !initial && (
          <p className="text-xs text-sky-300">Garmin hat gestern {padelYesterdaySuggestion.minutes} min Padel erkannt – bitte prüfen.</p>
        )}
        <Chips value={c.padelYesterday} onChange={(v) => set('padelYesterday', v)} options={PADEL_OPTS} />
        {c.padelYesterday && c.padelYesterday !== 'none' && (
          <Chips
            value={c.padelYesterdayMinutes}
            onChange={(v) => set('padelYesterdayMinutes', v)}
            options={[
              { v: 60, label: '60 min' },
              { v: 90, label: '90 min' },
              { v: 120, label: '120 min+' },
            ]}
          />
        )}
      </Q>

      <Q n={6} title="Spielst du heute Padel?">
        <Chips value={c.padelToday} onChange={(v) => set('padelToday', v)} options={PADEL_OPTS} />
      </Q>

      <Q n={7} title="Und morgen?">
        <Chips
          value={c.padelTomorrow}
          onChange={(v) => set('padelTomorrow', v)}
          options={[
            { v: false, label: 'Kein Padel' },
            { v: true, label: 'Padel geplant' },
          ]}
        />
      </Q>

      <input
        type="text"
        value={c.note ?? ''}
        onChange={(e) => set('note', e.target.value)}
        placeholder="Notiz (optional) – z. B. Stress, Reise, Erkältung …"
        className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-400"
      />

      <button
        type="submit"
        disabled={!complete}
        className="w-full py-3 rounded-xl font-semibold bg-emerald-500 text-gray-950 disabled:bg-gray-700 disabled:text-gray-400 transition-colors"
      >
        {complete ? 'Training für heute berechnen' : 'Bitte Fragen 1, 4, 5 und 6 beantworten'}
      </button>
    </form>
  )
}
