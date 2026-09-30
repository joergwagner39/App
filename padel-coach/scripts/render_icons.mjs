// Erzeugt die PNG-App-Icons aus public/icons/icon.svg (einmalig, Ergebnis ist eingecheckt).
// Aufruf: node scripts/render_icons.mjs
import { chromium } from 'playwright'
import { readFile } from 'fs/promises'

const svg = await readFile('public/icons/icon.svg', 'utf8')
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const page = await browser.newPage()
for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:#0a0f1e">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: false })
}
await browser.close()
