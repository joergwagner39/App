#!/usr/bin/env python3
"""
Daily food-deals checker.

Scrapes marktguru.de (which aggregates Lidl, Rewe and other German
retailers' weekly leaflets) for a configured list of specific products plus
a list of generic "healthy / longevity superfood" keywords, and emails any
newly found offers via SMTP.

Intended to run as a scheduled GitHub Actions job (see
.github/workflows/food-deals.yml) — NOT inside the Claude sandbox, whose
network policy blocks direct requests to retail sites.

Required environment variables:
    SMTP_HOST   (default: smtp.gmail.com)
    SMTP_PORT   (default: 587)
    SMTP_USER   sender address, e.g. joergwagner39@gmail.com
    SMTP_PASS   Gmail app password (NOT the normal account password)
    MAIL_FROM   defaults to SMTP_USER
    MAIL_TO     recipient, e.g. joerg.wagner@rogon.tv

State (which offers were already notified about) is kept in
seen_offers.json next to this script; the workflow commits changes to that
file back to the repo so we don't re-notify on the next run.
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

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

SCRIPT_DIR = Path(__file__).resolve().parent
SEEN_FILE = SCRIPT_DIR / "seen_offers.json"

SEARCH_BASE_URL = "https://www.marktguru.de/search?q={query}"

# Exact products the user wants tracked.
PRODUCTS = [
    "vly Erbsen-Drink Barista 1l",
    "vly Erbsen-Drink High Protein",
    "VEMONDO High Protein Sojadrink",
    "Président Meersalzbutter",
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

PRICE_RE = re.compile(r"(\d{1,3}(?:[.,]\d{2}))\s*€")
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
    url = SEARCH_BASE_URL.format(query=query.replace(" ", "+"))
    offers: list[Offer] = []

    page.goto(url, timeout=30000, wait_until="domcontentloaded")
    dismiss_cookie_banner(page)
    try:
        page.wait_for_timeout(2500)
    except PWTimeout:
        pass

    # Generic heuristic: find every DOM node whose own text contains a price
    # ("x,xx €"), then look at a small ancestor block for the offer title
    # and a link. This avoids depending on exact CSS class names, which
    # marktguru changes periodically.
    candidates = page.locator("*").filter(has_text=re.compile(r"\d,\d{2}\s*€"))
    count = min(candidates.count(), 60)

    seen_urls_this_query: set[str] = set()

    for i in range(count):
        node = candidates.nth(i)
        try:
            text = node.inner_text(timeout=1000)
        except Exception:
            continue

        price_match = PRICE_RE.search(text)
        if not price_match:
            continue

        block = node
        block_text = text
        link_href = None
        for _ in range(4):
            try:
                parent = block.locator("xpath=..")
                parent_text = parent.inner_text(timeout=1000)
            except Exception:
                break
            if len(parent_text) > 600:
                break
            block, block_text = parent, parent_text

        try:
            link_locator = block.locator("a").first
            if link_locator.count() > 0:
                link_href = link_locator.get_attribute("href", timeout=1000)
        except Exception:
            link_href = None

        if link_href and link_href.startswith("/"):
            link_href = "https://www.marktguru.de" + link_href

        full_url = link_href or url
        if full_url in seen_urls_this_query:
            continue

        title = query
        for line in block_text.splitlines():
            line = line.strip()
            if line and not PRICE_RE.fullmatch(line + "€") and len(line) > 3:
                title = line
                break

        seen_urls_this_query.add(full_url)
        offers.append(
            Offer(
                query=query,
                kind=kind,
                title=title[:200],
                price=price_match.group(1) + " €",
                url=full_url,
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

    if new_offers:
        send_email(new_offers)

    return {
        "new_offers": [asdict(o) for o in new_offers],
        "errors": errors,
        "total_seen_count": len(seen),
    }


if __name__ == "__main__":
    result = run()
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    print()
