/**
 * Matching-Engine: bewertet ein Spieler-Verein-Paar über gewichtete Einzelkriterien
 * und liefert eine Prozentzahl plus nachvollziehbare Begründung je Kriterium.
 *
 * Grundregel: Kriterien ohne Datengrundlage werden nicht mit 0 bewertet, sondern
 * aus der Rechnung genommen. Sie senken stattdessen die ausgewiesene Datenbasis
 * (confidence), damit ein Treffer mit dünner Datenlage erkennbar bleibt.
 */

import { CRITERIA, CRITERION_META, CriterionKey, defaultWeights } from './criteria'
import {
  Assessment,
  Club,
  Injury,
  Player,
  POSITION_AFFINITY,
  POSITION_LABEL,
  Position,
  Rumor,
  RUMOR_STAGE_WEIGHT,
} from './types'
import { formatEur } from './format'

export interface CriterionResult {
  key: CriterionKey
  label: string
  /** 0..1, oder null wenn keine Datengrundlage vorhanden ist */
  score: number | null
  weight: number
  detail: string
}

export interface MatchResult {
  clubId: string
  club: Club
  /** Gesamtpassung 0..100 (gewichteter Mittelwert nach Anwendung der Begrenzung) */
  percent: number
  /** Gewichteter Mittelwert vor der Begrenzung, 0..100 */
  basePercent: number
  /** Begrenzungsfaktor aus den harten Kriterien, 0..1 */
  gate: number
  /** Harte Kriterien, die die Bewertung spürbar gedeckelt haben */
  limitedBy: CriterionResult[]
  /** Anteil der Gewichtung mit echter Datengrundlage, 0..100 */
  confidence: number
  criteria: CriterionResult[]
  strengths: CriterionResult[]
  concerns: CriterionResult[]
  missing: string[]
}

export interface MatchInput {
  player: Player
  clubs: Club[]
  rumors: Rumor[]
  injuries: Injury[]
  assessments: Assessment[]
  weights?: Partial<Record<CriterionKey, number>>
  /** Referenzdatum für Alters-, Vertrags- und Gerüchte-Berechnung */
  now?: Date
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * Kriterien, an denen ein Wechsel scheitern kann — sie zählen nicht nur im
 * Mittelwert mit, sondern begrenzen das Gesamtergebnis zusätzlich.
 */
const HARD_CRITERIA: CriterionKey[] = ['positionsbedarf', 'abloese', 'gehalt']

/** Deckel, den ein vollständig verfehltes hartes Kriterium setzt. */
const GATE_FLOOR = 0.6

/** Stückweise lineare Kennlinie über Stützstellen [x, y], aufsteigend nach x. */
function curve(x: number, points: [number, number][]): number {
  if (x <= points[0][0]) return points[0][1]
  const last = points[points.length - 1]
  if (x >= last[0]) return last[1]
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
  }
  return last[1]
}

function monthsUntil(iso: string, now: Date): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return NaN
  return (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
}

function daysSince(iso: string, now: Date): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return NaN
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
}

// ---------------------------------------------------------------------------
// Einzelkriterien
// ---------------------------------------------------------------------------

type Outcome = { score: number | null; detail: string }

/** Wirksamer Bedarf des Vereins für diesen Spieler, 0..1, plus die passende Position. */
function positionFit(player: Player, club: Club): { value: number; via: Position | null } {
  let best = 0
  let via: Position | null = null
  for (const [posRaw, needRaw] of Object.entries(club.needs)) {
    const pos = posRaw as Position
    const need = Number(needRaw)
    if (!Number.isFinite(need) || need <= 0) continue

    let affinity = 0
    if (pos === player.position) affinity = 1
    else if (player.altPositions.includes(pos)) affinity = 0.85
    else affinity = POSITION_AFFINITY[player.position]?.[pos] ?? 0

    const value = (need / 100) * affinity
    if (value > best) {
      best = value
      via = pos
    }
  }
  return { value: best, via }
}

