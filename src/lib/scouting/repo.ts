import { getDb, newId } from './db'
import { CriterionKey, defaultWeights } from './criteria'
import {
  Assessment,
  AssessmentKind,
  Club,
  Foot,
  Injury,
  Player,
  Position,
  POSITIONS,
  Rumor,
  RumorStage,
} from './types'

const nowIso = () => new Date().toISOString()

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// ---------------------------------------------------------------------------
// Vereine
// ---------------------------------------------------------------------------

function rowToClub(r: any): Club {
  return {
    id: r.id,
    name: r.name,
    country: r.country ?? '',
    league: r.league ?? '',
    leagueLevel: r.league_level ?? 3,
    transferBudgetEur: r.transfer_budget,
    salaryBudgetEur: r.salary_budget,
    avgSalaryEur: r.avg_salary,
    avgSquadAge: r.avg_squad_age,
    formation: r.formation,
    styleTempo: r.style_tempo,
    stylePossession: r.style_possession,
    stylePressing: r.style_pressing,
    youthPolicy: r.youth_policy,
    riskTolerance: r.risk_tolerance,
    needs: parseJson<Partial<Record<Position, number>>>(r.needs, {}),
    notes: r.notes,
    providerRef: r.provider_ref,
    updatedAt: r.updated_at,
  }
}

export function listClubs(): Club[] {
  return (getDb().prepare('SELECT * FROM clubs ORDER BY name COLLATE NOCASE').all() as any[]).map(
    rowToClub,
  )
}

export function getClub(id: string): Club | null {
  const r = getDb().prepare('SELECT * FROM clubs WHERE id = ?').get(id)
  return r ? rowToClub(r) : null
}

export type ClubInput = Omit<Club, 'id' | 'updatedAt'> & { id?: string }

export function upsertClub(input: ClubInput): Club {
  const id = input.id ?? newId('clb')
  const record = {
    id,
    name: input.name.trim(),
    country: input.country?.trim() ?? '',
    league: input.league?.trim() ?? '',
    league_level: input.leagueLevel ?? 3,
    transfer_budget: input.transferBudgetEur,
    salary_budget: input.salaryBudgetEur,
    avg_salary: input.avgSalaryEur,
    avg_squad_age: input.avgSquadAge,
    formation: input.formation,
    style_tempo: input.styleTempo,
    style_possession: input.stylePossession,
    style_pressing: input.stylePressing,
    youth_policy: input.youthPolicy,
    risk_tolerance: input.riskTolerance,
    needs: JSON.stringify(input.needs ?? {}),
    notes: input.notes,
    provider_ref: input.providerRef,
    updated_at: nowIso(),
  }
  getDb()
    .prepare(
      `INSERT INTO clubs (id, name, country, league, league_level, transfer_budget, salary_budget,
                          avg_salary, avg_squad_age, formation, style_tempo, style_possession,
                          style_pressing, youth_policy, risk_tolerance, needs, notes, provider_ref, updated_at)
       VALUES (@id, @name, @country, @league, @league_level, @transfer_budget, @salary_budget,
               @avg_salary, @avg_squad_age, @formation, @style_tempo, @style_possession,
               @style_pressing, @youth_policy, @risk_tolerance, @needs, @notes, @provider_ref, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, country = excluded.country, league = excluded.league,
         league_level = excluded.league_level, transfer_budget = excluded.transfer_budget,
         salary_budget = excluded.salary_budget, avg_salary = excluded.avg_salary,
         avg_squad_age = excluded.avg_squad_age, formation = excluded.formation,
         style_tempo = excluded.style_tempo, style_possession = excluded.style_possession,
         style_pressing = excluded.style_pressing, youth_policy = excluded.youth_policy,
         risk_tolerance = excluded.risk_tolerance, needs = excluded.needs, notes = excluded.notes,
         provider_ref = COALESCE(excluded.provider_ref, clubs.provider_ref),
         updated_at = excluded.updated_at`,
    )
    .run(record)
  return getClub(id) as Club
}

export function deleteClub(id: string): void {
  getDb().prepare('DELETE FROM clubs WHERE id = ?').run(id)
}

export function findClubByProviderRef(ref: string): Club | null {
  const r = getDb().prepare('SELECT * FROM clubs WHERE provider_ref = ?').get(ref)
  return r ? rowToClub(r) : null
}

