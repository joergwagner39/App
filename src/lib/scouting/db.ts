import fs from 'node:fs'
import path from 'node:path'
import { createClient, type Client, type InValue } from '@libsql/client'

/**
 * Datenbankanbindung über libSQL.
 *
 * Derselbe Client spricht beides: eine lokale SQLite-Datei in der Entwicklung
 * und eine gehostete Turso-Datenbank in der Produktion. Deshalb gibt es nur eine
 * Datenschicht statt zweier Implementierungen.
 *
 *   Lokal     — nichts setzen, oder SCOUTING_DB_PATH auf eine Datei zeigen lassen
 *   Turso     — TURSO_DATABASE_URL und TURSO_AUTH_TOKEN setzen
 *
 * Auf Vercel ist die lokale Variante keine Option: das Dateisystem einer
 * Serverless-Funktion ist nach dem Request wieder weg. Ohne TURSO_DATABASE_URL
 * bricht der Start dort deshalb bewusst mit einer klaren Meldung ab, statt Daten
 * stillschweigend zu verlieren.
 */

function resolveConfig(): { url: string; authToken?: string } {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim()
  if (tursoUrl) {
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim()
    if (!authToken && !tursoUrl.startsWith('file:')) {
      throw new Error(
        'TURSO_DATABASE_URL ist gesetzt, TURSO_AUTH_TOKEN fehlt. Beide Werte stehen im Turso-Dashboard.',
      )
    }
    return { url: tursoUrl, authToken }
  }

  if (process.env.VERCEL) {
    throw new Error(
      'Auf Vercel wird eine Turso-Datenbank benötigt: TURSO_DATABASE_URL und TURSO_AUTH_TOKEN ' +
        'in den Projekt-Umgebungsvariablen setzen. Eine lokale SQLite-Datei überlebt dort keinen Request.',
    )
  }

  const filePath = process.env.SCOUTING_DB_PATH ?? path.join(process.cwd(), 'data', 'scouting.db')
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  return { url: `file:${filePath}` }
}

let clientPromise: Promise<Client> | null = null

export function getDb(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient(resolveConfig())
      await migrate(client)
      return client
    })().catch((err) => {
      // Ein fehlgeschlagener Aufbau darf nicht dauerhaft zwischengespeichert
      // werden, sonst bleibt die App auch nach korrigierter Konfiguration tot.
      clientPromise = null
      throw err
    })
  }
  return clientPromise
}

async function migrate(client: Client) {
  await client.executeMultiple(`
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

// ---------------------------------------------------------------------------
// Kleine Hilfen, damit die Repository-Schicht knapp bleibt
// ---------------------------------------------------------------------------

export type Args = Record<string, InValue> | InValue[]

/** Alle Zeilen einer Abfrage als einfache Objekte. */
export async function all(sql: string, args?: Args): Promise<any[]> {
  const db = await getDb()
  const result = await db.execute(args === undefined ? sql : { sql, args })
  return result.rows as unknown as any[]
}

/** Erste Zeile oder null. */
export async function one(sql: string, args?: Args): Promise<any | null> {
  const rows = await all(sql, args)
  return rows[0] ?? null
}

/** Schreibender Aufruf ohne Rückgabe. */
export async function run(sql: string, args?: Args): Promise<void> {
  const db = await getDb()
  await db.execute(args === undefined ? sql : { sql, args })
}

export async function getMeta(key: string): Promise<string | null> {
  const row = await one('SELECT value FROM meta WHERE key = ?', [key])
  return row?.value ?? null
}

export async function setMeta(key: string, value: string): Promise<void> {
  await run(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  )
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`
}
