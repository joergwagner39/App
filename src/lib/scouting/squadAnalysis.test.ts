import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeSquad, suggestedNeeds } from './squadAnalysis'
import { Club, Player, Position } from './types'

const NOW = new Date('2026-10-03T00:00:00.000Z')

let counter = 0
function player(position: Position, overrides: Partial<Player> = {}): Player {
  counter++
  return {
    id: `p${counter}`,
    name: `Spieler ${counter}`,
    position,
    altPositions: [],
    age: 25,
    birthDate: null,
    nationality: null,
    foot: null,
    heightCm: null,
    currentClubId: 'c1',
    currentClubName: null,
    marketValueEur: null,
    salaryEur: null,
    contractUntil: '2029-06-30',
    leagueLevel: 1,
    minutesLastSeason: 1500,
    appearances: null,
    goals: null,
    assists: null,
    pace: null,
    technique: null,
    physique: null,
    defensiveWork: null,
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
    transferBudgetEur: null,
    salaryBudgetEur: null,
    avgSalaryEur: null,
    avgSquadAge: null,
    formation: '4-2-3-1',
    styleTempo: null,
    stylePossession: null,
    stylePressing: null,
    youthPolicy: null,
    riskTolerance: null,
    needs: {},
    notes: null,
    providerRef: null,
    updatedAt: NOW.toISOString(),
    ...overrides,
  }
}

/** Kader mit ausreichender Besetzung auf allen Positionen. */
function fullSquad(): Player[] {
  return [
    player('TW'), player('TW'),
    player('IV'), player('IV'), player('IV'), player('IV'),
    player('LV'), player('LV'),
    player('RV'), player('RV'),
    player('DM'), player('DM'),
    player('ZM'), player('ZM'), player('ZM'),
    player('OM'), player('OM'),
    player('LA'), player('LA'),
    player('RA'), player('RA'),
    player('ST'), player('ST'),
  ]
}

function needFor(analysis: ReturnType<typeof analyzeSquad>, position: Position) {
  const found = analysis.needs.find((n) => n.position === position)
  assert.ok(found, `Position ${position} fehlt in der Analyse`)
  return found
}

test('Leerer Kader liefert keine Bedarfe, sondern einen Hinweis', () => {
  const a = analyzeSquad(club(), [], NOW)
  assert.equal(a.needs.length, 0)
  assert.equal(a.squadSize, 0)
  assert.ok(a.caveats.some((c) => c.includes('kein Spieler')))
})

test('Fehlende Position erzeugt hohen Bedarf', () => {
  const squad = fullSquad().filter((p) => p.position !== 'ST')
  const a = analyzeSquad(club(), squad, NOW)
  const st = needFor(a, 'ST')
  assert.ok(st.value > 25, `Sturmbedarf zu niedrig: ${st.value}`)
  assert.ok(
    st.reasons.some((r) => r.includes('kein gelernter')),
    `Begründung fehlt: ${st.reasons.join(' | ')}`,
  )
})

test('Voll besetzter Kader erzeugt kaum Bedarf', () => {
  const a = analyzeSquad(club(), fullSquad(), NOW)
  const maxNeed = Math.max(...a.needs.map((n) => n.value))
  assert.ok(maxNeed < 25, `Unerwarteter Bedarf im vollen Kader: ${maxNeed}`)
})

test('Nebenpositionen zählen anteilig auf die Kaderbreite', () => {
  const ohne = analyzeSquad(club(), fullSquad().filter((p) => p.position !== 'LV'), NOW)
  const mit = analyzeSquad(
    club(),
    [
      ...fullSquad().filter((p) => p.position !== 'LV'),
      player('IV', { altPositions: ['LV'] }),
      player('IV', { altPositions: ['LV'] }),
    ],
    NOW,
  )
  assert.ok(
    needFor(mit, 'LV').value < needFor(ohne, 'LV').value,
    'Nebenpositionen senken den Bedarf nicht',
  )
})

test('Auslaufende Verträge erhöhen den Bedarf', () => {
  const stabil = analyzeSquad(club(), fullSquad(), NOW)
  const auslaufend = analyzeSquad(
    club(),
    fullSquad().map((p) => (p.position === 'IV' ? { ...p, contractUntil: '2027-06-30' } : p)),
    NOW,
  )
  assert.ok(needFor(auslaufend, 'IV').value > needFor(stabil, 'IV').value)
  assert.ok(needFor(auslaufend, 'IV').reasons.some((r) => r.includes('Restlaufzeit')))
})

