// Trainingsbibliothek: VO2max (kniefreundlich), Hyrox, Kraft, Oberkörper, Zone 2, Recovery.
// Jede Einheit passt sich an den gewählten Umfang an (weniger / normal / mehr).
import type { DoseLevel, SessionType } from './types'

export type Modality = 'bike' | 'rower' | 'skierg' | 'pool' | 'crosstrainer' | 'run'

export const MODALITY_LABEL: Record<Modality, string> = {
  bike: 'Rad-Ergometer / Wattbike',
  rower: 'Rudergerät',
  skierg: 'SkiErg',
  pool: 'Schwimmen',
  crosstrainer: 'Crosstrainer',
  run: 'Laufen (flach, weicher Untergrund)',
}

export interface WorkoutContext {
  maxHr?: number
  modality: Modality
  /** Knieschmerz 0–10 aus dem heutigen Check-in */
  knee: number
  canRun: boolean
  dose: DoseLevel
  equipment: { sled: boolean; wallball: boolean; kettlebell: boolean; skierg: boolean; rower: boolean; bike: boolean }
}

export interface Block {
  name: string
  detail: string
  note?: string
  /** Zusatzblock bei „mehr“ */
  extra?: boolean
}

export interface Workout {
  id: string
  type: SessionType
  title: string
  /** Minuten für weniger / normal / mehr – oder fester Text */
  minutes: [number, number, number] | string
  goal: string
  blocks: (ctx: WorkoutContext) => Block[]
}

export function durationLabel(w: Workout, dose: DoseLevel): string {
  if (typeof w.minutes === 'string') return w.minutes
  const i = dose === 'less' ? 0 : dose === 'more' ? 2 : 1
  return `~${w.minutes[i]} Min.`
}

/** Wert je nach Umfang */
const by = <T,>(ctx: WorkoutContext, less: T, normal: T, more: T): T => (ctx.dose === 'less' ? less : ctx.dose === 'more' ? more : normal)

export function hr(ctx: WorkoutContext, lo: number, hi: number): string {
  if (!ctx.maxHr) return `${lo}–${hi} % HFmax`
  return `${Math.round((ctx.maxHr * lo) / 100)}–${Math.round((ctx.maxHr * hi) / 100)} bpm`
}

const warmup = (ctx: WorkoutContext, min = 12): Block => ({
  name: 'Aufwärmen',
  detail: `${by(ctx, Math.max(8, min - 4), min, min)} min ${MODALITY_LABEL[ctx.modality]} locker (${hr(ctx, 60, 70)}), letzte 3 min mit 3 × 20 s Steigerung.`,
})

const cooldown = (ctx: WorkoutContext, min = 10): Block => ({
  name: 'Cool-down',
  detail: `${by(ctx, Math.max(5, min - 5), min, min)} min sehr locker (${hr(ctx, 55, 65)}), danach 5 min Mobility für Hüfte und Waden.`,
})

const kneePrehab = (ctx: WorkoutContext): Block | null =>
  ctx.knee >= 2 && ctx.dose !== 'less'
    ? {
        name: 'Knie-Prehab',
        detail: 'Spanish Squat (Band hinter den Knien) 5 × 45 s halten, Terminal Knee Extension mit Band 2 × 15, Wadenheben 2 × 15.',
        note: 'Schmerz bis 3/10 ist ok, wenn er bis morgen abklingt.',
      }
    : null

const extra = (ctx: WorkoutContext, detail: string): Block | null =>
  ctx.dose === 'more' ? { name: 'Extra (mehr Training)', detail, extra: true } : null

function compact(blocks: (Block | null)[]): Block[] {
  return blocks.filter((b): b is Block => b !== null)
}

/** Ersatz für einen 1-km-Lauf, falls Laufen heute nicht erlaubt ist. */
function runSub(ctx: WorkoutContext): string {
  if (ctx.canRun) return '1 km Laufen (locker-zügig, flach)'
  if (ctx.equipment.bike) return '2,5 km Rad-Ergometer zügig (≈ 4 min)'
  if (ctx.equipment.rower) return '1000 m Rudern zügig'
  if (ctx.equipment.skierg) return '800 m SkiErg zügig'
  return '4 min Crosstrainer zügig'
}