function cPositionsbedarf(player: Player, club: Club): Outcome {
  const needsSet = Object.values(club.needs).some((n) => Number(n) > 0)
  if (!needsSet) {
    return { score: null, detail: 'Für diesen Verein ist kein Positionsbedarf hinterlegt.' }
  }
  const { value, via } = positionFit(player, club)
  if (!via) {
    return {
      score: 0,
      detail: `Der gesuchte Bedarf deckt sich nicht mit ${POSITION_LABEL[player.position]}.`,
    }
  }
  const need = Number(club.needs[via])
  const how =
    via === player.position
      ? 'Hauptposition'
      : player.altPositions.includes(via)
        ? 'gelernte Nebenposition'
        : 'verwandte Position'
  return {
    score: clamp01(value),
    detail: `Verein sucht ${POSITION_LABEL[via]} (Bedarf ${need}/100) — für den Spieler ${how}.`,
  }
}

function cSpielzeit(player: Player, club: Club): Outcome {
  const needsSet = Object.values(club.needs).some((n) => Number(n) > 0)
  const hasLevel = player.leagueLevel != null
  if (!needsSet && !hasLevel) {
    return { score: null, detail: 'Weder Bedarf noch bisheriges Spielniveau hinterlegt.' }
  }

  const parts: number[] = []
  const notes: string[] = []

  if (needsSet) {
    const { value } = positionFit(player, club)
    parts.push(value)
    notes.push(`Bedarfslage spricht für ${Math.round(value * 100)}% Einsatzwahrscheinlichkeit`)
  }

  if (hasLevel) {
    // Positiver gap = Verein spielt in schwächerer Liga als der Spieler gewohnt ist.
    const gap = club.leagueLevel - (player.leagueLevel as number)
    const gapScore = curve(gap, [
      [-2, 0.15],
      [-1, 0.35],
      [0, 0.6],
      [1, 0.85],
      [2, 1],
    ])
    parts.push(gapScore)
    notes.push(
      gap > 0
        ? `Spieler kommt aus höherem Niveau (${gap} Stufe${gap > 1 ? 'n' : ''}) — Stammplatzkandidat`
        : gap === 0
          ? 'gleiches Ligenniveau — Konkurrenzkampf offen'
          : `Sprung nach oben (${-gap} Stufe${-gap > 1 ? 'n' : ''}) — Einsatzzeit unsicher`,
    )
  }

  const score = parts.reduce((a, b) => a + b, 0) / parts.length
  return { score: clamp01(score), detail: notes.join('; ') + '.' }
}

function cAbloese(player: Player, club: Club, now: Date): Outcome {
  if (player.marketValueEur == null || club.transferBudgetEur == null) {
    return {
      score: null,
      detail:
        player.marketValueEur == null
          ? 'Kein Marktwert für den Spieler hinterlegt.'
          : 'Kein Transferbudget für den Verein hinterlegt.',
    }
  }

  let expectedFee = player.marketValueEur
  let feeNote = 'erwartete Ablöse auf Marktwertniveau'

  if (player.contractUntil) {
    const m = monthsUntil(player.contractUntil, now)
    if (Number.isFinite(m)) {
      if (m <= 0) {
        expectedFee = 0
        feeNote = 'vertragsfrei — keine Ablöse'
      } else if (m <= 6) {
        expectedFee = player.marketValueEur * 0.35
        feeNote = 'Vertrag läuft binnen 6 Monaten aus — deutlich reduzierte Ablöse erwartbar'
      } else if (m <= 12) {
        expectedFee = player.marketValueEur * 0.65
        feeNote = 'Vertrag unter 12 Monate Restlaufzeit — Abschlag auf den Marktwert'
      }
    }
  }

  if (expectedFee <= 0) {
    return { score: 1, detail: `${feeNote}; Budget ${formatEur(club.transferBudgetEur)}.` }
  }

  const ratio = club.transferBudgetEur / expectedFee
  const score = curve(ratio, [
    [0.3, 0.02],
    [0.5, 0.2],
    [0.8, 0.55],
    [1.0, 0.82],
    [1.3, 0.95],
    [2.0, 1],
  ])
  return {
    score,
    detail: `Budget ${formatEur(club.transferBudgetEur)} gegen ${formatEur(
      Math.round(expectedFee),
    )} (${feeNote}) — Deckung ${Math.round(ratio * 100)}%.`,
  }
}

