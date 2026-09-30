// Gemeinsames Datenformat für Oura- und Garmin-Werte (Server → Client).

export interface OuraSleep {
  date: string
  score?: number
  totalSleepSeconds?: number
  averageHrv?: number
  lowestHeartRate?: number
}

export interface OuraReadiness {
  date: string
  score?: number
  temperatureDeviation?: number
}

export interface GarminDaily {
  date: string
  restingHeartRate?: number
  averageStressLevel?: number
  bodyBatteryHighestValue?: number
}

export interface GarminActivity {
  date: string
  activityType: string
  duration: number
  maxHR?: number
  vo2max?: number
  trainingEffect?: number
  anaerobicTrainingEffect?: number
}

export interface WearableData {
  demo: boolean
  oura: { connected: boolean; sleep: OuraSleep[]; readiness: OuraReadiness[]; error?: string }
  garmin: {
    connected: boolean
    syncedAt?: string
    daily: GarminDaily[]
    activities: GarminActivity[]
    vo2max?: number
    trainingReadiness?: number
  }
  status: { kv: boolean; pinRequired: boolean; ouraConfigured: boolean }
}
