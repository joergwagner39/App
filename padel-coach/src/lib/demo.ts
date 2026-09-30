// Beispieldaten, solange weder Oura noch Garmin verbunden ist.
import type { GarminActivity, WearableData } from './wearables'

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export function demoData(): Omit<WearableData, 'status'> {
  const days = Array.from({ length: 60 }, (_, i) => 59 - i)
  const wave = (i: number) => Math.sin(i / 2.3)
  const trend = (i: number) => i / 60 // langsame Verbesserung
  const activities: GarminActivity[] = []
  for (let d = 84; d >= 1; d--) {
    const dow = d % 7
    if (dow === 1) activities.push({ date: iso(d), activityType: 'indoor_cycling', duration: 2700, maxHR: 176, trainingEffect: 3.8, anaerobicTrainingEffect: 2.4 })
    if (dow === 3) activities.push({ date: iso(d), activityType: 'padel', duration: 5400, maxHR: 171, trainingEffect: 3.1, anaerobicTrainingEffect: 1.9 })
    if (dow === 4) activities.push({ date: iso(d), activityType: 'strength_training', duration: 3000, maxHR: 150, trainingEffect: 2.2 })
    if (dow === 6 && d < 60) activities.push({ date: iso(d), activityType: 'indoor_rowing', duration: 3300, maxHR: 170, trainingEffect: 3.5, anaerobicTrainingEffect: 2.8 })
  }
  return {
    demo: true,
    oura: {
      connected: false,
      sleep: days.map((d, i) => ({
        date: iso(d),
        score: Math.round(74 + wave(i) * 8 + trend(i) * 4),
        totalSleepSeconds: Math.round((7.0 + wave(i) * 0.6) * 3600),
        averageHrv: Math.round(48 + wave(i) * 6 + trend(i) * 6),
        lowestHeartRate: Math.round(52 - wave(i) * 2 - trend(i) * 2),
      })),
      readiness: days.map((d, i) => ({ date: iso(d), score: Math.round(76 + wave(i) * 9 + trend(i) * 3), temperatureDeviation: 0.1 })),
    },
    garmin: {
      connected: false,
      daily: days.map((d, i) => ({
        date: iso(d),
        restingHeartRate: Math.round(52 - trend(i) * 2),
        averageStressLevel: Math.round(30 - wave(i) * 5),
        bodyBatteryHighestValue: Math.round(72 + wave(i) * 15),
        bodyBatteryLowestValue: Math.round(20 + wave(i) * 8),
      })),
      activities,
      vo2max: 49.2,
      vo2history: Array.from({ length: 26 }, (_, i) => ({ date: iso(175 - i * 7), value: Math.round((46 + i * 0.13 + Math.sin(i) * 0.3) * 10) / 10 })),
    },
  }
}
