#!/usr/bin/env python3
"""One-off debug helper: tries several candidate marktguru.de search URL
patterns and reports which ones return a real (non-404) page with price
patterns, so the scraping URL can be fixed. Not part of the daily routine —
safe to delete after use."""
import re

from playwright.sync_api import sync_playwright

PRICE_RE = re.compile(r"\d,\d{2}\s*€")

CANDIDATE_URLS = [
    "https://www.marktguru.de/angebote?q=butter",
    "https://www.marktguru.de/angebote?query=butter",
    "https://www.marktguru.de/angebote?search=butter",
    "https://www.marktguru.de/suche?q=butter",
    "https://www.marktguru.de/suche/butter",
    "https://www.marktguru.de/search/butter",
    "https://www.marktguru.de/ip/butter",
    "https://www.marktguru.de/produkte/butter",
]

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        )
    )

    for url in CANDIDATE_URLS:
        print(f"\n=== TRYING {url} ===")
        try:
            resp = page.goto(url, timeout=20000, wait_until="domcontentloaded")
            page.wait_for_timeout(2500)
            title = page.title()
            body_text = page.inner_text("body")
            is_404 = "404" in title or "NICHT GEFUNDEN" in body_text.upper()
            price_count = len(PRICE_RE.findall(page.content()))
            print(f"status={resp.status if resp else None} title={title!r} is_404={is_404} price_matches={price_count}")
            if not is_404:
                print("BODY SNIPPET:", body_text[:500].replace("\n", " | "))
        except Exception as exc:  # noqa: BLE001
            print(f"ERROR: {exc}")

    # Also check the homepage for a link to a real search-results page.
    print("\n=== HOMEPAGE SEARCH LINKS ===")
    page.goto("https://www.marktguru.de/", timeout=20000, wait_until="domcontentloaded")
    page.wait_for_timeout(2500)
    links = page.eval_on_selector_all(
        "a[href]",
        "els => els.map(e => e.getAttribute('href')).filter(h => /such|search|angebot/i.test(h))",
    )
    for link in sorted(set(links))[:30]:
        print(link)

    browser.close()
