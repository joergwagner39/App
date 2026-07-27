'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'

import { MOOD_EMOJI, MOOD_LABELS, moodColor, type JournalEntry } from '@/lib/journal'

interface JournalTimelineProps {
  entries: JournalEntry[]
  onEdit: (date: string) => void
  onDelete: (date: string) => void
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-gray-200">{value}</p>
    </div>
  )
}

export default function JournalTimeline({ entries, onEdit, onDelete }: JournalTimelineProps) {
  const [openDate, setOpenDate] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (!entries.length) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-800 p-8 text-center text-sm text-gray-500">
        Noch keine früheren Einträge. Heute Abend fängt es an.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const open = openDate === entry.date
        const gratitude = entry.gratitude.filter((g) => g.trim())
        return (
          <article key={entry.date} className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40">
            <button
              type="button"
              onClick={() => setOpenDate(open ? null : entry.date)}
              className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-gray-900/70 sm:p-5"
              aria-expanded={open}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: `${moodColor(entry.mood)}22` }}
                title={`${entry.mood}/10 – ${MOOD_LABELS[entry.mood]}`}
              >
                {MOOD_EMOJI[entry.mood]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-gray-100">
                  {format(parseISO(entry.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
                </span>
                <span className="mt-0.5 block truncate text-sm text-gray-500">
                  {gratitude[0] || entry.notes || entry.tomorrow || entry.wins || 'Ohne Text'}
                </span>
              </span>
              <span
                className="shrink-0 text-sm font-semibold"
                style={{ color: moodColor(entry.mood) }}
              >
                {entry.mood}/10
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {open && (
              <div className="space-y-4 border-t border-gray-800 p-4 text-sm sm:p-5">
                {gratitude.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Dankbar für</p>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-gray-200">
                      {gratitude.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Field label="Gedanken zum Tag" value={entry.notes} />
                <Field label="Freude auf morgen" value={entry.tomorrow} />
                <Field label="Gut geklappt" value={entry.wins} />
                <Field label="Das Leben ist schön, weil" value={entry.lifeIsBeautiful} />
                <Field label="Gelernt" value={entry.learned} />

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onEdit(entry.date)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-emerald-500/60 hover:text-emerald-300"
                  >
                    <Pencil size={15} /> Bearbeiten
                  </button>
                  {confirmDelete === entry.date ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(entry.date)
                          setConfirmDelete(null)
                        }}
                        className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                      >
                        Wirklich löschen
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400"
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(entry.date)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-4 py-2 text-sm text-gray-500 transition hover:border-red-500/50 hover:text-red-400"
                    >
                      <Trash2 size={15} /> Löschen
                    </button>
                  )}
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
