import { promises as fs } from 'fs'
import path from 'path'
import type { ScreenerData } from './screener'

/** Ergebnis des letzten Screener-Laufs (data/screener/latest.json). */
export async function loadScreener(): Promise<ScreenerData | null> {
  try {
    const file = path.join(process.cwd(), 'data', 'screener', 'latest.json')
    return JSON.parse(await fs.readFile(file, 'utf8')) as ScreenerData
  } catch {
    return null
  }
}