const upperBody = (ctx: WorkoutContext): Block[] => [
  {
    name: 'Zug',
    detail: `Klimmzüge oder Latzug ${by(ctx, 3, 4, 5)} × 6–8 + Einarmiges Kurzhantel-Rudern ${by(ctx, 2, 3, 4)} × 10/Seite`,
  },
  {
    name: 'Druck',
    detail: `Schrägbankdrücken mit Kurzhanteln ${by(ctx, 2, 3, 4)} × 8 + Landmine- oder Schulterdrücken halbkniend ${by(ctx, 2, 3, 3)} × 8/Seite`,
  },
  {
    name: 'Schulter-Prehab (Überkopfschläge)',
    detail: 'Face Pulls 3 × 12 + Außenrotation mit Band 2 × 15 + Y-T-W 1 × 8 je Position',
    note: 'Schützt die Schulter bei Bandeja, Vibora und Smash.',
  },
  {
    name: 'Rumpf (Rotation)',
    detail: `Pallof Press ${by(ctx, 2, 3, 3)} × 10/Seite + Kabel-Holzhacker ${by(ctx, 2, 3, 3)} × 10/Seite + Dead Bug 2 × 10`,
  },
]

export const WORKOUTS: Workout[] = [
  // ── VO2max ─────────────────────────────────────────────
  {
    id: 'vo2-4x4',
    type: 'vo2max',
    title: 'Norwegisches 4×4',
    minutes: [40, 50, 65],
    goal: 'Klassiker für die VO2max: lange Zeit nahe an der maximalen Sauerstoffaufnahme.',
    blocks: (ctx) =>
      compact([
        warmup(ctx),
        {
          name: 'Hauptteil',
          detail: `${by(ctx, 3, 4, 5)} × 4 min hart auf ${MODALITY_LABEL[ctx.modality]} – Ziel ${hr(ctx, 88, 95)} ab ca. Minute 2. Dazwischen 3 min aktiv locker (${hr(ctx, 60, 70)}).`,
          note: 'Intensität so wählen, dass das letzte Intervall gerade noch gleich stark geht (RPE 8–9/10).',
        },
        cooldown(ctx),
        extra(ctx, `+ 10 min Zone 2 (${hr(ctx, 62, 72)}) auf einem anderen Gerät, z. B. SkiErg oder Rudern.`),
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'vo2-30-30',
    type: 'vo2max',
    title: '30/30-Serien',
    minutes: [35, 45, 55],
    goal: 'Kurze Intervalle, die Herzfrequenz bleibt trotzdem lange hoch – mental leichter als 4×4.',
    blocks: (ctx) =>
      compact([
        warmup(ctx),
        {
          name: 'Hauptteil',
          detail: `${by(ctx, 2, 3, 4)} Serien × 10 × (30 s hart / 30 s locker) auf ${MODALITY_LABEL[ctx.modality]}. 3 min Pause zwischen den Serien.`,
          note: `Ab der 4. Wiederholung sollte die Herzfrequenz bei ${hr(ctx, 88, 95)} liegen.`,
        },
        cooldown(ctx),
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'vo2-5x3',
    type: 'vo2max',
    title: '3-Minuten-Intervalle',
    minutes: [38, 45, 55],
    goal: 'Etwas kürzere Intervalle mit hohem Tempo – gut für Abwechslung.',
    blocks: (ctx) =>
      compact([
        warmup(ctx),
        {
          name: 'Hauptteil',
          detail: `${by(ctx, 4, 5, 6)} × 3 min bei ${hr(ctx, 90, 95)} (RPE 9/10) auf ${MODALITY_LABEL[ctx.modality]}, jeweils 2 min locker dazwischen.`,
        },
        cooldown(ctx),
        extra(ctx, 'Core-Finisher: 3 Runden Seitstütz 30 s/Seite + Hollow Hold 30 s.'),
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'vo2-pyramid',
    type: 'vo2max',
    title: 'Intervall-Pyramide',
    minutes: [40, 50, 60],
    goal: 'Wechselnde Intervalllängen – die langen Stücke für die VO2max, die kurzen für Tempohärte.',
    blocks: (ctx) =>
      compact([
        warmup(ctx),
        {
          name: 'Hauptteil',
          detail: `${by(ctx, '1-2-3-2-1', '1-2-3-4-3-2-1', '1-2-3-4-4-3-2-1')} min hart (${hr(ctx, 88, 95)}) auf ${MODALITY_LABEL[ctx.modality]}. Pause jeweils halb so lang wie das Intervall davor.`,
        },
        cooldown(ctx),
        kneePrehab(ctx),
      ]),
  },

  // ── Hyrox ──────────────────────────────────────────────
  {
    id: 'hyrox-compromised',
    type: 'hyrox',
    title: 'Hyrox Compromised Intervals',
    minutes: [42, 55, 70],
    goal: 'Ausdauer unter Vorermüdung – wie im Rennen, aber kniefreundlich.',
    blocks: (ctx) =>
      compact([
        warmup(ctx, 10),
        {
          name: `${by(ctx, 3, 4, 5)} Runden`,
          detail: [
            `A: ${runSub(ctx)}`,
            ctx.equipment.sled ? 'B: Sled Push 4 × 12,5 m (schwer, kurze Schritte)' : 'B: Kettlebell-Swings 20 ×',
            `C: ${runSub(ctx)}`,
            ctx.equipment.skierg ? 'D: SkiErg 250 m' : 'D: Burpees ohne Sprung 10 ×',
            '2 min Pause zwischen den Runden',
          ].join(' · '),
          note: 'Ziel: Rennpace halten, nicht die erste Runde „verballern“.',
        },
        cooldown(ctx, 8),
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'hyrox-stations',
    type: 'hyrox',
    title: 'Stationen-Technik & Kraftausdauer',
    minutes: [38, 50, 62],
    goal: 'Effiziente Technik an den Stationen – die meisten verlieren dort Zeit, nicht beim Laufen.',
    blocks: (ctx) => {
      const kneeBad = ctx.knee >= 4
      const sets = by(ctx, 3, 5, 6)
      return compact([
        warmup(ctx, 10),
        {
          name: 'Block 1 – Schlitten',
          detail: ctx.equipment.sled
            ? `${sets} × (Sled Push 12,5 m + Sled Pull 12,5 m), 90 s Pause. Fokus: niedriger Körperwinkel, Arme fast gestreckt.`
            : `${sets} × (Band-/Kabelzug Rudern 15 + Wandschieben isometrisch 20 s), 60 s Pause.`,
        },
        {
          name: 'Block 2 – Lunges/Wall Balls',
          detail: kneeBad
            ? `Knie-Variante: Box-Squat zur hohen Box mit Medizinball ${by(ctx, 3, 4, 5)} × 12 + Kettlebell-Kreuzheben ${by(ctx, 3, 4, 5)} × 10.`
            : `Sandbag Reverse Lunges (kurze Bewegung, kontrolliert) ${by(ctx, 3, 4, 5)} × 10/Seite + ${ctx.equipment.wallball ? `Wall Balls zur Box (Box-Squat) ${by(ctx, 3, 4, 5)} × 15` : 'Goblet Squats 4 × 12'}.`,
          note: kneeBad ? 'Heute keine Ausfallschritte – Knie schonen.' : 'Knie zeigt über den Fuß, nicht nach innen.',
        },
        ctx.dose === 'less'
          ? null
          : {
              name: 'Block 3 – Griff & Rumpf',
              detail: `Farmers Carry ${by(ctx, 3, 4, 5)} × 40 m (schwer) + ${ctx.equipment.skierg ? `SkiErg ${by(ctx, 3, 4, 5)} × 200 m` : 'Rudern 4 × 250 m'}.`,
            },
        cooldown(ctx, 8),
      ])
    },
  },
  {
    id: 'hyrox-emom',
    type: 'hyrox',
    title: 'Hyrox-EMOM',
    minutes: [35, 45, 55],
    goal: 'Alles in Bewegung halten: Pace-Gefühl und schnelle Übergänge.',
    blocks: (ctx) =>
      compact([
        warmup(ctx, 8),
        {
          name: `EMOM ${by(ctx, 24, 30, 36)} min (${by(ctx, 4, 5, 6)} Runden)`,
          detail: [
            `Min 1: ${ctx.equipment.skierg ? 'SkiErg 12 Kal.' : 'Rad 15 Kal.'}`,
            `Min 2: ${ctx.equipment.kettlebell ? 'KB-Swings 15' : 'Hip Thrusts 15'}`,
            `Min 3: ${ctx.equipment.rower ? 'Rudern 12 Kal.' : 'Rad 15 Kal.'}`,
            'Min 4: Farmers Carry 40 m',
            `Min 5: ${ctx.knee >= 4 ? 'Burpees ohne Sprung 8' : ctx.equipment.wallball ? 'Wall Balls 12 (Box-Squat)' : 'Goblet Squats 12'}`,
            'Min 6: Pause',
          ].join(' · '),
        },
        cooldown(ctx, 8),
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'hyrox-half',
    type: 'hyrox',
    title: 'Hyrox-Simulation',
    minutes: [38, 50, 70],
    goal: 'Race-Simulation – Pacing und Übergänge üben.',
    blocks: (ctx) => {
      const stations = [
        `${runSub(ctx)} → ${ctx.equipment.skierg ? 'SkiErg 500 m' : 'Rudern 500 m'}`,
        `${runSub(ctx)} → ${ctx.equipment.sled ? 'Sled Push 50 m' : 'KB-Swings 30'}`,
        `${runSub(ctx)} → ${ctx.equipment.rower ? 'Rudern 500 m' : 'Rad 1,5 km'}`,
        `${runSub(ctx)} → ${ctx.knee >= 4 ? 'Farmers Carry 100 m' : ctx.equipment.wallball ? '50 Wall Balls (Box-Squat)' : '40 Goblet Squats'}`,
        `${runSub(ctx)} → ${ctx.equipment.sled ? 'Sled Pull 50 m' : 'Band-Rudern 30'}`,
        `${runSub(ctx)} → Farmers Carry 200 m`,
      ]
      return compact([
        warmup(ctx, 12),
        {
          name: `Simulation mit ${by(ctx, 3, 4, 6)} Stationen (auf Zeit)`,
          detail: stations.slice(0, by(ctx, 3, 4, 6)).join(' · '),
          note: 'Zeit notieren – in 4–6 Wochen wiederholen.',
        },
        cooldown(ctx, 10),
      ])
    },
  },

  // ── Kraft ──────────────────────────────────────────────
  {
    id: 'strength-a',
    type: 'strength',
    title: 'Kraft A – Hüfte & Knie-Schutz',
    minutes: [35, 50, 65],
    goal: 'Kraft für Padel & Hyrox mit Fokus auf hintere Kette und kniefreundliche Beinübungen.',
    blocks: (ctx) =>
      compact([
        { name: 'Aufwärmen', detail: '5 min Rad/Rudern locker, dann Monster-Walks 2 × 10/Richtung, Glute Bridges 2 × 12.' },
        { name: '1', detail: `Spanish Squat isometrisch ${by(ctx, 3, 4, 5)} × 45 s (Band hinter den Knien)`, note: 'Wirkt oft schmerzlindernd auf die Patellasehne.' },
        { name: '2', detail: `Rumänisches Kreuzheben ${by(ctx, 3, 4, 5)} × 6 (2 RIR)` },
        { name: '3', detail: `Hip Thrust ${by(ctx, 2, 3, 4)} × 8` },
        { name: '4', detail: `${ctx.knee >= 4 ? 'Step-ups auf niedrige Box (20 cm)' : 'Step-ups auf kniehohe Box'} ${by(ctx, 2, 3, 3)} × 8/Seite, langsam absenken` },
        ctx.dose === 'less' ? null : { name: '5', detail: 'Klimmzüge oder Latzug 3 × 8 + Rudern am Kabel 3 × 10' },
        { name: '6', detail: 'Pallof Press 3 × 10/Seite + Wadenheben 3 × 15' },
        extra(ctx, `+ 15 min SkiErg oder Rudern in Zone 2 (${hr(ctx, 62, 72)}).`),
      ]),
  },
  {
    id: 'strength-b',
    type: 'strength',
    title: 'Kraft B – Power & Stabilität',
    minutes: [35, 50, 65],
    goal: 'Kraft, Stabilität für Richtungswechsel und Schulter-Prehab für Überkopfschläge.',
    blocks: (ctx) =>
      compact([
        { name: 'Aufwärmen', detail: '5 min Rad locker, Außenrotation mit Band 2 × 15, Hüftmobilisation 90/90.' },
        { name: '1', detail: `${ctx.equipment.kettlebell ? 'Trap-Bar- oder KB-Kreuzheben' : 'Kreuzheben'} ${by(ctx, 3, 4, 5)} × 5` },
        {
          name: '2',
          detail: ctx.knee >= 4 ? `Wandsitz isometrisch ${by(ctx, 3, 4, 5)} × 40 s (Winkel schmerzfrei wählen)` : `Split Squat mit Tempo 3-1-1, kurze Bewegung, ${by(ctx, 2, 3, 4)} × 8/Seite`,
        },
        { name: '3', detail: 'Nordic Hamstring Curl negativ 3 × 5 (oder Beinbeuger-Maschine 3 × 10)' },
        ctx.dose === 'less' ? null : { name: '4', detail: 'Liegestütz oder Bankdrücken 3 × 8 + Face Pulls 3 × 12' },
        { name: '5', detail: 'Copenhagen Plank 3 × 20 s/Seite + Seitstütz 3 × 30 s' },
        { name: '6', detail: 'Tibialis Raises 2 × 20 (Schienbein an die Wand, Zehen hoch)' },
        extra(ctx, 'Sled Push 4 × 15 m schwer oder Farmers Carry 4 × 40 m.'),
      ]),
  },

  // ── Oberkörper (z. B. nach Padel-Match) ───────────────────
  {
    id: 'upper-z2',
    type: 'upper',
    title: 'Oberkörper + Rad Zone 2',
    minutes: [45, 65, 85],
    goal: 'Beine vom Padel locker durchbewegen, Oberkörper und Rumpf gezielt kräftigen.',
    blocks: (ctx) =>
      compact([
        {
          name: 'Rad Zone 2 (Beine lockern)',
          detail: `${by(ctx, 20, 30, 45)} min Rad-Ergometer ruhig bei ${hr(ctx, 60, 70)}, hohe Trittfrequenz (85–95 U/min), wenig Widerstand.`,
          note: 'Fördert die Durchblutung nach dem Match, ohne die Beine zu belasten.',
        },
        ...upperBody(ctx),
        extra(ctx, `+ 10 min SkiErg in Zone 2 (${hr(ctx, 62, 72)}) – Oberkörper-Ausdauer für Hyrox.`),
      ]),
  },
  {
    id: 'upper-only',
    type: 'upper',
    title: 'Oberkörper & Rumpf',
    minutes: [30, 40, 55],
    goal: 'Beine erholen lassen, trotzdem trainieren: Zug, Druck, Schulter-Prehab und Rotation.',
    blocks: (ctx) =>
      compact([
        { name: 'Aufwärmen', detail: '5 min Rad sehr locker, Schulterkreisen, Band-Pull-Aparts 2 × 15.' },
        ...upperBody(ctx),
        extra(ctx, 'Hyrox-Griff: Farmers-Carry-Hold 3 × 40 s (stehend, schwer) + Hängen an der Stange 3 × 30 s.'),
        { name: 'Beine', detail: '10 min Mobility: Couch Stretch, 90/90, Waden – die Beine erholen sich heute.' },
      ]),
  },

  // ── Zone 2 ─────────────────────────────────────────────
  {
    id: 'zone2-steady',
    type: 'zone2',
    title: 'Zone-2-Grundlage',
    minutes: [35, 55, 80],
    goal: 'Aerobe Basis und Erholungsfähigkeit – macht dich zwischen Ballwechseln schneller frisch.',
    blocks: (ctx) =>
      compact([
        {
          name: 'Dauerbelastung',
          detail: `${by(ctx, 30, 45, 70)} min ${MODALITY_LABEL[ctx.modality]} gleichmäßig bei ${hr(ctx, 62, 72)}.`,
          note: 'Talk-Test: ganze Sätze sprechen muss möglich sein.',
        },
        { name: 'Mobility', detail: '10 min: Couch Stretch, 90/90, thorakale Rotation, Wadendehnung.' },
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'zone2-mixed',
    type: 'zone2',
    title: 'Zone 2 Mixed (Rad + Rudern)',
    minutes: [35, 50, 70],
    goal: 'Grundlage mit Gerätewechsel – mehr Muskulatur, weniger Monotonie.',
    blocks: (ctx) =>
      compact([
        {
          name: 'Dauerbelastung',
          detail: `${by(ctx, 15, 20, 30)} min Rad + ${by(ctx, 10, 15, 20)} min Rudern + ${by(ctx, 5, 10, 15)} min ${ctx.equipment.skierg ? 'SkiErg' : 'Rad'}, alles bei ${hr(ctx, 62, 72)}.`,
        },
        { name: 'Core', detail: 'Dead Bug 3 × 10, Seitstütz 3 × 30 s.' },
      ]),
  },

  // ── Recovery / Padel-Tag / Ruhe ─────────────────────────
  {
    id: 'recovery-mobility',
    type: 'recovery',
    title: 'Recovery: Bewegen & Mobilisieren',
    minutes: [20, 35, 45],
    goal: 'Durchblutung fördern, Nervensystem runterfahren – kein Trainingsreiz.',
    blocks: (ctx) =>
      compact([
        { name: 'Locker bewegen', detail: `${by(ctx, 10, 20, 30)} min Spaziergang oder Rad ganz locker (${hr(ctx, 50, 60)}).` },
        {
          name: 'Mobility-Flow (10 min)',
          detail: 'Katze-Kuh 10 ×, 90/90 Hüftwechsel 10 ×, Couch Stretch 60 s/Seite, Thorax-Rotation 8/Seite, Waden an der Wand 45 s/Seite.',
        },
        { name: 'Atmung (5 min)', detail: '4 s ein, 6–8 s aus – im Liegen, Beine hochgelegt.' },
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'recovery-swim',
    type: 'recovery',
    title: 'Recovery: Schwimmen/Aqua',
    minutes: [20, 30, 40],
    goal: 'Entlastung für Gelenke, Wasserdruck unterstützt die Erholung.',
    blocks: (ctx) => [
      { name: 'Schwimmen', detail: `${by(ctx, 15, 25, 35)} min ruhig, Technik statt Tempo. Alternativ Aqua-Jogging.` },
      { name: 'Sauna optional', detail: '1–2 Gänge, viel trinken – nicht direkt vor dem Schlafen.' },
    ],
  },
  {
    id: 'padel-activation',
    type: 'padel',
    title: 'Padel-Tag: Aktivierung vor dem Spiel',
    minutes: '12 Min. + Padel',
    goal: 'Padel ist heute die Einheit. Gut aufwärmen schützt Knie und Schulter.',
    blocks: (ctx) =>
      compact([
        {
          name: 'Aktivierung (vor dem Match)',
          detail:
            'Monster-Walks mit Band 2 × 10/Richtung, Hüftkreisen, Außenrotation Schulter mit Band 2 × 12, 5 × Split-Step + 3 Schritte in jede Richtung, 4 × lockere Shuffles.',
        },
        { name: 'Padel', detail: 'Spielen! Achte heute auf die Taktik des Tages.' },
        { name: 'Danach', detail: '5 min Waden, Hüftbeuger und Brustwirbelsäule dehnen, etwas Protein + Flüssigkeit.' },
        extra(ctx, 'Nach dem Padel: 15 min Oberkörper-Zirkel (Klimmzüge, Liegestütz, Face Pulls – je 3 Runden).'),
        ctx.knee >= 3 ? { name: 'Knie', detail: 'Heute eher Positionsspiel statt Sprints zur Wand; nach dem Spiel Spanish Squat 3 × 45 s.' } : null,
      ]),
  },
  {
    id: 'rest-day',
    type: 'rest',
    title: 'Ruhetag',
    minutes: '—',
    goal: 'Heute ist Erholung das Training.',
    blocks: () => [
      { name: 'Bewegung', detail: 'Nur Alltagsbewegung, gern ein ruhiger Spaziergang an der frischen Luft.' },
      { name: 'Schlaf', detail: 'Heute 30 min früher ins Bett, Koffein nach 14 Uhr vermeiden.' },
      { name: 'Ernährung', detail: 'Ausreichend Protein (~1,6–2 g/kg) und Flüssigkeit.' },
    ],
  },
]

export function workoutsOf(type: SessionType): Workout[] {
  return WORKOUTS.filter((w) => w.type === type)
}

export function workoutById(id: string): Workout | undefined {
  return WORKOUTS.find((w) => w.id === id)
}

export const SESSION_LABEL: Record<SessionType, string> = {
  vo2max: 'VO2max',
  hyrox: 'Hyrox',
  strength: 'Kraft',
  upper: 'Oberkörper',
  zone2: 'Zone 2',
  recovery: 'Recovery',
  rest: 'Ruhetag',
  padel: 'Padel',
}
