'use client'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Bot, CheckCircle2, CircleSlash, Sparkles } from 'lucide-react'
import type { JournalEntry } from '@/types/trading'

export default function JournalFeed({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center text-sm text-gray-500">
        Noch keine Einträge. Starte einen Durchlauf — der Bot schreibt dann jede Entscheidung samt Begründung hier hinein.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <article key={entry.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                entry.action === 'buy'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
              }`}>
                {entry.action === 'buy' ? 'KAUF' : 'VERKAUF'}
              </span>
              <span className="font-semibold text-white">{entry.symbol}</span>
              <span className="text-xs text-gray-400">
                {entry.qty} Stück · {entry.price.toFixed(2)} $ · Score {entry.score}
              </span>
            </div>
            <span className="text-[11px] text-gray-500 whitespace-nowrap">
              {format(new Date(entry.timestamp), 'dd.MM. HH:mm', { locale: de })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            {entry.executed ? (
              <><CheckCircle2 className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Order ausgeführt</span></>
            ) : (
              <><CircleSlash className="w-3 h-3 text-amber-400" /><span className="text-amber-400">nicht ausgeführt</span></>
            )}
            {entry.note && <span className="text-gray-500">· {entry.note}</span>}
          </div>

          <p className="text-sm text-gray-300 mt-3 leading-relaxed">{entry.commentary}</p>

          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
            {entry.commentarySource === 'claude'
              ? <><Sparkles className="w-3 h-3" /> Kommentar von Claude</>
              : <><Bot className="w-3 h-3" /> Kommentar aus dem Regelwerk</>}
          </div>

          <details className="mt-3">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-white">
              Regeln im Detail ({entry.reasons.length})
            </summary>
            <ul className="mt-2 space-y-1.5">
              {entry.reasons.map(reason => (
                <li key={reason.rule} className="text-[11px] text-gray-400">
                  <span className={reason.weight > 0 ? 'text-emerald-400' : reason.weight < 0 ? 'text-red-400' : 'text-gray-500'}>
                    {reason.weight > 0 ? '+' : ''}{reason.weight}
                  </span>{' '}
                  <span className="text-gray-200">{reason.rule}</span> — {reason.detail}
                </li>
              ))}
            </ul>
          </details>
        </article>
      ))}
    </div>
  )
}