function cGehalt(player: Player, club: Club): Outcome {
  if (player.salaryEur == null) {
    return { score: null, detail: 'Keine Gehaltsvorstellung hinterlegt.' }
  }
  const parts: number[] = []
  const notes: string[] = []

  if (club.salaryBudgetEur != null && club.salaryBudgetEur > 0) {
    // Faustregel: ein einzelner Spieler sollte rund 18% der Gehaltssumme nicht überschreiten.
    const capacity = club.salaryBudgetEur * 0.18
    const ratio = player.salaryEur / capacity
    parts.push(
      curve(ratio, [
        [0.4, 1],
        [0.8, 0.9],
        [1.0, 0.75],
        [1.4, 0.4],
        [2.0, 0.1],
        [3.0, 0.02],
      ]),
    )
    notes.push(
      `Gehalt ${formatEur(player.salaryEur)} entspricht ${Math.round(
        (player.salaryEur / club.salaryBudgetEur) * 100,
      )}% der Gehaltssumme`,
    )
  }

  if (club.avgSalaryEur != null && club.avgSalaryEur > 0) {
    const multiple = player.salaryEur / club.avgSalaryEur
    parts.push(
      curve(multiple, [
        [0.5, 1],
        [1.5, 0.95],
        [2.5, 0.8],
        [3.5, 0.5],
        [5.0, 0.15],
        [8.0, 0.02],
      ]),
    )
    notes.push(`${multiple.toFixed(1)}-faches Durchschnittsgehalt des Kaders`)
  }

  if (!parts.length) {
    return { score: null, detail: 'Kein Gehaltsbudget und kein Kaderdurchschnitt hinterlegt.' }
  }

  return {
    score: clamp01(parts.reduce((a, b) => a + b, 0) / parts.length),
    detail: notes.join('; ') + '.',
  }
}

function cNiveau(player: Player, club: Club): Outcome {
  if (player.leagueLevel == null) {
    return { score: null, detail: 'Bisheriges Ligenniveau des Spielers nicht hinterlegt.' }
  }
  // Positiver Wert = der Verein spielt höherklassig als der Spieler bisher.
  const step = player.leagueLevel - club.leagueLevel
  const score = curve(step, [
    [-3, 0.15],
    [-2, 0.35],
    [-1, 0.6],
    [0, 0.9],
    [1, 1],
    [2, 0.7],
    [3, 0.35],
  ])
  const detail =
    step === 0
      ? `Gleiches Niveau (Stufe ${club.leagueLevel}) — sportlich stimmiger Wechsel.`
      : step > 0
        ? `Aufstieg um ${step} Niveaustufe${step > 1 ? 'n' : ''} (Stufe ${player.leagueLevel} → ${club.leagueLevel}).`
        : `Abstieg um ${-step} Niveaustufe${-step > 1 ? 'n' : ''} (Stufe ${player.leagueLevel} → ${club.leagueLevel}).`
  return { score, detail }
}

function cGeruechte(player: Player, club: Club, rumors: Rumor[], now: Date): Outcome {
  const playerRumors = rumors.filter((r) => r.playerId === player.id)
  if (!playerRumors.length) {
    return { score: null, detail: 'Für diesen Spieler sind keine Gerüchte erfasst.' }
  }
  const pairRumors = playerRumors.filter((r) => r.clubId === club.id)
  if (!pairRumors.length) {
    return {
      score: 0.25,
      detail: `${playerRumors.length} Gerücht(e) erfasst, aber keines zu diesem Verein.`,
    }
  }

  // Noisy-Or: mehrere unabhängige Meldungen verstärken sich, ohne 100% zu überschreiten.
  let inverse = 1
  let best: Rumor | null = null
  let bestW = -1
  for (const r of pairRumors) {
    const days = daysSince(r.date, now)
    const recency = Number.isFinite(days) ? Math.max(0.15, Math.exp(-days / 240)) : 0.5
    const w = RUMOR_STAGE_WEIGHT[r.stage] * (r.credibility / 100) * recency
    inverse *= 1 - clamp01(w)
    if (w > bestW) {
      bestW = w
      best = r
    }
  }
  // Der Rohwert erreicht selbst bei einer glaubwürdigen Verhandlung nur rund 0,8.
  // Die Kennlinie hebt ihn auf ein Niveau, das der Aussage entspricht: ein
  // dokumentierter Verhandlungsstand ist ein starkes Signal und muss die
  // Gesamtpassung heben, nicht senken.
  const score = curve(clamp01(1 - inverse), [
    [0, 0.15],
    [0.2, 0.45],
    [0.4, 0.7],
    [0.6, 0.85],
    [0.8, 0.95],
    [1, 1],
  ])
  const stageLabel = best ? best.stage : ''
  return {
    score,
    detail: `${pairRumors.length} Meldung(en) zu diesem Verein, stärkste: ${stageLabel}${
      best?.source ? ` (${best.source}` : ''
    }${best?.source ? `, Glaubwürdigkeit ${best.credibility}/100)` : ''}.`,
  }
}

