// Trainingsbibliothek: VO2max (kniefreundlich), Hyrox, Kraft, Zone 2, Recovery.
import type { SessionType } from './types'

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
  equipment: { sled: boolean; wallball: boolean; kettlebell: boolean; skierg: boolean; rower: boolean; bike: boolean }
}

export interface Block {
  name: string
  detail: string
  note?: string
}

export interface Workout {
  id: string
  type: SessionType
  title: string
  duration: string
  goal: string
  blocks: (ctx: WorkoutContext) => Block[]
}

export function hr(ctx: WorkoutContext, lo: number, hi: number): string {
  if (!ctx.maxHr) return `${lo}–${hi} % HFmax`
  return `${Math.round((ctx.maxHr * lo) / 100)}–${Math.round((ctx.maxHr * hi) / 100)} bpm`
}

const warmup = (ctx: WorkoutContext, min = 12): Block => ({
  name: 'Aufwärmen',
  detail: `${min} min ${MODALITY_LABEL[ctx.modality]} locker (${hr(ctx, 60, 70)}), letzte 3 min mit 3 × 20 s Steigerung.`,
})

const cooldown = (ctx: WorkoutContext, min = 10): Block => ({
  name: 'Cool-down',
  detail: `${min} min sehr locker (${hr(ctx, 55, 65)}), danach 5 min Mobility für Hüfte und Waden.`,
})

const kneePrehab = (ctx: WorkoutContext): Block | null =>
  ctx.knee >= 2
    ? {
        name: 'Knie-Prehab',
        detail: 'Spanish Squat (Band hinter den Knien) 5 × 45 s halten, Terminal Knee Extension mit Band 2 × 15, Wadenheben 2 × 15.',
        note: 'Schmerz bis 3/10 ist ok, wenn er bis morgen abklingt.',
      }
    : null

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

