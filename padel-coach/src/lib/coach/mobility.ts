// Täglicher Kurzblock: Sprunggelenk-Mobilität + Hüftbeuger-Kräftigung (~7 Min., ohne Geräte).
import type { NeuroDrill } from './neuro'

export const MOBILITY_DRILLS: NeuroDrill[] = [
  // ── Sprunggelenk ──
  {
    id: 'knee-to-wall',
    title: 'Knie-zur-Wand (mit Messung)',
    category: 'Sprunggelenk',
    places: ['home', 'court'],
    needs: ['wall'],
    duration: '2 Min.',
    why: 'Verbessert die Dorsalflexion – mehr Beweglichkeit heißt weniger Stress fürs Knie beim tiefen Abstoppen.',
    steps: [
      'Schrittstellung vor einer Wand, vorderer Fuß gerade, Ferse bleibt am Boden.',
      'Knie über die zweite Zehe Richtung Wand schieben, 2 s halten, zurück – 10 × pro Seite.',
      'Test: Fuß so weit zurücksetzen, dass das Knie die Wand gerade noch berührt. Abstand Zehe–Wand in cm messen.',
    ],
    score: { label: 'cm (schwächere Seite)', unit: 'cm' },
    level: 'Richtwert: ab ca. 10 cm gilt die Beweglichkeit als gut.',
  },
  {
    id: 'ankle-rocks',
    title: 'Ankle Rocks im Halbkniestand',
    category: 'Sprunggelenk',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Mobilisiert das obere Sprunggelenk unter leichter Last.',
    steps: [
      'Halbkniestand, vorderer Fuß flach, Hände auf dem Knie.',
      'Gewicht langsam nach vorne über die Zehen schieben, Ferse bleibt unten, 2 s halten.',
      '15 × pro Seite.',
    ],
  },
  {
    id: 'calf-stretch',
    title: 'Wadendehnung: gestreckt & gebeugt',
    category: 'Sprunggelenk',
    places: ['home', 'court'],
    needs: ['wall'],
    duration: '2 Min.',
    why: 'Die Wadenmuskulatur ist oft der Bremsklotz für die Sprunggelenk-Beweglichkeit.',
    steps: [
      'Hände an der Wand, hinteres Bein gestreckt, Ferse am Boden – 30 s.',
      'Dann hinteres Knie leicht beugen (Soleus) – 30 s.',
      'Beide Seiten.',
    ],
  },
  {
    id: 'ankle-circles',
    title: 'Fuß-ABC & Sprunggelenk-Kreise',
    category: 'Sprunggelenk',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '1–2 Min.',
    why: 'Bewegt das Gelenk in alle Richtungen – gut morgens oder nach langem Sitzen/Reisen.',
    steps: ['Sitzend oder im Einbeinstand: mit dem großen Zeh das Alphabet in die Luft schreiben.', 'Dann 10 große Kreise pro Richtung. Beide Seiten.'],
  },
  {
    id: 'eccentric-calf',
    title: 'Einbeiniges Wadenheben, langsam ab',
    category: 'Sprunggelenk',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Kräftigt Wade und Achillessehne – Schutz bei den schnellen Antritten im Padel.',
    steps: ['Auf einer Stufe oder dem Boden: beidbeinig hoch, einbeinig in 3 s ablassen.', '2 × 10 pro Seite.'],
  },
  {
    id: 'tibialis',
    title: 'Tibialis Raises an der Wand',
    category: 'Sprunggelenk',
    places: ['home', 'court'],
    needs: ['wall'],
    duration: '1–2 Min.',
    why: 'Kräftigt das Schienbein – Balance zur starken Wade, schützt bei Richtungswechseln.',
    steps: ['Rücken an die Wand, Füße ca. 30 cm davor.', 'Zehen und Vorfuß so hoch wie möglich ziehen, langsam ab – 2 × 15–20.'],
  },
  // ── Hüftbeuger ──
  {
    id: 'slr',
    title: 'Bein heben in Rückenlage (mit Halt)',
    category: 'Hüftbeuger',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Kräftigt den Hüftbeuger in Verlängerung – stabilisiert Hüfte und entlastet das Knie.',
    steps: [
      'Rückenlage, ein Bein angestellt, das andere gestreckt, Zehen zu dir.',
      'Gestrecktes Bein bis Kniehöhe des anderen heben, 2 s halten, langsam ab.',
      '2 × 10 pro Seite.',
    ],
  },
  {
    id: 'psoas-march',
    title: 'Psoas-March',
    category: 'Hüftbeuger',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Hüftbeuger-Kraft über 90° – genau die Position beim Antritt und Knieheben.',
    steps: [
      'Rückenlage, beide Knie 90° in der Luft (optional Miniband um die Füße).',
      'Ein Bein langsam strecken, das andere Knie aktiv zur Brust ziehen. Unterer Rücken bleibt am Boden.',
      '2 × 10 pro Seite.',
    ],
  },
  {
    id: 'standing-knee-iso',
    title: 'Stehendes Knieheben gegen die Hand',
    category: 'Hüftbeuger',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Isometrische Kraft im Einbeinstand – trainiert Hüftbeuger und Balance zugleich.',
    steps: [
      'Einbeinstand, anderes Knie auf Hüfthöhe.',
      'Mit der Hand von oben gegen das Knie drücken, Knie hält dagegen – 20 s.',
      '3 × pro Seite.',
    ],
  },
  {
    id: 'seated-leg-lift',
    title: 'Sitzendes Bein-Anheben',
    category: 'Hüftbeuger',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Kräftigt den Hüftbeuger in der kürzesten Position – oft die schwächste.',
    steps: [
      'Aufrecht sitzen, Beine gestreckt, Hände neben den Hüften.',
      'Ein gestrecktes Bein 5–10 cm anheben, 2 s halten, ab.',
      '2 × 8 pro Seite.',
    ],
    score: { label: 'Sekunden gehalten (bestes Bein)', unit: 's' },
  },
  {
    id: 'hollow-tuck',
    title: 'Knee Tucks in Rückenlage',
    category: 'Hüftbeuger',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Hüftbeuger + Bauch zusammen – wichtig für Sprints und Hyrox-Stationen.',
    steps: ['Rückenlage, Arme seitlich, Beine leicht angehoben.', 'Knie zur Brust ziehen, wieder fast strecken – 3 × 12, langsam.'],
  },
  // ── Gegendehnung ──
  {
    id: 'couch-stretch',
    title: 'Couch Stretch',
    category: 'Dehnung',
    places: ['home', 'court'],
    needs: ['wall'],
    duration: '1,5 Min.',
    why: 'Hüftbeuger lang machen – nach dem Kräftigen und nach viel Sitzen.',
    steps: ['Hinteres Knie an Wand/Sofa, Fußrücken hoch an der Wand, vorderer Fuß aufgestellt.', 'Po anspannen, Becken nach vorne – 45 s pro Seite.'],
  },
  {
    id: 'half-kneel-stretch',
    title: 'Hüftbeuger-Dehnung im Halbkniestand',
    category: 'Dehnung',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '1,5 Min.',
    why: 'Sanftere Variante des Couch Stretch.',
    steps: ['Halbkniestand, Po anspannen, Becken leicht nach vorne schieben, Arm der hinteren Seite nach oben.', '45 s pro Seite.'],
  },
]

function dayNumber(date: string): number {
  return Math.floor(new Date(`${date}T12:00:00`).getTime() / 86_400_000)
}

/** Tagesblock: 2 × Sprunggelenk, 2 × Hüftbeuger, 1 × Dehnung. Knie-zur-Wand-Test jeden Montag. */
export function mobilityRoutine(date: string): NeuroDrill[] {
  const seed = dayNumber(date)
  const pick = (cat: string, n: number, offset: number) => {
    const pool = MOBILITY_DRILLS.filter((d) => d.category === cat)
    return Array.from({ length: n }, (_, i) => pool[(seed * n + i + offset) % pool.length])
  }
  const isMonday = new Date(`${date}T12:00:00`).getDay() === 1
  let ankle = pick('Sprunggelenk', 2, 0)
  if (isMonday && !ankle.some((d) => d.id === 'knee-to-wall')) ankle = [MOBILITY_DRILLS[0], ankle[1]]
  return [...ankle, ...pick('Hüftbeuger', 2, 1), ...pick('Dehnung', 1, 0)]
}
