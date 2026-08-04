import assert from 'node:assert/strict'
import test from 'node:test'
import { matchPlayer, matchPlayerToClub } from './matching'
import { defaultWeights } from './criteria'
import { Assessment, Club, Injury, Player, Rumor } from './types'

const NOW = new Date('2026-08-01T00:00:00.000Z')

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Testspieler',
    position: 'IV',
    altPositions: [],
    age: 25,
    birthDate: null,
    nationality: 'Deutschland',
    foot: 'rechts',
    heightCm: 187,
    currentClubId: null,
    currentClubName: null,
    marketValueEur: 5_000_000,
    salaryEur: 800_000,
    contractUntil: '2028-06-30',
    leagueLevel: 2,
    minutesLastSeason: 2500,
    appearances: 30,
    goals: 2,
    assists: 1,
    pace: 70,
    technique: 70,
    physique: 80,
    defensiveWork: 80,
    preferredCountries: [],
    willingToRelocate: true,
    notes: null,
    providerRef: null,
    updatedAt: NOW.toISOString(),
    ...overrides,
  }
}

function club(overrides: Partial<Club> = {}): Club {
  return {
    id: 'c1',
    name: 'Testverein',
    country: 'Deutschland',
    league: 'Bundesliga',
    leagueLevel: 1,
    transferBudgetEur: 20_000_000,
    salaryBudgetEur: 40_000_000,
    avgSalaryEur: 1_000_000,
    avgSquadAge: 26,
    formation: '4-2-3-1',
    styleTempo: 70,
    stylePossession: 70,
    stylePressing: 70,
    youthPolicy: 50,
    riskTolerance: 50,
    needs: { IV: 80 },
    notes: null,
    providerRef: null,
    updatedAt: NOW.toISOString(),
    ...overrides,
  }
}

const emptyCtx = {
  rumors: [] as Rumor[],
  injuries: [] as Injury[],
  assessments: [] as Assessment[],
  weights: defaultWeights(),
  now: NOW,
}

function criterion(result: ReturnType<typeof matchPlayerToClub>, key: string) {
  const found = result.criteria.find((c) => c.key === key)
  assert.ok(found, `Kriterium ${key} fehlt`)
  return found
}

test('Positionsbedarf: Hauptposition schlägt verwandte Position', () => {
  const direct = matchPlayerToClub(player(), club({ needs: { IV: 80 } }), emptyCtx)
  const related = matchPlayerToClub(player(), club({ needs: { DM: 80 } }), emptyCtx)

  assert.equal(criterion(direct, 'positionsbedarf').score, 0.8)
  assert.ok(
    (criterion(related, 'positionsbedarf').score ?? 0) <
      (criterion(direct, 'positionsbedarf').score ?? 0),
  )
})

test('Positionsbedarf: ohne hinterlegten Bedarf wird das Kriterium ausgeklammert', () => {
  const result = matchPlayerToClub(player(), club({ needs: {} }), emptyCtx)
  assert.equal(criterion(result, 'positionsbedarf').score, null)
  assert.ok(result.missing.includes('Positionsbedarf'))
})

test('Fehlende Daten senken die Datenbasis, nicht die Prozentzahl', () => {
  const full = matchPlayerToClub(player(), club(), emptyCtx)
  const sparse = matchPlayerToClub(
    player({ marketValueEur: null, salaryEur: null, leagueLevel: null }),
    club(),
    emptyCtx,
  )

  assert.ok(sparse.confidence < full.confidence)
  assert.ok(sparse.percent > 0)
})

test('Ablöse: knappes Budget drückt die Bewertung', () => {
  const rich = matchPlayerToClub(player(), club({ transferBudgetEur: 20_000_000 }), emptyCtx)
  const poor = matchPlayerToClub(player(), club({ transferBudgetEur: 1_000_000 }), emptyCtx)

  assert.ok((criterion(rich, 'abloese').score ?? 0) > 0.9)
  assert.ok((criterion(poor, 'abloese').score ?? 1) < 0.3)
  assert.ok(rich.percent > poor.percent)
})

test('Ablöse: auslaufender Vertrag macht auch kleine Budgets tragfähig', () => {
  const longContract = matchPlayerToClub(
    player({ contractUntil: '2030-06-30' }),
    club({ transferBudgetEur: 2_000_000 }),
    emptyCtx,
  )
  const expiring = matchPlayerToClub(
    player({ contractUntil: '2026-10-31' }),
    club({ transferBudgetEur: 2_000_000 }),
    emptyCtx,
  )

  assert.ok((criterion(expiring, 'abloese').score ?? 0) > (criterion(longContract, 'abloese').score ?? 0))
})

