import { subDays, format } from 'date-fns'
import type { DashboardData } from '@/types'

function randomBetween(min: number, max: number, decimals = 0): number {
  const val = Math.random() * (max - min) + min
  return parseFloat(val.toFixed(decimals))
}

function generateDates(days: number): string[] {
  return Array.from({ length: days }, (_, i) =>
    format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
  )
}

export function generateMockData(days = 30): DashboardData {
  const dates = generateDates(days)

  // Simulate a realistic training cycle with fatigue and recovery
  const sleepData = dates.map((date, i) => {
    const cycleFactor = Math.sin((i / 7) * Math.PI) * 0.15
    const trendFactor = (i / days) * 0.05
    const base = 72 + cycleFactor * 20 + trendFactor * 10
    const score = Math.min(100, Math.max(40, Math.round(base + randomBetween(-8, 8))))
    const totalSleep = randomBetween(19800, 28800) // 5.5h to 8h in seconds

    return {
      date,
      score,
      total_sleep_duration: totalSleep,
      rem_sleep_duration: Math.round(totalSleep * randomBetween(0.18, 0.25, 2)),
      deep_sleep_duration: Math.round(totalSleep * randomBetween(0.12, 0.22, 2)),
      light_sleep_duration: Math.round(totalSleep * randomBetween(0.45, 0.60, 2)),
      efficiency: randomBetween(82, 97, 1),
      latency: randomBetween(5, 25),
      restfulness: randomBetween(60, 95),
      timing: randomBetween(55, 90),
      hrv_balance: randomBetween(55, 95),
      average_hrv: randomBetween(28, 72, 1),
      lowest_heart_rate: randomBetween(42, 56),
      average_heart_rate: randomBetween(52, 68),
      breath_average: randomBetween(13.5, 16.5, 1),
    }
  })

  const readinessData = dates.map((date, i) => {
    const prevSleep = sleepData[i]
    const base = prevSleep.score * 0.6 + randomBetween(25, 45)
    const score = Math.min(100, Math.max(30, Math.round(base)))

    return {
      date,
      score,
      temperature_deviation: randomBetween(-0.5, 0.8, 2),
      temperature_trend_deviation: randomBetween(-0.3, 0.5, 2),
      hrv_balance_score: randomBetween(55, 98),
      recovery_index_score: randomBetween(50, 100),
      resting_heart_rate_score: randomBetween(60, 100),
      sleep_score: prevSleep.score,
      activity_score: randomBetween(60, 100),
    }
  })

  const activityData = dates.map((date) => ({
    date,
    score: randomBetween(55, 100),
    active_calories: randomBetween(200, 900),
    total_calories: randomBetween(1800, 3200),
    steps: randomBetween(4000, 18000),
    equivalent_walking_distance: randomBetween(3000, 14000),
    high_activity_time: randomBetween(0, 3600),
    medium_activity_time: randomBetween(1800, 7200),
    low_activity_time: randomBetween(3600, 10800),
    sedentary_time: randomBetween(18000, 36000),
  }))

  const garminActivities = dates.flatMap((date, i) => {
    if (i % 2 !== 0 && i % 3 !== 0) return []
    const types = ['running', 'cycling', 'swimming', 'strength_training', 'hiking']
    const type = types[i % types.length]

    return [{
      date,
      activityType: type,
      distance: type === 'strength_training' ? 0 : randomBetween(3000, 25000),
      duration: randomBetween(1800, 5400),
      averageHR: randomBetween(120, 165),
      maxHR: randomBetween(155, 190),
      calories: randomBetween(250, 800),
      averagePace: type === 'running' ? randomBetween(280, 420, 1) : undefined,
      elevationGain: ['cycling', 'hiking', 'running'].includes(type) ? randomBetween(50, 800) : undefined,
      vo2max: randomBetween(42, 58, 1),
      trainingEffect: randomBetween(1.5, 4.5, 1),
      anaerobicTrainingEffect: randomBetween(0.5, 3.5, 1),
    }]
  })

  const garminDaily = dates.map((date) => ({
    date,
    steps: randomBetween(3000, 15000),
    totalKilocalories: randomBetween(1800, 3000),
    activeKilocalories: randomBetween(200, 900),
    floorsClimbed: randomBetween(2, 25),
    minHeartRate: randomBetween(42, 55),
    maxHeartRate: randomBetween(110, 185),
    restingHeartRate: randomBetween(44, 62),
    averageStressLevel: randomBetween(15, 65),
    bodyBatteryChargedValue: randomBetween(20, 55),
    bodyBatteryDrainedValue: randomBetween(25, 65),
    bodyBatteryHighestValue: randomBetween(60, 100),
    bodyBatteryLowestValue: randomBetween(5, 35),
  }))

  return {
    oura: { sleep: sleepData, readiness: readinessData, activity: activityData },
    garmin: { daily: garminDaily, activities: garminActivities },
    lastUpdated: new Date().toISOString(),
  }
}
