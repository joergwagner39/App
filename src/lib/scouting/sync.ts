import {
  addInjury,
  addSyncLog,
  findClubByProviderRef,
  findPlayerByProviderRef,
  getPlayer,
  injuryExists,
  listClubs,
  upsertClub,
  upsertPlayer,
} from './repo'
import { activeProvider } from './providers'
import { ProviderPlayer } from './providers/types'

export interface SyncResult {
  provider: string
  created: number
  updated: number
  message: string
}

/**
 * Vereine aus dem Provider übernehmen.
 *
 * Manuell gepflegte Felder (Budgets, Bedarf, Spielstil, Notizen) werden nie
 * überschrieben. Auch das Ligenniveau bleibt stehen, sobald ein Verein einmal
 * angelegt ist — die Feineinstufung ist eine fachliche Entscheidung.
 */
export async function syncClubs(league?: string): Promise<SyncResult> {
  const { provider } = activeProvider()
  const clubs = await provider.listClubs({ league })

  let created = 0
  let updated = 0
  for (const c of clubs) {
    const existing = await findClubByProviderRef(c.ref)
    if (existing) {
      await upsertClub({
        ...existing,
        name: c.name,
        country: c.country || existing.country,
        league: c.league || existing.league,
      })
      updated++
    } else {
      await upsertClub({
        name: c.name,
        country: c.country,
        league: c.league,
        leagueLevel: c.leagueLevel ?? 3,
        transferBudgetEur: null,
        salaryBudgetEur: null,
        avgSalaryEur: null,
        avgSquadAge: null,
        formation: null,
        styleTempo: null,
        stylePossession: null,
        stylePressing: null,
        youthPolicy: null,
        riskTolerance: null,
        needs: {},
        notes: null,
        providerRef: c.ref,
      })
      created++
    }
  }

  const message = `${clubs.length} Vereine vom Anbieter gelesen. Budgets, Bedarf und Spielstil müssen weiterhin manuell gepflegt werden.`
  await addSyncLog({ provider: provider.id, scope: 'clubs', created, updated, message })
  return { provider: provider.id, created, updated, message }
}

/** Einen Spieler aus dem Provider übernehmen bzw. aktualisieren. */
export async function importProviderPlayer(
  p: ProviderPlayer,
): Promise<{ id: string; isNew: boolean }> {
  const existing = await findPlayerByProviderRef(p.ref)
  const club = p.clubRef ? await findClubByProviderRef(p.clubRef) : null

  if (existing) {
    // Nur Anbieterfelder aktualisieren; alles manuell Gepflegte bleibt unangetastet.
    const saved = await upsertPlayer({
      ...existing,
      name: p.name || existing.name,
      age: p.age ?? existing.age,
      birthDate: p.birthDate ?? existing.birthDate,
      nationality: p.nationality ?? existing.nationality,
      foot: p.foot ?? existing.foot,
      heightCm: p.heightCm ?? existing.heightCm,
      currentClubId: club?.id ?? existing.currentClubId,
      currentClubName: p.clubName ?? existing.currentClubName,
      minutesLastSeason: p.minutesLastSeason ?? existing.minutesLastSeason,
      appearances: p.appearances ?? existing.appearances,
      goals: p.goals ?? existing.goals,
      assists: p.assists ?? existing.assists,
    })
    return { id: saved.id, isNew: false }
  }

  const saved = await upsertPlayer({
    name: p.name,
    position: p.position ?? 'ZM',
    altPositions: p.altPositions ?? [],
    age: p.age,
    birthDate: p.birthDate,
    nationality: p.nationality,
    foot: p.foot,
    heightCm: p.heightCm,
    currentClubId: club?.id ?? null,
    currentClubName: p.clubName,
    marketValueEur: p.marketValueEur,
    salaryEur: null,
    contractUntil: p.contractUntil,
    leagueLevel: club?.leagueLevel ?? null,
    minutesLastSeason: p.minutesLastSeason,
    appearances: p.appearances,
    goals: p.goals,
    assists: p.assists,
    pace: null,
    technique: null,
    physique: null,
    defensiveWork: null,
    preferredCountries: [],
    willingToRelocate: true,
    notes: null,
    providerRef: p.ref,
  })
  return { id: saved.id, isNew: true }
}

