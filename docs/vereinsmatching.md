# Vereinsmatching

Spieler auswählen, passende Vereine mit prozentualer Bewertung erhalten — inklusive
Begründung je Kriterium. Erreichbar unter `/scouting`.

## Ersteinrichtung

```bash
npm install
npm run build && npm start      # oder: npm run dev
```

Beim ersten Aufruf von `/scouting` führt die App zur Ersteinrichtung. Das erste Konto
wird als Administrator angelegt; auf Wunsch wird ein Demo-Datensatz mitgeliefert
(10 erfundene Vereine mit Bedarf und Budget, 6 erfundene Spieler). Weitere Benutzer
legt der Administrator unter *Einstellungen* an. Jeder Benutzer hat eine eigene
Gewichtung und eigene Einschätzungen.

Die Daten liegen lokal in einer SQLite-Datei unter `data/scouting.db`, per
`SCOUTING_DB_PATH` verlegbar.

## Deployment auf Vercel

Die App spricht über libSQL sowohl eine lokale SQLite-Datei als auch eine
gehostete **Turso**-Datenbank an — eine Datenschicht für beides.

Auf Vercel ist Turso Pflicht. Eine Serverless-Funktion bekommt bei jedem Request
ein frisches, leeres Dateisystem; eine lokale SQLite-Datei wäre nach dem
Speichern eines Vereins wieder weg. Fehlt `TURSO_DATABASE_URL` auf Vercel, bricht
die App beim Start mit einer entsprechenden Meldung ab, statt Daten stillschweigend
zu verlieren.

**Schritte:**

