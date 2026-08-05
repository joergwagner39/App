'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  authenticate,
  createUser,
  deleteUser,
  endSession,
  startSession,
  userCount,
} from '@/lib/scouting/auth'
import { requireAdmin, requireUser } from '@/lib/scouting/guard'
import {
  addAssessment,
  addInjury,
  addRumor,
  deleteAssessment,
  deleteClub,
  deleteInjury,
  deletePlayer,
  deleteRumor,
  getClub,
  getPlayer,
  resetWeights,
  saveWeights,
  upsertClub,
  upsertPlayer,
} from '@/lib/scouting/repo'
import { parseEur, parseNumber } from '@/lib/scouting/format'
import {
  AssessmentKind,
  ASSESSMENT_KINDS,
  Foot,
  Position,
  POSITIONS,
  RumorStage,
  RUMOR_STAGES,
} from '@/lib/scouting/types'
import { CRITERIA } from '@/lib/scouting/criteria'
import { activeProvider } from '@/lib/scouting/providers'
import { importProviderPlayer, seedDemoData, syncClubs, syncInjuriesForPlayer } from '@/lib/scouting/sync'

// --- Hilfsfunktionen -------------------------------------------------------

const str = (fd: FormData, key: string): string => String(fd.get(key) ?? '').trim()
const strOrNull = (fd: FormData, key: string): string | null => str(fd, key) || null
const intOrNull = (fd: FormData, key: string): number | null => {
  const n = parseNumber(str(fd, key))
  return n == null ? null : Math.round(n)
}
const floatOrNull = (fd: FormData, key: string): number | null => parseNumber(str(fd, key))
const eurOrNull = (fd: FormData, key: string): number | null => parseEur(str(fd, key))

function asPosition(value: string, fallback: Position = 'ZM'): Position {
  return (POSITIONS as readonly string[]).includes(value) ? (value as Position) : fallback
}