function cVerletzung(player: Player, club: Club, injuries: Injury[], now: Date): Outcome {
  const own = injuries.filter((i) => i.playerId === player.id)
  const dataKnown = own.length > 0 || player.providerRef != null
  if (!dataKnown) {
    return { score: null, detail: 'Keine Verletzungshistorie erfasst.' }
  }

  const windowStart = new Date(now.getTime() - 730 * 24 * 3600 * 1000)
  let daysOut = 0
  let currentlyOut = false
  for (const inj of own) {
    const start = new Date(inj.startDate)
    const end = inj.endDate ? new Date(inj.endDate) : now
    if (!inj.endDate) currentlyOut = true
    const from = start > windowStart ? start : windowStart
    if (end <= from) continue
    daysOut += (end.getTime() - from.getTime()) / (1000 * 3600 * 24)
  }

  // 120 Ausfalltage in zwei Jahren drücken die Basis auf rund 0,5.
  let score = clamp01(1 - Math.min(1, (daysOut / 730) * 3))
  const notes = [`${Math.round(daysOut)} Ausfalltage in 24 Monaten`]
  if (currentlyOut) {
    score *= 0.6
    notes.push('aktuell verletzt')
  }
  if (club.riskTolerance != null) {
    const before = score
    score = score + (1 - score) * (club.riskTolerance / 100) * 0.6
    if (score - before > 0.03) {
      notes.push(`Verein trägt Risiko mit (${club.riskTolerance}/100)`)
    }
  }
  return { score: clamp01(score), detail: notes.join(', ') + '.' }
}

function cSpielstil(player: Player, club: Club): Outcome {
  const pairs: { deficit: number; note: string }[] = []

  if (club.styleTempo != null && player.pace != null) {
    const d = Math.max(0, club.styleTempo - player.pace) / 100
    pairs.push({ deficit: d, note: d > 0.15 ? 'Tempo unter dem Anforderungsprofil' : 'Tempo passt' })
  }
  if (club.stylePossession != null && player.technique != null) {
    const d = Math.max(0, club.stylePossession - player.technique) / 100
    pairs.push({
      deficit: d,
      note: d > 0.15 ? 'Technik für den Ballbesitzstil grenzwertig' : 'Technik passt zum Ballbesitz',
    })
  }
  if (club.stylePressing != null && player.defensiveWork != null) {
    const d = Math.max(0, club.stylePressing - player.defensiveWork) / 100
    pairs.push({
      deficit: d,
      note: d > 0.15 ? 'Defensivarbeit für das Pressing zu niedrig' : 'Defensivarbeit trägt das Pressing',
    })
  }
  if (club.stylePossession != null && player.physique != null) {
    // Wenig Ballbesitz = direktes Spiel = mehr Physis gefordert.
    const d = Math.max(0, 100 - club.stylePossession - player.physique) / 100
    pairs.push({
      deficit: d,
      note: d > 0.15 ? 'Physis für das direkte Spiel knapp' : 'Physis ausreichend',
    })
  }

  if (!pairs.length) {
    return { score: null, detail: 'Spielstil des Vereins oder Spielerprofil nicht hinterlegt.' }
  }

  const avg = pairs.reduce((a, p) => a + p.deficit, 0) / pairs.length
  const score = clamp01(1 - avg * 1.2)
  const worst = pairs.slice().sort((a, b) => b.deficit - a.deficit)[0]
  return { score, detail: `${worst.note} (${pairs.length} Merkmale verglichen).` }
}

