'use client'

import { Sparkles, Trophy, Heart, Lightbulb, Sunrise, PenLine } from 'lucide-react'

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

  return (
    <div className="space-y-4 sm:space-y-5">
      <Section
        icon={<Heart size={22} />}
        title="Wofür bist du heute dankbar?"
        hint="Drei Kleinigkeiten reichen – der Kaffee, ein Anruf, die Sonne auf dem Heimweg."
      >
        <div className="space-y-3">
          {entry.gratitude.map((value, index) => (
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
                enterKeyHint="next"
              />
            </div>
          ))}
        </div>
      </Section>

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
        title="Was habe ich heute gelernt?"
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

      <Section icon={<Sunrise size={22} />} title="Worauf freust du dich morgen?">
        <textarea
          value={entry.tomorrow}
          onChange={(e) => update({ tomorrow: e.target.value })}
          placeholder="Morgen freue ich mich auf …"
          rows={2}
          className={fieldClass}
        />
      </Section>

      <Section icon={<PenLine size={22} />} title="Freier Gedanke" hint="Alles, was sonst noch raus will.">
        <textarea
          value={entry.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="…"
          rows={4}
          className={fieldClass}
        />
      </Section>

      <Section
        icon={<Heart size={22} />}
        title="Wie war dein Tag – wie ist deine Stimmung?"
        hint="1 = sehr schwer, 10 = großartig. Aus dieser Zahl entsteht deine Kurve."
      >
        <MoodScale value={entry.mood} onChange={(mood) => update({ mood })} />
      </Section>
    </div>
  )
}
