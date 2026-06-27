import type {
  OuraSleepData,
  OuraReadinessData,
  GarminDailyData,
  GarminActivityData,
  TrainingRecommendation,
} from '@/types'

export function calculateTrainingRecommendation(
  sleep: OuraSleepData | undefined,
  readiness: OuraReadinessData | undefined,
  garminDaily: GarminDailyData | undefined,
  recentActivities: GarminActivityData[],
): TrainingRecommendation {
  const reasons: string[] = []

  const ouraReadiness = readiness?.score ?? 70
  const ouraSleep = sleep?.score ?? 70
  const bodyBattery = garminDaily?.bodyBatteryHighestValue ?? 70
  const stress = garminDaily?.averageStressLevel ?? 30
  const hrv = sleep?.average_hrv ?? 50

  // Detect consecutive hard training days
  const recentHardDays = recentActivities.filter(
    (a) => (a.trainingEffect ?? 0) >= 3.5
  ).length

  // Weighted composite score
  let composite = (
    ouraReadiness * 0.35 +
    ouraSleep * 0.25 +
    bodyBattery * 0.25 +
    (100 - stress * 1.2) * 0.15
  )

  if (recentHardDays >= 2) {
    composite -= 10
    reasons.push(`${recentHardDays} intensive Einheiten in den letzten 7 Tagen — Erholung priorisieren`)
  }

  if (hrv < 35) {
    composite -= 8
    reasons.push(`Niedriger HRV (${hrv.toFixed(0)} ms) deutet auf erhöhten Stress hin`)
  } else if (hrv > 60) {
    composite += 5
    reasons.push(`Guter HRV-Wert (${hrv.toFixed(0)} ms) — Erholung verläuft optimal`)
  }

  if (sleep?.efficiency && sleep.efficiency < 85) {
    composite -= 6
    reasons.push(`Schlafeffizienz ${sleep.efficiency.toFixed(0)}% unter Idealwert`)
  }

  if (ouraReadiness >= 80)
    reasons.push(`Oura Bereitschaftsscore ${ouraReadiness} — Körper ist fit`)
  else if (ouraReadiness < 60)
    reasons.push(`Oura Bereitschaftsscore ${ouraReadiness} — Belastung reduzieren`)

  if (bodyBattery >= 75)
    reasons.push(`Garmin Body Battery ${bodyBattery} — gute Energiereserven`)
  else if (bodyBattery < 40)
    reasons.push(`Garmin Body Battery ${bodyBattery} — Energiespeicher niedrig`)

  composite = Math.max(0, Math.min(100, composite))

  if (composite >= 85) {
    return {
      level: 'peak',
      title: 'Hochintensives Training',
      description: 'Alle Signale grün. Idealer Tag für maximale Leistung.',
      suggestedActivities: ['Intervall-Training', 'Tempolauf', 'Wettkampf-Simulation', 'Schwimmen Intensiv'],
      targetHRZone: 'Zone 4–5 (80–95% HFmax)',
      targetDuration: '45–75 Min.',
      reasoning: reasons,
    }
  }

  if (composite >= 70) {
    return {
      level: 'hard',
      title: 'Solides Training',
      description: 'Gute Erholung. Qualitätstraining möglich — mit Kontrolle.',
      suggestedActivities: ['Tempoläufe', 'Krafttraining', 'Radfahren mittel-intensiv', 'Schwimmen Technik'],
      targetHRZone: 'Zone 3–4 (70–85% HFmax)',
      targetDuration: '45–60 Min.',
      reasoning: reasons,
    }
  }

  if (composite >= 55) {
    return {
      level: 'moderate',
      title: 'Moderates Training',
      description: 'Mittlere Bereitschaft. Ausdauerarbeit im aeroben Bereich empfohlen.',
      suggestedActivities: ['Lockerer Lauf', 'Yoga', 'Radfahren locker', 'Schwimmen entspannt', 'Spaziergang'],
      targetHRZone: 'Zone 2 (60–70% HFmax)',
      targetDuration: '30–45 Min.',
      reasoning: reasons,
    }
  }

  if (composite >= 40) {
    return {
      level: 'easy',
      title: 'Leichte Bewegung',
      description: 'Körper braucht Erholung. Nur sehr leichte Aktivität empfohlen.',
      suggestedActivities: ['Spaziergang', 'Stretching', 'Mobility', 'Yoga sanft'],
      targetHRZone: 'Zone 1 (unter 60% HFmax)',
      targetDuration: '20–30 Min.',
      reasoning: reasons,
    }
  }

  return {
    level: 'rest',
    title: 'Ruhetag',
    description: 'Körper signalisiert hohen Erholungsbedarf. Heute ausruhen!',
    suggestedActivities: ['Schlafen', 'Meditation', 'Sauna', 'Massage', 'Leichtes Stretching'],
    reasoning: reasons,
  }
}