/** Verletzungen eines Spielers nachziehen, ohne Duplikate anzulegen. */
export async function syncInjuriesForPlayer(playerId: string): Promise<SyncResult> {
  const { provider } = activeProvider()
  const player = await getPlayer(playerId)
  if (!player) throw new Error('Spieler nicht gefunden.')
  if (!player.providerRef) {
    throw new Error('Dieser Spieler stammt nicht vom Anbieter — Verletzungen bitte manuell pflegen.')
  }

  const injuries = await provider.listInjuries({ playerRef: player.providerRef })

  let created = 0
  for (const inj of injuries) {
    const startDate = inj.startDate.slice(0, 10)
    if (await injuryExists(playerId, inj.type, startDate)) continue
    await addInjury({
      playerId,
      type: inj.type,
      severity: inj.severity ?? 2,
      startDate,
      endDate: inj.endDate ? inj.endDate.slice(0, 10) : null,
      daysOut: null,
      source: provider.id,
    })
    created++
  }

  const message = `${injuries.length} Einträge gelesen, ${created} neu übernommen.`
  await addSyncLog({ provider: provider.id, scope: `injuries:${playerId}`, created, updated: 0, message })
  return { provider: provider.id, created, updated: 0, message }
}

/**
 * Erstbefüllung mit Demo-Daten: Vereine inklusive Bedarf, Budget und Spielstil,
 * damit die Matching-Logik direkt etwas zu rechnen hat.
 */