function cAlter(player: Player, club: Club): Outcome {
  if (player.age == null) {
    return { score: null, detail: 'Kein Alter hinterlegt.' }
  }
  const parts: number[] = []
  const notes: string[] = []

  if (club.youthPolicy != null) {
    const ideal = 30 - (club.youthPolicy / 100) * 10
    const s = clamp01(1 - Math.abs(player.age - ideal) / 12)
    parts.push(s)
    notes.push(
      `Transferpolitik zielt auf ca. ${ideal.toFixed(0)} Jahre, Spieler ist ${player.age}`,
    )
  }
  if (club.avgSquadAge != null) {
    const s = clamp01(1 - Math.max(0, Math.abs(player.age - club.avgSquadAge) - 3) / 9)
    parts.push(s)
    notes.push(`Kaderschnitt ${club.avgSquadAge.toFixed(1)} Jahre`)
  }

  if (!parts.length) {
    return { score: null, detail: 'Weder Transferpolitik noch Kaderaltersschnitt hinterlegt.' }
  }
  return {
    score: clamp01(parts.reduce((a, b) => a + b, 0) / parts.length),
    detail: notes.join('; ') + '.',
  }
}

function cPraeferenz(player: Player, club: Club): Outcome {
  if (player.preferredCountries.length) {
    const match = player.preferredCountries.some(
      (c) => c.trim().toLowerCase() === club.country.trim().toLowerCase(),
    )
    if (match) {
      return { score: 1, detail: `${club.country} steht auf der Wunschliste des Spielers.` }
    }
    return {
      score: player.willingToRelocate ? 0.35 : 0.1,
      detail: `${club.country} steht nicht auf der Wunschliste (gewünscht: ${player.preferredCountries.join(', ')}).`,
    }
  }
  if (player.willingToRelocate) {
    return { score: 0.7, detail: 'Keine Länderpräferenz, Spieler ist wechselbereit.' }
  }
  return { score: 0.2, detail: 'Spieler ist derzeit nicht wechselbereit.' }
}

function cVertrag(player: Player, now: Date): Outcome {
  if (!player.contractUntil) {
    return { score: null, detail: 'Kein Vertragsende hinterlegt.' }
  }
  const m = monthsUntil(player.contractUntil, now)
  if (!Number.isFinite(m)) {
    return { score: null, detail: 'Vertragsende nicht auswertbar.' }
  }
  const score = curve(m, [
    [0, 1],
    [6, 0.95],
    [12, 0.8],
    [18, 0.6],
    [24, 0.45],
    [36, 0.3],
    [48, 0.2],
  ])
  const detail =
    m <= 0
      ? 'Vertrag ausgelaufen — Wechsel jederzeit möglich.'
      : `Noch ${Math.round(m)} Monate Restlaufzeit.`
  return { score, detail }
}

