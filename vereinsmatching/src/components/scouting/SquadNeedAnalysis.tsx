import Link from 'next/link'
import { SquadAnalysis } from '@/lib/scouting/squadAnalysis'
import { POSITION_LABEL } from '@/lib/scouting/types'
import { Badge, Card, EmptyState, ScoreBar, buttonClass, secondaryButtonClass } from './ui'

/**
 * Zeigt den aus dem Kader errechneten Bedarf neben dem, was im Verein hinterlegt
 * ist — mit Begründung je Position, damit die Zahl nachprüfbar bleibt.
 */
export function SquadNeedAnalysis({
  analysis,
  currentNeeds,
  clubId,
  applyAction,
  syncAction,
  canSync,
}: {
  analysis: SquadAnalysis
  currentNeeds: Partial<Record<string, number>>
  clubId: string
  applyAction: (formData: FormData) => void | Promise<void>
  syncAction: (formData: FormData) => void | Promise<void>
  canSync: boolean
}) {
  const relevant = analysis.needs.filter((n) => n.value > 0)

  return (
    <Card
      title="Bedarf aus dem Kader"
      subtitle={`Errechnet aus ${analysis.squadSize} erfassten Spielern: Kaderbreite, auslaufende Verträge, Altersstruktur und Lastverteilung.`}
      action={
        canSync ? (
          <form action={syncAction}>
            <input type="hidden" name="clubId" value={clubId} />
            <button className="text-xs text-marke-heller hover:underline" type="submit">
              Kader vom Anbieter aktualisieren
            </button>
          </form>
        ) : null
      }
    >
      {analysis.caveats.length > 0 && (
        <ul className="mb-4 space-y-1 rounded-xl border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
          {analysis.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}

      {analysis.squadSize === 0 ? (
        <EmptyState title="Kein Spieler diesem Verein zugeordnet.">
          Spieler lassen sich über den{' '}
          <Link href="/import/tabelle" className="text-marke-heller hover:underline">
            Tabellen-Import
          </Link>{' '}
          oder einzeln anlegen. Beim Spieler muss der Verein gesetzt sein.
        </EmptyState>
      ) : (
        <>
          <div className="space-y-2">
            {relevant.length === 0 ? (
              <p className="text-sm text-rogon-400">
                Der Kader ist auf allen Positionen ausreichend besetzt — rechnerisch kein Bedarf.
              </p>
            ) : (
              relevant.map((need) => {
                const current = currentNeeds[need.position]
                return (
                  <div
                    key={need.position}
                    className="grid grid-cols-[7rem_3rem_1fr] items-start gap-3 border-t border-rogon-800/70 pt-2 text-xs"
                  >
                    <div>
                      <span className="text-rogon-200">{need.position}</span>
                      <span className="ml-1 text-rogon-600">
                        {POSITION_LABEL[need.position]}
                      </span>
                      <div className="mt-1 text-rogon-600">
                        {need.depth} von {need.target}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-rogon-200">{need.value}</div>
                      {current != null && current !== need.value && (
                        <div className="mt-0.5 text-rogon-600">statt {current}</div>
                      )}
                    </div>
                    <div>
                      <ScoreBar percent={need.value} />
                      <div className="mt-1.5 text-rogon-400">
                        {need.reasons.length ? need.reasons.join('; ') : 'leichte Unterdeckung'}
                      </div>
                      {need.covering.length > 0 && (
                        <div className="mt-1 text-rogon-600">
                          {need.covering
                            .slice(0, 4)
                            .map((c) => `${c.player.name}${c.share < 1 ? ` (${Math.round(c.share * 100)}%)` : ''}`)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {relevant.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <form action={applyAction}>
                <input type="hidden" name="clubId" value={clubId} />
                <button className={buttonClass} type="submit">
                  Als Bedarf übernehmen
                </button>
              </form>
              <span className="text-xs text-rogon-500">
                Überschreibt die oben eingetragenen Werte. Danach lässt sich jede Position von Hand
                nachjustieren.
              </span>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
