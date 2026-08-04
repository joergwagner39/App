/**
 * Domänenmodell für das Spieler-Verein-Matching.
 *
 * Zwei Arten von Daten laufen hier zusammen:
 *  - Stammdaten (Spieler, Vereine, Verletzungen) — kommen wahlweise von einem
 *    Daten-Provider (Lizenz-API) oder werden manuell gepflegt.
 *  - Eigene Eintragungen (Bedarf, Budgets, Gerüchte, Einschätzungen) — die gibt
 *    es bei keinem Anbieter, die pflegt die Beratung selbst.
 */

export const POSITIONS = [
  'TW',
  'IV',
  'LV',
  'RV',
  'DM',
  'ZM',
  'OM',
  'LA',
  'RA',
  'ST',
] as const

export type Position = (typeof POSITIONS)[number]

export const POSITION_LABEL: Record<Position, string> = {
  TW: 'Torwart',
  IV: 'Innenverteidigung',
  LV: 'Linksverteidigung',
  RV: 'Rechtsverteidigung',
  DM: 'Defensives Mittelfeld',
  ZM: 'Zentrales Mittelfeld',
  OM: 'Offensives Mittelfeld',
  LA: 'Linksaußen',
  RA: 'Rechtsaußen',
  ST: 'Sturm',
}

/** Wie gut vertritt ein Spieler der Position A die Position B? 0..1 */
export const POSITION_AFFINITY: Record<Position, Partial<Record<Position, number>>> = {
  TW: {},
  IV: { LV: 0.5, RV: 0.5, DM: 0.5 },
  LV: { IV: 0.5, LA: 0.6, DM: 0.3 },
  RV: { IV: 0.5, RA: 0.6, DM: 0.3 },
  DM: { IV: 0.5, ZM: 0.8 },
  ZM: { DM: 0.8, OM: 0.7 },
  OM: { ZM: 0.7, LA: 0.6, RA: 0.6, ST: 0.5 },
  LA: { RA: 0.6, OM: 0.6, ST: 0.4, LV: 0.4 },
  RA: { LA: 0.6, OM: 0.6, ST: 0.4, RV: 0.4 },
  ST: { OM: 0.5, LA: 0.4, RA: 0.4 },
}

export type Foot = 'links' | 'rechts' | 'beidfüßig'

export interface Player {
  id: string
  name: string
  /** Hauptposition */
  position: Position
  /** Nebenpositionen, die der Spieler tatsächlich gespielt hat */
  altPositions: Position[]
  age: number | null
  birthDate: string | null
  nationality: string | null
  foot: Foot | null
  heightCm: number | null

  currentClubId: string | null
  /** Frei eingetragener Vereinsname, falls der Verein nicht in der DB steht */
  currentClubName: string | null

  marketValueEur: number | null
  /** Aktuelles bzw. gefordertes Jahresgehalt */
  salaryEur: number | null
  contractUntil: string | null

  /** Spielstärke-Niveau der aktuellen Liga, 1 (Top) .. 5 (unterklassig) */
  leagueLevel: number | null

  minutesLastSeason: number | null
  appearances: number | null
  goals: number | null
  assists: number | null

  /** Spielerprofil 0..100 — Basis für den Spielstil-Abgleich */
  pace: number | null
  technique: number | null
  physique: number | null
  defensiveWork: number | null

  /** Wunschländer (ISO-Ländername wie beim Verein hinterlegt) */
  preferredCountries: string[]
  willingToRelocate: boolean

  notes: string | null
  providerRef: string | null
  updatedAt: string
}

export interface Club {
  id: string
  name: string
  country: string
  league: string
  /** 1 (Top-Liga) .. 5 (unterklassig) */
  leagueLevel: number

  /** Eigene Eintragungen — kommen von keiner API */
  transferBudgetEur: number | null
  salaryBudgetEur: number | null
  avgSalaryEur: number | null
  avgSquadAge: number | null

  formation: string | null
  /** Spielstil 0..100 */
  styleTempo: number | null
  stylePossession: number | null
  stylePressing: number | null

  /** Neigung zu jungen Spielern, 0 (nur fertige Spieler) .. 100 (reine Jugendstrategie) */
  youthPolicy: number | null
  /** Bereitschaft, verletzungsanfällige Spieler zu holen, 0..100 */
  riskTolerance: number | null

  /** Positionsbedarf 0 (kein Bedarf) .. 100 (dringend) */
  needs: Partial<Record<Position, number>>

  notes: string | null
  providerRef: string | null
  updatedAt: string
}

export const RUMOR_STAGES = ['interesse', 'kontakt', 'verhandlung', 'einigung'] as const
export type RumorStage = (typeof RUMOR_STAGES)[number]

export const RUMOR_STAGE_WEIGHT: Record<RumorStage, number> = {
  interesse: 0.4,
  kontakt: 0.65,
  verhandlung: 0.85,
  einigung: 1,
}

export interface Rumor {
  id: string
  playerId: string
  clubId: string
  stage: RumorStage
  /** Glaubwürdigkeit der Quelle 0..100 */
  credibility: number
  source: string | null
  url: string | null
  /** Datum des Gerüchts (ISO) — ältere Gerüchte zählen weniger */
  date: string
  note: string | null
  createdBy: string | null
  createdAt: string
}

export interface Injury {
  id: string
  playerId: string
  type: string
  /** 1 (kurz) .. 5 (schwer) */
  severity: number
  startDate: string
  /** null = noch nicht zurück */
  endDate: string | null
  daysOut: number | null
  source: string | null
  createdAt: string
}

export const ASSESSMENT_KINDS = ['einschaetzung', 'kontakt', 'praeferenz'] as const
export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number]

/**
 * Eigene Eintragung der Beratung. Ist sowohl playerId als auch clubId gesetzt,
 * wirkt die Bewertung als direkter Zu-/Abschlag auf genau dieses Paar.
 */
export interface Assessment {
  id: string
  userId: string
  playerId: string | null
  clubId: string | null
  kind: AssessmentKind
  /** -100 (passt gar nicht) .. +100 (passt hervorragend) */
  rating: number
  text: string | null
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'berater'
  createdAt: string
}