// ---------------------------------------------------------------------------
// Spieler
// ---------------------------------------------------------------------------

function rowToPlayer(r: any): Player {
  const alt = parseJson<string[]>(r.alt_positions, []).filter((p): p is Position =>
    (POSITIONS as readonly string[]).includes(p),
  )
  return {
    id: r.id,
    name: r.name,
    position: (POSITIONS as readonly string[]).includes(r.position)
      ? (r.position as Position)
      : 'ZM',
    altPositions: alt,
    age: r.age,
    birthDate: r.birth_date,
    nationality: r.nationality,
    foot: (r.foot as Foot) ?? null,
    heightCm: r.height_cm,
    currentClubId: r.current_club_id,
    currentClubName: r.current_club_name,
    marketValueEur: r.market_value,
    salaryEur: r.salary,
    contractUntil: r.contract_until,
    leagueLevel: r.league_level,
    minutesLastSeason: r.minutes_last_season,
    appearances: r.appearances,
    goals: r.goals,
    assists: r.assists,
    pace: r.pace,
    technique: r.technique,
    physique: r.physique,
    defensiveWork: r.defensive_work,
    preferredCountries: parseJson<string[]>(r.preferred_countries, []),
    willingToRelocate: !!r.willing_to_relocate,
    notes: r.notes,
    providerRef: r.provider_ref,
    updatedAt: r.updated_at,
  }
}

export function listPlayers(search?: string): Player[] {
  const db = getDb()
  const rows = search?.trim()
    ? (db
        .prepare(
          `SELECT * FROM players WHERE name LIKE ? COLLATE NOCASE ORDER BY name COLLATE NOCASE LIMIT 200`,
        )
        .all(`%${search.trim()}%`) as any[])
    : (db.prepare('SELECT * FROM players ORDER BY name COLLATE NOCASE LIMIT 200').all() as any[])
  return rows.map(rowToPlayer)
}

export function getPlayer(id: string): Player | null {
  const r = getDb().prepare('SELECT * FROM players WHERE id = ?').get(id)
  return r ? rowToPlayer(r) : null
}

export type PlayerInput = Omit<Player, 'id' | 'updatedAt'> & { id?: string }

export function upsertPlayer(input: PlayerInput): Player {
  const id = input.id ?? newId('plr')
  const record = {
    id,
    name: input.name.trim(),
    position: input.position,
    alt_positions: JSON.stringify(input.altPositions ?? []),
    age: input.age,
    birth_date: input.birthDate,
    nationality: input.nationality,
    foot: input.foot,
    height_cm: input.heightCm,
    current_club_id: input.currentClubId,
    current_club_name: input.currentClubName,
    market_value: input.marketValueEur,
    salary: input.salaryEur,
    contract_until: input.contractUntil,
    league_level: input.leagueLevel,
    minutes_last_season: input.minutesLastSeason,
    appearances: input.appearances,
    goals: input.goals,
    assists: input.assists,
    pace: input.pace,
    technique: input.technique,
    physique: input.physique,
    defensive_work: input.defensiveWork,
    preferred_countries: JSON.stringify(input.preferredCountries ?? []),
    willing_to_relocate: input.willingToRelocate ? 1 : 0,
    notes: input.notes,
    provider_ref: input.providerRef,
    updated_at: nowIso(),
  }
  getDb()
    .prepare(
      `INSERT INTO players (id, name, position, alt_positions, age, birth_date, nationality, foot,
                            height_cm, current_club_id, current_club_name, market_value, salary,
                            contract_until, league_level, minutes_last_season, appearances, goals,
                            assists, pace, technique, physique, defensive_work, preferred_countries,
                            willing_to_relocate, notes, provider_ref, updated_at)
       VALUES (@id, @name, @position, @alt_positions, @age, @birth_date, @nationality, @foot,
               @height_cm, @current_club_id, @current_club_name, @market_value, @salary,
               @contract_until, @league_level, @minutes_last_season, @appearances, @goals,
               @assists, @pace, @technique, @physique, @defensive_work, @preferred_countries,
               @willing_to_relocate, @notes, @provider_ref, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, position = excluded.position, alt_positions = excluded.alt_positions,
         age = excluded.age, birth_date = excluded.birth_date, nationality = excluded.nationality,
         foot = excluded.foot, height_cm = excluded.height_cm,
         current_club_id = excluded.current_club_id, current_club_name = excluded.current_club_name,
         market_value = excluded.market_value, salary = excluded.salary,
         contract_until = excluded.contract_until, league_level = excluded.league_level,
         minutes_last_season = excluded.minutes_last_season, appearances = excluded.appearances,
         goals = excluded.goals, assists = excluded.assists, pace = excluded.pace,
         technique = excluded.technique, physique = excluded.physique,
         defensive_work = excluded.defensive_work,
         preferred_countries = excluded.preferred_countries,
         willing_to_relocate = excluded.willing_to_relocate, notes = excluded.notes,
         provider_ref = COALESCE(excluded.provider_ref, players.provider_ref),
         updated_at = excluded.updated_at`,
    )
    .run(record)
  return getPlayer(id) as Player
}

