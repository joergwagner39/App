# ROGON Vereinsmatching

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

Fehlt die Datenbankkonfiguration, zeigt `/scouting` statt einer Fehlerseite eine
Anleitung mit genau diesen Schritten. Umgebungsvariablen greifen erst beim nächsten
Deployment — nach dem Eintragen ist also ein *Redeploy* nötig.

### Preview oder Production

Vercel baut aus jedem Branch eine **Preview**-Bereitstellung und nur aus dem
Produktionsbranch eine **Production**-Bereitstellung. Solange die Arbeit auf einem
Feature-Branch liegt, ist „Preview“ also der erwartete Zustand und kein Fehler — die
Preview-Adresse ist voll funktionsfähig und teilbar.

Für die Hauptadresse gibt es zwei Wege: den Branch in den Produktionsbranch
übernehmen, oder unter *Settings → Git* den Produktionsbranch umstellen.

Wichtig in beiden Fällen: Die Anwendung liegt unter **`/scouting`**, nicht auf der
Startseite — dort läuft das Oura-Dashboard aus demselben Repository.

Das kostenlose Kontingent von Turso und Vercel reicht für diesen Umfang.

## Erscheinungsbild

Die Oberfläche folgt der ROGON-CI:

- **Hausfarbe** `#0A4165` (aus `--color-primary` auf rogon.tv). Davon abgeleitet die
  Skala `rogon-50` bis `rogon-950` für Flächen, Ränder und Text, sowie `marke-hell`
  `#1A6FA8` und `marke-heller` `#3E9BD6` für Schaltflächen und Verweise — die
  Hausfarbe selbst ist auf dunklem Grund zu dunkel für interaktive Elemente.
- **Hausschrift Antonio**, geladen über `next/font`. Sie läuft schmal und ist für
  Fließtext und Tabellen zu eng; gesetzt wird sie über die Klasse `font-marke`
  gezielt für Überschriften, Navigation und Prozentwerte.
- **Logo** unter `public/marke/rogon-logo-weiss.png` (weiß auf transparent, passt
  zur dunklen Grundfläche).

Das Oura-Dashboard im selben Repository ist davon nicht berührt — die Umfärbung
betrifft ausschließlich `src/app/scouting` und `src/components/scouting`.

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

### Geprüfte freie Quellen

Zwei naheliegende kostenlose Quellen wurden getestet und verworfen:

- **OpenLigaDB** (`api.openligadb.de`, ohne Schlüssel nutzbar) liefert Vereine,
  Tabellen, Spielpläne und Torschützen für die deutschen Ligen — aber **keine
  Kader**. Der Endpunktkatalog kennt keinen Spieler- oder Kaderabruf. Für
  Vereinsstammdaten brauchbar, für Spielerdaten nicht.
- **Wikidata** (SPARQL) liefert technisch Spieler mit Position, Geburtsdatum und
  Verein, aber in unbrauchbarer Qualität: aktuelle und längst zurückgetretene
  Spieler stehen gleichberechtigt nebeneinander (im Test erschien ein Jahrgang
  1920 im aktuellen Kader), Dubletten sind häufig, Positionen sehr grob, Verträge
  fehlen ganz.

**Praktikabel für kicker-Niveau ist die kostenlose Stufe von API-Football:**
100 Abfragen pro Tag bei vollem Endpunktzugriff. Ein täglicher Kaderabgleich der
1. und 2. Bundesliga braucht rund 36 Abfragen plus Statistik — das passt. Der
Adapter dafür ist eingebaut, es fehlt nur der Schlüssel in `API_FOOTBALL_KEY`.

### Drei Wege, Daten hereinzubekommen

1. **Tabellen-Import** (`/scouting/import/tabelle`) — Spalten aus Excel, einem
   Portal-Export oder der Zwischenablage einfügen. Funktioniert mit jeder Quelle,
   die sich exportieren lässt, und braucht keinen Vertrag. Details unten.
2. **Lizenz-API** — football-data.org, Sportmonks und API-Football sind als Adapter fertig. Sportmonks
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

