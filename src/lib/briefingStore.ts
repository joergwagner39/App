import { promises as fs } from 'fs'
import path from 'path'
import type { Briefing } from './briefing'

/**
 * Tages-Briefings liegen als data/briefings/YYYY-MM-DD.json im Repo. Eine
 * Claude-Routine legt dort jeden Morgen eine neue Datei ab, der Renderer
 * (scripts/briefing/render.mjs) macht daraus das PNG.
 */
export const BRIEFING_DIR = path.join(process.cwd(), 'data', 'briefings')

const FILE_RE = /^(\d{4}-\d{2}-\d{2})\.json$/

export async function listBriefingDates(): Promise<string[]> {
  let files: string[]
  try {
    files = await fs.readdir(BRIEFING_DIR)
  } catch {
    return []
  }
  return files
    .map((f) => FILE_RE.exec(f)?.[1])
    .filter((d): d is string => Boolean(d))
    .sort()
    .reverse()
}

export async function loadBriefing(date?: string): Promise<{ date: string; data: Briefing } | null> {
  const target = date && FILE_RE.test(`${date}.json`) ? date : (await listBriefingDates())[0]
  if (!target) return null
  try {
    const raw = await fs.readFile(path.join(BRIEFING_DIR, `${target}.json`), 'utf8')
    return { date: target, data: JSON.parse(raw) as Briefing }
  } catch {
    return null
  }
}
