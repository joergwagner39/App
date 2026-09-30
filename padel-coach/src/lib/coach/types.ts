// Datenmodell des Coach-Bereichs (Check-ins, Pläne, Quiz-Historie).

export type SessionType =
  | 'vo2max'
  | 'hyrox'
  | 'strength'
  | 'upper'
  | 'zone2'
  | 'recovery'
  | 'rest'
  | 'padel'

export type Feeling = 1 | 2 | 3 | 4 | 5

export type PadelIntensity = 'none' | 'light' | 'match'

/** Umfang der heutigen Einheit – vor dem Workout wählbar */
export type DoseLevel = 'less' | 'normal' | 'more'
export interface Dose {
  level: DoseLevel
  /** Bei „weniger“: wegen Zeit (kürzer, gleiche Intensität) oder Kraft/Gefühl (leichter) */
  reason?: 'time' | 'energy'
}

export interface CheckIn {
  feeling: Feeling
  /** 0 = keine Beschwerden, 10 = starke Schmerzen */
  knee: number
  /** Muskelkater / Müdigkeit in den Beinen, 0–3 */
  soreness: number
  /** Einheit von gestern gemacht? */
  yesterdayDone: 'yes' | 'partly' | 'no' | 'none-planned'
  /** Padel gestern gespielt? */
  padelYesterday: PadelIntensity
  padelYesterdayMinutes?: number
  /** Padel heute geplant? */
  padelToday: PadelIntensity
  /** Padel morgen geplant? */
  padelTomorrow: boolean
  note?: string
}

export interface DayRecord {
  date: string // YYYY-MM-DD
  checkIn?: CheckIn
  /** Die Einheit, die für diesen Tag vorgeschlagen wurde */
  plannedSession?: { type: SessionType; workoutId: string; title: string; manual?: boolean }
  dose?: Dose
  /** Nachträglich per Check-in am Folgetag erfasst */
  completed?: 'yes' | 'partly' | 'no'
  padelPlayed?: PadelIntensity
  padelMinutes?: number
  tacticAnswer?: { id: string; correct: boolean; index?: number }
  quizAnswer?: { id: string; correct: boolean; index?: number }
  updatedAt: number
}

export interface CoachSettings {
  maxHr?: number
  age?: number
  /** Laufen grundsätzlich erlaubt (bei Kniebeschwerden aus) */
  allowRunning: boolean
  /** Verfügbares Equipment */
  equipment: {
    bike: boolean
    rower: boolean
    skierg: boolean
    pool: boolean
    sled: boolean
    wallball: boolean
    kettlebell: boolean
  }
  hyroxRaceDate?: string
  hyroxDivision?: 'open' | 'pro' | 'doubles' | 'relay'
  /** Zielzeit, z. B. "1:25:00" */
  hyroxTargetTime?: string
  /** Padel-Einheiten pro Woche als Ziel */
  padelPerWeek: number
  /** Freitext, z. B. „Turnier im Mai“ oder „Level 3.5“ */
  padelGoal?: string
  updatedAt: number
}

export interface CoachState {
  version: 1
  days: Record<string, DayRecord>
  settings: CoachSettings
}

export const DEFAULT_SETTINGS: CoachSettings = {
  allowRunning: false,
  padelPerWeek: 2,
  equipment: {
    bike: true,
    rower: true,
    skierg: true,
    pool: false,
    sled: true,
    wallball: true,
    kettlebell: true,
  },
  updatedAt: 0,
}

export function emptyState(): CoachState {
  return { version: 1, days: {}, settings: { ...DEFAULT_SETTINGS } }
}

/** Kompakte Sicht auf die Wearable-Daten, die der Coach braucht. */
export interface Signals {
  date: string
  readiness?: number
  sleepScore?: number
  sleepHours?: number
  hrv?: number
  hrvBaseline?: number
  restingHr?: number
  restingHrBaseline?: number
  tempDeviation?: number
  bodyBattery?: number
  stress?: number
  vo2max?: number
  maxHr?: number
  garminTrainingReadiness?: number
  /** Garmin-Aktivitäten der letzten 7 Tage */
  recentActivities: {
    date: string
    type: string
    minutes: number
    aerobicTE?: number
    anaerobicTE?: number
  }[]
  sources: { oura: boolean; garmin: boolean }
}