### football-data.org

```bash
SCOUTING_DATA_PROVIDER=football-data
FOOTBALL_DATA_TOKEN=…
FOOTBALL_DATA_COMPETITIONS=BL1     # Bundesliga
```

Liefert Vereine und Kader mit Position, Geburtsdatum und Nationalität. Nicht
enthalten: Marktwerte, Gehälter, Einsatzminuten und Verletzungen.

Zwei Eigenheiten bestimmen den Umgang:

- Der kostenlose Zugang deckt nur ausgewählte Wettbewerbe ab. Die Bundesliga läuft
  unter `BL1`; die 2. Bundesliga ist dort in aller Regel **nicht** enthalten und
  antwortet mit HTTP 403.
- Das Minutenlimit ist knapp. Der Adapter wartet bei HTTP 429 und versucht es
  erneut, statt den Abgleich abzubrechen.

Eine Spielersuche über alle Wettbewerbe kennt die Schnittstelle nicht; der Adapter
durchsucht deshalb die Kader der konfigurierten Wettbewerbe, was pro Verein eine
Abfrage kostet. Für große Ligen ist der Kaderabgleich der günstigere Weg.

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

## Kaderabgleich

Vereine, die über *Vereine abgleichen* vom Anbieter übernommen wurden, tragen eine
Anbieterreferenz. Für sie lässt sich der Kader nachziehen:

- einzeln über *Kader vom Anbieter aktualisieren* auf der Vereinsseite,
- für alle auf einmal über *Kader aller Vereine abgleichen* in den Einstellungen.

Neue Spieler kommen dazu, vorhandene werden in ihren Anbieterfeldern aufgefrischt.
Manuell gepflegte Angaben — Marktwert, Gehalt, Spielerprofil, Notizen — bleiben
unangetastet. Vereine, die von Hand oder per Tabelle angelegt wurden, haben keine
Anbieterreferenz; ihr Kader wird über den Tabellen-Import gepflegt.

## Bedarf aus dem Kader berechnen

Welche Art von Spieler ein Verein sucht, lässt sich teilweise aus seinem Kader
herleiten, statt es nur zu raten. Auf jeder Vereinsseite steht die Analyse über dem
Formular und schlägt je Position einen Bedarf zwischen 0 und 100 vor.

Vier Signale, getrennt ausgewiesen:

| Signal | Gewicht | Frage |
| --- | --- | --- |
| Kaderbreite | 45 | Stehen genug Spieler auf der Position? |
| Auslaufende Verträge | 25 | Wie viele laufen binnen zwölf Monaten aus? |
| Altersstruktur | 18 | Wie viele sind 31 oder älter? |
| Lastverteilung | 12 | Hängt die Position an einem einzigen Spieler? |

Die Sollbreite richtet sich nach der hinterlegten Formation: eine Dreierkette
verlangt fünf Innenverteidiger statt vier, ein System mit zwei Spitzen mehr Stürmer
und weniger Flügelspieler.

**Aushilfe zählt nicht als Kadertiefe.** Ein Außenstürmer kann im Notfall im Zentrum
spielen, ersetzt aber keinen Mittelstürmer. Verwandte Positionen werden deshalb nur
bis zu einem halben Spieler angerechnet, und eine Position ganz ohne gelernten
Spieler gilt immer als Lücke. Ohne diese Grenze deckt ein Kader voller Flügelspieler
den Sturm rechnerisch ab und der Bedarf verschwindet, obwohl kein Mittelstürmer da
ist.

Jeder Wert wird mit Begründung und den deckenden Spielern angezeigt, etwa:

> **TW Torwart — 56** · 1 von 2
> Kaderbreite 1.0 von 2 benötigten Spielern; 1 Spieler mit Vertrag unter 12 Monaten
> Restlaufzeit; 1 Spieler ab 31 Jahren; 100% der Einsatzzeit auf einem Spieler

