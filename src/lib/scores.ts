import type { OuraSleepData, OuraReadinessData, GarminDailyData, GarminActivityData } from '@/types'

export interface WellnessScore {
  total: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  label: string
  color: string
  components: { label: string; value: number; weight: number; score: number; source: 'oura' | 'garmin' }[]
}

export interface FitnessScore {
  total: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  label: string
  color: string
  components: { label: string; value: string; score: number; trend?: 'up' | 'down' | 'stable' }[]
}

function gradeFromScore(score: number): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; label: string; color: string } {
  if (score >= 85) return { grade: 'A', label: 'Ausgezeichnet', color: '#10b981' }
  if (score >= 70) return { grade: 'B', label: 'Gut', color: '#3b82f6' }
  if (score >= 55) return { grade: 'C', label: 'Mittel', color: '#f59e0b' }
  if (score >= 40) return { grade: 'D', label: 'Niedrig', color: '#f97316' }
  return { grade: 'F', label: 'Kritisch', color: '#ef4444' }
}

// Normalize HRV to 0-100 (typical range 20-90ms for adults)
function normalizeHRV(hrv: number): number {
  return Math.min(100, Math.max(0, ((hrv - 20) / 70) * 100))
}

// Normalize resting HR to 0-100 (lower is better; 40=elite, 70=average)
function normalizeRHR(rhr: number): number {
  return Math.min(100, Math.max(0, ((70 - rhr) / 30) * 100))
}

// Normalize VO2max (30=poor, 60=excellent)
function normalizeVO2max(vo2: number): number {
  return Math.min(100, Math.max(0, ((vo2 - 30) / 30) * 100))
}

export function calcWellnessScore(
  sleep: OuraSleepData | undefined,
  readiness: OuraReadinessData | undefined,
  garmin: GarminDailyData | undefined,
): WellnessScore {
  const components: WellnessScore['components'] = [
    {
      label: 'Schlaf Score',
      value: sleep?.score ?? 0,
      weight: 0.28,
      score: sleep?.score ?? 0,
      source: 'oura',
    },
    {
      label: 'Readiness',
      value: readiness?.score ?? 0,
      weight: 0.25,
      score: readiness?.score ?? 0,
      source: 'oura',
    },
    {
      label: 'HRV',
      value: sleep?.average_hrv ?? 0,
      weight: 0.22,
      score: normalizeHRV(sleep?.average_hrv ?? 40),
      source: 'oura',
    },
    {
      label: 'Body Battery',
      value: garmin?.bodyBatteryHighestValue ?? 0,
      weight: 0.15,
      score: garmin?.bodyBatteryHighestValue ?? 50,
      source: 'garmin',
    },
    {
      label: 'Stressresistenz',
      value: 100 - (garmin?.averageStressLevel ?? 30),
      weight: 0.10,
      score: Math.max(0, 100 - (garmin?.averageStressLevel ?? 30)),
      source: 'garmin',
    },
  ]

  const total = Math.round(
    components.reduce((sum, c) => sum + c.score * c.weight, 0)
  )

  return { total, ...gradeFromScore(total), components }
}

export function calcFitnessScore(
  recentActivities: GarminActivityData[],
  sleepHistory: OuraSleepData[],
  garminHistory: GarminDailyData[],
): FitnessScore {
  // VO2max: take best recent value
  const vo2Values = recentActivities.map((a) => a.vo2max ?? 0).filter((v) => v > 0)
  const vo2max = vo2Values.length ? Math.max(...vo2Values) : 0

  // Resting HR: average of last 7 days
  const rhrValues = [
    ...garminHistory.slice(-7).map((g) => g.restingHeartRate).filter((v) => v > 0),
    ...sleepHistory.slice(-7).map((s) => s.lowest_heart_rate).filter((v) => v > 0),
  ]
  const avgRHR = rhrValues.length ? rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length : 55

  // Training consistency: sessions per week (last 14 days)
  const sessionsLast14 = recentActivities.filter((a) => {
    const d = new Date(a.date)
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 14
  }).length
  const sessionsPerWeek = sessionsLast14 / 2
  const consistencyScore = Math.min(100, (sessionsPerWeek / 5) * 100)

  // Training effect: average aerobic TE of last 5 workouts
  const teValues = recentActivities.slice(-5).map((a) => a.trainingEffect ?? 0).filter((v) => v > 0)
  const avgTE = teValues.length ? teValues.reduce((a, b) => a + b, 0) / teValues.length : 0
  const teScore = Math.min(100, (avgTE / 4) * 100)

  // HRV trend (improving = higher fitness)
  const hrvLast7 = sleepHistory.slice(-7).map((s) => s.average_hrv ?? 0)
  const hrvFirst = hrvLast7.slice(0, 3).reduce((a, b) => a + b, 0) / 3
  const hrvLast = hrvLast7.slice(4).reduce((a, b) => a + b, 0) / 3
  const hrvTrend: 'up' | 'down' | 'stable' = hrvLast - hrvFirst > 2 ? 'up' : hrvLast - hrvFirst < -2 ? 'down' : 'stable'

  const vo2Score = normalizeVO2max(vo2max)
  const rhrScore = normalizeRHR(avgRHR)

  const components: FitnessScore['components'] = [
    {
      label: 'VO2max',
      value: vo2max > 0 ? `${vo2max.toFixed(1)} ml/kg/min` : '–',
      score: vo2Score,
    },
    {
      label: 'Ruhepuls',
      value: `${avgRHR.toFixed(0)} bpm`,
      score: rhrScore,
    },
    {
      label: 'Trainings/Woche',
      value: `${sessionsPerWeek.toFixed(1)}x`,
      score: consistencyScore,
    },
    {
      label: 'Trainingswirkung Ø',
      value: avgTE > 0 ? `${avgTE.toFixed(1)} / 5` : '–',
      score: teScore,
    },
    {
      label: 'HRV-Trend (7 Tage)',
      value: hrvTrend === 'up' ? 'Steigend ↑' : hrvTrend === 'down' ? 'Fallend ↓' : 'Stabil →',
      score: hrvTrend === 'up' ? 80 : hrvTrend === 'stable' ? 60 : 35,
      trend: hrvTrend,
    },
  ]

  const weights = [0.30, 0.25, 0.20, 0.15, 0.10]
  const total = Math.round(
    components.reduce((sum, c, i) => sum + c.score * weights[i], 0)
  )

  return { total, ...gradeFromScore(total), components }
}
