export type Accent = 'teal' | 'red' | 'amber'

export interface BriefingNews {
  /** Fettgedruckter Aufhänger, z.B. "Oracle explodiert +28 %" */
  headline: string
  /** Fließtext dahinter */
  text: string
}

export interface BriefingRow {
  title: string
  /** Kleine Zeile unter dem Titel (Sektor · Ticker · Detail) */
  meta?: string
  /** Rechte Spalte, gross */
  value: string
  /** Rechte Spalte, klein unter dem Wert */
  valueMeta?: string
}

export interface BriefingSection {
  label: string
  accent: Accent
  rows: BriefingRow[]
}

export interface Briefing {
  kicker: string
  title: string
  /** Anzeigedatum, z.B. "10. SEPTEMBER 2026" */
  date: string
  newsLabel: string
  news: BriefingNews[]
  sections: BriefingSection[]
  footer?: string
}

export const accentClasses: Record<Accent, { dot: string; label: string; bar: string; value: string }> = {
  teal: {
    dot: 'bg-teal-500',
    label: 'text-teal-700',
    bar: 'bg-teal-500',
    value: 'text-teal-700',
  },
  red: {
    dot: 'bg-rose-500',
    label: 'text-rose-700',
    bar: 'bg-rose-500',
    value: 'text-rose-600',
  },
  amber: {
    dot: 'bg-amber-400',
    label: 'text-amber-600',
    bar: 'bg-amber-400',
    value: 'text-amber-600',
  },
}

export const sampleBriefing: Briefing = {
  kicker: 'Dein täglicher Überblick',
  title: 'Markt\nBriefing',
  date: '10. September 2026',
  newsLabel: 'News des Tages',
  news: [
    {
      headline: 'Oracle explodiert +28 %',
      text: 'Der Cloud-Auftragsbestand verdreifachte sich auf sagenhafte $455 Mrd. Die KI-Cloud-Prognose wurde auf +77 % angehoben.',
    },
    {
      headline: 'Öl knackt die $100',
      text: 'Brent stieg erstmals seit Juli über 100 Dollar – neue Angriffe am Persischen Golf. Das belastete gestern die Aktien.',
    },
    {
      headline: 'Apple zeigt das iPhone Duo',
      text: 'Das erste faltbare iPhone ist da – Vorbestellung ab 12.9. Die Aktie reagierte mit -1,75 % aber verhalten.',
    },
    {
      headline: 'Renditen auf Mehrjahres-Hoch',
      text: 'Die 10-jährige US-Rendite kletterte auf 4,86 % – höchster Stand seit November 2023. Der dritte Verlusttag in Folge.',
    },
  ],
  sections: [
    {
      label: 'Earnings heute',
      accent: 'red',
      rows: [
        { title: 'Adobe', meta: 'Kreativ-Software · ADBE · ~$6,07 EPS erwartet', value: 'nachbörslich' },
        { title: 'Oracle im Fokus', meta: 'Reaktion auf den $455-Mrd.-Backlog', value: 'heute' },
        { title: 'Kroger', meta: 'Lebensmittel-Handel · KR · morgen', value: 'Fr 11.9.' },
      ],
    },
    {
      label: 'Auf dem Radar',
      accent: 'amber',
      rows: [
        {
          title: 'PPI-Erzeugerpreise & EZB',
          meta: 'Inflation & Europas Zinsentscheid · heute',
          value: '5,2%',
          valueMeta: 'PPI erwartet (YoY)',
        },
        {
          title: 'CPI-Inflation',
          meta: 'Der grosse Test vor der Fed · Freitag 11.9.',
          value: 'Fr',
          valueMeta: 'morgen',
        },
      ],
    },
  ],
}