Das Ergebnis ist ein **Vorschlag, keine Festlegung** — der Verein kennt seine Planung
besser als jede Kaderstatistik. Er steht neben dem manuell gepflegten Wert („23 statt
70") und wird erst per *Als Bedarf übernehmen* übernommen; danach lässt sich jede
Position von Hand nachjustieren.

Fehlt die Grundlage, sagt die Analyse das: zu kleiner Kader, keine Vertragsenden,
keine Einsatzminuten.

## Wie die Prozentzahl entsteht

Zwölf Kriterien, jedes liefert einen Wert zwischen 0 und 1 plus einen Begründungstext:

| Kriterium | Standardgewicht | Grundlage |
| --- | --- | --- |
| Positionsbedarf | 100 | Bedarf des Vereins, Nebenpositionen anteilig |
| Ablöse vs. Budget | 90 | Transferbudget gegen erwartete Ablöse |
| Gehalt vs. Gehaltsgefüge | 85 | Gehaltssumme und Kaderdurchschnitt |
| Gerüchte & Interesse | 85 | Verhandlungsstand, Glaubwürdigkeit, Aktualität |
| Draht zum Verein | 80 | Rolle des Ansprechpartners, Güte der Beziehung, Aktualität |
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

**Der Draht zum Verein wirkt zusätzlich als eigener Faktor**, maximal ±20%.
Positionsbedarf und Budget entscheiden, ob ein Wechsel überhaupt möglich ist; die
Verbindung zum Sportdirektor entscheidet, ob man den Termin bekommt. Das ist eine
andere Art von Einfluss und ginge im Mittelwert aus vierzehn Kriterien unter — als
eigener Faktor bewegt er die Rangfolge spürbar. Ein fehlendes Budget kann er nicht
überstimmen, weil die Begrenzung zuerst greift. Das Gewicht steuert ihn mit: bei 0
bleibt der Faktor neutral.

Der aktuelle Verein des Spielers wird aus der Rangliste ausgenommen.

## Ansprechpartner pflegen

Auf jeder Vereinsseite lassen sich Ansprechpartner erfassen: Name, Rolle, Güte der
Verbindung (0–100), Datum des letzten Austauschs, wer in der Beratung die Verbindung
hält, und eine Notiz.

Die Rolle bestimmt das Gewicht — ein guter Draht zum Sportdirektor öffnet Türen, die
ein Kontakt zum Scout nicht öffnet:

| Rolle | Gewicht |
| --- | --- |
| Sportdirektor | 1,0 |
| Geschäftsführer Sport | 0,9 |
| Kaderplaner | 0,85 |
| Cheftrainer | 0,75 |
| Scout | 0,45 |
| Sonstige | 0,35 |

Beziehungen verfallen langsamer als Gerüchte, aber sie verfallen: ohne Austausch
sinkt das Gewicht über rund anderthalb Jahre spürbar ab. Mehrere gute Kontakte bei
einem Verein verstärken sich.

Solange bei keinem Verein ein Kontakt steht, bleibt das Kriterium unbewertet und
senkt nur die ausgewiesene Datenbasis. Sind Kontakte gepflegt, aber keiner bei diesem
Verein, gibt es einen Abschlag — die Information „wir haben dort niemanden“ ist dann
belastbar.

## Tests

```bash
npm test        # 59 Tests: Bewertung, Tabellen-Import und Bedarfsanalyse
```

Bewertung: Positionsaffinität, Wirkung fehlender Daten auf die Datenbasis,
Ablöseabschlag bei auslaufendem Vertrag, Verstärkung mehrerer Gerüchte, Alterung von
Meldungen, Verletzungslast gegen Risikobereitschaft, die Deckelung durch harte
Kriterien sowie Sortierung und Wertebereich der Rangliste.

Import: Trennzeichenerkennung, Anführungszeichen und Zeilenumbrüche im Feld,
Positions- und Datumsformate, automatische Spaltenzuordnung deutsch wie englisch.

Bedarfsanalyse: Wirkung jedes der vier Signale einzeln, Formationsabhängigkeit,
Anrechnung von Nebenpositionen, die Grenze für Aushilfe sowie Sortierung,
Wertebereich und die Hinweise bei dünner Datenlage.
