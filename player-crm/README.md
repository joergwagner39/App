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
