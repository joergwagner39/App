"""Garmin → KV Sync für den Coach.

Holt Tageswerte (Body Battery, Stress, Ruhepuls), Aktivitäten, VO2max und
Training Readiness aus Garmin Connect und legt sie als JSON unter dem Key
``garmin:summary`` in Upstash Redis / Vercel KV ab. Die App liest das in
/api/dashboard.

Einmalig lokal Tokens erzeugen (fragt ggf. nach dem MFA-Code):
    GARMIN_EMAIL=... GARMIN_PASSWORD=... python scripts/garmin_sync/sync.py --login   (im Ordner padel-coach)
Die ausgegebene Zeichenkette als GitHub-Secret GARMIN_TOKENS speichern.

Regulärer Lauf (GitHub Action):
    GARMIN_TOKENS=... KV_REST_API_URL=... KV_REST_API_TOKEN=... python scripts/garmin_sync/sync.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone

from garminconnect import Garmin

TOKEN_KEY = "garmin:tokens"
SUMMARY_KEY = "garmin:summary"


def kv_config() -> tuple[str, str] | None:
    url = os.getenv("KV_REST_API_URL") or os.getenv("UPSTASH_REDIS_REST_URL")
    token = os.getenv("KV_REST_API_TOKEN") or os.getenv("UPSTASH_REDIS_REST_TOKEN")
    return (url.rstrip("/"), token) if url and token else None


def kv(cmd: list[str]):
    cfg = kv_config()
    if not cfg:
        raise SystemExit("KV_REST_API_URL / KV_REST_API_TOKEN fehlen")
    req = urllib.request.Request(
        cfg[0],
        data=json.dumps(cmd).encode(),
        headers={"Authorization": f"Bearer {cfg[1]}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        return json.loads(res.read())["result"]


def login_interactive() -> None:
    email, password = os.getenv("GARMIN_EMAIL"), os.getenv("GARMIN_PASSWORD")
    if not email or not password:
        raise SystemExit("GARMIN_EMAIL und GARMIN_PASSWORD setzen")
    g = Garmin(email, password, prompt_mfa=lambda: input("MFA-Code: "))
    g.login()
    print("\nAls GitHub-Secret GARMIN_TOKENS speichern:\n")
    print(g.client.dumps())


def connect() -> Garmin:
    # Zuletzt erneuerte Tokens aus KV bevorzugen, dann das Secret
    stored = None
    try:
        stored = kv(["GET", TOKEN_KEY])
    except Exception as e:  # noqa: BLE001
        print(f"KV-Tokens nicht lesbar: {e}", file=sys.stderr)
    for tokens in (stored, os.getenv("GARMIN_TOKENS")):
        if not tokens:
            continue
        try:
            g = Garmin()
            g.login(tokens)
            return g
        except Exception as e:  # noqa: BLE001
            print(f"Token-Login fehlgeschlagen: {e}", file=sys.stderr)
    email, password = os.getenv("GARMIN_EMAIL"), os.getenv("GARMIN_PASSWORD")
    if email and password:
        g = Garmin(email, password)
        g.login()
        return g
    raise SystemExit("Kein gültiger Garmin-Login (GARMIN_TOKENS oder GARMIN_EMAIL/PASSWORD)")


def safe(fn, *args, default=None):
    try:
        return fn(*args)
    except Exception as e:  # noqa: BLE001
        print(f"{fn.__name__}{args}: {e}", file=sys.stderr)
        return default


def first_number(obj, *keys):
    """Sucht rekursiv den ersten numerischen Wert zu einem der Keys."""
    if isinstance(obj, dict):
        for k in keys:
            v = obj.get(k)
            if isinstance(v, (int, float)):
                return v
        for v in obj.values():
            found = first_number(v, *keys)
            if found is not None:
                return found
    elif isinstance(obj, list):
        for v in obj:
            found = first_number(v, *keys)
            if found is not None:
                return found
    return None


def kv_get_json(key: str):
    try:
        raw = kv(["GET", key])
        return json.loads(raw) if raw else None
    except Exception as e:  # noqa: BLE001
        print(f"KV {key} nicht lesbar: {e}", file=sys.stderr)
        return None


def main() -> None:
    g = connect()
    today = date.today()
    previous = kv_get_json(SUMMARY_KEY) or {}

    # Tageswerte: beim ersten Lauf 30 Tage, danach nur die letzten 3 Tage neu laden
    known = {d["date"]: d for d in previous.get("daily", [])}
    lookback = 3 if known else 30
    for d in (today - timedelta(days=i) for i in range(lookback - 1, -1, -1)):
        s = safe(g.get_user_summary, d.isoformat())
        if not s:
            continue
        day = s.get("calendarDate", d.isoformat())
        known[day] = {
            "date": day,
            "steps": s.get("totalSteps") or 0,
            "restingHeartRate": s.get("restingHeartRate") or 0,
            "averageStressLevel": s.get("averageStressLevel") or 0,
            "bodyBatteryHighestValue": s.get("bodyBatteryHighestValue") or 0,
            "bodyBatteryLowestValue": s.get("bodyBatteryLowestValue") or 0,
        }
    cutoff = (today - timedelta(days=60)).isoformat()
    daily = sorted((d for d in known.values() if d["date"] >= cutoff), key=lambda x: x["date"])

    raw_acts = safe(g.get_activities_by_date, (today - timedelta(days=90)).isoformat(), today.isoformat(), default=[]) or []
    activities = []
    for a in raw_acts:
        start = a.get("startTimeLocal") or ""
        activities.append(
            {
                "date": start[:10],
                "activityType": (a.get("activityType") or {}).get("typeKey", "unknown"),
                "duration": a.get("duration") or 0,
                "averageHR": a.get("averageHR") or 0,
                "maxHR": a.get("maxHR") or 0,
                "vo2max": a.get("vO2MaxValue"),
                "trainingEffect": a.get("aerobicTrainingEffect"),
                "anaerobicTrainingEffect": a.get("anaerobicTrainingEffect"),
            }
        )
    activities.sort(key=lambda x: x["date"])

    metrics = safe(g.get_max_metrics, today.isoformat())
    readiness = safe(g.get_training_readiness, today.isoformat())
    vo2 = first_number(metrics, "vo2MaxPreciseValue", "vo2MaxValue")

    # VO2max-Verlauf: gespeicherte Historie + Werte aus Aktivitäten + heutiger Wert
    history = {h["date"]: h["value"] for h in previous.get("vo2history", [])}
    for a in activities:
        if a.get("vo2max") and a["date"] not in history:
            history[a["date"]] = a["vo2max"]
    if vo2:
        history[today.isoformat()] = round(vo2, 1)
    vo2history = [{"date": k, "value": v} for k, v in sorted(history.items())][-400:]

    summary = {
        "daily": daily,
        "activities": activities,
        "vo2max": vo2,
        "vo2history": vo2history,
        "trainingReadiness": first_number(readiness, "score"),
        "syncedAt": datetime.now(timezone.utc).isoformat(),
    }
    kv(["SET", SUMMARY_KEY, json.dumps(summary)])
    # Erneuerte Tokens für den nächsten Lauf sichern
    safe(lambda: kv(["SET", TOKEN_KEY, g.client.dumps()]))
    print(f"Sync ok: {len(daily)} Tage, {len(activities)} Aktivitäten, VO2max={vo2}, Historie={len(vo2history)}")


if __name__ == "__main__":
    if "--login" in sys.argv:
        login_interactive()
    else:
        main()
