/**
 * Bedarfsanalyse: leitet aus dem Kader eines Vereins her, welche Positionen er
 * vermutlich sucht.
 *
 * Grundgedanke: Bedarf entsteht nicht nur dort, wo wenige Spieler stehen, sondern
 * auch dort, wo der Kader altert, Verträge auslaufen oder die Last auf einem
 * einzigen Spieler liegt. Vier Signale, getrennt ausgewiesen, damit nachvollziehbar
 * bleibt, woher ein Wert kommt.
 *
 * Das Ergebnis ist ein Vorschlag, keine Festlegung — der Verein kennt seine
 * Planung besser als jede Kaderstatistik. In der Oberfläche steht der Vorschlag
 * deshalb neben dem manuell gepflegten Wert und wird erst auf Knopfdruck
 * übernommen.
 */

import {
  Club,
  Player,
  Position,
  POSITIONS,
  POSITION_AFFINITY,
  POSITION_LABEL,
} from './types'

/** Wie viele einsatzfähige Spieler eine Position normalerweise braucht. */
const BASE_TARGET: Record<Position, number> = {
  TW: 2,
  IV: 4,
  LV: 2,
  RV: 2,
  DM: 2,
  ZM: 3,
  OM: 2,
  LA: 2,
  RA: 2,
  ST: 2,
}

/**
 * Formationsabhängiger Zuschlag. Eine Dreierkette braucht mehr Innenverteidiger,
 * ein System mit Flügelstürmern mehr Außenbahnspieler.
 */
function targetDepth(formation: string | null): Record<Position, number> {
  const target = { ...BASE_TARGET }
  const f = (formation ?? '').replace(/\s/g, '')

  if (/^3-/.test(f)) {
    target.IV = 5
    target.LV = 2
    target.RV = 2
  }
  if (/-3-3$/.test(f) || /-2-3-1$/.test(f)) {
    target.LA = 2
    target.RA = 2
  }
  if (/-4-2$/.test(f)) {
    target.ST = 3
    target.LA = 1
    target.RA = 1
  }
  if (/-5-2$/.test(f)) {
    target.ZM = 4
  }
  return target
}

export interface PositionNeed {
  position: Position
  /** Vorschlag 0..100 */
  value: number
  /** Gewichtete Kaderbreite auf dieser Position */
  depth: number
  target: number
  /** Spieler, die diese Position abdecken, nach Abdeckungsgrad sortiert */
  covering: { player: Player; share: number }[]
  /** Einzelne Begründungen, stärkste zuerst */
  reasons: string[]
}

export interface SquadAnalysis {
  clubId: string
  /** Spieler im Kader, die in der App erfasst sind */
  squadSize: number
  needs: PositionNeed[]
  /** Hinweise zur Belastbarkeit der Analyse */
  caveats: string[]
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/**
 * Wie viel Aushilfe aus verwandten Positionen höchstens als Kadertiefe zählt.
 *
 * Ein Außenstürmer kann im Notfall im Sturmzentrum spielen, aber er ersetzt
 * keinen Mittelstürmer. Ohne diese Grenze deckt ein Kader mit Flügelspielern
 * rechnerisch den Sturm ab und der Bedarf verschwindet, obwohl kein einziger
 * Mittelstürmer im Kader steht.
 */
const COVER_CAP = 0.5

/** Wie stark deckt dieser Spieler die Position ab? 0..1 */
function coverage(player: Player, position: Position): number {
  if (player.position === position) return 1
  if (player.altPositions.includes(position)) return 0.8
  return POSITION_AFFINITY[player.position]?.[position] ?? 0
}

/** Zählt der Spieler als Fachmann für die Position — oder nur als Aushilfe? */
function isSpecialist(player: Player, position: Position): boolean {
  return player.position === position || player.altPositions.includes(position)
}

function monthsUntil(iso: string | null, now: Date): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
}

/**
 * Bedarf je Position aus dem Kader herleiten.
 *
 * @param squad Spieler, die diesem Verein zugeordnet sind
 */
