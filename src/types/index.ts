export interface OuraSleepData {
  date: string
  score: number
  total_sleep_duration: number
  rem_sleep_duration: number
  deep_sleep_duration: number
  light_sleep_duration: number
  efficiency: number
  latency: number
  restfulness: number
  timing: number
  hrv_balance: number
  average_hrv: number
  lowest_heart_rate: number
  average_heart_rate: number
  breath_average: number
}

export interface OuraReadinessData {
  date: string
  score: number
  temperature_deviation: number
  temperature_trend_deviation: number
  hrv_balance_score: number
  recovery_index_score: number
  resting_heart_rate_score: number
  sleep_score: number
  activity_score: number
}

export interface OuraActivityData {
  date: string
  score: number
  active_calories: number
  total_calories: number
  steps: number
  equivalent_walking_distance: number
  high_activity_time: number
  medium_activity_time: number
  low_activity_time: number
  sedentary_time: number
}

export interface GarminActivityData {
  date: string
  activityType: string
  distance: number
  duration: number
  averageHR: number
  maxHR: number
  calories: number
  averagePace?: number
  elevationGain?: number
  vo2max?: number
  trainingEffect?: number
  anaerobicTrainingEffect?: number
}

export interface GarminDailyData {
  date: string
  steps: number
  totalKilocalories: number
  activeKilocalories: number
  floorsClimbed: number
  minHeartRate: number
  maxHeartRate: number
  restingHeartRate: number
  averageStressLevel: number
  bodyBatteryChargedValue: number
  bodyBatteryDrainedValue: number
  bodyBatteryHighestValue: number
  bodyBatteryLowestValue: number
}

export interface DashboardData {
  oura: {
    sleep: OuraSleepData[]
    readiness: OuraReadinessData[]
    activity: OuraActivityData[]
  }
  garmin: {
    daily: GarminDailyData[]
    activities: GarminActivityData[]
  }
  lastUpdated: string
}

export interface TrainingRecommendation {
  level: 'rest' | 'easy' | 'moderate' | 'hard' | 'peak'
  title: string
  description: string
  suggestedActivities: string[]
  targetHRZone?: string
  targetDuration?: string
  reasoning: string[]
}
