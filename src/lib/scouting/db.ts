import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

/**
 * SQLite-Anbindung. Der Pfad lässt sich über SCOUTING_DB_PATH umbiegen, damit
 * die Datenbank beim Deployment auf einem persistenten Volume liegen kann.
 */
const DB_PATH =
  process.env.SCOUTING_DB_PATH ?? path.join(process.cwd(), 'data', 'scouting.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'berater',
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id                 TEXT PRIMARY KEY,
      name               TEXT NOT NULL,
      country            TEXT NOT NULL DEFAULT '',
      league             TEXT NOT NULL DEFAULT '',
      league_level       INTEGER NOT NULL DEFAULT 3,
      transfer_budget    INTEGER,
      salary_budget      INTEGER,
      avg_salary         INTEGER,
      avg_squad_age      REAL,
      formation          TEXT,
      style_tempo        INTEGER,
      style_possession   INTEGER,
      style_pressing     INTEGER,
      youth_policy       INTEGER,
      risk_tolerance     INTEGER,
      needs              TEXT NOT NULL DEFAULT '{}',
      notes              TEXT,
      provider_ref       TEXT,
      updated_at         TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_clubs_provider ON clubs(provider_ref);

    CREATE TABLE IF NOT EXISTS players (
      id                   TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      position             TEXT NOT NULL,
      alt_positions        TEXT NOT NULL DEFAULT '[]',
      age                  INTEGER,
      birth_date           TEXT,
      nationality          TEXT,
      foot                 TEXT,
      height_cm            INTEGER,
      current_club_id      TEXT REFERENCES clubs(id) ON DELETE SET NULL,
      current_club_name    TEXT,
      market_value         INTEGER,
      salary               INTEGER,
      contract_until       TEXT,
      league_level         INTEGER,
      minutes_last_season  INTEGER,
      appearances          INTEGER,
      goals                INTEGER,
      assists              INTEGER,
      pace                 INTEGER,
      technique            INTEGER,
      physique             INTEGER,
      defensive_work       INTEGER,
      preferred_countries  TEXT NOT NULL DEFAULT '[]',
      willing_to_relocate  INTEGER NOT NULL DEFAULT 1,
      notes                TEXT,
      provider_ref         TEXT,
      updated_at           TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_players_provider ON players(provider_ref);
    CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);

    CREATE TABLE IF NOT EXISTS rumors (
      id          TEXT PRIMARY KEY,
      player_id   TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      club_id     TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      stage       TEXT NOT NULL,
      credibility INTEGER NOT NULL DEFAULT 50,
      source      TEXT,
      url         TEXT,
      date        TEXT NOT NULL,
      note        TEXT,
      created_by  TEXT,
      created_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rumors_player ON rumors(player_id);

    CREATE TABLE IF NOT EXISTS injuries (
      id         TEXT PRIMARY KEY,
      player_id  TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      type       TEXT NOT NULL,
      severity   INTEGER NOT NULL DEFAULT 2,
      start_date TEXT NOT NULL,
      end_date   TEXT,
      days_out   INTEGER,
      source     TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_injuries_player ON injuries(player_id);

    CREATE TABLE IF NOT EXISTS assessments (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      player_id  TEXT REFERENCES players(id) ON DELETE CASCADE,
      club_id    TEXT REFERENCES clubs(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL DEFAULT 'einschaetzung',
      rating     INTEGER NOT NULL DEFAULT 0,
      text       TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_assessments_player ON assessments(player_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_club ON assessments(club_id);

    CREATE TABLE IF NOT EXISTS weights (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key     TEXT NOT NULL,
      value   INTEGER NOT NULL,
      PRIMARY KEY (user_id, key)
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id         TEXT PRIMARY KEY,
      provider   TEXT NOT NULL,
      scope      TEXT NOT NULL,
      created    INTEGER NOT NULL DEFAULT 0,
      updated    INTEGER NOT NULL DEFAULT 0,
      message    TEXT,
      created_at TEXT NOT NULL
    );
  `)
}

export function getMeta(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

export function setMeta(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    .run(key, value)
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`
}
