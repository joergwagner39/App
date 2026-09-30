// Entscheidet anhand von Wearable-Daten, Check-in und Verlauf, welche Einheit heute dran ist.
import type { CheckIn, CoachSettings, CoachState, DayRecord, SessionType, Signals } from './types'
import type { WearableData } from '@/lib/wearables'
import { WORKOUTS, workoutsOf, type Modality, type Workout, type WorkoutContext } from './workouts'
import { PADEL_TACTICS } from './padel'
import { QUIZ, FACTS } from './knowledge'

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return isoDate(d)
}

function dayNumber(date: string): number {
  return Math.floor(new Date(`${date}T12:00:00`).getTime() / 86_400_000)
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined)

// ── Signale aus Dashboard-Daten ──────────────────────────────────────────

export function buildSignals(data: WearableData, today: string): Signals {
  const sleep = data.oura.sleep
  const readiness = data.oura.readiness
  const lastSleep = sleep[sleep.length - 1]
  const lastReadiness = readiness[readiness.length - 1]
  const hrvs = sleep.map((s) => s.averageHrv).filter((v): v is number => typeof v === 'number' && v > 0)
  const rhrs = sleep.map((s) => s.lowestHeartRate).filter((v): v is number => typeof v === 'number' && v > 0)

  const gDaily = data.garmin.daily
  const lastG = gDaily[gDaily.length - 1]
  const acts = data.garmin.activities
  const weekAgo = addDays(today, -7)
  const vo2 = data.garmin.vo2max ?? [...acts].reverse().find((a) => a.vo2max)?.vo2max
  const observedMax = acts.reduce((m, a) => Math.max(m, a.maxHR ?? 0), 0)

  return {
    date: today,
    readiness: lastReadiness?.score,
    sleepScore: lastSleep?.score,
    sleepHours: lastSleep?.totalSleepSeconds ? lastSleep.totalSleepSeconds / 3600 : undefined,
    hrv: lastSleep?.averageHrv,
    hrvBaseline: avg(hrvs.slice(-30, -1)),
    restingHr: lastSleep?.lowestHeartRate ?? lastG?.restingHeartRate,
    restingHrBaseline: avg(rhrs.slice(-30, -1)),
    tempDeviation: lastReadiness?.temperatureDeviation,
    bodyBattery: lastG?.bodyBatteryHighestValue || undefined,
    stress: lastG?.averageStressLevel || undefined,
    vo2max: vo2 ? Math.round(vo2 * 10) / 10 : undefined,
    maxHr: observedMax > 150 ? observedMax : undefined,
    garminTrainingReadiness: data.garmin.trainingReadiness,
    recentActivities: acts
      .filter((a) => a.date >= weekAgo)
      .map((a) => ({
        date: a.date,
        type: a.activityType,
        minutes: Math.round((a.duration ?? 0) / 60),
        aerobicTE: a.trainingEffect,
        anaerobicTE: a.anaerobicTrainingEffect,
      })),
    sources: { oura: data.oura.connected, garmin: data.garmin.connected },
  }
}

// ── Bereitschafts-Score ─────────────────────────────────────────────────

export interface ReadinessResult {
  score: number
  reasons: string[]
  warnings: string[]
}

