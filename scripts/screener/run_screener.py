#!/usr/bin/env python3
"""Pullback-Screener für Qualitäts- und Wachstumsaktien.

Lädt Kursdaten von Yahoo Finance (Chart-API, ohne API-Key) für das Universum
in data/screener/universe.json und schreibt data/screener/latest.json.

Signale je Aktie:
  - Rücksetzer an SMA 50 (Tag), SMA 200 (Tag) und SMA 200 (Woche)
  - Rücksetzer auf das 61,8 %-Fibonacci-Retracement der letzten Aufwärtswelle
  - Überverkauft: RSI(14) Tag bzw. Woche unter 30

Nur Standardbibliothek, damit es überall ohne Installation läuft:
    python scripts/screener/run_screener.py
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UNIVERSE = ROOT / "data" / "screener" / "universe.json"
OUT = ROOT / "data" / "screener" / "latest.json"

# Abstand zum Niveau (in %), ab dem ein Kurs als "am Niveau" gilt.
# Positiv = Kurs liegt darüber, negativ = darunter.
TOUCH_BAND = {
    "sma50d": (-3.0, 3.0),
    "sma200d": (-4.0, 4.0),
    "sma200w": (-6.0, 6.0),
    "fib618": (-3.0, 3.0),
}
RSI_OVERSOLD = 30.0
FIB_LOOKBACK_DAYS = 252  # Swing-Hoch der letzten 12 Monate
MIN_SWING_PCT = 15.0  # nur echte Aufwärtswellen (Tief -> Hoch mindestens +15 %)

USER_AGENT = "Mozilla/5.0 (compatible; pullback-screener/1.0)"


def fetch_chart(ticker: str, rng: str, interval: str) -> dict:
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        f"?range={rng}&interval={interval}&includePrePost=false"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.load(resp)
            result = data["chart"]["result"]
            if not result:
                raise ValueError(data["chart"].get("error"))
            return result[0]
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as exc:
            if attempt == 3:
                raise RuntimeError(f"{ticker} {interval}: {exc}") from exc
            time.sleep(2**attempt)
    raise AssertionError("unreachable")


def series(result: dict) -> list[dict]:
    """Zeitreihe ohne Lücken (Yahoo liefert an Feiertagen None)."""
    q = result["indicators"]["quote"][0]
    rows = []
    for i, ts in enumerate(result.get("timestamp") or []):
        c, h, l = q["close"][i], q["high"][i], q["low"][i]
        if c is None or h is None or l is None:
            continue
        rows.append({"t": ts, "c": c, "h": h, "l": l})
    return rows


def sma(values: list[float], n: int) -> float | None:
    return sum(values[-n:]) / n if len(values) >= n else None


def rsi(values: list[float], n: int = 14) -> float | None:
    """RSI nach Wilder."""
    if len(values) <= n:
        return None
    gains, losses = 0.0, 0.0
    for i in range(1, n + 1):
        d = values[i] - values[i - 1]
        gains += max(d, 0)
        losses += max(-d, 0)
    avg_g, avg_l = gains / n, losses / n
    for i in range(n + 1, len(values)):
        d = values[i] - values[i - 1]
        avg_g = (avg_g * (n - 1) + max(d, 0)) / n
        avg_l = (avg_l * (n - 1) + max(-d, 0)) / n
    if avg_l == 0:
        return 100.0
    return 100 - 100 / (1 + avg_g / avg_l)


def pct(price: float, level: float | None) -> float | None:
    return None if not level else (price / level - 1) * 100


def fibonacci(daily: list[dict]) -> dict | None:
    """61,8 %-Retracement der letzten Aufwärtswelle.

    Swing-Hoch = höchstes Hoch der letzten 12 Monate. Swing-Tief = tiefstes
    Tief in den 12 Monaten vor diesem Hoch. Retracement-Niveaus werden vom
    Hoch nach unten gerechnet.
    """
    if len(daily) < FIB_LOOKBACK_DAYS:
        return None
    window = daily[-FIB_LOOKBACK_DAYS:]
    hi_idx = max(range(len(window)), key=lambda i: window[i]["h"])
    abs_hi = len(daily) - FIB_LOOKBACK_DAYS + hi_idx
    before = daily[max(0, abs_hi - FIB_LOOKBACK_DAYS) : abs_hi + 1]
    low = min(r["l"] for r in before)
    high = daily[abs_hi]["h"]
    if high / low - 1 < MIN_SWING_PCT / 100:
        return None
    rng = high - low
    low_date = next(r["t"] for r in before if r["l"] == low)
    return {
        "swingHigh": round(high, 2),
        "swingHighDate": iso(daily[abs_hi]["t"]),
        "swingLow": round(low, 2),
        "swingLowDate": iso(low_date),
        "fib382": round(high - 0.382 * rng, 2),
        "fib500": round(high - 0.5 * rng, 2),
        "fib618": round(high - 0.618 * rng, 2),
        "fib786": round(high - 0.786 * rng, 2),
    }


def iso(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()


def in_band(key: str, dist: float | None) -> bool:
    if dist is None:
        return False
    lo, hi = TOUCH_BAND[key]
    return lo <= dist <= hi


def analyse(stock: dict) -> dict:
    ticker = stock["ticker"]
    d_res = fetch_chart(ticker, "2y", "1d")
    w_res = fetch_chart(ticker, "5y", "1wk")
    daily, weekly = series(d_res), series(w_res)
    if len(daily) < 60:
        raise RuntimeError(f"{ticker}: zu wenig Kursdaten")

    closes = [r["c"] for r in daily]
    wcloses = [r["c"] for r in weekly]
    price = d_res["meta"].get("regularMarketPrice") or closes[-1]

    sma50 = sma(closes, 50)
    sma200 = sma(closes, 200)
    sma200w = sma(wcloses, 200)
    sma200_prev = sum(closes[-221:-21]) / 200 if len(closes) >= 221 else None
    high52 = max(r["h"] for r in daily[-252:])
    fib = fibonacci(daily)

    dist = {
        "sma50d": pct(price, sma50),
        "sma200d": pct(price, sma200),
        "sma200w": pct(price, sma200w),
        "fib618": pct(price, fib["fib618"]) if fib else None,
    }
    rsi_d = rsi(closes)
    rsi_w = rsi(wcloses)

    signals = [k for k in TOUCH_BAND if in_band(k, dist[k])]
    if rsi_d is not None and rsi_d < RSI_OVERSOLD:
        signals.append("rsiD")
    if rsi_w is not None and rsi_w < RSI_OVERSOLD:
        signals.append("rsiW")

    def r(x: float | None, n: int = 2) -> float | None:
        return None if x is None else round(x, n)

    return {
        **stock,
        "currency": d_res["meta"].get("currency"),
        "price": r(price),
        "change1d": r(pct(price, closes[-2]) if len(closes) > 1 else None),
        "high52w": r(high52),
        "drawdown": r(pct(price, high52), 1),
        "sma50d": r(sma50),
        "sma200d": r(sma200),
        "sma200w": r(sma200w),
        # Aufwärtstrend intakt, wenn der 200er heute höher liegt als vor einem Monat
        "sma200dRising": None if sma200 is None or sma200_prev is None else sma200 > sma200_prev,
        "dist": {k: r(v, 1) for k, v in dist.items()},
        "rsiD": r(rsi_d, 1),
        "rsiW": r(rsi_w, 1),
        "fib": fib,
        "signals": signals,
        # wöchentliche Schlusskurse der letzten 2 Jahre für die Sparkline
        "spark": [r(c) for c in wcloses[-104:]],
    }


def main() -> int:
    universe = json.loads(UNIVERSE.read_text())["stocks"]
    rows, errors = [], []
    for i, stock in enumerate(universe, 1):
        try:
            rows.append(analyse(stock))
            print(f"[{i}/{len(universe)}] {stock['ticker']}: {rows[-1]['signals']}")
        except Exception as exc:  # eine kaputte Aktie soll den Lauf nicht stoppen
            errors.append({"ticker": stock["ticker"], "error": str(exc)})
            print(f"[{i}/{len(universe)}] {stock['ticker']}: FEHLER {exc}", file=sys.stderr)
        time.sleep(0.3)

    rows.sort(key=lambda x: (-len(x["signals"]), x["drawdown"] or 0))
    OUT.write_text(
        json.dumps(
            {
                "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "bands": TOUCH_BAND,
                "rsiOversold": RSI_OVERSOLD,
                "stocks": rows,
                "errors": errors,
            },
            ensure_ascii=False,
            indent=1,
        )
        + "\n"
    )
    print(f"{len(rows)} Aktien geschrieben, {len(errors)} Fehler -> {OUT.relative_to(ROOT)}")
    return 0 if rows else 1


if __name__ == "__main__":
    sys.exit(main())
