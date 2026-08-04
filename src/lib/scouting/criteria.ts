/** Bewertungskriterien des Matchings inkl. Standardgewichtung. */

export const CRITERIA = [
  'positionsbedarf',
  'spielzeit',
  'abloese',
  'gehalt',
  'niveau',
  'geruechte',
  'verletzung',
  'spielstil',
  'alter',
  'praeferenz',
  'vertrag',
  'einschaetzung',
] as const

export type CriterionKey = (typeof CRITERIA)[number]

export interface CriterionMeta {
  key: CriterionKey
  label: string
  description: string
  /** Standardgewicht 0..100 */
  defaultWeight: number
}

export const CRITERION_META: Record<CriterionKey, CriterionMeta> = {
  positionsbedarf: {
    key: 'positionsbedarf',
    label: 'Positionsbedarf',
    description:
      'Sucht der Verein auf der Position des Spielers? Nebenpositionen zählen anteilig.',
    defaultWeight: 100,
  },
  spielzeit: {
    key: 'spielzeit',
    label: 'Spielzeit-Perspektive',
    description:
      'Wie wahrscheinlich ist Einsatzzeit — aus Bedarf und Niveauunterschied zum Verein.',
    defaultWeight: 80,
  },
  abloese: {
    key: 'abloese',
    label: 'Ablöse vs. Budget',
    description: 'Deckt das Transferbudget des Vereins den Marktwert des Spielers?',
    defaultWeight: 90,
  },
  gehalt: {
    key: 'gehalt',
    label: 'Gehalt vs. Gehaltsgefüge',
    description:
      'Passt die Gehaltsvorstellung zum Gehaltsbudget und zum Gefüge der Mannschaft?',
    defaultWeight: 85,
  },
  niveau: {
    key: 'niveau',
    label: 'Sportliches Niveau',
    description:
      'Liga-Niveau des Vereins im Verhältnis zum bisherigen Niveau des Spielers.',
    defaultWeight: 75,
  },
  geruechte: {
    key: 'geruechte',
    label: 'Gerüchte & Interesse',
    description:
      'Dokumentiertes Interesse, gewichtet nach Verhandlungsstand, Glaubwürdigkeit und Aktualität.',
    defaultWeight: 85,
  },
  verletzung: {
    key: 'verletzung',
    label: 'Verletzungsbild',
    description:
      'Ausfallzeiten der letzten 24 Monate im Verhältnis zur Risikobereitschaft des Vereins.',
    defaultWeight: 55,
  },
  spielstil: {
    key: 'spielstil',
    label: 'Spielstil-Fit',
    description:
      'Profil des Spielers (Tempo, Technik, Physis, Defensivarbeit) gegen den Stil des Vereins.',
    defaultWeight: 60,
  },
  alter: {
    key: 'alter',
    label: 'Alter & Kaderstruktur',
    description: 'Alter des Spielers gegen Transferpolitik und Altersschnitt des Kaders.',
    defaultWeight: 45,
  },
  praeferenz: {
    key: 'praeferenz',
    label: 'Wunsch des Spielers',
    description: 'Wunschländer und Wechselbereitschaft des Spielers.',
    defaultWeight: 50,
  },
  vertrag: {
    key: 'vertrag',
    label: 'Vertragssituation',
    description:
      'Restlaufzeit — kurze Laufzeit oder Ablösefreiheit macht den Wechsel realistischer.',
    defaultWeight: 40,
  },
  einschaetzung: {
    key: 'einschaetzung',
    label: 'Eigene Einschätzung',
    description: 'Manuelle Bewertungen der Beratung zu Spieler, Verein oder zur Paarung.',
    defaultWeight: 65,
  },
}

export function defaultWeights(): Record<CriterionKey, number> {
  const out = {} as Record<CriterionKey, number>
  for (const key of CRITERIA) out[key] = CRITERION_META[key].defaultWeight
  return out
}
