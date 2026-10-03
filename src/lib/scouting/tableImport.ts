/**
 * Tabellen-Import für Spieler und Vereine.
 *
 * Jeder legale Weg, an Portaldaten zu kommen, endet bei einer Tabelle: der
 * Export eines Anbieters, ein Wyscout-Export oder die eigene Excel-Liste.
 * Deshalb liegt hier eine Zuordnung von beliebigen Spaltenüberschriften auf die
 * Felder der App — statt für jede Quelle einen eigenen Adapter zu schreiben.
 */

import { parseEur, parseNumber } from './format'
import { Club, Player, Position, POSITIONS } from './types'
import { listClubs, listPlayers, upsertClub, upsertPlayer } from './repo'
import {
  TargetKind,
  clampScale,
  parseBool,
  parseDate,
  parseFoot,
  parsePosition,
  parsePositionList,
} from './tableFields'

export * from './tableFields'

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export type ImportMode = 'create_and_update' | 'create_only'

export interface ImportRowError {
  row: number
  message: string
}

export interface ImportResult {
  created: number
  updated: number
  skipped: number
  errors: ImportRowError[]
}

export interface ImportOptions {
  kind: TargetKind
  headers: string[]
  rows: string[][]
  /** Feldschlüssel je Spaltenindex, leer = Spalte ignorieren */
  mapping: string[]
  mode: ImportMode
}

/** Liest einen Zeilenwert über den Feldschlüssel. */
function valueOf(mapping: string[], row: string[], key: string): string {
  const index = mapping.indexOf(key)
  if (index < 0) return ''
  return row[index] ?? ''
}

export async function importTable(options: ImportOptions): Promise<ImportResult> {
  const { kind, rows, mapping, mode } = options
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] }

  if (!mapping.includes('name')) {
    result.errors.push({ row: 0, message: 'Keine Spalte ist dem Feld „Name“ zugeordnet.' })
    return result
  }

  // Bestand einmal laden statt je Zeile abzufragen.
  const existingClubs = await listClubs()
  const clubByName = new Map(existingClubs.map((c) => [c.name.trim().toLowerCase(), c]))
  const existingPlayers = kind === 'players' ? await listPlayers() : []
  const playerByName = new Map(existingPlayers.map((p) => [p.name.trim().toLowerCase(), p]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // Zeile 1 ist die Überschrift
    const name = valueOf(mapping, row, 'name').trim()

    if (!name) {
      result.skipped++
      continue
    }

    try {
      if (kind === 'players') {
        const existing = playerByName.get(name.toLowerCase())
        if (existing && mode === 'create_only') {
          result.skipped++
          continue
        }
        const saved = await upsertPlayer(
          buildPlayer(name, mapping, row, existing ?? null, clubByName),
        )
        playerByName.set(name.toLowerCase(), saved)
        existing ? result.updated++ : result.created++
      } else {
        const existing = clubByName.get(name.toLowerCase())
        if (existing && mode === 'create_only') {
          result.skipped++
          continue
        }
        const saved = await upsertClub(buildClub(name, mapping, row, existing ?? null))
        clubByName.set(name.toLowerCase(), saved)
        existing ? result.updated++ : result.created++
      }
    } catch (err) {
      result.errors.push({ row: rowNumber, message: (err as Error).message })
    }
  }

  return result
}