function cEinschaetzung(player: Player, club: Club, assessments: Assessment[]): Outcome {
  const relevant: { a: Assessment; w: number }[] = []
  for (const a of assessments) {
    if (a.playerId === player.id && a.clubId === club.id) relevant.push({ a, w: 1 })
    else if (a.clubId === club.id && a.playerId == null) relevant.push({ a, w: 0.5 })
  }
  if (!relevant.length) {
    return { score: null, detail: 'Keine eigene Bewertung zu dieser Paarung erfasst.' }
  }
  const sum = relevant.reduce((acc, r) => acc + ((r.a.rating + 100) / 200) * r.w, 0)
  const wsum = relevant.reduce((acc, r) => acc + r.w, 0)
  const pair = relevant.filter((r) => r.w === 1).length
  return {
    score: clamp01(sum / wsum),
    detail: `${relevant.length} eigene Bewertung(en)${pair ? `, davon ${pair} direkt zur Paarung` : ' zum Verein'}.`,
  }
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export function matchPlayerToClub(
  player: Player,
  club: Club,
  ctx: {
    rumors: Rumor[]
    injuries: Injury[]
    assessments: Assessment[]
    weights: Record<CriterionKey, number>
    now: Date
  },
): MatchResult {
  const outcomes: Record<CriterionKey, Outcome> = {
    positionsbedarf: cPositionsbedarf(player, club),
    spielzeit: cSpielzeit(player, club),
    abloese: cAbloese(player, club, ctx.now),
    gehalt: cGehalt(player, club),
    niveau: cNiveau(player, club),
    geruechte: cGeruechte(player, club, ctx.rumors, ctx.now),
    verletzung: cVerletzung(player, club, ctx.injuries, ctx.now),
    spielstil: cSpielstil(player, club),
    alter: cAlter(player, club),
    praeferenz: cPraeferenz(player, club),
    vertrag: cVertrag(player, ctx.now),
    einschaetzung: cEinschaetzung(player, club, ctx.assessments),
  }

  const criteria: CriterionResult[] = CRITERIA.map((key) => ({
    key,
    label: CRITERION_META[key].label,
    score: outcomes[key].score,
    weight: ctx.weights[key] ?? CRITERION_META[key].defaultWeight,
    detail: outcomes[key].detail,
  }))

  let weighted = 0
  let usedWeight = 0
  let totalWeight = 0
  for (const c of criteria) {
    totalWeight += c.weight
    if (c.score == null) continue
    weighted += c.score * c.weight
    usedWeight += c.weight
  }

  const base = usedWeight > 0 ? weighted / usedWeight : 0
  const confidence = totalWeight > 0 ? Math.round((usedWeight / totalWeight) * 100) : 0

  // Harte Kriterien wirken zusätzlich begrenzend. Ein reiner Mittelwert würde
  // sie verwässern: ein Verein, der die Position gar nicht sucht oder den Spieler
  // nicht bezahlen kann, ist kein 80%-Treffer, auch wenn sonst alles passt.
  // Ein Kriterium bei 0 deckelt das Ergebnis auf GATE_FLOOR, mehrere Ausfälle
  // verstärken sich.
  let gate = 1
  const limitedBy: CriterionResult[] = []
  for (const c of criteria) {
    if (!HARD_CRITERIA.includes(c.key) || c.score == null || c.weight <= 0) continue
    const factor = GATE_FLOOR + (1 - GATE_FLOOR) * c.score
    gate *= factor
    // Nur melden, wenn das Kriterium wirklich klemmt (Einzelwert unter 0,5).
    if (factor < 0.8) limitedBy.push(c)
  }
  limitedBy.sort((a, b) => (a.score as number) - (b.score as number))

  const percent = Math.round(base * gate * 100)

  const scored = criteria.filter((c) => c.score != null && c.weight > 0)
  const strengths = scored
    .filter((c) => (c.score as number) >= 0.7)
    .sort((a, b) => (b.score as number) * b.weight - (a.score as number) * a.weight)
    .slice(0, 3)
  const concerns = scored
    .filter((c) => (c.score as number) < 0.45)
    .sort((a, b) => (1 - (b.score as number)) * b.weight - (1 - (a.score as number)) * a.weight)
    .slice(0, 3)

  return {
    clubId: club.id,
    club,
    percent,
    basePercent: Math.round(base * 100),
    gate,
    limitedBy,
    confidence,
    criteria,
    strengths,
    concerns,
    missing: criteria.filter((c) => c.score == null && c.weight > 0).map((c) => c.label),
  }
}

export function matchPlayer(input: MatchInput): MatchResult[] {
  const now = input.now ?? new Date()
  const weights = { ...defaultWeights(), ...(input.weights ?? {}) }
  const ctx = {
    rumors: input.rumors,
    injuries: input.injuries,
    assessments: input.assessments,
    weights,
    now,
  }
  return input.clubs
    .filter((club) => club.id !== input.player.currentClubId)
    .map((club) => matchPlayerToClub(input.player, club, ctx))
    .sort((a, b) => b.percent - a.percent || b.confidence - a.confidence)
}