export function computeReadiness(s: Signals, c: CheckIn | undefined): ReadinessResult {
  const reasons: string[] = []
  const warnings: string[] = []
  let base: number
  if (s.readiness !== undefined) {
    base = s.readiness
    reasons.push(`Oura Readiness ${s.readiness}`)
  } else if (s.garminTrainingReadiness !== undefined) {
    base = s.garminTrainingReadiness
    reasons.push(`Garmin Training Readiness ${s.garminTrainingReadiness}`)
  } else if (s.bodyBattery !== undefined) {
    base = s.bodyBattery
    reasons.push(`Body Battery ${s.bodyBattery}`)
  } else {
    base = 72
    reasons.push('Keine Wearable-Daten – Bewertung nur über dein Befinden')
  }

  let score = base
  if (s.bodyBattery !== undefined && s.readiness !== undefined) {
    score = score * 0.75 + s.bodyBattery * 0.25
    if (s.bodyBattery < 35) reasons.push(`Body Battery nur ${s.bodyBattery}`)
  }
  if (s.hrv && s.hrvBaseline) {
    const diff = (s.hrv - s.hrvBaseline) / s.hrvBaseline
    if (diff < -0.15) {
      score -= 8
      reasons.push(`HRV ${Math.round(s.hrv)} ms, ${Math.round(-diff * 100)} % unter deinem Schnitt`)
    } else if (diff > 0.1) {
      score += 3
      reasons.push(`HRV ${Math.round(s.hrv)} ms über deinem Schnitt`)
    }
  }
  if (s.restingHr && s.restingHrBaseline && s.restingHr - s.restingHrBaseline >= 5) {
    score -= 6
    reasons.push(`Ruhepuls ${s.restingHr} (+${Math.round(s.restingHr - s.restingHrBaseline)} ggü. Schnitt)`)
  }
  if (s.tempDeviation !== undefined && s.tempDeviation >= 0.5) {
    score -= 12
    warnings.push(`Körpertemperatur +${s.tempDeviation.toFixed(1)} °C – mögliches Infekt-Signal`)
  }
  if (s.sleepHours !== undefined && s.sleepHours < 6) {
    score -= 6
    reasons.push(`Nur ${s.sleepHours.toFixed(1)} h Schlaf`)
  }
  if (c) {
    const f = (c.feeling - 3) * 7
    score += f
    if (c.feeling <= 2) reasons.push('Du fühlst dich heute nicht gut')
    if (c.feeling >= 4) reasons.push('Du fühlst dich gut')
    if (c.soreness >= 2) {
      score -= c.soreness * 3
      reasons.push('Deutlicher Muskelkater')
    }
    if (c.knee >= 4) warnings.push(`Knie ${c.knee}/10 – Stoß- und tiefe Kniebelastung heute vermeiden`)
    if (c.knee >= 7) warnings.push('Starke Knieschmerzen: bitte ärztlich/physiotherapeutisch abklären lassen')
  }
  return { score: Math.round(Math.max(0, Math.min(100, score))), reasons, warnings }
}

// ── Verlauf auswerten ────────────────────────────────────────────────────

const HARD: SessionType[] = ['vo2max', 'hyrox']

function wasDone(r: DayRecord | undefined): boolean {
  return !!r && (r.completed === 'yes' || r.completed === 'partly')
}

function countDone(state: CoachState, today: string, type: SessionType, days = 7): number {
  let n = 0
  for (let i = 1; i <= days; i++) {
    const r = state.days[addDays(today, -i)]
    if (r?.plannedSession?.type === type && wasDone(r)) n++
  }
  return n
}

function padelSessions(state: CoachState, today: string, days = 7): number {
  let n = 0
  for (let i = 1; i <= days; i++) {
    const r = state.days[addDays(today, -i)]
    if (r?.padelPlayed && r.padelPlayed !== 'none') n++
  }
  return n
}

function yesterdayWasHard(state: CoachState, s: Signals, c: CheckIn | undefined, today: string): string | null {
  const y = addDays(today, -1)
  const r = state.days[y]
  if (c?.padelYesterday === 'match') return 'Gestern Padel-Match'
  if (r?.plannedSession && HARD.includes(r.plannedSession.type) && (c ? c.yesterdayDone === 'yes' || c.yesterdayDone === 'partly' : wasDone(r)))
    return `Gestern ${r.plannedSession.title}`
  const hardAct = s.recentActivities.find((a) => a.date === y && ((a.anaerobicTE ?? 0) >= 3 || (a.aerobicTE ?? 0) >= 4))
  if (hardAct) return `Gestern intensive Garmin-Aktivität (${hardAct.type})`
  return null
}

// ── Auswahl ─────────────────────────────────────────────────────────────

export interface DayPlan {
  type: SessionType
  workout: Workout
  ctx: WorkoutContext
  readiness: ReadinessResult
  why: string[]
  optional?: string
}