export function deletePlayer(id: string): void {
  getDb().prepare('DELETE FROM players WHERE id = ?').run(id)
}

export function findPlayerByProviderRef(ref: string): Player | null {
  const r = getDb().prepare('SELECT * FROM players WHERE provider_ref = ?').get(ref)
  return r ? rowToPlayer(r) : null
}

// ---------------------------------------------------------------------------
// Gerüchte
// ---------------------------------------------------------------------------

function rowToRumor(r: any): Rumor {
  return {
    id: r.id,
    playerId: r.player_id,
    clubId: r.club_id,
    stage: r.stage as RumorStage,
    credibility: r.credibility,
    source: r.source,
    url: r.url,
    date: r.date,
    note: r.note,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }
}

export function listRumors(playerId?: string): Rumor[] {
  const db = getDb()
  const rows = playerId
    ? (db.prepare('SELECT * FROM rumors WHERE player_id = ? ORDER BY date DESC').all(playerId) as any[])
    : (db.prepare('SELECT * FROM rumors ORDER BY date DESC LIMIT 500').all() as any[])
  return rows.map(rowToRumor)
}

export function addRumor(input: Omit<Rumor, 'id' | 'createdAt'>): Rumor {
  const record = {
    id: newId('rum'),
    player_id: input.playerId,
    club_id: input.clubId,
    stage: input.stage,
    credibility: Math.max(0, Math.min(100, input.credibility)),
    source: input.source,
    url: input.url,
    date: input.date,
    note: input.note,
    created_by: input.createdBy,
    created_at: nowIso(),
  }
  getDb()
    .prepare(
      `INSERT INTO rumors (id, player_id, club_id, stage, credibility, source, url, date, note, created_by, created_at)
       VALUES (@id, @player_id, @club_id, @stage, @credibility, @source, @url, @date, @note, @created_by, @created_at)`,
    )
    .run(record)
  return rowToRumor(record)
}

