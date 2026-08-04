import Link from 'next/link'
import { MatchResult } from '@/lib/scouting/matching'
import { formatEur, matchTone } from '@/lib/scouting/format'
import { Badge, EmptyState, ScoreBar } from './ui'

/** Rangliste der passenden Vereine inklusive aufklappbarer Begründung. */
export function MatchList({ results }: { results: MatchResult[] }) {
  if (!results.length) {
    return (
      <EmptyState title="Keine Vereine zum Vergleich vorhanden.">
        Zuerst unter „Vereine“ mindestens einen Verein mit Bedarf und Budget anlegen.
      </EmptyState>
    )
  }

  return (
    <ol className="space-y-3">
      {results.map((result, index) => {
        const tone = matchTone(result.percent)
        return (
          <li
            key={result.clubId}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">#{index + 1}</span>
                  <Link
                    href={`/scouting/vereine/${result.clubId}`}
                    className="font-medium text-slate-100 hover:text-sky-400"
                  >
                    {result.club.name}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {result.club.league}
                    {result.club.country ? ` · ${result.club.country}` : ''} · Niveau{' '}
                    {result.club.leagueLevel}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.strengths.map((c) => (
                    <Badge key={c.key} tone="good">
                      {c.label}
                    </Badge>
                  ))}
                  {result.concerns.map((c) => (
                    <Badge key={c.key} tone="bad">
                      {c.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="w-40 shrink-0 text-right">
                <div className={`text-2xl font-semibold ${tone.text}`}>{result.percent}%</div>
                <ScoreBar percent={result.percent} className="mt-1" />
                <div className="mt-1 text-xs text-slate-500">
                  Datenbasis {result.confidence}%
                </div>
                {result.limitedBy.length > 0 && (
                  <div className="mt-1 text-xs text-amber-400/80">
                    gedeckelt durch {result.limitedBy.map((c) => c.label).join(', ')}
                  </div>
                )}
              </div>
            </div>

            <details className="group mt-3">
              <summary className="cursor-pointer text-xs text-slate-400 transition hover:text-slate-200">
                Bewertung im Detail
              </summary>

              <div className="mt-3 space-y-2">
                {result.criteria
                  .filter((c) => c.weight > 0)
                  .map((c) => (
                    <div
                      key={c.key}
                      className="grid grid-cols-[10rem_4rem_1fr] items-start gap-3 border-t border-slate-800/70 pt-2 text-xs"
                    >
                      <div className="text-slate-300">
                        {c.label}
                        <span className="ml-1 text-slate-600">·{c.weight}</span>
                      </div>
                      <div className="text-right">
                        {c.score == null ? (
                          <span className="text-slate-600">k. A.</span>
                        ) : (
                          <span className={matchTone(Math.round(c.score * 100)).text}>
                            {Math.round(c.score * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400">{c.detail}</div>
                    </div>
                  ))}
              </div>

              <div className="mt-3 grid gap-2 border-t border-slate-800/70 pt-3 text-xs text-slate-500 sm:grid-cols-2">
                <div>
                  Mittelwert {result.basePercent}% × Begrenzung{' '}
                  {Math.round(result.gate * 100)}% = {result.percent}%
                  <div className="mt-1">
                    Transferbudget: {formatEur(result.club.transferBudgetEur)} · Gehaltssumme:{' '}
                    {formatEur(result.club.salaryBudgetEur)}
                  </div>
                </div>
                {result.missing.length > 0 && (
                  <div className="sm:text-right">
                    Ohne Datengrundlage: {result.missing.join(', ')}
                  </div>
                )}
              </div>
            </details>
          </li>
        )
      })}
    </ol>
  )
}
