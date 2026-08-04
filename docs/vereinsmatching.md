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

Die Daten liegen in einer SQLite-Datei unter `data/scouting.db` (per
`SCOUTING_DB_PATH` verlegbar — beim Deployment auf ein persistentes Volume legen).

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

Die Vereinsbewertung — Budget, Bedarf, Spielstil, Transferpolitik — liefert ohnehin
kein Anbieter. Genau diese Einträge entscheiden im Matching über die Reihenfolge.

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
npm test        # 19 Tests der Bewertungslogik
```

Abgedeckt sind unter anderem: Positionsaffinität, Wirkung fehlender Daten auf die
Datenbasis, Ablöseabschlag bei auslaufendem Vertrag, Verstärkung mehrerer Gerüchte,
Alterung von Meldungen, Verletzungslast gegen Risikobereitschaft, die Deckelung durch
harte Kriterien sowie Sortierung und Wertebereich der Rangliste.
