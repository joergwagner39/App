import Link from 'next/link'
import { requireUser } from '@/lib/scouting/guard'
import { TableImportForm } from '@/components/scouting/TableImportForm'
import { Card, ErrorBanner, InfoBanner, secondaryButtonClass } from '@/components/scouting/ui'
import { importTableAction } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function TableImportPage({
  searchParams,
}: {
  searchParams: {
    fehler?: string
    angelegt?: string
    aktualisiert?: string
    uebersprungen?: string
    zeilenfehler?: string
  }
}) {
  await requireUser()

  const hasResult = searchParams.angelegt != null || searchParams.aktualisiert != null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-marke text-3xl uppercase tracking-wide text-rogon-100">Tabelle importieren</h1>
          <p className="mt-1 text-sm text-rogon-400">
            Spalten aus Excel, einem Portal-Export oder der Zwischenablage einfügen. Die Zuordnung
            schlägt die App vor, korrigieren lässt sie sich von Hand.
          </p>
        </div>
        <Link href="/scouting/import" className={secondaryButtonClass}>
          Stattdessen Anbieter durchsuchen
        </Link>
      </div>

      <ErrorBanner message={searchParams.fehler} />

      {hasResult && (
        <InfoBanner>
          {searchParams.angelegt ?? 0} neu angelegt, {searchParams.aktualisiert ?? 0} aktualisiert
          {Number(searchParams.uebersprungen ?? 0) > 0
            ? `, ${searchParams.uebersprungen} übersprungen`
            : ''}
          .
          {searchParams.zeilenfehler && (
            <div className="mt-2 text-amber-300">
              Nicht übernommen: {searchParams.zeilenfehler}
            </div>
          )}
        </InfoBanner>
      )}

      <TableImportForm action={importTableAction} />

      <Card title="Hinweis zu Portaldaten">
        <div className="space-y-2 text-sm text-rogon-400">
          <p>
            Transfermarkt und kicker bieten keine öffentliche Schnittstelle und untersagen
            automatisiertes Auslesen. Was hier eingefügt wird, sollte deshalb aus einer Quelle
            stammen, die eine Weiterverwendung erlaubt: ein Export aus einem lizenzierten
            Scouting-Werkzeug, Daten eines Anbieters mit Vertrag oder eure eigenen Listen.
          </p>
          <p>
            Budgets, Positionsbedarf und Spielstil liefert ohnehin kein Portal — genau diese
            Angaben entscheiden im Matching über die Reihenfolge.
          </p>
        </div>
      </Card>
    </div>
  )
}
