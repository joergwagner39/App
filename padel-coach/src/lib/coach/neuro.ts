// Tägliches neurozentriertes Training: Augen, Gleichgewicht, Koordination, Ballgefühl, Handgelenk.
// Alles mit Padel-Schläger und Ball – das meiste geht auch in der Wohnung.

export type NeuroCategory = 'Augen' | 'Balance' | 'Koordination' | 'Ballgefühl' | 'Handgelenk' | 'Reaktion'

export interface NeuroDrill {
  id: string
  title: string
  category: NeuroCategory
  /** Wo es geht: home = Wohnung (leise, wenig Platz), court = Court/Garten/Halle mit Wand */
  places: ('home' | 'court')[]
  needs: ('racket' | 'ball' | 'wall' | 'none')[]
  duration: string
  why: string
  steps: string[]
  /** Optional: Rekord erfassen (z. B. Kontakte ohne Fehler) */
  score?: { label: string; unit: string }
  level?: string
}

export const NEURO_DRILLS: NeuroDrill[] = [
  // ── Augen ──
  {
    id: 'saccades',
    title: 'Sakkaden: schneller Blickwechsel',
    category: 'Augen',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Schnelle, präzise Augenbewegungen – du erfasst Ball und Gegner früher.',
    steps: [
      'Zwei Ziele auf Augenhöhe, ca. 40 cm auseinander (z. B. zwei Post-its an der Wand), 1 m Abstand.',
      'Kopf still halten, nur die Augen springen so schnell wie möglich hin und her – jedes Ziel scharf sehen.',
      '2 × 20 Wechsel, dann diagonal und oben/unten.',
    ],
    level: 'Steigerung: Ziele weiter auseinander oder im Einbeinstand.',
  },
  {
    id: 'near-far',
    title: 'Nah-Fern-Fokus',
    category: 'Augen',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Schnelles Scharfstellen – wichtig, wenn der Ball von der Rückwand auf dich zukommt.',
    steps: [
      'Daumen ca. 20 cm vor der Nase, ein Punkt in 3–5 m Entfernung.',
      'Abwechselnd Daumen und Punkt scharf stellen, jeweils erst wechseln, wenn es wirklich scharf ist.',
      '2 × 15 Wechsel.',
    ],
  },
  {
    id: 'vor',
    title: 'Blickstabilisation (VOR)',
    category: 'Augen',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Der Blick bleibt ruhig, auch wenn der Kopf sich bewegt – z. B. beim Laufen zum Ball.',
    steps: [
      'Einen Buchstaben oder Padel-Ball auf Armlänge fixieren.',
      'Kopf zügig links-rechts drehen (ca. 30°), der Buchstabe bleibt scharf – 30 s.',
      'Dann Kopf nicken (ja-ja) – 30 s. 2 Runden.',
    ],
    level: 'Bei Schwindel langsamer – das ist normal und wird mit der Zeit besser.',
  },
  {
    id: 'pursuit',
    title: 'Ball-Blickfolge',
    category: 'Augen',
    places: ['home', 'court'],
    needs: ['ball'],
    duration: '1–2 Min.',
    why: 'Saubere Folgebewegung der Augen – du verlierst den Ball seltener.',
    steps: [
      'Padel-Ball in der Hand, Arm ausgestreckt.',
      'Ball langsam in einer großen liegenden Acht bewegen, Augen folgen, Kopf bleibt still.',
      '2 × 30 s, dann mit der anderen Hand.',
    ],
  },
  // ── Balance ──
  {
    id: 'single-leg-head',
    title: 'Einbeinstand mit Kopfdrehen',
    category: 'Balance',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Gleichgewicht + Gleichgewichtsorgan – schützt Knie und Sprunggelenk beim Abstoppen.',
    steps: [
      'Auf einem Bein stehen, Knie leicht gebeugt.',
      'Kopf langsam links-rechts drehen, 30 s pro Bein.',
      'Steigerung: Augen schließen oder auf einem Kissen stehen.',
    ],
  },
  {
    id: 'balance-toss',
    title: 'Einbeinstand & Ball hochwerfen',
    category: 'Balance',
    places: ['home', 'court'],
    needs: ['ball'],
    duration: '2 Min.',
    why: 'Gleichgewicht halten, während die Augen beim Ball sind – wie im Spiel.',
    steps: [
      'Auf einem Bein stehen, Padel-Ball 30–50 cm hochwerfen und fangen.',
      'Mit Schlaghand werfen, mit der anderen fangen – und umgekehrt.',
      '30 s pro Bein, 2 Runden.',
    ],
    score: { label: 'Fänge in 30 s', unit: 'Fänge' },
  },
  // ── Koordination ──
  {
    id: 'cross-crawl',
    title: 'Überkreuz-Koordination mit Kopfrechnen',
    category: 'Koordination',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '2 Min.',
    why: 'Beide Gehirnhälften + Dual-Task – Entscheidungen treffen, während der Körper arbeitet.',
    steps: [
      'Im Stand: rechtes Knie zur linken Hand, linkes Knie zur rechten Hand, zügig.',
      'Dabei laut von 100 in 3er-Schritten rückwärts zählen.',
      '2 × 45 s.',
    ],
  },
  {
    id: 'weak-hand-catch',
    title: 'Fangen mit der schwachen Hand',
    category: 'Koordination',
    places: ['home', 'court'],
    needs: ['ball'],
    duration: '2 Min.',
    why: 'Schult die Hand-Auge-Koordination der Nicht-Schlaghand – die du beim Überkopfball zum Zielen brauchst.',
    steps: [
      'Ball mit der Schlaghand hochwerfen (ca. Kopfhöhe), zwischendurch einmal klatschen.',
      'Mit der schwachen Hand fangen. 30 Wiederholungen.',
      'Steigerung: zweimal klatschen oder dabei um die eigene Achse drehen.',
    ],
    score: { label: 'Fänge ohne Fehler', unit: 'Fänge' },
  },
  {
    id: 'two-ball',
    title: 'Zwei Bälle jonglieren',
    category: 'Koordination',
    places: ['home', 'court'],
    needs: ['ball'],
    duration: '2–3 Min.',
    why: 'Timing und peripheres Sehen – der Klassiker für Hand-Auge-Koordination.',
    steps: [
      'Zwei Padel-Bälle in einer Hand: abwechselnd hochwerfen und fangen (Kreis-Bewegung).',
      'Wenn das klappt: zwei Bälle, zwei Hände, Kaskade.',
      '3 × 30 s.',
    ],
    score: { label: 'Würfe ohne Fehler', unit: 'Würfe' },
  },
  // ── Ballgefühl mit Schläger ──
  {
    id: 'bote-forehand',
    title: 'Ball tippen – Vorhandseite',
    category: 'Ballgefühl',
    places: ['home', 'court'],
    needs: ['racket', 'ball'],
    duration: '2 Min.',
    why: 'Grundlage für Touch und Kontrolle – Schlagfläche ruhig, kleine Impulse.',
    steps: [
      'Ball mit einer Hand auf dem Schläger (Vorhandseite) hochtippen, ca. 20–30 cm hoch.',
      'Knie leicht gebeugt, Blick auf den Ball.',
      'Ziel: so viele Kontakte wie möglich ohne Fehler.',
    ],
    score: { label: 'Kontakte am Stück', unit: 'Kontakte' },
  },
  {
    id: 'bote-alternate',
    title: 'Ball tippen – Vorhand/Rückhand im Wechsel',
    category: 'Ballgefühl',
    places: ['home', 'court'],
    needs: ['racket', 'ball'],
    duration: '2 Min.',
    why: 'Schneller Griffwechsel und Schlagflächengefühl – wie am Netz bei Volleys.',
    steps: [
      'Bei jedem Kontakt den Schläger drehen: einmal Vorhand-, einmal Rückhandseite.',
      'Kontinentalgriff locker halten, Bewegung aus dem Unterarm.',
      'Rekord zählen.',
    ],
    score: { label: 'Kontakte am Stück', unit: 'Kontakte' },
  },
  {
    id: 'bote-weak',
    title: 'Ball tippen mit der schwachen Hand',
    category: 'Ballgefühl',
    places: ['home', 'court'],
    needs: ['racket', 'ball'],
    duration: '2 Min.',
    why: 'Fordert das Gehirn maximal – die Kontrolle der Schlaghand profitiert mit.',
    steps: ['Schläger in die Nicht-Schlaghand, Vorhandseite tippen.', 'Erst 10 am Stück, dann steigern.'],
    score: { label: 'Kontakte am Stück', unit: 'Kontakte' },
  },
  {
    id: 'bote-height',
    title: 'Hoch-tief-Tippen',
    category: 'Ballgefühl',
    places: ['home', 'court'],
    needs: ['racket', 'ball'],
    duration: '2 Min.',
    why: 'Dosierung der Kraft – entscheidend für Chiquita und Lob.',
    steps: ['Abwechselnd ein Kontakt auf Augenhöhe, einer nur 10 cm hoch.', 'Dann 3 niedrig, 1 hoch. Rhythmus halten.'],
    score: { label: 'Kontakte am Stück', unit: 'Kontakte' },
  },
  {
    id: 'bote-edge',
    title: 'Ball mit dem Rahmen tippen',
    category: 'Ballgefühl',
    places: ['home', 'court'],
    needs: ['racket', 'ball'],
    duration: '2 Min.',
    why: 'Extrem präzise Treffpunkt-Kontrolle – Profi-Übung.',
    steps: ['Ball 2–3 × normal tippen, dann einmal mit dem Rahmen (Kante) treffen.', 'Ziel: Rahmen-Kontakte am Stück.'],
    score: { label: 'Rahmen-Kontakte', unit: 'Kontakte' },
    level: 'Schwer – lieber kurz und konzentriert üben.',
  },
  {
    id: 'stop-on-racket',
    title: 'Ball auf dem Schläger abstoppen',
    category: 'Ballgefühl',
    places: ['home', 'court'],
    needs: ['racket', 'ball'],
    duration: '2 Min.',
    why: 'Weiche Hände für Stopps und Block-Volleys.',
    steps: [
      'Ball 1 m hochspielen und mit dem Schläger „fangen“: Schläger beim Kontakt nachgeben lassen, Ball bleibt liegen.',
      '10 × Vorhandseite, 10 × Rückhandseite.',
    ],
    score: { label: 'Stopps am Stück', unit: 'Stopps' },
  },
  {
    id: 'dribble',
    title: 'Ball mit dem Schläger prellen',
    category: 'Ballgefühl',
    places: ['home', 'court'],
    needs: ['racket', 'ball'],
    duration: '2 Min.',
    why: 'Kontrolle nach unten – und geht leise auf Teppich oder Matte.',
    steps: [
      'Ball mit der Schlagfläche auf den Boden prellen, Hüfthöhe.',
      'Dann in die Knie gehen und tief prellen, dann im Gehen.',
    ],
    score: { label: 'Prellen am Stück', unit: 'Kontakte' },
  },
  // ── Handgelenk / Tap-Out ──
  {
    id: 'wrist-tap',
    title: 'Tap-Out übers Handgelenk',
    category: 'Handgelenk',
    places: ['home', 'court'],
    needs: ['racket', 'ball'],
    duration: '2–3 Min.',
    why: 'Kurze Impulse nur aus dem Handgelenk – Gefühl für Volley, Bandeja und Vibora-Schnitt.',
    steps: [
      'Kontinentalgriff, Unterarm bleibt ruhig (eventuell mit der anderen Hand am Unterarm stabilisieren).',
      'Ball nur mit kurzen Handgelenksimpulsen tippen (Tap), 10–20 cm hoch.',
      'Dann „Tap-Out“: jeden 5. Kontakt mit einem Handgelenks-Snap seitlich wegspielen und wieder fangen.',
      '3 × 30 s pro Seite (Vorhand-/Rückhandseite).',
    ],
    score: { label: 'Handgelenk-Taps am Stück', unit: 'Taps' },
  },
  {
    id: 'wrist-shadow',
    title: 'Vibora-/Bandeja-Handgelenk im Schatten',
    category: 'Handgelenk',
    places: ['home', 'court'],
    needs: ['racket'],
    duration: '2 Min.',
    why: 'Saubere Handgelenks-Bewegung (Pronation) einschleifen – ohne Ball, ohne Risiko für die Wohnung.',
    steps: [
      'Langsam: Schläger hinter dem Kopf, Treffpunkt vor dem Körper, Handgelenk führt den Schlägerkopf seitlich über den Ball (Schnitt).',
      '10 × Bandeja (flach), 10 × Vibora (mehr Handgelenk).',
      'Achtung Lampe & Decke 😉',
    ],
  },
  {
    id: 'wrist-strength',
    title: 'Handgelenk-Kräftigung mit dem Schläger',
    category: 'Handgelenk',
    places: ['home', 'court'],
    needs: ['racket'],
    duration: '2 Min.',
    why: 'Vorbeugung gegen Tennis-/Padelarm.',
    steps: [
      'Schläger am Griffende halten, Unterarm auf dem Oberschenkel.',
      'Langsam Pronation/Supination (Schlägerkopf nach links und rechts drehen) – 2 × 15.',
      'Radialabduktion: Schlägerkopf hoch und langsam runter – 2 × 15.',
    ],
  },
  // ── Reaktion ──
  {
    id: 'wall-catch',
    title: 'Wandball mit Handwechsel',
    category: 'Reaktion',
    places: ['court'],
    needs: ['ball', 'wall'],
    duration: '2 Min.',
    why: 'Reaktion und Fangen unter Zeitdruck – wie bei schnellen Volleys.',
    steps: [
      '2 m vor einer Wand, Ball gegen die Wand werfen, abwechselnd links und rechts fangen.',
      'Abstand verringern, wenn es zu leicht ist.',
    ],
    score: { label: 'Fänge in 60 s', unit: 'Fänge' },
  },
  {
    id: 'drop-catch',
    title: 'Fallender Ball',
    category: 'Reaktion',
    places: ['home', 'court'],
    needs: ['ball'],
    duration: '1–2 Min.',
    why: 'Reaktionsschnelligkeit der Hand.',
    steps: [
      'Ball mit dem Handrücken nach oben auf Schulterhöhe halten, loslassen.',
      'Hand schnell drehen und den Ball fangen, bevor er die Hüfthöhe erreicht.',
      '10 × pro Hand.',
    ],
    score: { label: 'Fänge von 20', unit: 'Fänge' },
  },
  {
    id: 'reaction-arrows',
    title: 'Reaktions-Split-Step mit der App',
    category: 'Reaktion',
    places: ['home', 'court'],
    needs: ['none'],
    duration: '1 Min.',
    why: 'Split-Step, Signal erkennen, explosiv in die Richtung – das Herz des Padel-Stellungsspiels.',
    steps: [
      'Handy auf Augenhöhe hinlegen, „Reaktionspfeile starten“ antippen.',
      'Leichte Split-Step-Position. Pfeil erscheint → Ausfallschritt in die Richtung und Schlag schattieren, zurück.',
      '60 s.',
    ],
  },
]

