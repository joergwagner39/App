# Padel & Fitness Coach (`/coach`)

Installierbare Web-App (PWA) für Handy und Laptop. Sie nutzt Oura- und Garmin-Daten
und fragt jeden Morgen ab, wie es dir geht, ob du die Einheit von gestern gemacht hast
und ob du Padel gespielt hast oder spielst. Daraus wählt sie das Training des Tages.

## Was die App jeden Tag zeigt

- **Check-in:** Befinden, Knie (0–10), Muskelkater, Einheit gestern erledigt?,
  Padel gestern, heute oder morgen?
- **Training des Tages:** eine Einheit aus VO2max (Rad, Rudern, SkiErg, Schwimmen;
  Laufen nur, wenn erlaubt und das Knie ≤ 2/10 ist), Hyrox (ohne Laufen, wenn das Knie
  es nicht zulässt), Kraft, Zone 2, Recovery, Ruhetag oder Padel-Aktivierung.
  Pulsbereiche kommen aus deiner max. Herzfrequenz.
- **Padel-Taktik des Tages** mit animierter Court-Skizze und Quizfrage. Falsch
  beantwortete Taktiken kommen wieder dran.
- **Quizfrage** zu Körper und Training sowie **Fakt des Tages**.

### Wie die Einheit gewählt wird (`src/lib/coach/engine.ts`)

1. Bereitschaft (0–100): Oura Readiness (sonst Garmin Training Readiness oder
   Body Battery), dazu HRV und Ruhepuls im Vergleich zu deinem Schnitt, Temperatur,
   Schlafdauer, Befinden und Muskelkater.
2. Regeln: Fieber, Knie ≥ 7 oder Score < 40 → Ruhe/Recovery. Padel-Match heute →
   Padel-Tag. Score < 55 → Recovery. Harter Tag gestern (auch ein Padel-Match) →
   Kraft oder Zone 2. Padel morgen → keine schwere Beineinheit.
3. Sonst gelten Wochenziele (7 Tage): 2× VO2max, 1× Hyrox (2×, wenn der Wettkampf
   weniger als 8 Wochen entfernt ist), 1× Kraft, 1× Zone 2.

## Einrichtung

1. **Oura:** wie bisher über das Dashboard (OAuth oder Token).
2. **KV-Speicher:** Im Vercel-Projekt unter *Storage* „Upstash for Redis“ verbinden.
   Dadurch werden `KV_REST_API_URL` und `KV_REST_API_TOKEN` gesetzt.
3. **Sync zwischen Geräten:** In Vercel `COACH_PIN` setzen und dieselbe PIN in der App
   unter *Setup* eingeben. Ohne PIN speichert jedes Gerät nur lokal
   (Export/Import unter *Setup* geht trotzdem).
4. **Garmin:** Der Login direkt von Vercel läuft in Timeouts. Deshalb holt eine
   GitHub Action die Daten dreimal täglich:
   - Lokal einmal ausführen:
     `pip install -r scripts/garmin_sync/requirements.txt`, dann
     `GARMIN_EMAIL=… GARMIN_PASSWORD=… python scripts/garmin_sync/sync.py --login`
     (fragt ggf. nach dem MFA-Code).
   - Die ausgegebene Zeichenkette als Repo-Secret `GARMIN_TOKENS` speichern, dazu
     `KV_REST_API_URL` und `KV_REST_API_TOKEN` als Secrets.
   - Den Workflow „Garmin Sync“ einmal manuell starten.
5. **Auf dem Handy installieren:** `/coach` öffnen, dann auf dem iPhone
   Teilen → „Zum Home-Bildschirm“ oder auf Android im Menü → „App installieren“.
   Auf dem Laptop gibt es in Chrome/Edge das Installieren-Symbol in der Adressleiste.

## Inhalte erweitern

- Taktiken und Übungen: `src/lib/coach/padel.ts`. Koordinaten in Metern auf dem
  10 × 20-m-Court, das Netz liegt bei y = 10, das eigene Team unten.
- Quiz und Fakten: `src/lib/coach/knowledge.ts`
- Einheiten: `src/lib/coach/workouts.ts`