export async function seedDemoData(): Promise<{ clubs: number; players: number }> {
  const { demoProvider } = await import('./providers/demo')

  const profiles: Record<
    string,
    Pick<
      Parameters<typeof upsertClub>[0],
      | 'transferBudgetEur'
      | 'salaryBudgetEur'
      | 'avgSalaryEur'
      | 'avgSquadAge'
      | 'formation'
      | 'styleTempo'
      | 'stylePossession'
      | 'stylePressing'
      | 'youthPolicy'
      | 'riskTolerance'
      | 'needs'
    >
  > = {
    'demo:c1': {
      transferBudgetEur: 45_000_000,
      salaryBudgetEur: 90_000_000,
      avgSalaryEur: 3_200_000,
      avgSquadAge: 26.4,
      formation: '4-2-3-1',
      styleTempo: 72,
      stylePossession: 78,
      stylePressing: 80,
      youthPolicy: 55,
      riskTolerance: 40,
      needs: { IV: 70, ZM: 40, RA: 85 },
    },
    'demo:c2': {
      transferBudgetEur: 18_000_000,
      salaryBudgetEur: 42_000_000,
      avgSalaryEur: 1_500_000,
      avgSquadAge: 25.1,
      formation: '3-4-3',
      styleTempo: 85,
      stylePossession: 52,
      stylePressing: 88,
      youthPolicy: 80,
      riskTolerance: 55,
      needs: { ST: 90, IV: 55, DM: 35 },
    },
    'demo:c3': {
      transferBudgetEur: 4_000_000,
      salaryBudgetEur: 12_000_000,
      avgSalaryEur: 450_000,
      avgSquadAge: 25.8,
      formation: '4-4-2',
      styleTempo: 68,
      stylePossession: 45,
      stylePressing: 62,
      youthPolicy: 60,
      riskTolerance: 60,
      needs: { OM: 60, LV: 45 },
    },
    'demo:c4': {
      transferBudgetEur: 6_500_000,
      salaryBudgetEur: 16_000_000,
      avgSalaryEur: 600_000,
      avgSquadAge: 27.2,
      formation: '4-3-3',
      styleTempo: 60,
      stylePossession: 62,
      stylePressing: 58,
      youthPolicy: 35,
      riskTolerance: 45,
      needs: { ST: 65, IV: 70, TW: 30 },
    },
    'demo:c5': {
      transferBudgetEur: 800_000,
      salaryBudgetEur: 4_000_000,
      avgSalaryEur: 160_000,
      avgSquadAge: 24.6,
      formation: '4-2-3-1',
      styleTempo: 74,
      stylePossession: 40,
      stylePressing: 70,
      youthPolicy: 85,
      riskTolerance: 70,
      needs: { ZM: 55, RA: 50, IV: 40 },
    },
    'demo:c6': {
      transferBudgetEur: 30_000_000,
      salaryBudgetEur: 65_000_000,
      avgSalaryEur: 2_400_000,
      avgSquadAge: 25.5,
      formation: '4-3-3',
      styleTempo: 78,
      stylePossession: 70,
      stylePressing: 75,
      youthPolicy: 70,
      riskTolerance: 45,
      needs: { IV: 80, LA: 45 },
    },
    'demo:c7': {
      transferBudgetEur: 25_000_000,
      salaryBudgetEur: 70_000_000,
      avgSalaryEur: 2_600_000,
      avgSquadAge: 28.1,
      formation: '3-5-2',
      styleTempo: 55,
      stylePossession: 58,
      stylePressing: 52,
      youthPolicy: 25,
      riskTolerance: 35,
      needs: { ZM: 75, ST: 50 },
    },
    'demo:c8': {
      transferBudgetEur: 20_000_000,
      salaryBudgetEur: 55_000_000,
      avgSalaryEur: 2_000_000,
      avgSquadAge: 26.9,
      formation: '4-3-3',
      styleTempo: 62,
      stylePossession: 82,
      stylePressing: 68,
      youthPolicy: 50,
      riskTolerance: 40,
      needs: { RA: 60, DM: 70 },
    },
    'demo:c9': {
      transferBudgetEur: 9_000_000,
      salaryBudgetEur: 20_000_000,
      avgSalaryEur: 800_000,
      avgSquadAge: 23.9,
      formation: '4-3-3',
      styleTempo: 80,
      stylePossession: 74,
      stylePressing: 82,
      youthPolicy: 95,
      riskTolerance: 60,
      needs: { IV: 65, ST: 55, LV: 40 },
    },
    'demo:c10': {
      transferBudgetEur: 14_000_000,
      salaryBudgetEur: 35_000_000,
      avgSalaryEur: 1_300_000,
      avgSquadAge: 26.2,
      formation: '4-2-3-1',
      styleTempo: 82,
      stylePossession: 48,
      stylePressing: 72,
      youthPolicy: 45,
      riskTolerance: 55,
      needs: { OM: 80, IV: 50, RV: 45 },
    },
  }

  const clubs = await demoProvider.listClubs({})
  let clubCount = 0
  for (const c of clubs) {
    if (await findClubByProviderRef(c.ref)) continue
    const profile = profiles[c.ref] ?? {
      transferBudgetEur: null,
      salaryBudgetEur: null,
      avgSalaryEur: null,
      avgSquadAge: null,
      formation: null,
      styleTempo: null,
      stylePossession: null,
      stylePressing: null,
      youthPolicy: null,
      riskTolerance: null,
      needs: {},
    }
    await upsertClub({
      name: c.name,
      country: c.country,
      league: c.league,
      leagueLevel: c.leagueLevel ?? 3,
      notes: null,
      providerRef: c.ref,
      ...profile,
    })
    clubCount++
  }

  const attributes: Record<
    string,
    { pace: number; technique: number; physique: number; defensiveWork: number; salary: number }
  > = {
    'demo:p1': { pace: 68, technique: 62, physique: 84, defensiveWork: 80, salary: 550_000 },
    'demo:p2': { pace: 86, technique: 71, physique: 66, defensiveWork: 45, salary: 220_000 },
    'demo:p3': { pace: 64, technique: 88, physique: 70, defensiveWork: 74, salary: 2_800_000 },
    'demo:p4': { pace: 90, technique: 84, physique: 55, defensiveWork: 42, salary: 1_400_000 },
    'demo:p5': { pace: 52, technique: 66, physique: 78, defensiveWork: 60, salary: 700_000 },
    'demo:p6': { pace: 70, technique: 69, physique: 82, defensiveWork: 88, salary: 900_000 },
  }

  const players = await demoProvider.searchPlayers('')
  let playerCount = 0
  for (const p of players) {
    if (await findPlayerByProviderRef(p.ref)) continue
    const { id } = await importProviderPlayer(p)
    const attr = attributes[p.ref]
    const stored = await getPlayer(id)
    if (stored && attr) {
      await upsertPlayer({
        ...stored,
        pace: attr.pace,
        technique: attr.technique,
        physique: attr.physique,
        defensiveWork: attr.defensiveWork,
        salaryEur: attr.salary,
        leagueLevel:
          stored.leagueLevel ??
          clubs.find((c) => c.ref === p.clubRef)?.leagueLevel ??
          null,
      })
    }
    await syncInjuriesForPlayerRef(id, p.ref)
    playerCount++
  }

  return { clubs: clubCount, players: playerCount }
}

async function syncInjuriesForPlayerRef(playerId: string, ref: string) {
  const { demoProvider } = await import('./providers/demo')
  const injuries = await demoProvider.listInjuries({ playerRef: ref })
  for (const inj of injuries) {
    const startDate = inj.startDate.slice(0, 10)
    if (await injuryExists(playerId, inj.type, startDate)) continue
    await addInjury({
      playerId,
      type: inj.type,
      severity: inj.severity ?? 2,
      startDate,
      endDate: inj.endDate ? inj.endDate.slice(0, 10) : null,
      daysOut: null,
      source: 'demo',
    })
  }
}

export async function hasAnyData(): Promise<boolean> {
  return (await listClubs()).length > 0
}
