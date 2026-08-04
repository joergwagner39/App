import { DataProvider } from './types'
import { demoProvider } from './demo'
import { apiFootballProvider } from './apiFootball'
import { sportmonksProvider } from './sportmonks'

export const PROVIDERS: Record<string, DataProvider> = {
  demo: demoProvider,
  'api-football': apiFootballProvider,
  sportmonks: sportmonksProvider,
}

/**
 * Aktiver Provider laut SCOUTING_DATA_PROVIDER. Ist der gewählte Provider nicht
 * konfiguriert (kein Key), fällt die App bewusst auf Demo-Daten zurück, statt
 * mit einem Fehler stehen zu bleiben — der Zustand wird in der Oberfläche
 * angezeigt.
 */
export function activeProvider(): { provider: DataProvider; fellBack: boolean; requested: string } {
  const requested = (process.env.SCOUTING_DATA_PROVIDER ?? 'demo').trim().toLowerCase()
  const chosen = PROVIDERS[requested]
  if (!chosen) return { provider: demoProvider, fellBack: true, requested }
  if (!chosen.isConfigured()) return { provider: demoProvider, fellBack: true, requested }
  return { provider: chosen, fellBack: false, requested }
}

export type { DataProvider } from './types'
export { demoProvider } from './demo'
