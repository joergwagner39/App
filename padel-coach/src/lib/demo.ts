// Beispieldaten, solange weder Oura noch Garmin verbunden ist.
import type { WearableData } from './wearables'

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export function demoData(): Omit<WearableData, 'status'> {
  const days = Array.from({ length: 30 }, (_, i) => 29 - i)
  const wave = (i: number) => Math.sin(i / 2.3)
  return {
    demo: true,
    oura: {
      connected: false,
      sleep: days.map((d, i) => ({
        date: iso(d),
        score: Math.round(76 + wave(i) * 8),
        totalSleepSeconds: Math.round((7.1 + wave(i) * 0.6) * 3600),
        averageHrv: Math.round(52 + wave(i) * 7),
        lowestHeartRate: Math.round(50 - wave(i) * 2),
      })),
      readiness: days.map((d, i) => ({ date: iso(d), score: Math.round(78 + wave(i) * 9), temperatureDeviation: 0.1 })),
    },
    garmin: {
      connected: false,
      daily: days.map((d, i) => ({ date: iso(d), restingHeartRate: 51, averageStressLevel: 28, bodyBatteryHighestValue: Math.round(72 + wave(i) * 15) })),
      activities: [
        { date: iso(2), activityType: 'indoor_cycling', duration: 2700, maxHR: 176, trainingEffect: 3.8, anaerobicTrainingEffect: 2.4 },
        { date: iso(4), activityType: 'padel', duration: 5400, maxHR: 171, trainingEffect: 3.1, anaerobicTrainingEffect: 1.9 },
      ],
      vo2max: 49,
    },
  }
}
