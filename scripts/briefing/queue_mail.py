#!/usr/bin/env python3
"""
Legt fuer ein gerendertes Tages-Briefing eine Mail in mail_outbox/ ab.

    python scripts/briefing/queue_mail.py --date 2026-09-10 \
        --png data/briefings/png/2026-09-10.png

Die Mail traegt das PNG als Anhang; den Versand uebernimmt
scripts/mail_outbox/send_outbox.py. Empfaenger kommt aus MAIL_TO.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date as date_cls
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUTBOX_DIR = REPO_ROOT / "mail_outbox"


def plain_text(briefing: dict) -> str:
    lines: list[str] = [briefing.get("title", "Markt Briefing").replace("\n", " "), ""]
    lines.append(briefing.get("newsLabel", "News des Tages").upper())
    for item in briefing.get("news", []):
        lines.append(f"- {item['headline']}: {item['text']}")
    for section in briefing.get("sections", []):
        lines += ["", section["label"].upper()]
        for row in section.get("rows", []):
            meta = f" ({row['meta']})" if row.get("meta") else ""
            value_meta = f" – {row['valueMeta']}" if row.get("valueMeta") else ""
            lines.append(f"- {row['title']}{meta}: {row['value']}{value_meta}")
    lines += ["", "Grafik im Anhang. Keine Anlageberatung."]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default=date_cls.today().isoformat())
    parser.add_argument("--png", required=True)
    args = parser.parse_args()

    recipients = [a.strip() for a in os.environ.get("MAIL_TO", "").split(",") if a.strip()]
    if not recipients:
        print("MAIL_TO ist nicht gesetzt – keine Mail eingereiht.", file=sys.stderr)
        return 1

    source = REPO_ROOT / "data" / "briefings" / f"{args.date}.json"
    briefing = json.loads(source.read_text(encoding="utf-8"))

    payload = {
        "to": recipients,
        "subject": f"Markt Briefing {date_cls.fromisoformat(args.date).strftime('%d.%m.%Y')}",
        "body": plain_text(briefing),
        "attachments": [args.png],
    }

    OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
    target = OUTBOX_DIR / f"{args.date}-markt-briefing.json"
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Mail eingereiht: {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
