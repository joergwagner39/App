import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/scouting/guard'
import { getClub, listAssessments } from '@/lib/scouting/repo'
import { formatDate } from '@/lib/scouting/format'
import { ClubForm } from '@/components/scouting/ClubForm'
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  InfoBanner,
  buttonClass,
  dangerButtonClass,
  inputClass,
} from '@/components/scouting/ui'
import {
  addAssessmentAction,
  deleteAssessmentAction,
  deleteClubAction,
  saveClubAction,
} from '../../actions'

export const dynamic = 'force-dynamic'

export default function ClubDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { fehler?: string; gespeichert?: string }
}) {
  requireUser()
  const club = getClub(params.id)
  if (!club) notFound()

  const assessments = listAssessments({ clubId: club.id })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{club.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {club.league || 'Liga unbekannt'}
            {club.country ? ` · ${club.country}` : ''} · Niveau {club.leagueLevel}
          </p>
        </div>
        <form action={deleteClubAction}>
          <input type="hidden" name="id" value={club.id} />
          <button className={dangerButtonClass} type="submit">
            Verein löschen
          </button>
        </form>
      </div>

      <ErrorBanner message={searchParams.fehler} />
      {searchParams.gespeichert === '1' && <InfoBanner>Änderungen gespeichert.</InfoBanner>}

      <ClubForm club={club} action={saveClubAction} />

      <Card
        title="Einschätzungen zum Verein"
        subtitle="Wirken auf jede Paarung mit diesem Verein — mit halbem Gewicht gegenüber einer Bewertung, die direkt zu Spieler und Verein erfasst wurde."
      >
        {assessments.length === 0 ? (
          <EmptyState title="Noch keine Einschätzung erfasst." />
        ) : (
          <ul className="mb-4 space-y-2">
            {assessments.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 px-3 py-2 text-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={a.rating >= 0 ? 'good' : 'bad'}>
                      {a.rating > 0 ? `+${a.rating}` : a.rating}
                    </Badge>
                    {a.playerId && (
                      <Link
                        href={`/scouting/spieler/${a.playerId}`}
                        className="text-xs text-sky-400 hover:underline"
                      >
                        zur Spielerpaarung
                      </Link>
                    )}
                    <span className="text-xs text-slate-500">{formatDate(a.createdAt)}</span>
                  </div>
                  {a.text && <div className="mt-1 text-slate-300">{a.text}</div>}
                </div>
                <form action={deleteAssessmentAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="clubId" value={club.id} />
                  <button className={dangerButtonClass} type="submit">
                    Entfernen
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addAssessmentAction} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="clubId" value={club.id} />
          <input type="hidden" name="kind" value="einschaetzung" />
          <input
            className={inputClass}
            name="rating"
            type="number"
            min={-100}
            max={100}
            defaultValue={0}
            placeholder="Bewertung −100 bis +100"
          />
          <input className={inputClass} name="text" placeholder="Begründung" />
          <button className={buttonClass} type="submit">
            Hinzufügen
          </button>
        </form>
      </Card>
    </div>
  )
}
