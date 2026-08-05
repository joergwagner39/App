import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { all, newId, one, run, getMeta, setMeta } from './db'
import { User } from './types'

const COOKIE = 'scouting_session'
const SESSION_DAYS = 14

// ---------------------------------------------------------------------------
// Passwörter
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64)
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, saltB64, hashB64] = stored.split('$')
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false
  const salt = Buffer.from(saltB64, 'base64url')
  const expected = Buffer.from(hashB64, 'base64url')
  const actual = crypto.scryptSync(password, salt, expected.length)
  return crypto.timingSafeEqual(expected, actual)
}

// ---------------------------------------------------------------------------
// Session-Cookie (signiertes Token, kein zusätzlicher Speicher nötig)
// ---------------------------------------------------------------------------

async function sessionSecret(): Promise<Buffer> {
  const fromEnv = process.env.SCOUTING_SESSION_SECRET
  if (fromEnv) return Buffer.from(fromEnv, 'utf8')

  // Ohne gesetztes Secret wird einmalig eines erzeugt und in der Datenbank
  // abgelegt, damit die App auch ohne Konfiguration sofort läuft.
  let stored = await getMeta('session_secret')
  if (!stored) {
    stored = crypto.randomBytes(32).toString('base64url')
    await setMeta('session_secret', stored)
  }
  return Buffer.from(stored, 'utf8')
}

async function sign(payload: string): Promise<string> {
  const secret = await sessionSecret()
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

async function createToken(userId: string): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 24 * 3600 * 1000
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString('base64url')
  return `${payload}.${await sign(payload)}`
}

async function readToken(token: string): Promise<string | null> {
  const [payload, mac] = token.split('.')
  if (!payload || !mac) return null

  const expected = Buffer.from(await sign(payload))
  const actual = Buffer.from(mac)
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return typeof data.uid === 'string' ? data.uid : null
  } catch {
    return null
  }
}

export async function startSession(userId: string): Promise<void> {
  cookies().set(COOKIE, await createToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  })
}

export function endSession(): void {
  cookies().delete(COOKIE)
}

// ---------------------------------------------------------------------------
// Benutzer
// ---------------------------------------------------------------------------

interface UserRow {
  id: string
  email: string
  name: string
  password_hash: string
  role: string
  created_at: string
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === 'admin' ? 'admin' : 'berater',
    createdAt: row.created_at,
  }
}

export async function userCount(): Promise<number> {
  const row = await one('SELECT COUNT(*) AS n FROM users')
  return Number(row?.n ?? 0)
}

export async function listUsers(): Promise<User[]> {
  const rows = (await all('SELECT * FROM users ORDER BY created_at ASC')) as UserRow[]
  return rows.map(toUser)
}

export async function createUser(
  email: string,
  name: string,
  password: string,
  role: 'admin' | 'berater',
): Promise<User> {
  const normalized = email.trim().toLowerCase()
  if (!normalized.includes('@')) throw new Error('Bitte eine gültige E-Mail-Adresse angeben.')
  if (password.length < 8) throw new Error('Das Passwort muss mindestens 8 Zeichen haben.')

  const existing = await one('SELECT id FROM users WHERE email = ?', [normalized])
  if (existing) throw new Error('Für diese E-Mail-Adresse existiert bereits ein Konto.')

  const user: UserRow = {
    id: newId('usr'),
    email: normalized,
    name: name.trim() || normalized,
    password_hash: hashPassword(password),
    role,
    created_at: new Date().toISOString(),
  }
  await run(
    `INSERT INTO users (id, email, name, password_hash, role, created_at)
     VALUES (@id, @email, @name, @password_hash, @role, @created_at)`,
    { ...user },
  )
  return toUser(user)
}

export async function deleteUser(id: string): Promise<void> {
  await run('DELETE FROM users WHERE id = ?', [id])
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  const row = (await one('SELECT * FROM users WHERE email = ?', [
    email.trim().toLowerCase(),
  ])) as UserRow | null
  if (!row) {
    // Gleiche Laufzeit wie bei existierendem Konto, damit die Antwort nichts verrät.
    crypto.scryptSync(password, 'dummy', 64)
    return null
  }
  if (!verifyPassword(password, row.password_hash)) return null
  return toUser(row)
}

export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(COOKIE)?.value
  if (!token) return null
  const uid = await readToken(token)
  if (!uid) return null
  const row = (await one('SELECT * FROM users WHERE id = ?', [uid])) as UserRow | null
  return row ? toUser(row) : null
}
