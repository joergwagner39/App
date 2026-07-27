# „Heute war schön" auf dem iPad einrichten

Die App ist die Startseite des Projekts. Damit sie sich auf dem iPad wie eine richtige
App verhält und die Einträge auf allen Geräten gleich sind, sind drei Schritte
nötig: veröffentlichen, Datenbank verbinden, zum Home-Bildschirm hinzufügen.

## 1. Bei Vercel veröffentlichen

1. Auf [vercel.com](https://vercel.com) mit dem GitHub-Konto anmelden.
2. **Add New… → Project** und dieses Repository auswählen.
3. Branch wählen (`main`, oder der Branch mit dem Tagebuch) und auf **Deploy**.

Next.js wird automatisch erkannt, es sind keine Build-Einstellungen nötig.
Nach ein bis zwei Minuten gibt es eine Adresse wie
`https://dein-projekt.vercel.app` – das ist direkt das Tagebuch.

## 2. Datenbank und Kennwort einrichten

**Datenbank anlegen:** Im Vercel-Projekt auf **Storage → Create Database →
Postgres**, Region Frankfurt wählen, mit dem Projekt verbinden. Vercel legt
dabei die Variable `DATABASE_URL` (bzw. `POSTGRES_URL`) selbst an – nichts
abzutippen. Die Tabelle erzeugt die App beim ersten Zugriff automatisch.

Für ein Abendtagebuch reicht der kostenlose Tarif um Größenordnungen: Ein
Eintrag ist etwa ein halbes Kilobyte, zehn Jahre täglich sind rund zwei
Megabyte.

**Kennwort setzen:** Unter **Settings → Environment Variables** anlegen:

| Name | Wert |
| --- | --- |
| `JOURNAL_TOKEN` | ein langes, zufälliges Kennwort |

Ein brauchbares Kennwort erzeugt z. B. `openssl rand -base64 24` im Terminal.

Danach einmal **Redeploy** auslösen, damit die Variablen greifen.

> Ohne `JOURNAL_TOKEN` antwortet `/api/journal` grundsätzlich nicht – lieber
> kein Abgleich als ein Tagebuch, das jeder lesen kann, der die Adresse kennt.

**In der App eintragen:** Die Seite öffnen → Reiter **Einträge** → unter
„Auf allen Geräten" das Kennwort eingeben → **Verbinden & abgleichen**. Das
Kennwort bleibt im jeweiligen Browser gespeichert; auf jedem neuen Gerät
einmal eingeben.

## 3. Zum Home-Bildschirm hinzufügen

Auf dem iPad in Safari `https://dein-projekt.vercel.app` öffnen →
Teilen-Symbol → **Zum Home-Bildschirm**. Ergebnis: eigenes Icon, eigener
Name, Start im Vollbild ohne Safari-Leiste.

Chrome und Firefox auf iOS können das nicht – dafür muss es Safari sein.

## Wie die Daten laufen

Geschrieben wird immer zuerst in den Browser, danach zum Server. Das heißt:

- **Ohne Netz** funktioniert alles weiter; die App startet dank Service Worker
  auch im Flugmodus. Einträge, die nicht durchkamen, werden gemerkt und beim
  nächsten Start oder sobald das Gerät wieder online ist nachgeschickt.
- **Beim Abgleich** gewinnt pro Tag die zuletzt geänderte Fassung.
- **Der Export** unter „Daten sichern" bleibt unabhängig davon nützlich –
  eine JSON-Datei in der iCloud ist das beste Backup gegen versehentliches
  Löschen.

## Ohne Datenbank betreiben

Fehlt `DATABASE_URL`, speichert der Server die Einträge in `.journal-data/`
im Projektordner. Für lokales Ausprobieren praktisch, für Vercel ungeeignet:
Dort ist das Dateisystem nach jedem Deploy wieder leer.

```bash
JOURNAL_TOKEN=testgeheim npm run dev
```
