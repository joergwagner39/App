import { all, getDb, newId, one, run } from './db'
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

/** libSQL akzeptiert kein undefined — offene Felder werden zu NULL. */
const nz = <T>(value: T | null | undefined): T | null => value ?? null

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

export async function listClubs(): Promise<Club[]> {
  return (await all('SELECT * FROM clubs ORDER BY name COLLATE NOCASE')).map(rowToClub)
}

export async function getClub(id: string): Promise<Club | null> {
  const r = await one('SELECT * FROM clubs WHERE id = ?', [id])
  return r ? rowToClub(r) : null
}

export type ClubInput = Omit<Club, 'id' | 'updatedAt'> & { id?: string }

export async function upsertClub(input: ClubInput): Promise<Club> {
  const id = input.id ?? newId('clb')
  await run(
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
    {
      id,
      name: input.name.trim(),
      country: input.country?.trim() ?? '',
      league: input.league?.trim() ?? '',
      league_level: input.leagueLevel ?? 3,
      transfer_budget: nz(input.transferBudgetEur),
      salary_budget: nz(input.salaryBudgetEur),
      avg_salary: nz(input.avgSalaryEur),
      avg_squad_age: nz(input.avgSquadAge),
      formation: nz(input.formation),
      style_tempo: nz(input.styleTempo),
      style_possession: nz(input.stylePossession),
      style_pressing: nz(input.stylePressing),
      youth_policy: nz(input.youthPolicy),
      risk_tolerance: nz(input.riskTolerance),
      needs: JSON.stringify(input.needs ?? {}),
      notes: nz(input.notes),
      provider_ref: nz(input.providerRef),
      updated_at: nowIso(),
    },
  )
  return (await getClub(id)) as Club
}

export async function deleteClub(id: string): Promise<void> {
  await run('DELETE FROM clubs WHERE id = ?', [id])
}

