# Padel & Hyrox Coach

Eigenständige Web-App (Next.js, installierbar als App auf Handy und Laptop).
Sie nutzt deine **Oura**- und **Garmin**-Daten, fragt jeden Morgen, wie es dir geht,
und stellt daraus dein Training zusammen. Dazu gibt es jeden Tag eine Padel-Taktik mit
Skizze, eine Quizfrage und einen Fakt.

## Funktionen

- **Werte (Scoreboard):** Oura und Garmin zusammengefasst.
  - **VO2max als Hauptwert:** aktueller Wert, Veränderung über 4 und 12 Wochen,
    Fitnessklasse nach Alter und Geschlecht (Richtwerte Cooper Institute),
    Abstand zum VO2max-Ziel mit Prognose und Verlauf mit Ziellinie.
  - Kacheln für Readiness, HRV, Ruhepuls, Schlaf, Body Battery und Stress:
    Ø 7 Tage im Vergleich zu den 30 Tagen davor, Trend als Pfeil mit Text und Mini-Verlauf.
    Antippen öffnet den 30-Tage-Chart.
  - Trainingszeit pro Woche (8 Wochen), getrennt nach intensiv und locker.
- **Morgen-Check-in:** Befinden, Knie (0–10), Muskelkater, Einheit von gestern gemacht?,
  Padel gestern (wird aus Garmin vorausgefüllt), heute oder morgen?
- **Ziele:** Hyrox-Wettkampf (Datum, Division, Zielzeit) mit Countdown sowie Padel-Einheiten
  pro Woche und ein eigenes Padel-Ziel. Mit Wettkampfdatum plant der Coach in Phasen:
  Grundlage → Aufbau → spezifischer Aufbau (mehr Hyrox) → wettkampfnah → Tapering.
- **Training des Tages** aus Oura Readiness, HRV, Ruhepuls, Temperatur, Schlaf,
  Garmin Body Battery, Training Readiness und Aktivitäten:
  - **Nach einem Padel-Match** entscheiden die Daten: bei guter Bereitschaft
    **Oberkörper + Rad Zone 2** (Beine locker durchbewegen), sonst oder bei schweren
    Beinen **nur Oberkörper & Rumpf**, bei schlechten Werten Recovery.
  - **VO2max:** 4×4, 30/30, 3-Minuten-Intervalle oder Pyramide auf Rad, Rudergerät,
    SkiErg oder im Wasser. Laufen nur, wenn du es erlaubst und das Knie bei höchstens
    2/10 liegt.
  - **Hyrox:** Stationen, EMOM, „Compromised Intervals“ und Simulationen mit Ergometer
    statt Laufen, mit Knie-Varianten.
  - **Kraft** (kniefreundlich), **Oberkörper**, **Zone 2**, **Recovery**, **Ruhetag** und
    **Padel-Aktivierung** vor dem Spiel.
  - Wochenziele je nach Phase. Zwei oder mehr Padel-Matches pro Woche ersetzen einen
    VO2max-Termin. Nach einem harten Tag folgt nie direkt ein zweiter.
- **Vor dem Workout: Weniger / Normal / Mehr**
  - *Weniger – wenig Zeit:* kürzere Version bei gleicher Intensität
  - *Weniger – wenig Kraft/Gefühl:* eine Stufe leichter (z. B. VO2max → Zone 2,
    Kraft → Oberkörper, Oberkörper + Rad → nur Oberkörper)
  - *Mehr:* mehr Intervalle, Runden oder Sätze plus ein Extra-Block
- **Padel:** 20 Taktiken mit animierten Court-Skizzen und Quiz. Falsch beantwortete
  kommen wieder dran. Dazu 8 Übungen, auch zur kniefreundlichen Athletik.
- **Neuro & Ballgefühl (täglich ~12 Min.):** Augen (Sakkaden, Nah-Fern, Blickstabilisation),
  Balance, Koordination, Ballgefühl mit Schläger (tippen Vorhand/Rückhand, schwache Hand,
  Rahmen, abstoppen, prellen), Tap-Out übers Handgelenk, Reaktion. Modus Wohnung oder Court,
  Rekorde pro Übung, Reaktionstest (ms) mit Verlauf, Reaktionspfeile für den Split-Step, Serie.
- **Quiz** zu Körper und Training sowie **Fakt des Tages**.
- **Sync:** Check-ins und Antworten werden zwischen Handy und Laptop abgeglichen.

Ohne verbundene Daten zeigt die App Beispielwerte.

## Deployment auf Vercel

1. In Vercel ein **neues Projekt** aus diesem Repo anlegen und als
   **Root Directory `padel-coach`** wählen.
2. **Storage → „Upstash for Redis“** verbinden. Dadurch werden
   `KV_REST_API_URL` und `KV_REST_API_TOKEN` automatisch gesetzt.
3. **PIN:** Beim ersten Öffnen der App legst du die PIN direkt in der App fest; sie wird als
   Hash im KV gespeichert. Alternativ kann sie als Umgebungsvariable `COACH_PIN` gesetzt werden.
4. **Oura:** Am einfachsten unter *Setup* in der App deinen Oura Personal Access Token
   einfügen (wird geprüft und im KV gespeichert) – oder als `OURA_ACCESS_TOKEN` in Vercel.
   Alternativ per OAuth: Unter https://cloud.ouraring.com/oauth/applications eine App anlegen und als
   Redirect-URI `https://<deine-domain>/api/oura/callback` eintragen. Dann
   `OURA_CLIENT_ID` und `OURA_CLIENT_SECRET` in Vercel setzen, neu deployen und in der
   App unter **Setup → „Mit Oura verbinden“** klicken.
5. **Garmin** (per GitHub Action, weil der Login direkt von Vercel nicht zuverlässig
   klappt):
   ```bash
   cd padel-coach
   pip install -r scripts/garmin_sync/requirements.txt
   GARMIN_EMAIL=… GARMIN_PASSWORD=… python scripts/garmin_sync/sync.py --login
   ```
   Die ausgegebene Zeichenkette als GitHub-Secret **`GARMIN_TOKENS`** speichern, dazu
   **`KV_REST_API_URL`** und **`KV_REST_API_TOKEN`** (Werte aus Vercel). Danach den
   Workflow **„Padel Coach – Garmin Sync“** einmal manuell starten. Er läuft dann
   dreimal täglich.
6. **Als App installieren:**
   - iPhone: Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“
   - Android: Menü → „App installieren“
   - Laptop: Installieren-Symbol in der Adressleiste von Chrome oder Edge

## Lokal starten

```bash
cd padel-coach
npm install
npm run dev   # http://localhost:3000
```

Ohne Umgebungsvariablen läuft die App mit Beispieldaten und speichert nur lokal im Browser.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/lib/coach/engine.ts` | Bereitschafts-Score, Auswahl der Einheit, Inhalte des Tages, Sync-Merge |
| `src/lib/coach/workouts.ts` | Einheiten-Bibliothek |
| `src/lib/coach/padel.ts` | Taktiken (mit Skizzen-Koordinaten in Metern, Netz bei y = 10) und Übungen |
| `src/lib/coach/knowledge.ts` | Quizfragen und Fakten |
| `src/lib/oura.ts` | Oura OAuth und API v2 (Token im KV, automatischer Refresh) |
| `src/app/api/data` | Wearable-Daten für die App (PIN-geschützt) |
| `src/app/api/state` | Check-ins und Einstellungen geräteübergreifend (PIN-geschützt) |
| `scripts/garmin_sync` | Garmin → KV (GitHub Action) |
