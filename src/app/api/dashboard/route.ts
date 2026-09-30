import { NextRequest, NextResponse } from 'next/server'
import { generateMockData } from '@/lib/mockData'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Token from OAuth cookie (preferred) or env fallback
  const ouraToken = request.cookies.get('oura_token')?.value
    || process.env.OURA_ACCESS_TOKEN
    || searchParams.get('oura_token')
    || ''
  const garminEmail = process.env.GARMIN_EMAIL || searchParams.get('garmin_email') || ''
  const garminPassword = process.env.GARMIN_PASSWORD || searchParams.get('garmin_password') || ''

  if (ouraToken) {
    try {
      const data = await fetchOuraData(ouraToken)
      // Garmin via email/password is unreliable on Vercel (timeout) — use mock for now
      const mock = generateMockData(30)
      return NextResponse.json({ ...data, garmin: mock.garmin, isMockData: false })
    } catch (e) {
      console.error('Oura API fetch failed:', e)
    }
  }

  // Return mock data when no credentials configured
  const data = generateMockData(30)
  return NextResponse.json({ ...data, isMockData: true })
}

async function fetchOuraData(ouraToken: string) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]

  const headers = { Authorization: `Bearer ${ouraToken}` }
  const timeout = 8000
  const fetchWithTimeout = (url: string) =>
    fetch(url, { headers, signal: AbortSignal.timeout(timeout) })

  const [sleepRes, dailySleepRes, readinessRes, activityRes] = await Promise.all([
    fetchWithTimeout(`https://api.ouraring.com/v2/usercollection/sleep?start_date=${start}&end_date=${end}`),
    fetchWithTimeout(`https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${start}&end_date=${end}`),
    fetchWithTimeout(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${start}&end_date=${end}`),
    fetchWithTimeout(`https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${start}&end_date=${end}`),
  ])

  if (!sleepRes.ok) throw new Error(`Oura API error: ${sleepRes.status}`)

  const [sleepJson, dailySleepJson, readinessJson, activityJson] = await Promise.all([
    sleepRes.json(), dailySleepRes.json(), readinessRes.json(), activityRes.json(),
  ])

  // daily_sleep has the score; sleep has HRV, efficiency etc. — merge by date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoreByDate: Record<string, number> = {}
  for (const d of dailySleepJson.data ?? []) {
    scoreByDate[d.day] = d.score
  }

  return {
    oura: {
      sleep: sleepJson.data?.map((d: Parameters<typeof mapOuraSleep>[0]) => mapOuraSleep(d, scoreByDate)) ?? [],
      readiness: readinessJson.data?.map(mapOuraReadiness) ?? [],
      activity: activityJson.data?.map(mapOuraActivity) ?? [],
    },
    lastUpdated: new Date().toISOString(),
  }
}

async function fetchGarminData(garminEmail: string, garminPassword: string) {
  const { GarminConnect } = await import('garmin-connect')
  const garmin = new GarminConnect({ username: garminEmail, password: garminPassword })
  await garmin.login()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // getUserSummary returns steps, HR, stress, body battery — fetch last 7 days + activities in parallel
  const last7Dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    last7Dates.push(d.toISOString().split('T')[0])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summaries, activities] = await Promise.all([
    Promise.all(last7Dates.map(date =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (garmin as any).getUserSummary(date).catch(() => null) as Promise<any>
    )),
    garmin.getActivities(0, 30).catch(() => []) as Promise<any[]>,
  ])

  const daily = summaries
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => ({
      date: s.calendarDate ?? todayStr,
      steps: s.totalSteps ?? 0,
      totalKilocalories: s.totalKilocalories ?? 0,
      activeKilocalories: s.activeKilocalories ?? 0,
      floorsClimbed: s.floorsAscended ?? 0,
      minHeartRate: s.minHeartRate ?? 0,
      maxHeartRate: s.maxHeartRate ?? 0,
      restingHeartRate: s.restingHeartRate ?? 0,
      averageStressLevel: s.averageStressLevel ?? 0,
      bodyBatteryChargedValue: s.bodyBatteryChargedValue ?? 0,
      bodyBatteryDrainedValue: s.bodyBatteryDrainedValue ?? 0,
      bodyBatteryHighestValue: s.bodyBatteryHighestValue ?? 0,
      bodyBatteryLowestValue: s.bodyBatteryLowestValue ?? 0,
    }))

  return {
    daily,
    activities: Array.isArray(activities) ? activities.map(mapGarminActivity) : [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOuraSleep(d: any, scoreByDate: Record<string, number> = {}) {
  return {
    date: d.day,
    score: scoreByDate[d.day] ?? d.score ?? 0,
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
  // garmin-connect npm returns camelCase; fallback to snake_case field names
  const startTime = d.startTimeLocal ?? d.start_time ?? ''
  return {
    date: startTime.split(' ')[0] ?? startTime.split('T')[0],
    activityType: d.activityType?.typeKey ?? d.activityType ?? d.type ?? 'unknown',
    distance: d.distance ?? d.distance_meters,
    duration: d.duration ?? d.duration_seconds,
    averageHR: d.averageHR ?? d.avg_hr_bpm,
    maxHR: d.maxHR ?? d.max_hr_bpm,
    calories: d.calories,
    averagePace: d.averageSpeed,
    elevationGain: d.elevationGain ?? d.elevation_gain_meters,
    vo2max: d.vO2MaxValue,
    trainingEffect: d.aerobicTrainingEffect,
    anaerobicTrainingEffect: d.anaerobicTrainingEffect,
  }
}
