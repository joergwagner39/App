'use client'

import { useState } from 'react'
import { Sparkles, Trophy, Heart, Lightbulb, Sunrise, PenLine, Plus, ChevronDown } from 'lucide-react'

import type { JournalEntry } from '@/lib/journal'
import MoodScale from './MoodScale'

interface JournalEditorProps {
  entry: JournalEntry
  onChange: (entry: JournalEntry) => void
}

const fieldClass =
  'w-full rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-base leading-relaxed text-gray-100 placeholder:text-gray-600 outline-none transition focus:border-emerald-500/60 focus:bg-gray-900 sm:text-lg'

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 text-emerald-400">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold text-gray-100 sm:text-xl">{title}</h2>
          {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export default function JournalEditor({ entry, onChange }: JournalEditorProps) {
  const update = (patch: Partial<JournalEntry>) => onChange({ ...entry, ...patch })

  const updateGratitude = (index: number, value: string) => {
    const gratitude = [...entry.gratitude]
    gratitude[index] = value
    update({ gratitude })
  }

  // Zeile 2 und 3 erscheinen erst auf Wunsch – der leere Bogen soll nicht mahnen
  const filledGratitude = entry.gratitude.filter((g) => g.trim()).length
  const [visibleLines, setVisibleLines] = useState(() =>
    Math.min(3, Math.max(1, filledGratitude + (entry.gratitude[0]?.trim() ? 1 : 0))),
  )
  const shownLines = Math.min(3, Math.max(visibleLines, filledGratitude))

  const optionalFilled = [entry.wins, entry.lifeIsBeautiful, entry.learned].filter((v) =>
    v.trim(),
  ).length
  const [showOptional, setShowOptional] = useState(optionalFilled > 0)

  return (
    <div className="space-y-4 sm:space-y-5">
      <Section
        icon={<Heart size={22} />}
        title="Wofür bist du heute dankbar?"
        hint="Eine Zeile genügt – der Kaffee, ein Anruf, die Sonne auf dem Heimweg."
      >
        <div className="space-y-3">
          {entry.gratitude.slice(0, shownLines).map((value, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-400">
                {index + 1}
              </span>
              <input
                type="text"
                value={value}
                onChange={(e) => updateGratitude(index, e.target.value)}
                placeholder={
                  ['Ich bin dankbar für …', 'Außerdem für …', 'Und für …'][index] ??
                  'Ich bin dankbar für …'
                }
                className={fieldClass}
                enterKeyHint={index === 2 ? 'done' : 'next'}
              />
            </div>
          ))}
          {shownLines < 3 && (
            <button
              type="button"
              onClick={() => setVisibleLines(shownLines + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-gray-500 transition hover:text-emerald-300"
            >
              <Plus size={15} /> noch etwas
            </button>
          )}
        </div>
      </Section>

      <Section
        icon={<PenLine size={22} />}
        title="Gedanken zum Tag"
        hint="Ohne Vorgabe – was dir durch den Kopf geht, so lang oder kurz wie es kommt."
      >
        <textarea
          value={entry.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Heute war …"
          rows={5}
          className={fieldClass}
        />
      </Section>

      <Section
        icon={<Sunrise size={22} />}
        title="Worauf freust du dich morgen?"
        hint="Ein Satz. Er nimmt den Blick vom Tag mit ins Bett."
      >
        <textarea
          value={entry.tomorrow}
          onChange={(e) => update({ tomorrow: e.target.value })}
          placeholder="Morgen freue ich mich auf …"
          rows={2}
          className={fieldClass}
        />
      </Section>

      <Section
        icon={<Heart size={22} />}
        title="Und wie war der Tag insgesamt?"
        hint="1 heißt sehr schwer, 10 heißt großartig. Aus dieser einen Zahl entsteht deine Kurve."
      >
        <MoodScale value={entry.mood} onChange={(mood) => update({ mood })} />
      </Section>

      {/* Damit ist der Abend erledigt. Der Rest ist Angebot, kein Pensum. */}
      <div className="border-t border-gray-800 pt-2">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          aria-expanded={showOptional}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-gray-900/50"
        >
          <ChevronDown
            size={18}
            className={`shrink-0 text-emerald-400 transition-transform ${showOptional ? 'rotate-180' : ''}`}
          />
          <span className="min-w-0">
            <span className="block font-medium text-gray-200">Wenn du heute mehr Zeit hast</span>
            <span className="block text-sm text-gray-500">
              {optionalFilled > 0
                ? `${optionalFilled} von 3 ausgefüllt`
                : 'z. B. Was hat heute gut geklappt? Was hast du gelernt?'}
            </span>
          </span>
        </button>

        {showOptional && (
          <div className="mt-3 space-y-4 sm:space-y-5">
            <Section
              icon={<Trophy size={22} />}
              title="Was hat heute gut geklappt?"
              hint="Auch das Kleine zählt: ein gutes Gespräch, eine erledigte Sache, Nein gesagt."
            >
              <textarea
                value={entry.wins}
                onChange={(e) => update({ wins: e.target.value })}
                placeholder="Heute ist mir gelungen …"
                rows={3}
                className={fieldClass}
              />
            </Section>

            <Section icon={<Sparkles size={22} />} title="Das Leben ist schön, weil …">
              <textarea
                value={entry.lifeIsBeautiful}
                onChange={(e) => update({ lifeIsBeautiful: e.target.value })}
                placeholder="… weil"
                rows={3}
                className={fieldClass}
              />
            </Section>

            <Section
              icon={<Lightbulb size={22} />}
              title="Was hast du heute gelernt?"
              hint="Über dich, über andere, über die Welt. Auch aus dem, was schiefging."
            >
              <textarea
                value={entry.learned}
                onChange={(e) => update({ learned: e.target.value })}
                placeholder="Mir ist aufgefallen …"
                rows={3}
                className={fieldClass}
              />
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
