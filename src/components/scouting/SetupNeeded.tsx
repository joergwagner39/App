import { Card } from './ui'

/**
 * Wird anstelle der Anwendung angezeigt, wenn die Datenbank nicht konfiguriert
 * ist. Ohne diese Seite liefe der Aufruf in eine Fehlerseite ohne Hinweis — die
 * eigentliche Meldung bleibt in der Produktion aus Sicherheitsgründen verborgen.
 */
export function SetupNeeded({ problem }: { problem: string }) {
  return (
    <div className="mx-auto mt-12 max-w-2xl space-y-6">
      <div>
        <h1 className="font-marke text-3xl uppercase tracking-wide text-rogon-100">
          Datenbank fehlt noch
        </h1>
        <p className="mt-2 text-sm text-rogon-400">{problem}</p>
      </div>

      <Card title="Warum das nötig ist">
        <p className="text-sm text-rogon-300">
          Auf Vercel läuft jede Anfrage in einer eigenen, kurzlebigen Umgebung. Eine Datei auf der
          Festplatte wäre nach dem nächsten Klick wieder verschwunden — ein angelegter Verein ginge
          verloren. Deshalb wird dort eine gehostete Datenbank benötigt. Die Anwendung bricht lieber
          hier ab, als Eingaben stillschweigend zu verlieren.
        </p>
      </Card>

      <Card title="In drei Schritten erledigt">
        <ol className="space-y-4 text-sm text-rogon-300">
          <li>
            <span className="font-marke text-rogon-100">1. Datenbank anlegen</span>
            <p className="mt-1 text-rogon-400">
              Kostenloses Konto bei Turso, dann eine Datenbank erzeugen. Notiert werden die
              Verbindungsadresse und ein Zugriffstoken.
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-rogon-800 bg-rogon-950 p-3 text-xs text-rogon-300">
{`turso db create vereinsmatching
turso db show vereinsmatching --url
turso db tokens create vereinsmatching`}
            </pre>
          </li>
          <li>
            <span className="font-marke text-rogon-100">2. Bei Vercel hinterlegen</span>
            <p className="mt-1 text-rogon-400">
              Im Projekt unter <em>Settings → Environment Variables</em> eintragen:
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-rogon-300">
              <li>TURSO_DATABASE_URL</li>
              <li>TURSO_AUTH_TOKEN</li>
              <li>SCOUTING_SESSION_SECRET</li>
            </ul>
          </li>
          <li>
            <span className="font-marke text-rogon-100">3. Neu bereitstellen</span>
            <p className="mt-1 text-rogon-400">
              Umgebungsvariablen greifen erst beim nächsten Deployment. In der Deployment-Liste
              genügt <em>Redeploy</em>. Danach legt die Anwendung ihre Tabellen selbst an und führt
              zur Ersteinrichtung.
            </p>
          </li>
        </ol>
      </Card>

      <p className="text-xs text-rogon-500">
        Auf dem eigenen Rechner ist nichts davon nötig — dort wird ohne Konfiguration eine Datei
        unter <code className="text-rogon-400">data/scouting.db</code> angelegt.
      </p>
    </div>
  )
}