test('Gerüchte: mehrere glaubwürdige Meldungen verstärken sich', () => {
  const base: Omit<Rumor, 'id' | 'stage' | 'credibility'> = {
    playerId: 'p1',
    clubId: 'c1',
    source: 'Test',
    url: null,
    date: '2026-07-15',
    note: null,
    createdBy: null,
    createdAt: NOW.toISOString(),
  }
  const one = matchPlayerToClub(player(), club(), {
    ...emptyCtx,
    rumors: [{ ...base, id: 'r1', stage: 'interesse', credibility: 60 }],
  })
  const many = matchPlayerToClub(player(), club(), {
    ...emptyCtx,
    rumors: [
      { ...base, id: 'r1', stage: 'interesse', credibility: 60 },
      { ...base, id: 'r2', stage: 'verhandlung', credibility: 80 },
    ],
  })

  assert.ok((criterion(many, 'geruechte').score ?? 0) > (criterion(one, 'geruechte').score ?? 0))
  assert.ok((criterion(many, 'geruechte').score ?? 0) <= 1)
})

test('Gerüchte: ein glaubwürdiger Verhandlungsstand hebt die Gesamtpassung', () => {
  const ohne = matchPlayerToClub(player(), club(), emptyCtx)
  const mit = matchPlayerToClub(player(), club(), {
    ...emptyCtx,
    rumors: [
      {
        id: 'r1',
        playerId: 'p1',
        clubId: 'c1',
        stage: 'verhandlung',
        credibility: 95,
        source: 'Direktkontakt',
        url: null,
        date: '2026-07-25',
        note: null,
        createdBy: null,
        createdAt: NOW.toISOString(),
      },
    ],
  })

  assert.equal(criterion(ohne, 'geruechte').score, null)
  assert.ok(
    (criterion(mit, 'geruechte').score ?? 0) > 0.9,
    `Verhandlungsstand zu schwach bewertet: ${criterion(mit, 'geruechte').score}`,
  )
  assert.ok(
    mit.percent > ohne.percent,
    `Gesamtpassung sinkt trotz Verhandlungsstand: ${ohne.percent} → ${mit.percent}`,
  )
})

test('Gerüchte: alte Meldungen wiegen weniger als frische', () => {
  const mk = (date: string): Rumor => ({
    id: 'r1',
    playerId: 'p1',
    clubId: 'c1',
    stage: 'verhandlung',
    credibility: 90,
    source: null,
    url: null,
    date,
    note: null,
    createdBy: null,
    createdAt: NOW.toISOString(),
  })
  const fresh = matchPlayerToClub(player(), club(), { ...emptyCtx, rumors: [mk('2026-07-28')] })
  const old = matchPlayerToClub(player(), club(), { ...emptyCtx, rumors: [mk('2024-01-10')] })

  assert.ok((criterion(fresh, 'geruechte').score ?? 0) > (criterion(old, 'geruechte').score ?? 0))
})

test('Gerüchte: ohne jede Meldung bleibt das Kriterium unbewertet', () => {
  const result = matchPlayerToClub(player(), club(), emptyCtx)
  assert.equal(criterion(result, 'geruechte').score, null)
})

test('Verletzungen: lange Ausfälle senken die Bewertung, Risikobereitschaft mildert ab', () => {
  const injuries: Injury[] = [
    {
      id: 'i1',
      playerId: 'p1',
      type: 'Kreuzbandriss',
      severity: 5,
      startDate: '2025-09-01',
      endDate: '2026-03-01',
      daysOut: null,
      source: null,
      createdAt: NOW.toISOString(),
    },
  ]
  const cautious = matchPlayerToClub(player(), club({ riskTolerance: 0 }), { ...emptyCtx, injuries })
  const bold = matchPlayerToClub(player(), club({ riskTolerance: 100 }), { ...emptyCtx, injuries })

  assert.ok((criterion(cautious, 'verletzung').score ?? 1) < 0.5)
  assert.ok((criterion(bold, 'verletzung').score ?? 0) > (criterion(cautious, 'verletzung').score ?? 0))
})

test('Wunschländer: passendes Land bewertet voll, unpassendes deutlich schwächer', () => {
  const wanted = matchPlayerToClub(
    player({ preferredCountries: ['Deutschland'] }),
    club({ country: 'Deutschland' }),
    emptyCtx,
  )
  const unwanted = matchPlayerToClub(
    player({ preferredCountries: ['Deutschland'] }),
    club({ country: 'Italien' }),
    emptyCtx,
  )

  assert.equal(criterion(wanted, 'praeferenz').score, 1)
  assert.ok((criterion(unwanted, 'praeferenz').score ?? 1) < 0.5)
})