function pickModality(settings: CoachSettings, knee: number, seed: number, forHyrox = false): Modality {
  const e = settings.equipment
  const options: Modality[] = []
  if (e.bike) options.push('bike')
  if (e.rower) options.push('rower')
  if (e.skierg && !forHyrox) options.push('skierg')
  if (e.pool && !forHyrox) options.push('pool')
  if (settings.allowRunning && knee <= 2) options.push('run')
  if (!options.length) options.push('crosstrainer')
  return options[seed % options.length]
}

export function resolveMaxHr(settings: CoachSettings, s: Signals): number | undefined {
  if (settings.maxHr) return settings.maxHr
  if (s.maxHr) return s.maxHr
  if (settings.age) return Math.round(208 - 0.7 * settings.age)
  return undefined
}

export function planDay(state: CoachState, s: Signals, c: CheckIn | undefined, today: string): DayPlan {
  const settings = state.settings
  const knee = c?.knee ?? 0
  const readiness = computeReadiness(s, c)
  const score = readiness.score
  const why: string[] = []
  const seed = dayNumber(today)
  let type: SessionType
  let optional: string | undefined

  const hardYesterday = yesterdayWasHard(state, s, c, today)
  const vo2Done = countDone(state, today, 'vo2max')
  const hyroxDone = countDone(state, today, 'hyrox')
  const strengthDone = countDone(state, today, 'strength')
  const zone2Done = countDone(state, today, 'zone2')
  const padelDone = padelSessions(state, today)
  const raceSoon =
    settings.hyroxRaceDate && dayNumber(settings.hyroxRaceDate) - seed <= 56 && dayNumber(settings.hyroxRaceDate) >= seed
  const hyroxTarget = raceSoon ? 2 : 1
  const vo2Target = 2

  const sick = s.tempDeviation !== undefined && s.tempDeviation >= 0.8
  if (sick || knee >= 7 || (c && c.feeling === 1) || score < 40) {
    type = score < 30 || sick ? 'rest' : 'recovery'
    why.push(sick ? 'Temperatur deutlich erhöht – heute keine Belastung' : 'Deine Signale sagen klar: Erholung')
  } else if (c?.padelToday === 'match') {
    type = 'padel'
    why.push('Padel-Match heute – das ist deine Einheit. Nur Aktivierung davor.')
  } else if (score < 55) {
    type = 'recovery'
    why.push(`Bereitschaft ${score}/100 – aktive Erholung bringt heute mehr als ein harter Reiz`)
  } else if (c?.padelToday === 'light') {
    type = 'padel'
    why.push('Lockeres Padel heute')
    if (score >= 70 && strengthDone === 0) optional = 'Optional nach dem Padel: 20 min Oberkörper + Core aus „Kraft B“ (Blöcke 4–5).'
  } else if (hardYesterday || score < 68) {
    if (hardYesterday) why.push(`${hardYesterday} – kein zweiter harter Tag in Folge`)
    else why.push(`Bereitschaft ${score}/100 – moderat statt hart`)
    type = strengthDone === 0 && score >= 60 && knee < 6 && !(c?.soreness && c.soreness >= 2) ? 'strength' : 'zone2'
  } else if (c?.padelTomorrow) {
    why.push('Morgen Padel – heute keine schwere Beinbelastung')
    type = vo2Done < vo2Target && score >= 75 ? 'vo2max' : 'zone2'
    if (type === 'vo2max') why.push('Kurzes VO2max-Intervall auf dem Ergometer passt trotzdem')
  } else {
    // Wochenziele: 2× VO2max, 1–2× Hyrox, 1× Kraft, 1× Zone 2 (+ Padel)
    const candidates: { t: SessionType; need: number; min: number }[] = [
      { t: 'vo2max', need: vo2Target - vo2Done, min: 72 },
      { t: 'hyrox', need: hyroxTarget - hyroxDone, min: 70 },
      { t: 'strength', need: 1 - strengthDone, min: 62 },
      { t: 'zone2', need: 1 - zone2Done, min: 55 },
    ]
    const deficits = candidates.filter((d) => d.need > 0 && score >= d.min)
    deficits.sort((a, b) => b.need - a.need)
    type = deficits[0]?.t ?? 'zone2'
    why.push(`Bereitschaft ${score}/100 – ein Qualitätstag ist drin`)
    const labels: Record<string, string> = { vo2max: 'VO2max', hyrox: 'Hyrox', strength: 'Kraft', zone2: 'Zone 2' }
    why.push(
      `Diese Woche erledigt: VO2max ${vo2Done}/${vo2Target}, Hyrox ${hyroxDone}/${hyroxTarget}, Kraft ${strengthDone}/1, Zone 2 ${zone2Done}/1, Padel ${padelDone}×` +
        (deficits[0] ? ` → heute ${labels[type]}` : ''),
    )
    if (raceSoon) why.push('Hyrox-Wettkampf in weniger als 8 Wochen – mehr Hyrox-Einheiten')
  }

  if (c?.yesterdayDone === 'no') why.push('Gestern ausgelassen? Kein Problem – nicht nachholen, einfach weiter nach Plan.')
  if (c?.padelYesterday === 'light') why.push('Gestern lockeres Padel – zählt als Bewegung, aber nicht als harter Tag')

  const options = workoutsOf(type)
  const done = type === 'vo2max' ? vo2Done : type === 'hyrox' ? hyroxDone : type === 'strength' ? strengthDone : 0
  let workout = options[(seed + done) % options.length]
  if (type === 'recovery') workout = options.find((w) => w.id === (settings.equipment.pool && seed % 3 === 0 ? 'recovery-swim' : 'recovery-mobility'))!
  const ctx: WorkoutContext = {
    maxHr: resolveMaxHr(settings, s),
    modality: type === 'recovery' || type === 'zone2' ? pickModality({ ...settings, allowRunning: false }, knee, seed) : pickModality(settings, knee, seed + done, type === 'hyrox'),
    knee,
    canRun: settings.allowRunning && knee <= 2,
    equipment: settings.equipment,
  }
  if (!settings.allowRunning || knee > 2) {
    if (type === 'vo2max' || type === 'hyrox') why.push('Kniefreundlich: Laufen ist durch Ergometer ersetzt')
  }
  return { type, workout, ctx, readiness, why, optional }
}

