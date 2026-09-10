# Tages-Briefing

## Ablauf

1. **Inhalt**: Für jeden Tag liegt eine Datei `data/briefings/YYYY-MM-DD.json`
   im Repo (Struktur siehe `src/lib/briefing.ts`, Beispiel:
   `data/briefings/2026-09-10.json`). Die legt entweder die tägliche
   Claude-Routine an oder du selbst über `/briefing` → „Speichern".
2. **Rendern**: `.github/workflows/market-briefing.yml` läuft werktags um
   05:45 UTC, baut die App und schiesst über `render.mjs` ein PNG in
   `data/briefings/png/YYYY-MM-DD.png` (1080 × 1920, Story-Format).
3. **Versand**: `queue_mail.py` legt eine Mail mit dem PNG als Anhang in
   `mail_outbox/`, `scripts/mail_outbox/send_outbox.py` verschickt sie.
   Empfänger und SMTP-Zugang kommen aus denselben Secrets wie beim
   Food-Deals-Job (`FOOD_DEALS_SMTP_USER`, `FOOD_DEALS_SMTP_PASS`,
   `FOOD_DEALS_MAIL_TO`).
4. Das PNG wird zurück ins Repo committet und liegt zusätzlich als
   Workflow-Artefakt bereit.

Fehlt für den Tag eine JSON-Datei, bricht der Workflow nicht ab – er
protokolliert nur, dass nichts zu rendern war.

## Lokal

```bash
npm run build
npm run briefing:render                     # neuestes Briefing
npm run briefing:render -- --date 2026-09-10 --out out/karte.png
```

`render.mjs` startet dafür kurz einen `next start` auf Port 3210
(`--port` überschreibt das) und beendet ihn wieder. Ein anderer
Chromium lässt sich per `CHROMIUM_PATH` vorgeben.

Zum Bearbeiten: `npm run dev`, dann <http://localhost:3000/briefing>.