test('Eigene Einschätzung: Bewertung zur Paarung wirkt auf das Ergebnis', () => {
  const positive: Assessment = {
    id: 'a1',
    userId: 'u1',
    playerId: 'p1',
    clubId: 'c1',
    kind: 'einschaetzung',
    rating: 90,
    text: null,
    createdAt: NOW.toISOString(),
  }
  const negative: Assessment = { ...positive, id: 'a2', rating: -90 }

  const good = matchPlayerToClub(player(), club(), { ...emptyCtx, assessments: [positive] })
  const bad = matchPlayerToClub(player(), club(), { ...emptyCtx, assessments: [negative] })

  assert.ok(good.percent > bad.percent)
  assert.equal(criterion(good, 'einschaetzung').score, 0.95)
})

test('Gewichtung 0 nimmt ein Kriterium aus der Rechnung', () => {
  const weights = { ...defaultWeights(), abloese: 0 }
  const withAbloese = matchPlayerToClub(player(), club({ transferBudgetEur: 500_000 }), emptyCtx)
  const withoutAbloese = matchPlayerToClub(player(), club({ transferBudgetEur: 500_000 }), {
    ...emptyCtx,
    weights,
  })

  assert.ok(withoutAbloese.percent > withAbloese.percent)
  assert.ok(!withoutAbloese.missing.includes('Ablöse vs. Budget'))
})

test('Rangliste ist absteigend sortiert und lässt den aktuellen Verein aus', () => {
  const p = player({ currentClubId: 'c2' })
  const results = matchPlayer({
    player: p,
    clubs: [
      club({ id: 'c1', name: 'Passend', needs: { IV: 90 } }),
      club({ id: 'c2', name: 'Aktueller Verein' }),
      club({ id: 'c3', name: 'Unpassend', needs: { TW: 90 }, transferBudgetEur: 100_000 }),
    ],
    rumors: [],
    injuries: [],
    assessments: [],
    now: NOW,
  })

  assert.equal(results.length, 2)
  assert.ok(!results.some((r) => r.clubId === 'c2'))
  assert.equal(results[0].clubId, 'c1')
  assert.ok(results[0].percent >= results[1].percent)
})

test('Harte Kriterien deckeln das Ergebnis zusätzlich zum Mittelwert', () => {
  const noNeed = matchPlayerToClub(player(), club({ needs: { TW: 90 } }), emptyCtx)

  assert.equal(criterion(noNeed, 'positionsbedarf').score, 0)
  assert.ok(noNeed.percent < noNeed.basePercent)
  assert.ok(noNeed.gate <= 0.61, `Begrenzung greift nicht: ${noNeed.gate}`)
  assert.deepEqual(
    noNeed.limitedBy.map((c) => c.key),
    ['positionsbedarf'],
  )
})

test('Ohne verfehltes hartes Kriterium bleibt die Bewertung unbegrenzt', () => {
  const good = matchPlayerToClub(player(), club({ needs: { IV: 100 } }), emptyCtx)
  assert.equal(good.limitedBy.length, 0)
  assert.ok(good.gate > 0.95)
})

test('Mehrere verfehlte harte Kriterien verstärken die Begrenzung', () => {
  const one = matchPlayerToClub(player(), club({ needs: { TW: 90 } }), emptyCtx)
  const two = matchPlayerToClub(
    player(),
    club({ needs: { TW: 90 }, transferBudgetEur: 200_000 }),
    emptyCtx,
  )

  assert.ok(two.gate < one.gate)
  assert.ok(two.percent < one.percent)
})

test('Begrenzung schafft klare Abstufung zwischen Bedarf und Nicht-Bedarf', () => {
  const wanted = matchPlayerToClub(player(), club({ needs: { IV: 90 } }), emptyCtx)
  const notWanted = matchPlayerToClub(player(), club({ needs: { ST: 90 } }), emptyCtx)

  assert.ok(
    wanted.percent - notWanted.percent > 25,
    `Abstand zu gering: ${wanted.percent} vs ${notWanted.percent}`,
  )
})

test('Prozentwert bleibt immer im Bereich 0 bis 100', () => {
  const extremes: Club[] = [
    club({ transferBudgetEur: 0, salaryBudgetEur: 0, needs: { TW: 100 } }),
    club({ transferBudgetEur: 900_000_000, salaryBudgetEur: 900_000_000, needs: { IV: 100 } }),
  ]
  for (const c of extremes) {
    const r = matchPlayerToClub(player(), c, emptyCtx)
    assert.ok(r.percent >= 0 && r.percent <= 100, `Prozent außerhalb des Bereichs: ${r.percent}`)
    assert.ok(r.confidence >= 0 && r.confidence <= 100)
  }
})
