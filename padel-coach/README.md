# Padel & Fitness Coach

Eigenständige Web-App (Next.js, installierbar als App auf Handy und Laptop).
Sie nutzt deine **Oura**- und **Garmin**-Daten, fragt jeden Morgen, wie es dir geht,
und stellt daraus dein Training zusammen. Dazu gibt es jeden Tag eine Padel-Taktik mit
Skizze, eine Quizfrage und einen Fakt.

## Funktionen

- **Morgen-Check-in:** Befinden, Knie (0–10), Muskelkater, Einheit von gestern gemacht?,
  Padel gestern (wird aus Garmin vorausgefüllt), heute oder morgen?
- **Training des Tages** aus Oura Readiness, HRV, Ruhepuls, Temperatur, Schlaf,
  Garmin Body Battery, Training Readiness und Aktivitäten:
  - **VO2max:** 4×4, 30/30, 5×3 oder Pyramide auf Rad, Rudergerät, SkiErg oder im Wasser.
    Laufen nur, wenn du es erlaubst und das Knie bei höchstens 2/10 liegt.
  - **Hyrox:** Stationen und „Compromised Intervals“ mit Ergometer statt Laufen,
    mit Knie-Varianten.
  - **Kraft** (kniefreundlich), **Zone 2**, **Recovery**, **Ruhetag** und
    **Padel-Aktivierung** vor dem Spiel.
  - Wochenziele: 2× VO2max, 1× Hyrox (2×, wenn der Wettkampf weniger als 8 Wochen
    entfernt ist), 1× Kraft, 1× Zone 2. Nach einem harten Tag (auch nach einem
    Padel-Match) folgt nie direkt ein zweiter.
- **Padel:** 20 Taktiken mit animierten Court-Skizzen und Quiz. Falsch beantwortete
  kommen wieder dran. Dazu 8 Übungen, auch zur kniefreundlichen Athletik.
- **Quiz** zu Körper und Training sowie **Fakt des Tages**.
- **Sync:** Check-ins und Antworten werden zwischen Handy und Laptop abgeglichen.

Ohne verbundene Daten zeigt die App Beispielwerte.

## Deployment auf Vercel

1. In Vercel ein **neues Projekt** aus diesem Repo anlegen und als
   **Root Directory `padel-coach`** wählen.
2. **Storage → „Upstash for Redis“** verbinden. Dadurch werden
   `KV_REST_API_URL` und `KV_REST_API_TOKEN` automatisch gesetzt.
3. Umgebungsvariable **`COACH_PIN`** setzen. Die PIN gibst du auf jedem Gerät einmal ein.
4. **Oura:** Unter https://cloud.ouraring.com/oauth/applications eine App anlegen und als
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