/** Feste Reihenfolge der Kategorien in der Tagesroutine */
const SLOTS: NeuroCategory[][] = [['Augen'], ['Balance', 'Koordination'], ['Ballgefühl'], ['Ballgefühl'], ['Handgelenk', 'Reaktion']]

function dayNumber(date: string): number {
  return Math.floor(new Date(`${date}T12:00:00`).getTime() / 86_400_000)
}

/** Tägliche Routine (5 Übungen, ~10–12 Min.), rotiert jeden Tag. */
export function neuroRoutine(date: string, place: 'home' | 'court'): NeuroDrill[] {
  const seed = dayNumber(date)
  const used = new Set<string>()
  return SLOTS.map((cats, i) => {
    // Tap-Out übers Handgelenk jeden zweiten Tag fest einplanen
    if (i === SLOTS.length - 1 && seed % 2 === 0) {
      const tap = NEURO_DRILLS.find((d) => d.id === 'wrist-tap')!
      used.add(tap.id)
      return tap
    }
    const pool = NEURO_DRILLS.filter((d) => cats.includes(d.category) && d.places.includes(place) && !used.has(d.id))
    const pick = pool[(seed * (i + 3) + i * 7) % pool.length]
    used.add(pick.id)
    return pick
  })
}

export const NEURO_CATEGORIES: NeuroCategory[] = ['Augen', 'Balance', 'Koordination', 'Ballgefühl', 'Handgelenk', 'Reaktion']