function buildPlayer(
  name: string,
  mapping: string[],
  row: string[],
  existing: Player | null,
  clubByName: Map<string, Club>,
): Parameters<typeof upsertPlayer>[0] {
  const get = (key: string) => valueOf(mapping, row, key).trim()
  /** Leere Zelle lässt einen vorhandenen Wert stehen, statt ihn zu löschen. */
  const keep = <T>(raw: string, parsed: T | null, current: T | null): T | null =>
    raw === '' ? current : parsed

  const clubName = get('currentClubName')
  const matchedClub = clubName ? clubByName.get(clubName.toLowerCase()) : undefined

  const position = parsePosition(get('position'))
  const birthDate = parseDate(get('birthDate'))
  const ageRaw = get('age')
  const age = keep(ageRaw, parseNumber(ageRaw), existing?.age ?? null)

  return {
    id: existing?.id,
    name,
    position: position ?? existing?.position ?? 'ZM',
    altPositions: get('altPositions')
      ? parsePositionList(get('altPositions'))
      : (existing?.altPositions ?? []),
    age: age == null ? null : Math.round(age),
    birthDate: keep(get('birthDate'), birthDate, existing?.birthDate ?? null),
    nationality: keep(get('nationality'), get('nationality') || null, existing?.nationality ?? null),
    foot: keep(get('foot'), parseFoot(get('foot')), existing?.foot ?? null),
    heightCm: keep(get('heightCm'), parseNumber(get('heightCm')), existing?.heightCm ?? null),
    currentClubId: matchedClub?.id ?? existing?.currentClubId ?? null,
    currentClubName: keep(clubName, clubName || null, existing?.currentClubName ?? null),
    marketValueEur: keep(
      get('marketValueEur'),
      parseEur(get('marketValueEur')),
      existing?.marketValueEur ?? null,
    ),
    salaryEur: keep(get('salaryEur'), parseEur(get('salaryEur')), existing?.salaryEur ?? null),
    contractUntil: keep(
      get('contractUntil'),
      parseDate(get('contractUntil')),
      existing?.contractUntil ?? null,
    ),
    leagueLevel: keep(
      get('leagueLevel'),
      parseNumber(get('leagueLevel')),
      existing?.leagueLevel ?? matchedClub?.leagueLevel ?? null,
    ),
    minutesLastSeason: keep(
      get('minutesLastSeason'),
      parseNumber(get('minutesLastSeason')),
      existing?.minutesLastSeason ?? null,
    ),
    appearances: keep(get('appearances'), parseNumber(get('appearances')), existing?.appearances ?? null),
    goals: keep(get('goals'), parseNumber(get('goals')), existing?.goals ?? null),
    assists: keep(get('assists'), parseNumber(get('assists')), existing?.assists ?? null),
    pace: keep(get('pace'), clampScale(parseNumber(get('pace'))), existing?.pace ?? null),
    technique: keep(get('technique'), clampScale(parseNumber(get('technique'))), existing?.technique ?? null),
    physique: keep(get('physique'), clampScale(parseNumber(get('physique'))), existing?.physique ?? null),
    defensiveWork: keep(
      get('defensiveWork'),
      clampScale(parseNumber(get('defensiveWork'))),
      existing?.defensiveWork ?? null,
    ),
    preferredCountries: get('preferredCountries')
      ? get('preferredCountries')
          .split(/[,;/|]+/)
          .map((c) => c.trim())
          .filter(Boolean)
      : (existing?.preferredCountries ?? []),
    willingToRelocate:
      parseBool(get('willingToRelocate')) ?? existing?.willingToRelocate ?? true,
    notes: keep(get('notes'), get('notes') || null, existing?.notes ?? null),
    providerRef: existing?.providerRef ?? null,
  }
}

function buildClub(
  name: string,
  mapping: string[],
  row: string[],
  existing: Club | null,
): Parameters<typeof upsertClub>[0] {
  const get = (key: string) => valueOf(mapping, row, key).trim()
  const keep = <T>(raw: string, parsed: T | null, current: T | null): T | null =>
    raw === '' ? current : parsed

  const needs: Partial<Record<Position, number>> = { ...(existing?.needs ?? {}) }
  for (const pos of POSITIONS) {
    const raw = get(`need_${pos}`)
    if (raw === '') continue
    const value = clampScale(parseNumber(raw))
    if (value == null || value <= 0) delete needs[pos]
    else needs[pos] = value
  }

  return {
    id: existing?.id,
    name,
    country: get('country') || existing?.country || '',
    league: get('league') || existing?.league || '',
    leagueLevel: Math.max(
      1,
      Math.min(5, Math.round(parseNumber(get('leagueLevel')) ?? existing?.leagueLevel ?? 3)),
    ),
    transferBudgetEur: keep(
      get('transferBudgetEur'),
      parseEur(get('transferBudgetEur')),
      existing?.transferBudgetEur ?? null,
    ),
    salaryBudgetEur: keep(
      get('salaryBudgetEur'),
      parseEur(get('salaryBudgetEur')),
      existing?.salaryBudgetEur ?? null,
    ),
    avgSalaryEur: keep(get('avgSalaryEur'), parseEur(get('avgSalaryEur')), existing?.avgSalaryEur ?? null),
    avgSquadAge: keep(get('avgSquadAge'), parseNumber(get('avgSquadAge')), existing?.avgSquadAge ?? null),
    formation: keep(get('formation'), get('formation') || null, existing?.formation ?? null),
    styleTempo: keep(get('styleTempo'), clampScale(parseNumber(get('styleTempo'))), existing?.styleTempo ?? null),
    stylePossession: keep(
      get('stylePossession'),
      clampScale(parseNumber(get('stylePossession'))),
      existing?.stylePossession ?? null,
    ),
    stylePressing: keep(
      get('stylePressing'),
      clampScale(parseNumber(get('stylePressing'))),
      existing?.stylePressing ?? null,
    ),
    youthPolicy: keep(get('youthPolicy'), clampScale(parseNumber(get('youthPolicy'))), existing?.youthPolicy ?? null),
    riskTolerance: keep(
      get('riskTolerance'),
      clampScale(parseNumber(get('riskTolerance'))),
      existing?.riskTolerance ?? null,
    ),
    needs,
    notes: keep(get('notes'), get('notes') || null, existing?.notes ?? null),
    providerRef: existing?.providerRef ?? null,
  }
}

