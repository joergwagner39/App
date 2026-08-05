import Link from 'next/link'
import { requireUser } from '@/lib/scouting/guard'
import { listClubs, listPlayers } from '@/lib/scouting/repo'
import { formatDate, formatEur } from '@/lib/scouting/format'
import { POSITION_LABEL } from '@/lib/scouting/types'
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  InfoBanner,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from '@/components/scouting/ui'
import { seedDemoAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: { q?: string; fehler?: string; demo?: string }
}) {
  await requireUser()

  const query = searchParams.q ?? ''
  const players = await listPlayers(query)
  const clubs = await listClubs()
  const clubName = new Map(clubs.map((c) => [c.id, c.name]))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Spieler</h1>
          <p className="mt-1 text-sm text-slate-400">
            Spieler auswählen, um passende Vereine mit prozentualer Bewertung zu sehen.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/scouting/import" className={secondaryButtonClass}>
            Aus Anbieter importieren
          </Link>
          <Link href="/scouting/spieler/neu" className={buttonClass}>
            Spieler anlegen
          </Link>
        </div>
      </div>

      <ErrorBanner message={searchParams.fehler} />
      {searchParams.demo === '1' && <InfoBanner>Demo-Daten wurden angelegt.</InfoBanner>}

      <Card>
        <form className="flex flex-wrap gap-2" action="/scouting">
          <input
            className={`${inputClass} max-w-sm flex-1`}
            name="q"
            placeholder="Nach Name suchen…"
            defaultValue={query}
          />
          <button className={secondaryButtonClass} type="submit">
            Suchen
          </button>
        </form>
      </Card>

      {players.length === 0 ? (
        <Card>
          <EmptyState title={query ? 'Keine Treffer.' : 'Noch keine Spieler erfasst.'}>
            {!query && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/scouting/spieler/neu" className={buttonClass}>
                  Ersten Spieler anlegen
                </Link>
                <form action={seedDemoAction}>
                  <button className={secondaryButtonClass} type="submit">
                    Demo-Daten laden
                  </button>
                </form>
              </div>
            )}
          </EmptyState>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Position</th>
                  <th className="px-2 py-2">Alter</th>
                  <th className="px-2 py-2">Aktueller Verein</th>
                  <th className="px-2 py-2">Marktwert</th>
                  <th className="px-2 py-2">Vertrag bis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {players.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-800/40">
                    <td className="px-2 py-2.5">
                      <Link
                        href={`/scouting/spieler/${p.id}`}
                        className="font-medium text-slate-100 hover:text-sky-400"
                      >
                        {p.name}
                      </Link>
                      {p.nationality && (
                        <span className="ml-2 text-xs text-slate-500">{p.nationality}</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      <Badge>{p.position}</Badge>
                      {p.altPositions.length > 0 && (
                        <span className="ml-2 text-xs text-slate-500">
                          {p.altPositions.join(', ')}
                        </span>
                      )}
                      <span className="sr-only">{POSITION_LABEL[p.position]}</span>
                    </td>
                    <td className="px-2 py-2.5 text-slate-300">{p.age ?? '—'}</td>
                    <td className="px-2 py-2.5 text-slate-300">
                      {(p.currentClubId ? clubName.get(p.currentClubId) : null) ??
                        p.currentClubName ??
                        '—'}
                    </td>
                    <td className="px-2 py-2.5 text-slate-300">{formatEur(p.marketValueEur)}</td>
                    <td className="px-2 py-2.5 text-slate-300">{formatDate(p.contractUntil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
