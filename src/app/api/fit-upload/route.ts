import { NextRequest, NextResponse } from 'next/server'
import type { GarminActivityData, GarminDailyData } from '@/types'

interface FitRecord {
  timestamp?: Date
  heart_rate?: number
  distance?: number
  speed?: number
  altitude?: number
  cadence?: number
  power?: number
  stress_level?: number
}

interface FitSession {
  start_time?: Date
  total_elapsed_time?: number
  total_distance?: number
  avg_heart_rate?: number
  max_heart_rate?: number
  total_calories?: number
  avg_speed?: number
  total_ascent?: number
  sport?: string
  sub_sport?: string
  total_training_effect?: number
  total_anaerobic_training_effect?: number
  enhanced_avg_speed?: number
}

interface FitActivity {
  sessions?: FitSession[]
  records?: FitRecord[]
  device_infos?: unknown[]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'Keine Dateien hochgeladen' }, { status: 400 })
    }

    const FitParser = (await import('fit-file-parser')).default

    const activities: GarminActivityData[] = []
    const dailyMap: Record<string, Partial<GarminDailyData>> = {}

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.fit')) continue

      const buffer = await file.arrayBuffer()
      const parsed = await new Promise<FitActivity>((resolve, reject) => {
        const parser = new FitParser({ force: true, speedUnit: 'm/s', lengthUnit: 'm', temperatureUnit: 'celsius', elapsedRecordField: false, mode: 'cascade' })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(parser.parse as any)(buffer, (err: unknown, data: FitActivity) => {
          if (err) reject(new Error(String(err)))
          else resolve(data)
        })
      })

      for (const session of parsed.sessions ?? []) {
        const date = session.start_time
          ? new Date(session.start_time).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        const sportType = session.sport ?? 'unknown'

        activities.push({
          date,
          activityType: sportType,
          distance: session.total_distance ?? 0,
          duration: session.total_elapsed_time ?? 0,
          averageHR: session.avg_heart_rate ?? 0,
          maxHR: session.max_heart_rate ?? 0,
          calories: session.total_calories ?? 0,
          averagePace: session.avg_speed ? 1 / session.avg_speed : undefined,
          elevationGain: session.total_ascent,
          trainingEffect: session.total_training_effect,
          anaerobicTrainingEffect: session.total_anaerobic_training_effect,
        })

        // Aggregate daily data from records
        const records = parsed.records ?? []
        const dayRecords = records.filter((r) => {
          if (!r.timestamp) return false
          return new Date(r.timestamp).toISOString().split('T')[0] === date
        })

        const hrValues = dayRecords.map((r) => r.heart_rate).filter((h): h is number => h !== undefined)
        const stressValues = dayRecords.map((r) => r.stress_level).filter((s): s is number => s !== undefined)

        if (!dailyMap[date]) {
          dailyMap[date] = {
            date,
            steps: 0,
            totalKilocalories: session.total_calories ?? 0,
            activeKilocalories: session.total_calories ?? 0,
            floorsClimbed: session.total_ascent ? Math.round(session.total_ascent / 3) : 0,
            minHeartRate: hrValues.length ? Math.min(...hrValues) : 0,
            maxHeartRate: hrValues.length ? Math.max(...hrValues) : 0,
            restingHeartRate: hrValues.length ? Math.min(...hrValues) : 0,
            averageStressLevel: stressValues.length ? Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length) : 25,
            bodyBatteryChargedValue: 0,
            bodyBatteryDrainedValue: 0,
            bodyBatteryHighestValue: 80,
            bodyBatteryLowestValue: 30,
          }
        }
      }
    }

    const daily = Object.values(dailyMap) as GarminDailyData[]

    return NextResponse.json({
      activities,
      daily,
      fileCount: files.filter((f) => f.name.toLowerCase().endsWith('.fit')).length,
    })
  } catch (e) {
    console.error('FIT parse error:', e)
    return NextResponse.json({ error: 'FIT-Datei konnte nicht verarbeitet werden' }, { status: 500 })
  }
}
