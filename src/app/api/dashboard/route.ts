import { NextResponse } from 'next/server'
import { generateMockData } from '@/lib/mockData'

// In production: fetch real data from Oura & Garmin APIs
// Oura: https://cloud.ouraring.com/v2/usercollection/sleep
// Garmin: via garmin-connect npm package with credentials

export async function GET() {
  const ouraToken = process.env.OURA_ACCESS_TOKEN
  const garminEmail = process.env.GARMIN_EMAIL
  const garminPassword = process.env.GARMIN_PASSWORD

  if (ouraToken && garminEmail && garminPassword) {
    try {
      const data = await fetchRealData(ouraToken, garminEmail, garminPassword)
      return NextResponse.json(data)
    } catch (e) {
      console.error('Real API fetch failed, falling back to mock data:', e)
    }
  }

  // Return mock data when no credentials configured
  const data = generateMockData(30)
  return NextResponse.json({ ...data, isMockData: true })
}

async function fetchRealData(ouraToken: string, garminEmail: string, garminPassword: string) {
  const { GarminConnect } = await import('garmin-connect')
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]

  // Fetch Oura data
  const [sleepRes, readinessRes, activityRes] = await Promise.all([
    fetch(`https://api.ouraring.com/v2/usercollection/sleep?start_date=${start}&end_date=${end}`, {
      headers: { Authorization: `Bearer ${ouraToken}` },
    }),
    fetch(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${start}&end_date=${end}`, {
      headers: { Authorization: `Bearer ${ouraToken}` },
    }),
    fetch(`https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${start}&end_date=${end}`, {
      headers: { Authorization: `Bearer ${ouraToken}` },
    }),
  ])

  const [sleepJson, readinessJson, activityJson] = await Promise.all([
    sleepRes.json(),
    readinessRes.json(),
    activityRes.json(),
  ])

  // Fetch Garmin data
  const garmin = new GarminConnect({ username: garminEmail, password: garminPassword })
  await garmin.login()

  const garminActivities = await garmin.getActivities(0, 50)
  const garminDaily: unknown[] = []

  return {
    oura: {
      sleep: sleepJson.data?.map(mapOuraSleep) ?? [],
      readiness: readinessJson.data?.map(mapOuraReadiness) ?? [],
      activity: activityJson.data?.map(mapOuraActivity) ?? [],
    },
    garmin: {
      daily: [],
      activities: Array.isArray(garminActivities) ? garminActivities.map(mapGarminActivity) : [],
    },
    lastUpdated: new Date().toISOString(),
    isMockData: false,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOuraSleep(d: any) {
  return {
    date: d.day,
    score: d.score,
    total_sleep_duration: d.total_sleep_duration,
    rem_sleep_duration: d.rem_sleep_duration,
    deep_sleep_duration: d.deep_sleep_duration,
    light_sleep_duration: d.light_sleep_duration,
    efficiency: d.efficiency,
    latency: d.latency,
    restfulness: d.contributors?.restfulness,
    timing: d.contributors?.timing,
    hrv_balance: d.contributors?.hrv_balance,
    average_hrv: d.average_hrv,
    lowest_heart_rate: d.lowest_heart_rate,
    average_heart_rate: d.average_heart_rate,
    breath_average: d.breath_average,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOuraReadiness(d: any) {
  return {
    date: d.day,
    score: d.score,
    temperature_deviation: d.temperature_deviation,
    temperature_trend_deviation: d.temperature_trend_deviation,
    hrv_balance_score: d.contributors?.hrv_balance,
    recovery_index_score: d.contributors?.recovery_index,
    resting_heart_rate_score: d.contributors?.resting_heart_rate,
    sleep_score: d.contributors?.sleep_balance,
    activity_score: d.contributors?.activity_balance,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOuraActivity(d: any) {
  return {
    date: d.day,
    score: d.score,
    active_calories: d.active_calories,
    total_calories: d.total_calories,
    steps: d.steps,
    equivalent_walking_distance: d.equivalent_walking_distance,
    high_activity_time: d.high_activity_time,
    medium_activity_time: d.medium_activity_time,
    low_activity_time: d.low_activity_time,
    sedentary_time: d.sedentary_time,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGarminDaily(d: any) {
  return {
    date: d.calendarDate,
    steps: d.totalSteps,
    totalKilocalories: d.totalKilocalories,
    activeKilocalories: d.activeKilocalories,
    floorsClimbed: d.floorsAscended,
    minHeartRate: d.minHeartRate,
    maxHeartRate: d.maxHeartRate,
    restingHeartRate: d.restingHeartRate,
    averageStressLevel: d.averageStressLevel,
    bodyBatteryChargedValue: d.bodyBatteryChargedValue,
    bodyBatteryDrainedValue: d.bodyBatteryDrainedValue,
    bodyBatteryHighestValue: d.bodyBatteryHighestValue,
    bodyBatteryLowestValue: d.bodyBatteryLowestValue,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGarminActivity(d: any) {
  return {
    date: d.startTimeLocal?.split(' ')[0],
    activityType: d.activityType?.typeKey,
    distance: d.distance,
    duration: d.duration,
    averageHR: d.averageHR,
    maxHR: d.maxHR,
    calories: d.calories,
    averagePace: d.averageSpeed,
    elevationGain: d.elevationGain,
    vo2max: d.vO2MaxValue,
    trainingEffect: d.aerobicTrainingEffect,
    anaerobicTrainingEffect: d.anaerobicTrainingEffect,
  }
}