export function deleteRumor(id: string): void {
  getDb().prepare('DELETE FROM rumors WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Verletzungen
// ---------------------------------------------------------------------------

function rowToInjury(r: any): Injury {
  return {
    id: r.id,
    playerId: r.player_id,
    type: r.type,
    severity: r.severity,
    startDate: r.start_date,
    endDate: r.end_date,
    daysOut: r.days_out,
    source: r.source,
    createdAt: r.created_at,
  }
}

export function listInjuries(playerId?: string): Injury[] {
  const db = getDb()
  const rows = playerId
    ? (db
        .prepare('SELECT * FROM injuries WHERE player_id = ? ORDER BY start_date DESC')
        .all(playerId) as any[])
    : (db.prepare('SELECT * FROM injuries ORDER BY start_date DESC LIMIT 1000').all() as any[])
  return rows.map(rowToInjury)
}

export function addInjury(input: Omit<Injury, 'id' | 'createdAt'>): Injury {
  const record = {
    id: newId('inj'),
    player_id: input.playerId,
    type: input.type,
    severity: Math.max(1, Math.min(5, input.severity)),
    start_date: input.startDate,
    end_date: input.endDate,
    days_out: input.daysOut,
    source: input.source,
    created_at: nowIso(),
  }
  getDb()
    .prepare(
      `INSERT INTO injuries (id, player_id, type, severity, start_date, end_date, days_out, source, created_at)
       VALUES (@id, @player_id, @type, @severity, @start_date, @end_date, @days_out, @source, @created_at)`,
    )
    .run(record)
  return rowToInjury(record)
}

export function deleteInjury(id: string): void {
  getDb().prepare('DELETE FROM injuries WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Eigene Einschätzungen
// ---------------------------------------------------------------------------

function rowToAssessment(r: any): Assessment {
  return {
    id: r.id,
    userId: r.user_id,
    playerId: r.player_id,
    clubId: r.club_id,
    kind: r.kind as AssessmentKind,
    rating: r.rating,
    text: r.text,
    createdAt: r.created_at,
  }
}

export function listAssessments(opts: { playerId?: string; clubId?: string } = {}): Assessment[] {
  const db = getDb()
  if (opts.playerId) {
    return (
      db
        .prepare(
          'SELECT * FROM assessments WHERE player_id = ? OR player_id IS NULL ORDER BY created_at DESC',
        )
        .all(opts.playerId) as any[]
    ).map(rowToAssessment)
  }
  if (opts.clubId) {
    return (
      db
        .prepare('SELECT * FROM assessments WHERE club_id = ? ORDER BY created_at DESC')
        .all(opts.clubId) as any[]
    ).map(rowToAssessment)
  }
  return (
    db.prepare('SELECT * FROM assessments ORDER BY created_at DESC LIMIT 500').all() as any[]
  ).map(rowToAssessment)
}

export function addAssessment(input: Omit<Assessment, 'id' | 'createdAt'>): Assessment {
  const record = {
    id: newId('asm'),
    user_id: input.userId,
    player_id: input.playerId,
    club_id: input.clubId,
    kind: input.kind,
    rating: Math.max(-100, Math.min(100, input.rating)),
    text: input.text,
    created_at: nowIso(),
  }
  getDb()
    .prepare(
      `INSERT INTO assessments (id, user_id, player_id, club_id, kind, rating, text, created_at)
       VALUES (@id, @user_id, @player_id, @club_id, @kind, @rating, @text, @created_at)`,
    )
    .run(record)
  return rowToAssessment(record)
}

export function deleteAssessment(id: string): void {
  getDb().prepare('DELETE FROM assessments WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Gewichtung je Benutzer
// ---------------------------------------------------------------------------

export function getWeights(userId: string): Record<CriterionKey, number> {
  const rows = getDb()
    .prepare('SELECT key, value FROM weights WHERE user_id = ?')
    .all(userId) as { key: string; value: number }[]
  const weights = defaultWeights()
  for (const row of rows) {
    if (row.key in weights) weights[row.key as CriterionKey] = row.value
  }
  return weights
}

export function saveWeights(userId: string, weights: Record<string, number>): void {
  const db = getDb()
  const stmt = db.prepare(
    `INSERT INTO weights (user_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
  )
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(weights)) {
      stmt.run(userId, key, Math.max(0, Math.min(100, Math.round(value))))
    }
  })
  tx()
}

export function resetWeights(userId: string): void {
  getDb().prepare('DELETE FROM weights WHERE user_id = ?').run(userId)
}

// ---------------------------------------------------------------------------
// Sync-Protokoll
// ---------------------------------------------------------------------------

export interface SyncLogEntry {
  id: string
  provider: string
  scope: string
  created: number
  updated: number
  message: string | null
  createdAt: string
}

export function addSyncLog(entry: Omit<SyncLogEntry, 'id' | 'createdAt'>): void {
  getDb()
    .prepare(
      `INSERT INTO sync_log (id, provider, scope, created, updated, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      newId('syn'),
      entry.provider,
      entry.scope,
      entry.created,
      entry.updated,
      entry.message,
      nowIso(),
    )
}

export function listSyncLog(limit = 10): SyncLogEntry[] {
  return (
    getDb()
      .prepare('SELECT * FROM sync_log ORDER BY created_at DESC LIMIT ?')
      .all(limit) as any[]
  ).map((r) => ({
    id: r.id,
    provider: r.provider,
    scope: r.scope,
    created: r.created,
    updated: r.updated,
    message: r.message,
    createdAt: r.created_at,
  }))
}