export function allWorkouts(): Workout[] {
  return WORKOUTS
}

// ── Tägliche Inhalte ─────────────────────────────────────────────────────

export function tacticOfDay(state: CoachState, today: string) {
  const seed = dayNumber(today)
  // Jeden 3. Tag eine zuletzt falsch beantwortete Taktik wiederholen
  if (seed % 3 === 0) {
    const wrong = Object.values(state.days)
      .filter((d) => d.date < today && d.tacticAnswer && !d.tacticAnswer.correct)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((d) => d.tacticAnswer!.id)
    const rightLater = new Set(
      Object.values(state.days)
        .filter((d) => d.tacticAnswer?.correct)
        .map((d) => d.tacticAnswer!.id),
    )
    const repeat = wrong.find((id) => !rightLater.has(id))
    const t = repeat && PADEL_TACTICS.find((x) => x.id === repeat)
    if (t) return { tactic: t, repeat: true }
  }
  return { tactic: PADEL_TACTICS[seed % PADEL_TACTICS.length], repeat: false }
}

export function quizOfDay(today: string) {
  // anderer Schritt als die Taktik, damit Kombinationen variieren
  return QUIZ[(dayNumber(today) * 7) % QUIZ.length]
}

export function factOfDay(today: string) {
  return FACTS[(dayNumber(today) * 11) % FACTS.length]
}

/** Deterministische Optionsreihenfolge, damit die richtige Antwort nicht immer an Platz 2 steht. */
export function shuffledOptions(id: string, options: string[]): { text: string; index: number }[] {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const arr = options.map((text, index) => ({ text, index }))
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0
    const j = h % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Merge für Geräte-Sync ────────────────────────────────────────────────

export function mergeStates(a: CoachState, b: CoachState): CoachState {
  const days: Record<string, DayRecord> = { ...a.days }
  for (const [k, v] of Object.entries(b.days)) {
    const cur = days[k]
    if (!cur || (v.updatedAt ?? 0) > (cur.updatedAt ?? 0)) days[k] = v
  }
  const settings = (b.settings.updatedAt ?? 0) > (a.settings.updatedAt ?? 0) ? b.settings : a.settings
  return { version: 1, days, settings }
}
