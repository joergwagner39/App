#!/usr/bin/env node
/**
 * Rendert ein Tages-Briefing als 1080 x 1920 PNG.
 *
 *   node scripts/briefing/render.mjs [--date YYYY-MM-DD] [--out pfad.png] [--port 3210]
 *
 * Erwartet eine gebaute App (`npm run build`); startet selbst einen
 * `next start`, schiesst den Screenshot von /briefing/render und beendet den
 * Server wieder. Ohne --date wird das neueste data/briefings/*.json genommen.
 */
import { spawn } from 'node:child_process'
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const CARD = { width: 1080, height: 1920 }

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

async function newestDate() {
  const dir = path.join(process.cwd(), 'data', 'briefings')
  const files = await readdir(dir).catch(() => [])
  const dates = files.map((f) => /^(\d{4}-\d{2}-\d{2})\.json$/.exec(f)?.[1]).filter(Boolean).sort()
  if (!dates.length) throw new Error(`Kein Briefing in ${dir} gefunden.`)
  return dates[dates.length - 1]
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* Server noch nicht da */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`Server unter ${url} nicht erreichbar.`)
}

const date = arg('date') ?? (await newestDate())
const port = arg('port', '3210')
const out = arg('out', path.join('out', `markt-briefing-${date}.png`))
const base = `http://127.0.0.1:${port}`

await mkdir(path.dirname(out), { recursive: true })

// detached, damit am Ende die ganze Prozessgruppe (next start + Kindprozess)
// zuverlaessig beendet werden kann.
const server = spawn('npx', ['next', 'start', '-p', port], {
  stdio: ['ignore', 'inherit', 'inherit'],
  env: process.env,
  detached: true,
})

function stopServer() {
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {
    /* schon beendet */
  }
}

let browser
let failure = null
try {
  await waitForServer(`${base}/briefing/render?date=${date}`)
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
  })
  const page = await browser.newPage({ viewport: CARD, deviceScaleFactor: 1 })
  await page.goto(`${base}/briefing/render?date=${date}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const card = await page.$('#briefing-card')
  if (!card) throw new Error('Karte (#briefing-card) nicht gefunden.')
  await card.screenshot({ path: out })
  console.log(`PNG geschrieben: ${out} (${date})`)
} catch (err) {
  failure = err
} finally {
  await browser?.close()
  stopServer()
}

if (failure) {
  console.error(failure)
  process.exit(1)
}
process.exit(0)
