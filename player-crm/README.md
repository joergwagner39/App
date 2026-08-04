# Player Relations CRM

Übersicht und Betreuung der Spieler für die Spielerberatung: Stammdaten, Adresse, Ausweis (mit Ablauf-Status), Versicherungsstatus, Zufriedenheits-Scoreboard, letzter Kontakt, offene To-Dos mit Erinnerungen, Familie/weitere Infos und Ausrüster (inkl. Logo).

## Entwicklung

```bash
npm install
npm run dev
```

Läuft standardmäßig auf `http://localhost:3001`.

## Datenhaltung

Aktuell werden alle Daten (inkl. hochgeladener Bilder) im `localStorage` des Browsers gespeichert – keine Anmeldung, kein Server nötig. Eine Anbindung an eine echte Datenbank kann später ergänzt werden, ohne die UI grundlegend zu ändern (Storage-Layer liegt gekapselt in `src/lib/storage.ts`).

Wichtig: Der Speicher ist pro "Ort", an dem die App läuft, getrennt (Vercel-Preview, lokaler Browser, Desktop-App, Handy-PWA haben jeweils eigene Daten).

## Desktop-App bauen (Windows/Mac/Linux)

Das eigentliche Bauen muss auf dem Zielrechner passieren (Electron lädt beim Installieren Binärdateien herunter, die im Sandbox-Build-Environment nicht erreichbar sind).

```bash
npm install
npm run dist
```

Ergebnis liegt danach in `dist/` (z.B. `.exe`-Installer und portable `.exe` unter Windows, `.dmg` unter macOS, `.AppImage` unter Linux).

Für die Entwicklung mit Live-Reload in einem Electron-Fenster:

```bash
npm run electron:dev
```

## Als App aufs Handy installieren (PWA)

Die Web-App (z.B. die Vercel-Preview-URL) ist als Progressive Web App installierbar – kein App Store nötig:

- **Android (Chrome)**: Seite öffnen → Menü (⋮) → "App installieren" bzw. "Zum Startbildschirm hinzufügen"
- **iPhone (Safari)**: Seite öffnen → Teilen-Symbol → "Zum Home-Bildschirm"

Danach startet die App im eigenen Fenster ohne Browser-Leiste und funktioniert auch offline (App-Grundgerüst wird über einen Service Worker gecacht; für neue Daten ist trotzdem Internet nötig, sofern nicht schon lokal gespeichert).
