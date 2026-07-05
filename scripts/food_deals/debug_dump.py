#!/usr/bin/env python3
"""One-off debug helper: dumps marktguru.de search page HTML + a screenshot
so we can inspect the real DOM structure and fix the scraping selectors.
Not part of the daily routine — safe to delete after use."""
from playwright.sync_api import sync_playwright

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
    with open("debug.html", "w", encoding="utf-8") as f:
        f.write(page.content())
    page.screenshot(path="debug.png", full_page=True)
    browser.close()
print("dumped debug.html and debug.png")