test('Alternder Kader erhöht den Bedarf', () => {
  const jung = analyzeSquad(club(), fullSquad(), NOW)
  const alt = analyzeSquad(
    club(),
    fullSquad().map((p) => (p.position === 'ZM' ? { ...p, age: 33 } : p)),
    NOW,
  )
  assert.ok(needFor(alt, 'ZM').value > needFor(jung, 'ZM').value)
  assert.ok(needFor(alt, 'ZM').reasons.some((r) => r.includes('ab 31')))
})

test('Last auf einem einzigen Spieler erhöht den Bedarf', () => {
  const verteilt = analyzeSquad(club(), fullSquad(), NOW)
  const einseitig = analyzeSquad(
    club(),
    fullSquad().map((p, i) =>
      p.position === 'TW' ? { ...p, minutesLastSeason: i === 0 ? 3060 : 30 } : p,
    ),
    NOW,
  )
  assert.ok(needFor(einseitig, 'TW').value > needFor(verteilt, 'TW').value)
  assert.ok(needFor(einseitig, 'TW').reasons.some((r) => r.includes('Einsatzzeit')))
})

test('Dreierkette verlangt mehr Innenverteidiger als Viererkette', () => {
  const squad = fullSquad()
  const vierer = analyzeSquad(club({ formation: '4-2-3-1' }), squad, NOW)
  const dreier = analyzeSquad(club({ formation: '3-4-3' }), squad, NOW)
  assert.equal(needFor(vierer, 'IV').target, 4)
  assert.equal(needFor(dreier, 'IV').target, 5)
  assert.ok(needFor(dreier, 'IV').value > needFor(vierer, 'IV').value)
})

test('Bedarfe sind absteigend sortiert und liegen zwischen 0 und 100', () => {
  const a = analyzeSquad(club(), fullSquad().slice(0, 12), NOW)
  for (let i = 1; i < a.needs.length; i++) {
    assert.ok(a.needs[i - 1].value >= a.needs[i].value, 'nicht absteigend sortiert')
  }
  for (const n of a.needs) {
    assert.ok(n.value >= 0 && n.value <= 100, `Wert außerhalb des Bereichs: ${n.value}`)
  }
})

test('Dünner Kader wird als unsichere Grundlage gekennzeichnet', () => {
  const a = analyzeSquad(club(), fullSquad().slice(0, 8), NOW)
  assert.ok(a.caveats.some((c) => c.includes('überschätzt')))
})

test('Fehlende Vertrags- und Minutenangaben werden als Lücke ausgewiesen', () => {
  const squad = fullSquad().map((p) => ({ ...p, contractUntil: null, minutesLastSeason: null }))
  const a = analyzeSquad(club(), squad, NOW)
  assert.ok(a.caveats.some((c) => c.includes('Vertragsenden')))
  assert.ok(a.caveats.some((c) => c.includes('Einsatzminuten')))
})

test('Vorschlag enthält nur Positionen über der Schwelle', () => {
  const squad = fullSquad().filter((p) => p.position !== 'ST')
  const a = analyzeSquad(club(), squad, NOW)
  const suggestion = suggestedNeeds(a, 20)
  assert.ok(suggestion.ST != null, 'Sturm fehlt im Vorschlag')
  for (const value of Object.values(suggestion)) {
    assert.ok((value ?? 0) >= 20)
  }
})

test('Deckende Spieler werden je Position mit Anteil ausgewiesen', () => {
  const squad = [player('IV'), player('DM', { altPositions: ['IV'] })]
  const a = analyzeSquad(club(), squad, NOW)
  const iv = needFor(a, 'IV')
  assert.equal(iv.covering[0].share, 1)
  assert.equal(iv.covering[1].share, 0.8)
  assert.equal(iv.depth, 1.8)
})

test('Aushilfe aus verwandten Positionen ersetzt keinen gelernten Spieler', () => {
  // Kader voller Flügelspieler, aber ohne Mittelstürmer: der Bedarf muss bleiben.
  const squad = [
    player('LA'), player('LA'), player('RA'), player('RA'),
    player('OM'), player('OM'),
  ]
  const a = analyzeSquad(club(), squad, NOW)
  const st = needFor(a, 'ST')
  assert.ok(st.value >= 25, `Sturmbedarf durch Aushilfe wegdiskutiert: ${st.value}`)
  assert.ok(st.depth <= 0.5, `Aushilfe zählt zu stark: ${st.depth}`)
})