export async function findClubByProviderRef(ref: string): Promise<Club | null> {
  const r = await one('SELECT * FROM clubs WHERE provider_ref = ?', [ref])
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

export async function listPlayers(search?: string): Promise<Player[]> {
  const rows = search?.trim()
    ? await all(
        'SELECT * FROM players WHERE name LIKE ? COLLATE NOCASE ORDER BY name COLLATE NOCASE LIMIT 200',
        [`%${search.trim()}%`],
      )
    : await all('SELECT * FROM players ORDER BY name COLLATE NOCASE LIMIT 200')
  return rows.map(rowToPlayer)
}

export async function getPlayer(id: string): Promise<Player | null> {
  const r = await one('SELECT * FROM players WHERE id = ?', [id])
  return r ? rowToPlayer(r) : null
}

export type PlayerInput = Omit<Player, 'id' | 'updatedAt'> & { id?: string }

export async function upsertPlayer(input: PlayerInput): Promise<Player> {
  const id = input.id ?? newId('plr')
  await run(
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
    {
      id,
      name: input.name.trim(),
      position: input.position,
      alt_positions: JSON.stringify(input.altPositions ?? []),
      age: nz(input.age),
      birth_date: nz(input.birthDate),
      nationality: nz(input.nationality),
      foot: nz(input.foot),
      height_cm: nz(input.heightCm),
      current_club_id: nz(input.currentClubId),
      current_club_name: nz(input.currentClubName),
      market_value: nz(input.marketValueEur),
      salary: nz(input.salaryEur),
      contract_until: nz(input.contractUntil),
      league_level: nz(input.leagueLevel),
      minutes_last_season: nz(input.minutesLastSeason),
      appearances: nz(input.appearances),
      goals: nz(input.goals),
      assists: nz(input.assists),
      pace: nz(input.pace),
      technique: nz(input.technique),
      physique: nz(input.physique),
      defensive_work: nz(input.defensiveWork),
      preferred_countries: JSON.stringify(input.preferredCountries ?? []),
      willing_to_relocate: input.willingToRelocate ? 1 : 0,
      notes: nz(input.notes),
      provider_ref: nz(input.providerRef),
      updated_at: nowIso(),
    },
  )
  return (await getPlayer(id)) as Player
}

export async function deletePlayer(id: string): Promise<void> {
  await run('DELETE FROM players WHERE id = ?', [id])
}

export async function findPlayerByProviderRef(ref: string): Promise<Player | null> {
  const r = await one('SELECT * FROM players WHERE provider_ref = ?', [ref])
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

export async function listRumors(playerId?: string): Promise<Rumor[]> {
  const rows = playerId
    ? await all('SELECT * FROM rumors WHERE player_id = ? ORDER BY date DESC', [playerId])
    : await all('SELECT * FROM rumors ORDER BY date DESC LIMIT 500')
  return rows.map(rowToRumor)
}

export async function addRumor(input: Omit<Rumor, 'id' | 'createdAt'>): Promise<Rumor> {
  const record = {
    id: newId('rum'),
    player_id: input.playerId,
    club_id: input.clubId,
    stage: input.stage,
    credibility: Math.max(0, Math.min(100, input.credibility)),
    source: nz(input.source),
    url: nz(input.url),
    date: input.date,
    note: nz(input.note),
    created_by: nz(input.createdBy),
    created_at: nowIso(),
  }
  await run(
    `INSERT INTO rumors (id, player_id, club_id, stage, credibility, source, url, date, note, created_by, created_at)
     VALUES (@id, @player_id, @club_id, @stage, @credibility, @source, @url, @date, @note, @created_by, @created_at)`,
    record,
  )
  return rowToRumor(record)
}

export async function deleteRumor(id: string): Promise<void> {
  await run('DELETE FROM rumors WHERE id = ?', [id])
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

export async function listInjuries(playerId?: string): Promise<Injury[]> {
  const rows = playerId
    ? await all('SELECT * FROM injuries WHERE player_id = ? ORDER BY start_date DESC', [playerId])
    : await all('SELECT * FROM injuries ORDER BY start_date DESC LIMIT 1000')
  return rows.map(rowToInjury)
}

export async function addInjury(input: Omit<Injury, 'id' | 'createdAt'>): Promise<Injury> {
  const record = {
    id: newId('inj'),
    player_id: input.playerId,
    type: input.type,
    severity: Math.max(1, Math.min(5, input.severity)),
    start_date: input.startDate,
    end_date: nz(input.endDate),
    days_out: nz(input.daysOut),
    source: nz(input.source),
    created_at: nowIso(),
  }
  await run(
    `INSERT INTO injuries (id, player_id, type, severity, start_date, end_date, days_out, source, created_at)
     VALUES (@id, @player_id, @type, @severity, @start_date, @end_date, @days_out, @source, @created_at)`,
    record,
  )
  return rowToInjury(record)
}

export async function deleteInjury(id: string): Promise<void> {
  await run('DELETE FROM injuries WHERE id = ?', [id])
}

/** Prüft, ob ein Verletzungseintrag bereits vorliegt — verhindert Duplikate beim Abgleich. */
export async function injuryExists(
  playerId: string,
  type: string,
  startDate: string,
): Promise<boolean> {
  const row = await one(
    'SELECT id FROM injuries WHERE player_id = ? AND type = ? AND start_date = ?',
    [playerId, type, startDate],
  )
  return !!row
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

export async function listAssessments(
  opts: { playerId?: string; clubId?: string } = {},
): Promise<Assessment[]> {
  if (opts.playerId) {
    return (
      await all(
        'SELECT * FROM assessments WHERE player_id = ? OR player_id IS NULL ORDER BY created_at DESC',
        [opts.playerId],
      )
    ).map(rowToAssessment)
  }
  if (opts.clubId) {
    return (
      await all('SELECT * FROM assessments WHERE club_id = ? ORDER BY created_at DESC', [
        opts.clubId,
      ])
    ).map(rowToAssessment)
  }
  return (await all('SELECT * FROM assessments ORDER BY created_at DESC LIMIT 500')).map(
    rowToAssessment,
  )
}

export async function addAssessment(
  input: Omit<Assessment, 'id' | 'createdAt'>,
): Promise<Assessment> {
  const record = {
    id: newId('asm'),
    user_id: input.userId,
    player_id: nz(input.playerId),
    club_id: nz(input.clubId),
    kind: input.kind,
    rating: Math.max(-100, Math.min(100, input.rating)),
    text: nz(input.text),
    created_at: nowIso(),
  }
  await run(
    `INSERT INTO assessments (id, user_id, player_id, club_id, kind, rating, text, created_at)
     VALUES (@id, @user_id, @player_id, @club_id, @kind, @rating, @text, @created_at)`,
    record,
  )
  return rowToAssessment(record)
}

export async function deleteAssessment(id: string): Promise<void> {
  await run('DELETE FROM assessments WHERE id = ?', [id])
}

// ---------------------------------------------------------------------------
// Gewichtung je Benutzer
// ---------------------------------------------------------------------------

export async function getWeights(userId: string): Promise<Record<CriterionKey, number>> {
  const rows = await all('SELECT key, value FROM weights WHERE user_id = ?', [userId])
  const weights = defaultWeights()
  for (const row of rows) {
    if (row.key in weights) weights[row.key as CriterionKey] = row.value
  }
  return weights
}

export async function saveWeights(
  userId: string,
  weights: Record<string, number>,
): Promise<void> {
  const entries = Object.entries(weights)
  if (!entries.length) return
  const db = await getDb()
  await db.batch(
    entries.map(([key, value]) => ({
      sql: `INSERT INTO weights (user_id, key, value) VALUES (?, ?, ?)
            ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
      args: [userId, key, Math.max(0, Math.min(100, Math.round(value)))],
    })),
    'write',
  )
}

export async function resetWeights(userId: string): Promise<void> {
  await run('DELETE FROM weights WHERE user_id = ?', [userId])
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

export async function addSyncLog(entry: Omit<SyncLogEntry, 'id' | 'createdAt'>): Promise<void> {
  await run(
    `INSERT INTO sync_log (id, provider, scope, created, updated, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      newId('syn'),
      entry.provider,
      entry.scope,
      entry.created,
      entry.updated,
      nz(entry.message),
      nowIso(),
    ],
  )
}

export async function listSyncLog(limit = 10): Promise<SyncLogEntry[]> {
  return (await all('SELECT * FROM sync_log ORDER BY created_at DESC LIMIT ?', [limit])).map(
    (r) => ({
      id: r.id,
      provider: r.provider,
      scope: r.scope,
      created: r.created,
      updated: r.updated,
      message: r.message,
      createdAt: r.created_at,
    }),
  )
}
