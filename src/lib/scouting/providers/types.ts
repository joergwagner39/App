import { Foot, Position } from '../types'

/**
 * Gemeinsame Schnittstelle für alle Datenquellen.
 *
 * Wichtig: Lizenz-APIs liefern Stammdaten, Statistik und Verletzungen. Sie liefern
 * KEINE Transferbudgets, keinen Positionsbedarf und keine Spielstil-Bewertung —
 * das sind Einschätzungen, die in der App gepflegt werden. Provider dürfen solche
 * Felder deshalb nie überschreiben.
 */
export interface ProviderPlayer {
  /** Eindeutige Referenz beim Anbieter, Format "<provider>:<id>" */
  ref: string
  name: string
  position: Position | null
  altPositions: Position[]
  age: number | null
  birthDate: string | null
  nationality: string | null
  foot: Foot | null
  heightCm: number | null
  clubRef: string | null
  clubName: string | null
  marketValueEur: number | null
  contractUntil: string | null
  leagueName: string | null
  country: string | null
  minutesLastSeason: number | null
  appearances: number | null
  goals: number | null
  assists: number | null
  currentlyInjured: boolean | null
}

export interface ProviderClub {
  ref: string
  name: string
  country: string
  league: string
  leagueLevel: number | null
}

export interface ProviderInjury {
  playerRef: string
  type: string
  severity: number | null
  startDate: string
  endDate: string | null
}

export interface DataProvider {
  readonly id: string
  readonly label: string
  /** Ist ein API-Key gesetzt? */
  isConfigured(): boolean
  /** Hinweistext, was zur Konfiguration fehlt bzw. woher der Key kommt. */
  setupHint(): string

  searchPlayers(query: string): Promise<ProviderPlayer[]>
  listClubs(options: { league?: string; season?: number }): Promise<ProviderClub[]>
  listInjuries(options: { playerRef?: string; league?: string; season?: number }): Promise<
    ProviderInjury[]
  >
}

/**
 * Grobe Einordnung der Ligastärke 1 (Top) .. 5 (unterklassig). Nur eine
 * Starthilfe — die Feineinstufung passiert in der Vereinsverwaltung.
 */
export function guessLeagueLevel(country: string | null, league: string | null): number {
  const l = (league ?? '').toLowerCase()
  const c = (country ?? '').toLowerCase()

  const topFive = ['premier league', 'bundesliga', 'la liga', 'laliga', 'serie a', 'ligue 1']
  const topCountries = ['england', 'germany', 'deutschland', 'spain', 'italy', 'france']

  if (topFive.some((t) => l.includes(t)) && topCountries.includes(c)) return 1
  if (l.includes('champions league')) return 1
  if (
    l.includes('eredivisie') ||
    l.includes('primeira liga') ||
    l.includes('süper lig') ||
    l.includes('super lig') ||
    l.includes('premier liga') ||
    l.includes('jupiler') ||
    l.includes('pro league')
  ) {
    return 2
  }
  if (/2\.?\s*(bundesliga|liga)/.test(l) || l.includes('championship') || l.includes('serie b'))
    return 2
  if (l.includes('3. liga') || l.includes('league one') || l.includes('serie c')) return 3
  if (l.includes('regionalliga') || l.includes('league two')) return 4
  if (l.includes('oberliga')) return 5
  return 3
}

/** Grobzuordnung der bei APIs üblichen Sammelpositionen. */
export function mapCoarsePosition(raw: string | null | undefined): Position | null {
  if (!raw) return null
  const p = raw.toLowerCase()
  if (p.includes('goalkeeper') || p.includes('torwart') || p === 'gk') return 'TW'
  if (p.includes('centre-back') || p.includes('center back') || p.includes('innenverteidiger'))
    return 'IV'
  if (p.includes('left-back') || p.includes('left back')) return 'LV'
  if (p.includes('right-back') || p.includes('right back')) return 'RV'
  if (p.includes('defensive midfield') || p === 'dm') return 'DM'
  if (p.includes('attacking midfield') || p === 'am') return 'OM'
  if (p.includes('left wing') || p.includes('linksaußen')) return 'LA'
  if (p.includes('right wing') || p.includes('rechtsaußen')) return 'RA'
  if (p.includes('defender') || p.includes('abwehr')) return 'IV'
  if (p.includes('midfielder') || p.includes('mittelfeld')) return 'ZM'
  if (p.includes('attacker') || p.includes('forward') || p.includes('striker') || p.includes('sturm'))
    return 'ST'
  return null
}