1. Turso-Konto anlegen und Datenbank erzeugen:

   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth signup
   turso db create vereinsmatching
   turso db show vereinsmatching --url        # → TURSO_DATABASE_URL
   turso db tokens create vereinsmatching     # → TURSO_AUTH_TOKEN
   ```

2. Auf vercel.com das GitHub-Repository importieren und den Branch wählen.

3. Unter *Settings → Environment Variables* eintragen:

   | Variable | Wert |
   | --- | --- |
   | `TURSO_DATABASE_URL` | aus Schritt 1 |
   | `TURSO_AUTH_TOKEN` | aus Schritt 1 |
   | `SCOUTING_SESSION_SECRET` | eine lange Zufallszeichenkette |
   | `SCOUTING_DATA_PROVIDER` | `demo`, bis ein API-Key vorliegt |

   `SCOUTING_SESSION_SECRET` sollte im Produktivbetrieb gesetzt sein. Ohne den
   Wert erzeugt die App zwar selbst einen und legt ihn in der Datenbank ab, aber
   ein bewusst gesetzter Schlüssel lässt sich rotieren.

4. Deployen. Beim ersten Aufruf von `/scouting` legt die App die Tabellen selbst
   an und führt zur Ersteinrichtung.

Das kostenlose Kontingent von Turso und Vercel reicht für diesen Umfang.

## Woher die Daten kommen

| Datenart | Quelle |
| --- | --- |
| Stammdaten, Saisonstatistik, Verletzungen | Lizenz-API oder manuelle Eingabe |
| Marktwert, Gehalt, Vertragsende | manuelle Eingabe |
| Transferbudget, Gehaltssumme, Positionsbedarf, Spielstil | manuelle Eingabe |
| Gerüchte, eigene Einschätzungen | manuelle Eingabe |

**Transfermarkt und kicker sind bewusst nicht angebunden.** Beide bieten keine
öffentliche API und untersagen automatisiertes Auslesen in ihren Nutzungsbedingungen.
Angebunden werden stattdessen Anbieter mit Lizenzmodell.

Zu Transfermarkt kursieren diverse inoffizielle API-Wrapper und Scraper-Projekte.
Die sind technisch nutzbar, aber rechtlich angreifbar und brechen bei jeder
Layout-Änderung. Dazu kommt ein inhaltlicher Punkt: die Marktwerte dort sind
Community-Schätzungen, keine belegten Ablösen oder Gehälter — als harte Grundlage
für ein Angebot an einen Verein also ohnehin mit Vorsicht zu behandeln.

Die Vereinsbewertung — Budget, Bedarf, Spielstil, Transferpolitik — liefert ohnehin
kein Anbieter. Genau diese Einträge entscheiden im Matching über die Reihenfolge.

### Drei Wege, Daten hereinzubekommen

1. **Tabellen-Import** (`/scouting/import/tabelle`) — Spalten aus Excel, einem
   Portal-Export oder der Zwischenablage einfügen. Funktioniert mit jeder Quelle,
   die sich exportieren lässt, und braucht keinen Vertrag. Details unten.
2. **Lizenz-API** — Sportmonks und API-Football sind als Adapter fertig. Sportmonks
   listet seine Tarife öffentlich (Einstieg ab rund 29 € im Monat für wenige Ligen,
   mittlere Pakete um 99 €). Liefert Stammdaten, Statistik und Verletzungen, keine
   Marktwerte und keine Gehälter.
3. **Scouting-Plattform** — Hudl Wyscout ist der Branchenstandard bei Vereinen,
   Preise nur auf Anfrage, Einzellizenzen beginnen im niedrigen dreistelligen
   Jahresbereich. Keine offene API im Paket, aber Exporte, die sich über den
   Tabellen-Import einlesen lassen.

## Tabellen-Import

Unter *Import* lässt sich eine Tabelle einfügen oder eine CSV-Datei wählen —
wahlweise für Spieler oder für Vereine. Semikolon, Komma und Tabulator werden
erkannt, aus Excel kopierte Zellen funktionieren direkt.

Die Spaltenzuordnung schlägt die App vor: deutsche und englische Überschriften
werden erkannt (`Marktwert` wie `Market Value`, `Verein` wie `Current Club`), jedes
Zielfeld wird höchstens einmal vergeben. Jede Zuordnung lässt sich von Hand
korrigieren, nicht zugeordnete Spalten werden ignoriert. Die Vorschau zeigt vor dem
Import, was wohin geht.

Beim Einlesen werden umgewandelt:

- **Beträge** mit Einheit — `2,5 Mio`, `900 Tsd`, `4500000`
- **Datumsangaben** in deutschem, englischem und ISO-Format — `30.06.2028`,
  `Jun 30, 2028`, `2028-06-30`
- **Positionen** in Lang- und Kurzform, deutsch und englisch — `Innenverteidiger`,
  `IV`, `Centre-Back`
- **Vereinsnamen** werden mit bereits angelegten Vereinen abgeglichen und verknüpft

Zwei Regeln, die Datenverlust verhindern:

- **Leere Zellen überschreiben nichts.** Wer eine Spielerliste ohne Gehaltsspalte
  importiert, verliert die bereits gepflegten Gehälter nicht.
- **Abgleich über den Namen.** Ein zweiter Import derselben Liste aktualisiert die
  vorhandenen Einträge, statt sie zu verdoppeln. Wahlweise lässt sich auch „nur neue
  anlegen“ wählen, dann bleiben vorhandene Einträge unberührt.

Zeilen ohne Namen werden übersprungen und in der Vorschau vorab als solche markiert.

### Anbieter konfigurieren

In `.env` (Vorlage siehe `.env.example`):

```bash
SCOUTING_DATA_PROVIDER=api-football   # demo | api-football | sportmonks
API_FOOTBALL_KEY=…
API_FOOTBALL_SEASON=2025              # optional
API_FOOTBALL_LEAGUE_IDS=78,79,61      # Ligen für den Vereinsimport
```

Ist der gewählte Anbieter nicht konfiguriert, fällt die App auf Demo-Daten zurück und
weist in der Oberfläche darauf hin, statt mit einem Fehler stehen zu bleiben.

Ein weiterer Anbieter kommt über eine Datei in `src/lib/scouting/providers/` dazu, die
das `DataProvider`-Interface erfüllt, plus ein Eintrag in `providers/index.ts`. Der
Rest der App bleibt unverändert.

Beim Abgleich überschreibt ein Anbieter nie manuell gepflegte Felder — Budgets,
Bedarf, Spielstil und Notizen bleiben stehen.

## Wie die Prozentzahl entsteht

Zwölf Kriterien, jedes liefert einen Wert zwischen 0 und 1 plus einen Begründungstext:

| Kriterium | Standardgewicht | Grundlage |
| --- | --- | --- |
| Positionsbedarf | 100 | Bedarf des Vereins, Nebenpositionen anteilig |
| Ablöse vs. Budget | 90 | Transferbudget gegen erwartete Ablöse |
| Gehalt vs. Gehaltsgefüge | 85 | Gehaltssumme und Kaderdurchschnitt |
| Gerüchte & Interesse | 85 | Verhandlungsstand, Glaubwürdigkeit, Aktualität |
| Spielzeit-Perspektive | 80 | Bedarf und Niveauunterschied |
| Sportliches Niveau | 75 | Ligenstufe des Vereins gegen bisheriges Niveau |
| Eigene Einschätzung | 65 | manuelle Bewertungen |
| Spielstil-Fit | 60 | Spielerprofil gegen Vereinsstil |
| Verletzungsbild | 55 | Ausfalltage 24 Monate, Risikobereitschaft des Vereins |
| Wunsch des Spielers | 50 | Wunschländer, Wechselbereitschaft |
| Alter & Kaderstruktur | 45 | Transferpolitik und Altersschnitt |
| Vertragssituation | 40 | Restlaufzeit |

Die Gewichte sind pro Benutzer unter *Einstellungen* änderbar; 0 blendet ein Kriterium
aus.

**Fehlende Daten zählen nicht als 0.** Ein Kriterium ohne Grundlage fällt aus der
Rechnung und senkt stattdessen die ausgewiesene *Datenbasis*. Ein Treffer mit 85 % bei
40 % Datenbasis ist damit als das erkennbar, was er ist: eine Vermutung.

**Harte Kriterien deckeln zusätzlich.** Positionsbedarf, Ablöse und Gehalt zählen nicht
nur im Mittelwert mit, sondern begrenzen das Ergebnis multiplikativ: ein Verein, der die
Position gar nicht sucht oder den Spieler nicht bezahlen kann, ist kein 80-%-Treffer,
auch wenn sonst alles passt. Ein vollständig verfehltes hartes Kriterium deckelt auf
60 %, mehrere verstärken sich. Die Oberfläche zeigt die Rechnung offen an:
*Mittelwert 88 % × Begrenzung 92 % = 81 %*.

Der aktuelle Verein des Spielers wird aus der Rangliste ausgenommen.

## Tests

```bash
npm test        # 34 Tests: Bewertungslogik und Tabellen-Import
```

Bewertung: Positionsaffinität, Wirkung fehlender Daten auf die Datenbasis,
Ablöseabschlag bei auslaufendem Vertrag, Verstärkung mehrerer Gerüchte, Alterung von
Meldungen, Verletzungslast gegen Risikobereitschaft, die Deckelung durch harte
Kriterien sowie Sortierung und Wertebereich der Rangliste.

Import: Trennzeichenerkennung, Anführungszeichen und Zeilenumbrüche im Feld,
Positions- und Datumsformate, automatische Spaltenzuordnung deutsch wie englisch.
