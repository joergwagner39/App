'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { shuffledOptions } from '@/lib/coach/engine'

export default function QuizCard({
  id,
  question,
  options,
  correct,
  explanation,
  answered,
  onAnswer,
}: {
  id: string
  question: string
  options: string[]
  correct: number
  explanation: string
  /** bereits gegebene Antwort (Index im Original-Array) */
  answered?: number
  onAnswer?: (index: number, isCorrect: boolean) => void
}) {
  const [picked, setPicked] = useState<number | undefined>(answered)
  const opts = shuffledOptions(id, options)
  const done = picked !== undefined

  return (
    <div className="space-y-3">
      <p className="font-medium text-white leading-snug">{question}</p>
      <div className="grid gap-2">
        {opts.map((o, i) => {
          const isRight = o.index === correct
          const isPicked = o.index === picked
          let cls = 'bg-gray-800/60 border-gray-700 text-gray-200 hover:border-gray-500'
          if (done && isRight) cls = 'bg-emerald-500/15 border-emerald-400 text-emerald-100'
          else if (done && isPicked) cls = 'bg-rose-500/15 border-rose-400 text-rose-100'
          else if (done) cls = 'bg-gray-800/40 border-gray-800 text-gray-500'
          return (
            <button
              key={o.index}
              type="button"
              disabled={done}
              onClick={() => {
                setPicked(o.index)
                onAnswer?.(o.index, o.index === correct)
              }}
              className={`flex items-start gap-2 text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${cls}`}
            >
              <span className="font-semibold text-gray-500 w-4 shrink-0">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1">{o.text}</span>
              {done && isRight && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {done && isPicked && !isRight && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            </button>
          )
        })}
      </div>
      {done && (
        <div
          className={`rounded-xl p-3 text-sm ${
            picked === correct ? 'bg-emerald-500/10 text-emerald-100' : 'bg-amber-500/10 text-amber-100'
          }`}
        >
          <span className="font-semibold">{picked === correct ? 'Richtig! ' : 'Nicht ganz. '}</span>
          {explanation}
        </div>
      )}
    </div>
  )
}
