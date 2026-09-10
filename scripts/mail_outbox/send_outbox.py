#!/usr/bin/env python3
"""
Generic mail-outbox sender.

Any Claude routine (Morning Briefing, Watchlist, Eifel-Immobilien, etc.)
that wants to actually SEND an email — not just create a Gmail draft, which
is all the Gmail MCP connector supports — writes a small JSON file into
mail_outbox/ instead:

    {
      "to": ["someone@example.com"],
      "subject": "...",
      "body": "plain text body",
      "attachments": ["data/briefings/png/2026-09-10.png"]   # optional
    }

"attachments" ist optional und enthaelt Pfade relativ zum Repo-Root (oder
absolut). Fehlt der Schluessel, wird wie bisher eine reine Text-Mail
verschickt.

This script (run by .github/workflows/mail-outbox.yml on every push to
mail_outbox/**) sends each file via SMTP and deletes it on success. Files
that fail to send are left in place so the next run retries them.

Required environment variables:
    SMTP_HOST   (default: smtp.gmail.com)
    SMTP_PORT   (default: 587)
    SMTP_USER   sender address
    SMTP_PASS   Gmail app password
    MAIL_FROM   defaults to SMTP_USER
"""
from __future__ import annotations

import json
import os
import smtplib
import sys
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUTBOX_DIR = REPO_ROOT / "mail_outbox"


def build_message(mail_from: str, payload: dict):
    text = MIMEText(payload["body"], "plain", "utf-8")
    attachments = payload.get("attachments") or []
    if not attachments:
        msg = text
    else:
        msg = MIMEMultipart()
        msg.attach(text)
        for rel in attachments:
            path = Path(rel)
            if not path.is_absolute():
                path = REPO_ROOT / path
            part = MIMEApplication(path.read_bytes())
            part.add_header("Content-Disposition", "attachment", filename=path.name)
            msg.attach(part)
    msg["Subject"] = payload["subject"]
    msg["From"] = mail_from
    msg["To"] = ", ".join(payload["to"])
    return msg


def send_one(smtp: smtplib.SMTP, mail_from: str, payload: dict) -> None:
    msg = build_message(mail_from, payload)
    smtp.sendmail(mail_from, payload["to"], msg.as_string())


def main() -> int:
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ["SMTP_USER"]
    smtp_pass = os.environ["SMTP_PASS"]
    mail_from = os.environ.get("MAIL_FROM", smtp_user)

    files = sorted(p for p in OUTBOX_DIR.glob("*.json") if p.name != ".gitkeep")
    if not files:
        print("Outbox empty, nothing to send.")
        return 0

    sent, failed = [], []
    with smtplib.SMTP(smtp_host, smtp_port) as smtp:
        smtp.starttls()
        smtp.login(smtp_user, smtp_pass)
        for f in files:
            try:
                payload = json.loads(f.read_text(encoding="utf-8"))
                send_one(smtp, mail_from, payload)
                f.unlink()
                sent.append(f.name)
            except Exception as exc:  # noqa: BLE001 - one bad file shouldn't block the rest
                failed.append((f.name, str(exc)))

    print(f"Sent: {sent}")
    if failed:
        print(f"Failed (left in outbox for retry): {failed}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
