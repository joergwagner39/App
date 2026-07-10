#!/usr/bin/env python3
"""
Daily food-deals checker.

Scrapes marktguru.de (which aggregates Lidl, Rewe and other German
retailers' weekly leaflets) for a configured list of specific products plus
a list of generic "healthy / longevity superfood" keywords.

Intended to run as a scheduled GitHub Actions job (see
.github/workflows/food-deals.yml) — NOT inside the Claude sandbox, whose
network policy blocks direct requests to retail sites.

New offers are emailed via SMTP (see required env vars below) AND appended
to pending_offers.json as a backup record, in case SMTP is ever
misconfigured or down — nothing gets silently lost.

Required environment variables:
    SMTP_HOST   (default: smtp.gmail.com)
    SMTP_PORT   (default: 587)
    SMTP_USER   sender address, e.g. joergwagner39@gmail.com
    SMTP_PASS   Gmail app password (NOT the normal account password)
    MAIL_FROM   defaults to SMTP_USER
    MAIL_TO     recipient, e.g. joerg.wagner@rogon.tv

State (which offers were already notified about) is kept in
seen_offers.json next to this script.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import smtplib
import sys
from dataclasses import dataclass, asdict
from email.mime.text import MIMEText
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

SCRIPT_DIR = Path(__file__).resolve().parent
SEEN_FILE = SCRIPT_DIR / "seen_offers.json"
PENDING_FILE = SCRIPT_DIR / "pending_offers.json"

# NOTE: marktguru's search results live at /search/<term> (path segment),
# NOT /search?q=<term> (that returns a 404). Confirmed by dumping the real
# page: https://www.marktguru.de/search/butter renders offer cards as
# plain text lines: Title / "Marke:" / Brand / "Preis:" / "€ X,XX" /
# validity / "Händler:" / Retailer.
SEARCH_BASE_URL = "https://www.marktguru.de/search/{query}"

# Exact products the user wants tracked.
PRODUCTS = [
    "vly Erbsen-Drink Barista 1l",
    "vly Erbsen-Drink High Protein",
    "VEMONDO High Protein Sojadrink",
    "Président Meersalzbutter",
    "Beauty of Joseon Relief Sun Rice Probiotics",
    "Beauty of Joseon Relief Sun Aqua Soothing",
]

# Generic "healthy / longevity superfood" search terms.
SUPERFOOD_KEYWORDS = [
    "Chia Samen",
    "Leinsamen",
    "Quinoa",
    "Kurkuma",
    "Matcha",
    "Spirulina",
    "Heidelbeeren",
    "Granatapfel",
    "Walnüsse",
    "Kimchi",
    "Sauerkraut",
    "Kombucha",
    "Lachs",
    "natives Olivenöl",
    "Hafer",
    "Kichererbsen",
    "Linsen",
    "Kollagen",
    "hochwertiges Protein",
]

ALL_QUERIES = [(p, "product") for p in PRODUCTS] + [
    (k, "superfood") for k in SUPERFOOD_KEYWORDS
]

PRICE_RE = re.compile(r"€\s*(\d{1,3}(?:[.,]\d{2}))")
COOKIE_BUTTON_TEXTS = [
    "Alle akzeptieren",
    "Akzeptieren",
    "Zustimmen",
    "Alles akzeptieren",
    "Einverstanden",
]


@dataclass
class Offer:
    query: str
    kind: str  # "product" or "superfood"
    title: str
    price: str | None
    url: str

    def key(self) -> str:
        raw = f"{self.title}|{self.price}|{self.url}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def load_seen() -> set[str]:
    if not SEEN_FILE.exists():
        return set()
    try:
        return set(json.loads(SEEN_FILE.read_text()))
    except (json.JSONDecodeError, OSError):
        return set()


def save_seen(seen: set[str]) -> None:
    SEEN_FILE.write_text(json.dumps(sorted(seen), ensure_ascii=False, indent=2))


def append_pending(new_offers: list[Offer]) -> None:
    if not new_offers:
        return
    existing = []
    if PENDING_FILE.exists():
        try:
            existing = json.loads(PENDING_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            existing = []
    existing.extend(asdict(o) for o in new_offers)
    PENDING_FILE.write_text(json.dumps(existing, ensure_ascii=False, indent=2))


def dismiss_cookie_banner(page) -> None:
    for text in COOKIE_BUTTON_TEXTS:
        try:
            btn = page.get_by_role("button", name=text, exact=False)
            if btn.count() > 0:
                btn.first.click(timeout=2000)
                return
        except Exception:
            continue


def scrape_marktguru(page, query: str, kind: str) -> list[Offer]:
    url = SEARCH_BASE_URL.format(query=quote(query))
    offers: list[Offer] = []

    page.goto(url, timeout=30000, wait_until="domcontentloaded")
    dismiss_cookie_banner(page)
    try:
        page.wait_for_timeout(2500)
    except PWTimeout:
        pass

    lines = [line.strip() for line in page.inner_text("body").splitlines() if line.strip()]

    # Offer cards render as a flat sequence of text lines:
    #   <Title>
    #   Marke:
    #   <Brand>
    #   Preis:
    #   € X,XX
    #   ...Gültig:<dates>
    #   Händler:
    #   <Retailer>
    # We anchor on "Marke:" (reliable label) and look a few lines around it
    # for the rest, since exact spacing/wording of the surrounding lines can
    # vary slightly between offer types.
    for i, line in enumerate(lines):
        if line != "Marke:" or i + 1 >= len(lines):
            continue

        title = lines[i - 1] if i - 1 >= 0 else query
        brand = lines[i + 1]

        price = None
        for j in range(i + 2, min(i + 6, len(lines))):
            if lines[j] == "Preis:" and j + 1 < len(lines):
                m = PRICE_RE.search(lines[j + 1])
                if m:
                    price = m.group(1) + " €"
                break

        retailer = None
        for j in range(i + 2, min(i + 14, len(lines))):
            if lines[j] == "Händler:" and j + 1 < len(lines):
                retailer = lines[j + 1]
                break

        if not price:
            continue

        full_title = f"{title} ({brand})" if brand and brand not in title else title
        if retailer:
            full_title = f"{full_title} – {retailer}"

        offers.append(
            Offer(
                query=query,
                kind=kind,
                title=full_title[:200],
                price=price,
                url=url,
            )
        )

    return offers


def scrape_all() -> tuple[list[Offer], list[str]]:
    all_offers: list[Offer] = []
    errors: list[str] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
            )
        )
        for query, kind in ALL_QUERIES:
            try:
                all_offers.extend(scrape_marktguru(page, query, kind))
            except Exception as exc:  # noqa: BLE001 - one bad query shouldn't kill the run
                errors.append(f"{query}: {exc}")
        browser.close()

    return all_offers, errors


def send_email(new_offers: list[Offer]) -> None:
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ["SMTP_USER"]
    smtp_pass = os.environ["SMTP_PASS"]
    mail_from = os.environ.get("MAIL_FROM", smtp_user)
    mail_to = os.environ["MAIL_TO"]

    lines = []
    for o in new_offers:
        kind_label = "Produkt" if o.kind == "product" else "Superfood"
        lines.append(f"[{kind_label}] {o.title}\nPreis: {o.price}\nSuche: {o.query}\nLink: {o.url}\n")
    body = "\n".join(lines)

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = f"Food-Deals gefunden ({len(new_offers)})"
    msg["From"] = mail_from
    msg["To"] = mail_to

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(mail_from, [mail_to], msg.as_string())


def run() -> dict:
    seen = load_seen()
    offers, errors = scrape_all()

    new_offers = [o for o in offers if o.key() not in seen]
    for o in new_offers:
        seen.add(o.key())
    save_seen(seen)

    email_sent = False
    email_error = None
    if new_offers:
        try:
            send_email(new_offers)
            email_sent = True
        except Exception as exc:  # noqa: BLE001 - report but don't fail the whole run
            email_error = str(exc)
            # SMTP failed — fall back to the pending-offers file so nothing
            # is lost; the "Food Deals Notify" Claude trigger can pick it up.
            append_pending(new_offers)

    return {
        "new_offers": [asdict(o) for o in new_offers],
        "errors": errors,
        "email_sent": email_sent,
        "email_error": email_error,
        "total_seen_count": len(seen),
    }


if __name__ == "__main__":
    result = run()
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    print()
