#!/usr/bin/env python3
"""One-off debug helper: prints snippets of the real marktguru.de search
page HTML around any price occurrences straight to stdout (read via the
Actions job log) so the scraping selectors can be fixed against the
actual DOM. Not part of the daily routine — safe to delete after use."""
import re

from playwright.sync_api import sync_playwright

PRICE_RE = re.compile(r"\d,\d{2}\s*€")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        )
    )
    page.goto("https://www.marktguru.de/search?q=butter", timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(4000)

    print("=== PAGE TITLE ===")
    print(page.title())
    print("=== PAGE URL AFTER LOAD ===")
    print(page.url)

    html = page.content()
    print(f"=== HTML LENGTH: {len(html)} ===")

    matches = list(PRICE_RE.finditer(html))
    print(f"=== PRICE PATTERN MATCHES IN RAW HTML: {len(matches)} ===")
    for m in matches[:5]:
        start = max(0, m.start() - 300)
        end = min(len(html), m.end() + 100)
        print("--- snippet ---")
        print(html[start:end])

    if not matches:
        print("=== NO PRICE PATTERN FOUND, DUMPING FIRST 3000 CHARS OF BODY TEXT ===")
        print(page.inner_text("body")[:3000])
        print("=== DUMPING FIRST 2000 CHARS OF RAW HTML ===")
        print(html[:2000])

    browser.close()