export function analyzeSquad(club: Club, squad: Player[], now = new Date()): SquadAnalysis {
  const targets = targetDepth(club.formation)
  const needs: PositionNeed[] = []
  const caveats: string[] = []

  if (squad.length === 0) {
    caveats.push('Für diesen Verein ist kein Spieler erfasst — ohne Kader keine Analyse.')
    return { clubId: club.id, squadSize: 0, needs: [], caveats }
  }
  if (squad.length < 14) {
    caveats.push(
      `Nur ${squad.length} Spieler erfasst. Ein vollständiger Kader hat gut 25 — die Analyse überschätzt den Bedarf, solange Spieler fehlen.`,
    )
  }
  if (squad.every((p) => p.contractUntil == null)) {
    caveats.push('Keine Vertragsenden hinterlegt — auslaufende Verträge fließen nicht ein.')
  }
  if (squad.every((p) => p.minutesLastSeason == null)) {
    caveats.push('Keine Einsatzminuten hinterlegt — die Lastverteilung fließt nicht ein.')
  }

  for (const position of POSITIONS) {
    const covering = squad
      .map((player) => ({ player, share: coverage(player, position) }))
      .filter((c) => c.share > 0)
      .sort((a, b) => b.share - a.share)

    // Gelernte Spieler zählen voll, Aushilfe nur begrenzt.
    const specialistDepth = covering
      .filter((c) => isSpecialist(c.player, position))
      .reduce((sum, c) => sum + c.share, 0)
    const coverDepth = Math.min(
      COVER_CAP,
      covering
        .filter((c) => !isSpecialist(c.player, position))
        .reduce((sum, c) => sum + c.share, 0),
    )
    const depth = specialistDepth + coverDepth
    const target = targets[position]
    const reasons: string[] = []

    // 1. Kaderbreite — fehlende Spieler auf der Position.
    const shortfall = Math.max(0, target - depth)
    let depthScore = clamp(shortfall / target, 0, 1)
    if (specialistDepth === 0) {
      // Ohne gelernten Spieler ist die Position eine Lücke, auch wenn sich
      // jemand notdürftig dorthin schieben ließe.
      depthScore = Math.max(depthScore, 0.6)
      reasons.push(`kein gelernter ${POSITION_LABEL[position]} im Kader`)
    } else if (shortfall >= 0.5) {
      reasons.push(`Kaderbreite ${depth.toFixed(1)} von ${target} benötigten Spielern`)
    }

    // 2. Auslaufende Verträge — Bedarf, der in Kürze entsteht.
    let expiring = 0
    for (const c of covering) {
      const months = monthsUntil(c.player.contractUntil, now)
      if (months != null && months <= 12) expiring += c.share
    }
    const contractScore = target > 0 ? clamp(expiring / target, 0, 1) : 0
    if (expiring >= 0.8) {
      reasons.push(
        `${Math.round(expiring * 10) / 10} Spieler mit Vertrag unter 12 Monaten Restlaufzeit`,
      )
    }

    // 3. Altersstruktur — wer in zwei Jahren wegbricht.
    let ageing = 0
    for (const c of covering) {
      if (c.player.age != null && c.player.age >= 31) ageing += c.share
    }
    const ageScore = target > 0 ? clamp(ageing / target, 0, 1) : 0
    if (ageing >= 0.8) {
      reasons.push(`${Math.round(ageing * 10) / 10} Spieler ab 31 Jahren`)
    }

    // 4. Lastverteilung — hängt die Position an einem einzigen Spieler?
    let loadScore = 0
    const withMinutes = covering.filter((c) => c.player.minutesLastSeason != null)
    if (withMinutes.length > 0) {
      const total = withMinutes.reduce((s, c) => s + (c.player.minutesLastSeason ?? 0) * c.share, 0)
      const top = Math.max(...withMinutes.map((c) => (c.player.minutesLastSeason ?? 0) * c.share))
      if (total > 0) {
        const share = top / total
        // Ab etwa 70% Last auf einem Spieler wird es dünn.
        loadScore = clamp((share - 0.7) / 0.3, 0, 1)
        if (loadScore > 0.3) {
          reasons.push(`${Math.round(share * 100)}% der Einsatzzeit auf einem Spieler`)
        }
      }
    }

    const value = Math.round(
      clamp(depthScore * 45 + contractScore * 25 + ageScore * 18 + loadScore * 12, 0, 100),
    )

    needs.push({ position, value, depth: Math.round(depth * 10) / 10, target, covering, reasons })
  }

  needs.sort((a, b) => b.value - a.value)
  return { clubId: club.id, squadSize: squad.length, needs, caveats }
}

/** Nur die Positionen mit nennenswertem Bedarf, als Werte für das Vereinsformular. */
export function suggestedNeeds(analysis: SquadAnalysis, threshold = 20): Partial<Record<Position, number>> {
  const out: Partial<Record<Position, number>> = {}
  for (const need of analysis.needs) {
    if (need.value >= threshold) out[need.position] = need.value
  }
  return out
}
