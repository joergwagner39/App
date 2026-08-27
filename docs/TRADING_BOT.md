# Trading-Bot

Ein regelbasierter Handels-Bot auf einem **Alpaca Paper-Trading-Depot** (Demo-Geld).
Jede Entscheidung wird im Klartext begründet — optional formuliert Claude daraus einen
ausführlichen Kommentar im Podcast-Ton.

Erreichbar unter `/trading`, oder über das Chart-Symbol oben rechts im Gesundheits-Dashboard.

> Lernprojekt, keine Anlageberatung. Verwende ausschließlich Paper-Trading-Keys.

## Einrichtung

1. **Demo-Depot anlegen**: auf [alpaca.markets](https://alpaca.markets/) registrieren,
   oben links auf *Paper Trading* schalten (100.000 $ Spielgeld), unter *API Keys* ein
   Schlüsselpaar erzeugen.
2. **Schlüssel hinterlegen**: entweder in `.env.local` (siehe `.env.example`) oder direkt
   im Browser unter `/trading` → Tab *Setup*. Browser-Schlüssel landen nur im
   `localStorage` und werden je Anfrage als Header an den eigenen Server geschickt.
3. **Optional Claude-Kommentar**: `ANTHROPIC_API_KEY` setzen oder im Setup eintragen.
   Ohne Key erklärt der Bot seine Trades weiterhin aus dem Regelwerk heraus.

Ohne Alpaca-Keys läuft alles im **Simulationsmodus**: erzeugte, aber realistische
Kursverläufe und ein fiktives Depot. Die Oberfläche und die Strategie verhalten sich
identisch — nur es wird nichts geordert.

## Wie der Bot entscheidet

`src/lib/trading/strategy.ts` wertet je Wert fünf Regelgruppen aus. Jede Regel liefert
eine Begründung und ein Gewicht (positiv = bullish, negativ = bearish):

| Regelgruppe | Signal | Gewicht |
|---|---|---|
| SMA20/SMA50 | goldenes Kreuz / Todeskreuz | ±30 |
| SMA20/SMA50 | Trendrichtung ohne Kreuzung | ±12 |
| 200-Tage-Linie | Kurs darüber / darunter | ±10 |
| RSI(14) | < 30 überverkauft / > 70 überkauft | ±22 |
| MACD | Kreuzung der Signallinie | ±25 |
| Bollinger-Bänder | Kurs außerhalb der Bänder | ±15 |
| Momentum 5 Tage | Übertreibung nach unten / oben | ±10 |

Die Summe ergibt den **Score** (−100 … +100):

- Score ≥ **+25** → Kaufsignal
- Score ≤ **−25** → Verkaufssignal
- dazwischen → abwarten

## Risikosteuerung

Vor jeder Order läuft eine feste Prüfkette (`src/lib/trading/bot.ts`):

- **Vertrauen** muss beim Einstieg mindestens 50 % betragen (Abstand des Scores zur Schwelle).
  Ausstiege laufen ohne diese Hürde — eine Position zu schließen soll leichter sein als eine zu eröffnen.
- **Positionsgröße**: höchstens 1 % des Depotwerts Risiko pro Trade. Aus Kurs und
  Stop-Loss-Abstand ergibt sich daraus die Stückzahl.
- **Positionsdeckel**: keine Position größer als 20 % des Depots.
- **Maximal 5** offene Positionen gleichzeitig.
- **Kein Nachkaufen** in bestehende Positionen, **keine Leerverkäufe**.
- Käufe gehen als **Bracket-Order** raus: Stop-Loss bei 2 × ATR unter dem Einstieg,
  Take-Profit bei 3 × ATR darüber (Chance/Risiko 1,5 : 1).

Standardwerte stehen in `DEFAULT_RISK` in `src/lib/trading/bot.ts`.

## Trockenlauf

Der Schalter *Trockenlauf* im Setup ist standardmäßig **an**: Signale, Stückzahlen und
Kommentare werden berechnet und protokolliert, aber keine Order abgeschickt. Erst wenn du
ihn ausschaltest, gehen Orders an das Paper-Depot.

## Handelstagebuch

Jeder Durchlauf schreibt seine Entscheidungen nach `data/trading-journal.json`
(nicht im Git, max. 500 Einträge) und zeigt sie im Tab *Tagebuch*: Aktion, Stückzahl,
Score, alle ausgelösten Regeln, der Kommentar und — falls die Order nicht ausgeführt
wurde — der Grund dafür.

## Struktur

```
src/lib/trading/
  indicators.ts       SMA, EMA, RSI, MACD, ATR, Bollinger
  strategy.ts         Regelwerk, Score, Positionsgröße
  alpaca.ts           Paper-Trading-API (Depot, Kurse, Orders)
  demoMarket.ts       simulierte Kurse ohne Keys
  commentary.ts       Claude-Kommentar + Regel-Fallback
  journal.ts          Handelstagebuch als JSON
  bot.ts              ein Durchlauf: Daten → Signale → Orders → Tagebuch
src/app/api/trading/          GET  Depot, Signale, Tagebuch
src/app/api/trading/run/      POST einen Durchlauf ausführen
src/app/api/verify-alpaca/    POST Zugangsdaten prüfen
src/app/trading/page.tsx      Oberfläche
```

## Automatisch laufen lassen

Ein Durchlauf ist ein einzelner POST — z. B. per Cron einmal täglich nach Börsenschluss:

```bash
curl -X POST http://localhost:3000/api/trading/run \
  -H "x-dry-run: false"
```

Die Schlüssel kommen dann aus den Umgebungsvariablen des Servers.
