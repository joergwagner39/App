import Link from 'next/link'
import { requireUser } from '@/lib/scouting/guard'
import { listClubs } from '@/lib/scouting/repo'
import { formatEur } from '@/lib/scouting/format'
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  buttonClass,
  secondaryButtonClass,
} from '@/components/scouting/ui'

export const dynamic = 'force-dynamic'

export default async function ClubsPage({ searchParams }: { searchParams: { fehler?: string } }) {
  await requireUser()
  const clubs = await listClubs()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Vereine</h1>
          <p className="mt-1 text-sm text-slate-400">
            Bedarf, Budget und Spielstil bestimmen, wie ein Verein im Matching abschneidet.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/scouting/einstellungen" className={secondaryButtonClass}>
            Aus Anbieter laden
          </Link>
          <Link href="/scouting/vereine/neu" className={buttonClass}>
            Verein anlegen
          </Link>
        </div>
      </div>

      <ErrorBanner message={searchParams.fehler} />

      {clubs.length === 0 ? (
        <Card>
          <EmptyState title="Noch keine Vereine erfasst.">
            Ohne Vereine kann das Matching nichts berechnen.
          </EmptyState>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Verein</th>
                  <th className="px-2 py-2">Liga</th>
                  <th className="px-2 py-2">Niveau</th>
                  <th className="px-2 py-2">Transferbudget</th>
                  <th className="px-2 py-2">Gesuchte Positionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {clubs.map((c) => {
                  const needs = Object.entries(c.needs)
                    .filter(([, v]) => Number(v) > 0)
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                  return (
                    <tr key={c.id} className="transition hover:bg-slate-800/40">
                      <td className="px-2 py-2.5">
                        <Link
                          href={`/scouting/vereine/${c.id}`}
                          className="font-medium text-slate-100 hover:text-sky-400"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-slate-300">
                        {c.league || '—'}
                        {c.country ? <span className="text-slate-500"> · {c.country}</span> : null}
                      </td>
                      <td className="px-2 py-2.5 text-slate-300">{c.leagueLevel}</td>
                      <td className="px-2 py-2.5 text-slate-300">
                        {formatEur(c.transferBudgetEur)}
                      </td>
                      <td className="px-2 py-2.5">
                        {needs.length === 0 ? (
                          <span className="text-xs text-slate-500">kein Bedarf hinterlegt</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {needs.map(([pos, value]) => (
                              <Badge key={pos} tone={Number(value) >= 70 ? 'warn' : 'neutral'}>
                                {pos} {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
