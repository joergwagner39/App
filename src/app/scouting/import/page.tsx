import { requireUser } from '@/lib/scouting/guard'
import { activeProvider, PROVIDERS } from '@/lib/scouting/providers'
import { findPlayerByProviderRef } from '@/lib/scouting/repo'
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
import { importPlayerAction } from '../actions'

export const dynamic = 'force-dynamic'

export default async function ImportPage({
  searchParams,
}: {
  searchParams: { q?: string; fehler?: string }
}) {
  await requireUser()

  const { provider, fellBack, requested } = activeProvider()
  const query = searchParams.q?.trim() ?? ''

  let results: Awaited<ReturnType<typeof provider.searchPlayers>> = []
  let searchError: string | null = null
  if (query) {
    try {
      results = await provider.searchPlayers(query)
    } catch (err) {
      searchError = (err as Error).message
    }
  }

  // Vorab nachsehen, welche Treffer schon in der Datenbank stehen — dann muss die
  // Liste unten nicht je Zeile einzeln nachfragen.
  const alreadyImported = await Promise.all(
    results.map(async (r) => ({ ref: r.ref, player: await findPlayerByProviderRef(r.ref) })),
  )
  const importedByRef = new Map<string, string>()
  for (const entry of alreadyImported) {
    if (entry.player) importedByRef.set(entry.ref, entry.player.id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Spieler importieren</h1>
        <p className="mt-1 text-sm text-slate-400">
          Stammdaten und Saisonstatistik vom Anbieter übernehmen. Marktwert, Gehalt und
          Spielerprofil werden anschließend in der App gepflegt.
        </p>
      </div>

      <ErrorBanner message={searchParams.fehler ?? searchError ?? undefined} />

      {fellBack && (
        <InfoBanner>
          {PROVIDERS[requested]
            ? `Der Anbieter „${PROVIDERS[requested].label}“ ist nicht konfiguriert — es werden Demo-Daten angezeigt. ${PROVIDERS[requested].setupHint()}`
            : `Unbekannter Anbieter „${requested}“ — es werden Demo-Daten angezeigt.`}
        </InfoBanner>
      )}

      <Card
        title={`Suche über ${provider.label}`}
        subtitle="Mindestens drei Zeichen eingeben."
      >
        <form className="flex flex-wrap gap-2" action="/scouting/import">
          <input
            className={`${inputClass} max-w-sm flex-1`}
            name="q"
            placeholder="Spielername…"
            defaultValue={query}
          />
          <button className={secondaryButtonClass} type="submit">
            Suchen
          </button>
        </form>
      </Card>

      {query && !searchError && (
        <Card title={`${results.length} Treffer`}>
          {results.length === 0 ? (
            <EmptyState title="Keine Treffer beim Anbieter." />
          ) : (
            <ul className="space-y-2">
              {results.map((r) => {
                const existingId = importedByRef.get(r.ref)
                return (
                  <li
                    key={r.ref}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-100">{r.name}</span>
                        {r.position && <Badge>{r.position}</Badge>}
                        {r.currentlyInjured && <Badge tone="bad">verletzt</Badge>}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {[
                          r.clubName,
                          r.leagueName,
                          r.nationality,
                          r.age ? `${r.age} Jahre` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>

                    {existingId ? (
                      <a
                        href={`/scouting/spieler/${existingId}`}
                        className="text-xs text-sky-400 hover:underline"
                      >
                        bereits importiert — öffnen
                      </a>
                    ) : (
                      <form action={importPlayerAction}>
                        <input type="hidden" name="ref" value={r.ref} />
                        <input type="hidden" name="query" value={query} />
                        <button className={buttonClass} type="submit">
                          Übernehmen
                        </button>
                      </form>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}