export const WORKOUTS: Workout[] = [
  // ── VO2max ─────────────────────────────────────────────
  {
    id: 'vo2-4x4',
    type: 'vo2max',
    title: 'Norwegisches 4×4',
    duration: '~50 Min.',
    goal: 'Klassiker für die VO2max: lange Zeit nahe an der maximalen Sauerstoffaufnahme.',
    blocks: (ctx) =>
      compact([
        warmup(ctx),
        {
          name: 'Hauptteil',
          detail: `4 × 4 min hart auf ${MODALITY_LABEL[ctx.modality]} – Ziel ${hr(ctx, 88, 95)} ab ca. Minute 2. Dazwischen 3 min aktiv locker (${hr(ctx, 60, 70)}).`,
          note: 'Intensität so wählen, dass das 4. Intervall gerade noch gleich stark geht (RPE 8–9/10).',
        },
        cooldown(ctx),
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'vo2-30-30',
    type: 'vo2max',
    title: '30/30-Serien',
    duration: '~45 Min.',
    goal: 'Kurze Intervalle, die Herzfrequenz bleibt trotzdem lange hoch – mental leichter als 4×4.',
    blocks: (ctx) =>
      compact([
        warmup(ctx),
        {
          name: 'Hauptteil',
          detail: `3 Serien × 10 × (30 s hart / 30 s locker) auf ${MODALITY_LABEL[ctx.modality]}. 3 min Pause zwischen den Serien.`,
          note: `Ab der 4. Wiederholung sollte die Herzfrequenz bei ${hr(ctx, 88, 95)} liegen.`,
        },
        cooldown(ctx),
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'vo2-5x3',
    type: 'vo2max',
    title: '5 × 3 Minuten',
    duration: '~45 Min.',
    goal: 'Etwas kürzere Intervalle mit hohem Tempo – gut für Abwechslung.',
    blocks: (ctx) =>
      compact([
        warmup(ctx),
        {
          name: 'Hauptteil',
          detail: `5 × 3 min bei ${hr(ctx, 90, 95)} (RPE 9/10) auf ${MODALITY_LABEL[ctx.modality]}, jeweils 2 min locker dazwischen.`,
        },
        cooldown(ctx),
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'vo2-pyramid',
    type: 'vo2max',
    title: 'Pyramide 1-2-3-4-3-2-1',
    duration: '~50 Min.',
    goal: 'Wechselnde Intervalllängen – die langen Stücke für die VO2max, die kurzen für Tempohärte.',
    blocks: (ctx) =>
      compact([
        warmup(ctx),
        {
          name: 'Hauptteil',
          detail: `1-2-3-4-3-2-1 min hart (${hr(ctx, 88, 95)}) auf ${MODALITY_LABEL[ctx.modality]}. Pause jeweils halb so lang wie das Intervall davor.`,
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
    duration: '~55 Min.',
    goal: 'Ausdauer unter Vorermüdung – wie im Rennen, aber kniefreundlich.',
    blocks: (ctx) =>
      compact([
        warmup(ctx, 10),
        {
          name: '4 Runden',
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
    duration: '~50 Min.',
    goal: 'Effiziente Technik an den Stationen – die meisten verlieren dort Zeit, nicht beim Laufen.',
    blocks: (ctx) => {
      const kneeBad = ctx.knee >= 4
      return compact([
        warmup(ctx, 10),
        {
          name: 'Block 1 – Schlitten',
          detail: ctx.equipment.sled
            ? '5 × (Sled Push 12,5 m + Sled Pull 12,5 m), 90 s Pause. Fokus: niedriger Körperwinkel, Arme fast gestreckt.'
            : '5 × (Band-/Kabelzug Rudern 15 + Wandschieben isometrisch 20 s), 60 s Pause.',
        },
        {
          name: 'Block 2 – Lunges/Wall Balls',
          detail: kneeBad
            ? 'Knie-Variante: Box-Squat zur hohen Box mit Medizinball 4 × 12 + Kettlebell-Kreuzheben 4 × 10.'
            : `Sandbag Reverse Lunges (kurze Bewegung, kontrolliert) 4 × 10/Seite + ${ctx.equipment.wallball ? 'Wall Balls zur Box (Box-Squat) 4 × 15' : 'Goblet Squats 4 × 12'}.`,
          note: kneeBad ? 'Heute keine Ausfallschritte – Knie schonen.' : 'Knie zeigt über den Fuß, nicht nach innen.',
        },
        {
          name: 'Block 3 – Griff & Rumpf',
          detail: `Farmers Carry 4 × 40 m (schwer) + ${ctx.equipment.skierg ? 'SkiErg 4 × 200 m' : 'Rudern 4 × 250 m'}.`,
        },
        cooldown(ctx, 8),
      ])
    },
  },
  {
    id: 'hyrox-emom',
    type: 'hyrox',
    title: 'Hyrox-EMOM 30',
    duration: '~45 Min.',
    goal: 'Alles in Bewegung halten: Pace-Gefühl und schnelle Übergänge.',
    blocks: (ctx) =>
      compact([
        warmup(ctx, 8),
        {
          name: 'EMOM 30 min (5 Runden)',
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
    title: 'Halbe Hyrox-Simulation',
    duration: '~50 Min.',
    goal: 'Race-Simulation über 4 Stationen – Pacing üben.',
    blocks: (ctx) =>
      compact([
        warmup(ctx, 12),
        {
          name: 'Simulation (auf Zeit)',
          detail: [
            `${runSub(ctx)} → ${ctx.equipment.skierg ? 'SkiErg 500 m' : 'Rudern 500 m'}`,
            `${runSub(ctx)} → ${ctx.equipment.sled ? 'Sled Push 50 m' : 'KB-Swings 30'}`,
            `${runSub(ctx)} → ${ctx.equipment.rower ? 'Rudern 500 m' : 'Rad 1,5 km'}`,
            `${runSub(ctx)} → ${ctx.knee >= 4 ? 'Farmers Carry 100 m' : ctx.equipment.wallball ? '50 Wall Balls (Box-Squat)' : '40 Goblet Squats'}`,
          ].join(' · '),
          note: 'Zeit notieren – in 4–6 Wochen wiederholen.',
        },
        cooldown(ctx, 10),
      ]),
  },

  // ── Kraft ──────────────────────────────────────────────
  {
    id: 'strength-a',
    type: 'strength',
    title: 'Kraft A – Hüfte & Knie-Schutz',
    duration: '~50 Min.',
    goal: 'Kraft für Padel & Hyrox mit Fokus auf hintere Kette und kniefreundliche Beinübungen.',
    blocks: (ctx) =>
      compact([
        { name: 'Aufwärmen', detail: '5 min Rad/Rudern locker, dann Monster-Walks 2 × 10/Richtung, Glute Bridges 2 × 12.' },
        { name: '1', detail: 'Spanish Squat isometrisch 4 × 45 s (Band hinter den Knien)', note: 'Wirkt oft schmerzlindernd auf die Patellasehne.' },
        { name: '2', detail: 'Rumänisches Kreuzheben 4 × 6 (2 RIR)' },
        { name: '3', detail: 'Hip Thrust 3 × 8' },
        { name: '4', detail: ctx.knee >= 4 ? 'Step-ups auf niedrige Box (20 cm) 3 × 8/Seite, langsam' : 'Step-ups auf kniehohe Box 3 × 8/Seite, langsam absenken' },
        { name: '5', detail: 'Klimmzüge oder Latzug 3 × 8 + Rudern am Kabel 3 × 10' },
        { name: '6', detail: 'Pallof Press 3 × 10/Seite + Wadenheben 3 × 15' },
      ]),
  },
  {
    id: 'strength-b',
    type: 'strength',
    title: 'Kraft B – Power & Stabilität',
    duration: '~50 Min.',
    goal: 'Kraft, Stabilität für Richtungswechsel und Schulter-Prehab für Überkopfschläge.',
    blocks: (ctx) =>
      compact([
        { name: 'Aufwärmen', detail: '5 min Rad locker, Außenrotation mit Band 2 × 15, Hüftmobilisation 90/90.' },
        { name: '1', detail: ctx.equipment.kettlebell ? 'Trap-Bar- oder KB-Kreuzheben 4 × 5' : 'Kreuzheben 4 × 5' },
        {
          name: '2',
          detail: ctx.knee >= 4 ? 'Wandsitz isometrisch 4 × 40 s (Winkel schmerzfrei wählen)' : 'Split Squat mit Tempo 3-1-1, kurze Bewegung, 3 × 8/Seite',
        },
        { name: '3', detail: 'Nordic Hamstring Curl negativ 3 × 5 (oder Beinbeuger-Maschine 3 × 10)' },
        { name: '4', detail: 'Liegestütz oder Bankdrücken 3 × 8 + Face Pulls 3 × 12' },
        { name: '5', detail: 'Copenhagen Plank 3 × 20 s/Seite + Seitstütz 3 × 30 s' },
        { name: '6', detail: 'Tibialis Raises 2 × 20 (Schienbein an die Wand, Zehen hoch)' },
      ]),
  },

  // ── Zone 2 ─────────────────────────────────────────────
  {
    id: 'zone2-steady',
    type: 'zone2',
    title: 'Zone-2-Grundlage',
    duration: '45–60 Min.',
    goal: 'Aerobe Basis und Erholungsfähigkeit – macht dich zwischen Ballwechseln schneller frisch.',
    blocks: (ctx) =>
      compact([
        {
          name: 'Dauerbelastung',
          detail: `45–60 min ${MODALITY_LABEL[ctx.modality]} gleichmäßig bei ${hr(ctx, 62, 72)}.`,
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
    duration: '~50 Min.',
    goal: 'Grundlage mit Gerätewechsel – mehr Muskulatur, weniger Monotonie.',
    blocks: (ctx) =>
      compact([
        {
          name: 'Dauerbelastung',
          detail: `20 min Rad + 15 min Rudern + 10 min ${ctx.equipment.skierg ? 'SkiErg' : 'Rad'}, alles bei ${hr(ctx, 62, 72)}.`,
        },
        { name: 'Core', detail: 'Dead Bug 3 × 10, Seitstütz 3 × 30 s.' },
      ]),
  },

  // ── Recovery / Padel-Tag / Ruhe ─────────────────────────
  {
    id: 'recovery-mobility',
    type: 'recovery',
    title: 'Recovery: Bewegen & Mobilisieren',
    duration: '30–40 Min.',
    goal: 'Durchblutung fördern, Nervensystem runterfahren – kein Trainingsreiz.',
    blocks: (ctx) =>
      compact([
        { name: 'Locker bewegen', detail: `20 min Spaziergang oder Rad ganz locker (${hr(ctx, 50, 60)}).` },
        {
          name: 'Mobility-Flow (10 min)',
          detail: 'Katze-Kuh 10 ×, 90/90 Hüftwechsel 10 ×, Couch Stretch 60 s/Seite, Thorax-Rotation 8/Seite, Waden an der Wand 45 s/Seite.',
        },
        {
          name: 'Atmung (5 min)',
          detail: '4 s ein, 6–8 s aus – im Liegen, Beine hochgelegt.',
        },
        kneePrehab(ctx),
      ]),
  },
  {
    id: 'recovery-swim',
    type: 'recovery',
    title: 'Recovery: Schwimmen/Aqua',
    duration: '~30 Min.',
    goal: 'Entlastung für Gelenke, Wasserdruck unterstützt die Erholung.',
    blocks: () => [
      { name: 'Schwimmen', detail: '20–25 min ruhig, Technik statt Tempo. Alternativ Aqua-Jogging.' },
      { name: 'Sauna optional', detail: '1–2 Gänge, viel trinken – nicht direkt vor dem Schlafen.' },
    ],
  },
  {
    id: 'padel-activation',
    type: 'padel',
    title: 'Padel-Tag: Aktivierung vor dem Spiel',
    duration: '12 Min. + Padel',
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
        ctx.knee >= 3
          ? { name: 'Knie', detail: 'Heute eher Positionsspiel statt Sprints zur Wand; nach dem Spiel Spanish Squat 3 × 45 s.' }
          : null,
      ]),
  },
  {
    id: 'rest-day',
    type: 'rest',
    title: 'Ruhetag',
    duration: '—',
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
  zone2: 'Zone 2',
  recovery: 'Recovery',
  rest: 'Ruhetag',
  padel: 'Padel',
}
