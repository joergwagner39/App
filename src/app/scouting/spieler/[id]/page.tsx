import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/scouting/guard'
import {
  getClub,
  getPlayer,
  getWeights,
  listAssessments,
  listClubs,
  listInjuries,
  listRumors,
} from '@/lib/scouting/repo'
import { matchPlayer } from '@/lib/scouting/matching'
import { formatDate, formatEur } from '@/lib/scouting/format'
import { POSITION_LABEL, RUMOR_STAGES } from '@/lib/scouting/types'
import { MatchList } from '@/components/scouting/MatchList'
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  buttonClass,
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
} from '@/components/scouting/ui'
import {
  addAssessmentAction,
  addInjuryAction,
  addRumorAction,
  deleteAssessmentAction,
  deleteInjuryAction,
  deletePlayerAction,
  deleteRumorAction,
  syncInjuriesAction,
} from '../../actions'

export const dynamic = 'force-dynamic'

export default function PlayerDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { fehler?: string }
}) {
  const user = requireUser()
  const player = getPlayer(params.id)
  if (!player) notFound()

  const clubs = listClubs()
  const rumors = listRumors(player.id)
  const injuries = listInjuries(player.id)
  const assessments = listAssessments({ playerId: player.id })
  const weights = getWeights(user.id)

  const results = matchPlayer({
    player,
    clubs,
    rumors,
    injuries,
    assessments,
    weights,
  })

  const clubById = new Map(clubs.map((c) => [c.id, c]))
  const currentClub = player.currentClubId ? getClub(player.currentClubId) : null
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      <ErrorBanner message={searchParams.fehler} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{player.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Badge>{POSITION_LABEL[player.position]}</Badge>
            {player.altPositions.length > 0 && (
              <span className="text-xs text-slate-500">
                auch: {player.altPositions.join(', ')}
              </span>
            )}
            <span>{player.age ? `${player.age} Jahre` : 'Alter unbekannt'}</span>
            <span>·</span>
            <span>{currentClub?.name ?? player.currentClubName ?? 'vereinslos'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/scouting/spieler/${player.id}/bearbeiten`} className={secondaryButtonClass}>
            Bearbeiten
          </Link>
          <form action={deletePlayerAction}>
            <input type="hidden" name="id" value={player.id} />
            <button className={dangerButtonClass} type="submit">
              Löschen
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Marktwert" value={formatEur(player.marketValueEur)} />
        <Stat label="Gehalt" value={formatEur(player.salaryEur)} />
        <Stat label="Vertrag bis" value={formatDate(player.contractUntil)} />
        <Stat
          label="Ligenniveau"
          value={player.leagueLevel ? `Stufe ${player.leagueLevel}` : '—'}
        />
      </div>

      <Card
        title="Passende Vereine"
        subtitle={`${results.length} Vereine bewertet — sortiert nach Gesamtpassung. Die Gewichtung lässt sich in den Einstellungen anpassen.`}
        action={
          <Link href="/scouting/einstellungen" className="text-xs text-sky-400 hover:underline">
            Gewichtung
          </Link>
        }
      >
        <MatchList results={results} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Gerüchte & Interesse"
          subtitle="Jede Meldung fließt gewichtet nach Verhandlungsstand, Glaubwürdigkeit und Alter ein."
        >
          {rumors.length === 0 ? (
            <EmptyState title="Noch keine Meldungen erfasst." />
          ) : (
            <ul className="mb-4 space-y-2">
              {rumors.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-200">
                        {clubById.get(r.clubId)?.name ?? 'Unbekannter Verein'}
                      </span>
                      <Badge tone="info">{r.stage}</Badge>
                      <span className="text-xs text-slate-500">
                        {formatDate(r.date)} · Glaubwürdigkeit {r.credibility}/100
                      </span>
                    </div>
                    {r.source && <div className="text-xs text-slate-500">Quelle: {r.source}</div>}
                    {r.note && <div className="mt-1 text-xs text-slate-400">{r.note}</div>}
                  </div>
                  <form action={deleteRumorAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="playerId" value={player.id} />
                    <button className={dangerButtonClass} type="submit">
                      Entfernen
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form action={addRumorAction} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="playerId" value={player.id} />
            <select className={inputClass} name="clubId" required defaultValue="">
              <option value="" disabled>
                Verein wählen…
              </option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select className={inputClass} name="stage" defaultValue="interesse">
              {RUMOR_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input className={inputClass} name="source" placeholder="Quelle (z. B. Sky, Berater)" />
            <Field label="Datum der Meldung">
              <input className={inputClass} name="date" type="date" defaultValue={today} />
            </Field>
            <Field label="Glaubwürdigkeit 0–100">
              <input
                className={inputClass}
                name="credibility"
                type="number"
                min={0}
                max={100}
                defaultValue={50}
              />
            </Field>
            <input className={inputClass} name="note" placeholder="Notiz" />
            <div className="sm:col-span-2">
              <button className={buttonClass} type="submit">
                Meldung hinzufügen
              </button>
            </div>
          </form>
        </Card>

        <Card
          title="Verletzungen"
          subtitle="Ausfalltage der letzten 24 Monate fließen in die Bewertung ein."
          action={
            player.providerRef ? (
              <form action={syncInjuriesAction}>
                <input type="hidden" name="playerId" value={player.id} />
                <button className="text-xs text-sky-400 hover:underline" type="submit">
                  Vom Anbieter aktualisieren
                </button>
              </form>
            ) : null
          }
        >
          {injuries.length === 0 ? (
            <EmptyState title="Keine Verletzungen erfasst." />
          ) : (
            <ul className="mb-4 space-y-2">
              {injuries.map((i) => (
                <li
                  key={i.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-200">{i.type}</div>
                    <div className="text-xs text-slate-500">
                      {formatDate(i.startDate)} –{' '}
                      {i.endDate ? formatDate(i.endDate) : 'laufend'} · Schwere {i.severity}/5
                    </div>
                  </div>
                  <form action={deleteInjuryAction}>
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="playerId" value={player.id} />
                    <button className={dangerButtonClass} type="submit">
                      Entfernen
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form action={addInjuryAction} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="playerId" value={player.id} />
            <input
              className={`${inputClass} sm:col-span-2`}
              name="type"
              placeholder="Art der Verletzung"
              required
            />
            <Field label="Ausfall seit">
              <input className={inputClass} name="startDate" type="date" defaultValue={today} />
            </Field>
            <Field label="Zurück am" hint="Leer lassen, solange der Spieler ausfällt.">
              <input className={inputClass} name="endDate" type="date" />
            </Field>
            <Field label="Schwere 1–5">
              <input
                className={inputClass}
                name="severity"
                type="number"
                min={1}
                max={5}
                defaultValue={2}
              />
            </Field>
            <div>
              <button className={buttonClass} type="submit">
                Eintrag hinzufügen
              </button>
            </div>
          </form>
        </Card>
      </div>

      <Card
        title="Eigene Einschätzungen"
        subtitle="Bewertung von −100 bis +100. Mit Verein gewählt wirkt sie gezielt auf diese Paarung, sonst als allgemeine Notiz zum Spieler."
      >
        {assessments.filter((a) => a.playerId === player.id).length === 0 ? (
          <EmptyState title="Noch keine Einschätzung erfasst." />
        ) : (
          <ul className="mb-4 space-y-2">
            {assessments
              .filter((a) => a.playerId === player.id)
              .map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={a.rating >= 0 ? 'good' : 'bad'}>
                        {a.rating > 0 ? `+${a.rating}` : a.rating}
                      </Badge>
                      {a.clubId && (
                        <span className="text-xs text-slate-400">
                          zu {clubById.get(a.clubId)?.name ?? 'unbekannt'}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{formatDate(a.createdAt)}</span>
                    </div>
                    {a.text && <div className="mt-1 text-slate-300">{a.text}</div>}
                  </div>
                  <form action={deleteAssessmentAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="playerId" value={player.id} />
                    <button className={dangerButtonClass} type="submit">
                      Entfernen
                    </button>
                  </form>
                </li>
              ))}
          </ul>
        )}

        <form action={addAssessmentAction} className="grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="playerId" value={player.id} />
          <input type="hidden" name="kind" value="einschaetzung" />
          <select className={inputClass} name="clubId" defaultValue="">
            <option value="">allgemein zum Spieler</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            name="rating"
            type="number"
            min={-100}
            max={100}
            defaultValue={0}
            placeholder="Bewertung"
          />
          <input className={inputClass} name="text" placeholder="Begründung" />
          <button className={buttonClass} type="submit">
            Hinzufügen
          </button>
        </form>
      </Card>

      {player.notes && (
        <Card title="Notizen">
          <p className="whitespace-pre-wrap text-sm text-slate-300">{player.notes}</p>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-medium text-slate-100">{value}</div>
    </div>
  )
}