function withError(path: string, message: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}fehler=${encodeURIComponent(message)}`)
}

// --- Anmeldung -------------------------------------------------------------

export async function setupAction(formData: FormData) {
  if ((await userCount()) > 0) redirect('/scouting/login')

  const email = str(formData, 'email')
  const name = str(formData, 'name')
  const password = str(formData, 'password')
  const seed = str(formData, 'seed') === 'on'

  let user
  try {
    user = await createUser(email, name, password, 'admin')
  } catch (err) {
    withError('/scouting/einrichten', (err as Error).message)
  }

  if (seed) {
    try {
      await seedDemoData()
    } catch {
      // Demo-Daten sind optional — ein Fehler darf die Einrichtung nicht blockieren.
    }
  }

  await startSession(user.id)
  redirect('/scouting')
}

export async function loginAction(formData: FormData) {
  const email = str(formData, 'email')
  const password = str(formData, 'password')

  const user = await authenticate(email, password)
  if (!user) withError('/scouting/login', 'E-Mail oder Passwort stimmt nicht.')

  await startSession(user.id)
  redirect('/scouting')
}

export async function logoutAction() {
  endSession()
  redirect('/scouting/login')
}

export async function createUserAction(formData: FormData) {
  await requireAdmin()
  const role = str(formData, 'role') === 'admin' ? 'admin' : 'berater'
  try {
    await createUser(str(formData, 'email'), str(formData, 'name'), str(formData, 'password'), role)
  } catch (err) {
    withError('/scouting/einstellungen', (err as Error).message)
  }
  revalidatePath('/scouting/einstellungen')
  redirect('/scouting/einstellungen')
}

export async function deleteUserAction(formData: FormData) {
  const me = await requireAdmin()
  const id = str(formData, 'id')
  if (id === me.id) withError('/scouting/einstellungen', 'Das eigene Konto lässt sich nicht löschen.')
  await deleteUser(id)
  revalidatePath('/scouting/einstellungen')
}

// --- Spieler ---------------------------------------------------------------

export async function savePlayerAction(formData: FormData) {
  await requireUser()
  const id = strOrNull(formData, 'id')
  const name = str(formData, 'name')
  if (!name) {
    withError(id ? `/scouting/spieler/${id}/bearbeiten` : '/scouting/spieler/neu', 'Bitte einen Namen angeben.')
  }

  const existing = id ? await getPlayer(id) : null
  const altPositions = formData
    .getAll('altPositions')
    .map((v) => String(v))
    .filter((v): v is Position => (POSITIONS as readonly string[]).includes(v))

  const preferredCountries = str(formData, 'preferredCountries')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  const foot = str(formData, 'foot')

  const saved = await upsertPlayer({
    id: id ?? undefined,
    name,
    position: asPosition(str(formData, 'position')),
    altPositions,
    age: intOrNull(formData, 'age'),
    birthDate: strOrNull(formData, 'birthDate'),
    nationality: strOrNull(formData, 'nationality'),
    foot: (['links', 'rechts', 'beidfüßig'].includes(foot) ? (foot as Foot) : null),
    heightCm: intOrNull(formData, 'heightCm'),
    currentClubId: strOrNull(formData, 'currentClubId'),
    currentClubName: strOrNull(formData, 'currentClubName'),
    marketValueEur: eurOrNull(formData, 'marketValueEur'),
    salaryEur: eurOrNull(formData, 'salaryEur'),
    contractUntil: strOrNull(formData, 'contractUntil'),
    leagueLevel: intOrNull(formData, 'leagueLevel'),
    minutesLastSeason: intOrNull(formData, 'minutesLastSeason'),
    appearances: intOrNull(formData, 'appearances'),
    goals: intOrNull(formData, 'goals'),
    assists: intOrNull(formData, 'assists'),
    pace: intOrNull(formData, 'pace'),
    technique: intOrNull(formData, 'technique'),
    physique: intOrNull(formData, 'physique'),
    defensiveWork: intOrNull(formData, 'defensiveWork'),
    preferredCountries,
    willingToRelocate: str(formData, 'willingToRelocate') === 'on',
    notes: strOrNull(formData, 'notes'),
    providerRef: existing?.providerRef ?? null,
  })

  revalidatePath('/scouting')
  redirect(`/scouting/spieler/${saved.id}`)
}

export async function deletePlayerAction(formData: FormData) {
  await requireUser()
  await deletePlayer(str(formData, 'id'))
  revalidatePath('/scouting')
  redirect('/scouting')
}

// --- Vereine ---------------------------------------------------------------

export async function saveClubAction(formData: FormData) {
  await requireUser()
  const id = strOrNull(formData, 'id')
  const name = str(formData, 'name')
  if (!name) {
    withError(id ? `/scouting/vereine/${id}` : '/scouting/vereine/neu', 'Bitte einen Vereinsnamen angeben.')
  }

  const existing = id ? await getClub(id) : null

  const needs: Partial<Record<Position, number>> = {}
  for (const pos of POSITIONS) {
    const raw = intOrNull(formData, `need_${pos}`)
    if (raw != null && raw > 0) needs[pos] = Math.max(0, Math.min(100, raw))
  }

  const saved = await upsertClub({
    id: id ?? undefined,
    name,
    country: str(formData, 'country'),
    league: str(formData, 'league'),
    leagueLevel: Math.max(1, Math.min(5, intOrNull(formData, 'leagueLevel') ?? 3)),
    transferBudgetEur: eurOrNull(formData, 'transferBudgetEur'),
    salaryBudgetEur: eurOrNull(formData, 'salaryBudgetEur'),
    avgSalaryEur: eurOrNull(formData, 'avgSalaryEur'),
    avgSquadAge: floatOrNull(formData, 'avgSquadAge'),
    formation: strOrNull(formData, 'formation'),
    styleTempo: intOrNull(formData, 'styleTempo'),
    stylePossession: intOrNull(formData, 'stylePossession'),
    stylePressing: intOrNull(formData, 'stylePressing'),
    youthPolicy: intOrNull(formData, 'youthPolicy'),
    riskTolerance: intOrNull(formData, 'riskTolerance'),
    needs,
    notes: strOrNull(formData, 'notes'),
    providerRef: existing?.providerRef ?? null,
  })

  revalidatePath('/scouting/vereine')
  redirect(`/scouting/vereine/${saved.id}?gespeichert=1`)
}

export async function deleteClubAction(formData: FormData) {
  await requireUser()
  await deleteClub(str(formData, 'id'))
  revalidatePath('/scouting/vereine')
  redirect('/scouting/vereine')
}

// --- Gerüchte, Verletzungen, Einschätzungen --------------------------------

export async function addRumorAction(formData: FormData) {
  const user = await requireUser()
  const playerId = str(formData, 'playerId')
  const clubId = str(formData, 'clubId')
  if (!playerId || !clubId) withError(`/scouting/spieler/${playerId}`, 'Bitte einen Verein auswählen.')

  const stage = str(formData, 'stage')
  await addRumor({
    playerId,
    clubId,
    stage: (RUMOR_STAGES as readonly string[]).includes(stage)
      ? (stage as RumorStage)
      : 'interesse',
    credibility: intOrNull(formData, 'credibility') ?? 50,
    source: strOrNull(formData, 'source'),
    url: strOrNull(formData, 'url'),
    date: strOrNull(formData, 'date') ?? new Date().toISOString().slice(0, 10),
    note: strOrNull(formData, 'note'),
    createdBy: user.id,
  })
  revalidatePath(`/scouting/spieler/${playerId}`)
}

export async function deleteRumorAction(formData: FormData) {
  await requireUser()
  await deleteRumor(str(formData, 'id'))
  revalidatePath(`/scouting/spieler/${str(formData, 'playerId')}`)
}

export async function addInjuryAction(formData: FormData) {
  await requireUser()
  const playerId = str(formData, 'playerId')
  await addInjury({
    playerId,
    type: str(formData, 'type') || 'unbekannt',
    severity: intOrNull(formData, 'severity') ?? 2,
    startDate: strOrNull(formData, 'startDate') ?? new Date().toISOString().slice(0, 10),
    endDate: strOrNull(formData, 'endDate'),
    daysOut: intOrNull(formData, 'daysOut'),
    source: 'manuell',
  })
  revalidatePath(`/scouting/spieler/${playerId}`)
}

export async function deleteInjuryAction(formData: FormData) {
  await requireUser()
  await deleteInjury(str(formData, 'id'))
  revalidatePath(`/scouting/spieler/${str(formData, 'playerId')}`)
}

export async function addAssessmentAction(formData: FormData) {
  const user = await requireUser()
  const playerId = strOrNull(formData, 'playerId')
  const clubId = strOrNull(formData, 'clubId')
  const kind = str(formData, 'kind')

  await addAssessment({
    userId: user.id,
    playerId,
    clubId,
    kind: (ASSESSMENT_KINDS as readonly string[]).includes(kind)
      ? (kind as AssessmentKind)
      : 'einschaetzung',
    rating: intOrNull(formData, 'rating') ?? 0,
    text: strOrNull(formData, 'text'),
  })

  if (playerId) revalidatePath(`/scouting/spieler/${playerId}`)
  if (clubId) revalidatePath(`/scouting/vereine/${clubId}`)
}

export async function deleteAssessmentAction(formData: FormData) {
  await requireUser()
  await deleteAssessment(str(formData, 'id'))
  const playerId = strOrNull(formData, 'playerId')
  const clubId = strOrNull(formData, 'clubId')
  if (playerId) revalidatePath(`/scouting/spieler/${playerId}`)
  if (clubId) revalidatePath(`/scouting/vereine/${clubId}`)
}

// --- Gewichtung ------------------------------------------------------------

export async function saveWeightsAction(formData: FormData) {
  const user = await requireUser()
  const weights: Record<string, number> = {}
  for (const key of CRITERIA) {
    const value = intOrNull(formData, `w_${key}`)
    if (value != null) weights[key] = value
  }
  await saveWeights(user.id, weights)
  revalidatePath('/scouting')
  redirect('/scouting/einstellungen?gespeichert=1')
}

export async function resetWeightsAction() {
  const user = await requireUser()
  await resetWeights(user.id)
  revalidatePath('/scouting/einstellungen')
  redirect('/scouting/einstellungen')
}

// --- Datenabgleich ---------------------------------------------------------

export async function syncClubsAction(formData: FormData) {
  await requireUser()
  const league = strOrNull(formData, 'league')
  try {
    await syncClubs(league ?? undefined)
  } catch (err) {
    withError('/scouting/einstellungen', (err as Error).message)
  }
  revalidatePath('/scouting/vereine')
  redirect('/scouting/einstellungen?abgeglichen=1')
}

export async function seedDemoAction() {
  await requireUser()
  await seedDemoData()
  revalidatePath('/scouting')
  redirect('/scouting?demo=1')
}

export async function syncInjuriesAction(formData: FormData) {
  await requireUser()
  const playerId = str(formData, 'playerId')
  try {
    await syncInjuriesForPlayer(playerId)
  } catch (err) {
    withError(`/scouting/spieler/${playerId}`, (err as Error).message)
  }
  revalidatePath(`/scouting/spieler/${playerId}`)
}

export async function importPlayerAction(formData: FormData) {
  await requireUser()
  const ref = str(formData, 'ref')
  const query = str(formData, 'query')
  const { provider } = activeProvider()

  const results = await provider.searchPlayers(query)
  const found = results.find((p) => p.ref === ref)
  if (!found) withError('/scouting/import', 'Der Spieler wurde beim Anbieter nicht mehr gefunden.')

  const { id } = await importProviderPlayer(found)
  revalidatePath('/scouting')
  redirect(`/scouting/spieler/${id}`)
}
