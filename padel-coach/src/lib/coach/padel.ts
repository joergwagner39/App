// Padel-Taktik: Inhalte + Skizzendaten.
// Koordinaten in Metern auf dem 10 × 20 m Court. x: 0 (links) … 10 (rechts),
// y: 0 (gegnerische Rückwand) … 20 (eigene Rückwand), Netz bei y = 10.
// Eigenes Team (A1 links, A2 rechts) steht unten, Gegner (B1, B2) oben.

export type Pt = [number, number]

export interface CourtDiagram {
  players: { id: 'A1' | 'A2' | 'B1' | 'B2'; at: Pt; focus?: boolean }[]
  /** Zielpositionen (gestrichelte Kreise) */
  ghosts?: { id: 'A1' | 'A2' | 'B1' | 'B2'; at: Pt }[]
  /** Ballwege. `via` = Aufsprung/Wandkontakt, `kind` steuert die Darstellung. */
  shots?: { path: Pt[]; kind: 'drive' | 'lob' | 'smash' | 'soft' }[]
  /** Laufwege */
  moves?: { from: Pt; to: Pt }[]
  zones?: { x: number; y: number; w: number; h: number; tone: 'good' | 'bad' | 'info'; label?: string }[]
  labels?: { at: Pt; text: string }[]
  bounces?: Pt[]
}

export interface PadelTactic {
  id: string
  title: string
  category: 'Positionsspiel' | 'Angriff' | 'Verteidigung' | 'Aufschlag & Return' | 'Teamplay'
  summary: string
  keyPoints: string[]
  diagram: CourtDiagram
  question: string
  options: string[]
  correct: number
  explanation: string
  drill: string
}

const NET_L: Pt = [2.5, 12.5]
const NET_R: Pt = [7.5, 12.5]
const BACK_L: Pt = [2.5, 18.5]
const BACK_R: Pt = [7.5, 18.5]
const OPP_NET_L: Pt = [2.5, 7.5]
const OPP_NET_R: Pt = [7.5, 7.5]
const OPP_BACK_L: Pt = [2.5, 1.5]
const OPP_BACK_R: Pt = [7.5, 1.5]

export const PADEL_TACTICS: PadelTactic[] = [
  {
    id: 'lob-netz',
    title: 'Mit dem Lob das Netz erobern',
    category: 'Positionsspiel',
    summary:
      'Wer das Netz hat, hat den Punkt meistens in der Hand. Ein guter, tiefer Lob ist der sicherste Weg, die Gegner vom Netz zu vertreiben und selbst nach vorne zu kommen.',
    keyPoints: [
      'Lob hoch und tief spielen – er soll hinter der Aufschlaglinie landen.',
      'Sobald klar ist, dass der Gegner nicht angreifen kann: gemeinsam nach vorne.',
      'Auf dem Weg nach vorne kurz vor dem gegnerischen Schlag Split-Step machen.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: BACK_L, focus: true },
        { id: 'A2', at: BACK_R },
        { id: 'B1', at: OPP_NET_L },
        { id: 'B2', at: OPP_NET_R },
      ],
      shots: [{ path: [BACK_L, [3, 2.2]], kind: 'lob' }],
      bounces: [[3, 2.2]],
      moves: [
        { from: BACK_L, to: NET_L },
        { from: BACK_R, to: NET_R },
        { from: OPP_NET_L, to: [2.8, 1.5] },
        { from: OPP_NET_R, to: OPP_BACK_R },
      ],
      ghosts: [
        { id: 'A1', at: NET_L },
        { id: 'A2', at: NET_R },
      ],
    },
    question: 'Dein Lob geht tief über die Netzspieler, sie müssen zurücklaufen. Was macht ihr jetzt?',
    options: [
      'Hinten bleiben und abwarten, was kommt',
      'Beide gemeinsam zügig ans Netz vorrücken',
      'Nur ich rücke vor, mein Partner sichert hinten',
      'Zur Seitenwand ausweichen',
    ],
    correct: 1,
    explanation:
      'Ein Lob, der die Gegner nach hinten zwingt, ist die Einladung ans Netz. Rückt als Paar vor – einer allein öffnet die Diagonale und die Mitte.',
    drill: 'Lob-Serie: 20 Lobs aus der Rückwandposition, Ziel ist ein Korridor 1–2 m vor der gegnerischen Rückwand. Nach jedem Lob 3 Schritte vor + Split-Step.',
  },
  {
    id: 'bandeja',
    title: 'Bandeja: Netz halten statt alles riskieren',
    category: 'Angriff',
    summary:
      'Die Bandeja ist ein kontrollierter, geslicter Überkopfball. Sie ist kein Winner, sondern hält dich am Netz, wenn der gegnerische Lob gut ist.',
    keyPoints: [
      'Seitlich stellen, Schläger vor dem Körper, Ball vor dem Körper treffen.',
      'Ziel: tief in die Ecke oder an die Seitenwand beim Gegner – nicht an die Rückwand in die Mitte.',
      'Nach dem Schlag sofort wieder zurück in die Netzposition.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: [2.5, 14.5], focus: true },
        { id: 'A2', at: NET_R },
        { id: 'B1', at: OPP_BACK_L },
        { id: 'B2', at: OPP_BACK_R },
      ],
      shots: [
        { path: [[7, 2.5], [2.5, 14.3]], kind: 'lob' },
        { path: [[2.5, 14.3], [8.6, 3.2], [10, 1.6]], kind: 'soft' },
      ],
      bounces: [[8.6, 3.2]],
      moves: [{ from: NET_L, to: [2.5, 14.5] }, { from: [2.5, 14.5], to: [2.5, 12.8] }],
      labels: [{ at: [8.2, 4.4], text: 'Seitenwand' }],
    },
    question: 'Ein guter Lob kommt, du erreichst ihn, stehst aber nicht sauber darunter. Die beste Wahl?',
    options: [
      'Mit voller Kraft smashen',
      'Bandeja kontrolliert in die Ecke/Seitenwand und Netz halten',
      'Den Ball weich in die Mitte zurückspielen und hinten bleiben',
      'Einen Stopp direkt hinters Netz versuchen',
    ],
    correct: 1,
    explanation:
      'Aus schlechter Position ist ein Smash ein Geschenk für die Gegner. Die Bandeja kostet wenig Risiko, drückt die Gegner in die Ecke und du bleibst am Netz.',
    drill: 'Schattenschläge Bandeja: 3 × 10 mit Rückwärts-Seitschritten, dann 3 × 10 mit Zuspiel (Partner lobbt aus der Hand).',
  },
  {
    id: 'mitte',
    title: 'Durch die Mitte',
    category: 'Angriff',
    summary:
      'Der Ball zwischen beide Gegner ist der sicherste Angriffsball im Padel: Das Netz ist in der Mitte am niedrigsten, und zwei Spieler zögern gerne gleichzeitig.',
    keyPoints: [
      'Netzhöhe Mitte 88 cm, außen 92 cm – weniger Risiko.',
      'Kein Winkel für den Gegner: Er kann den Ball kaum nach außen öffnen.',
      'Erzeugt Verwirrung: „Deiner!“ – „Nein, deiner!“',
    ],
    diagram: {
      players: [
        { id: 'A1', at: NET_L, focus: true },
        { id: 'A2', at: NET_R },
        { id: 'B1', at: [2.2, 7.8] },
        { id: 'B2', at: [7.8, 7.8] },
      ],
      shots: [{ path: [NET_L, [5, 5.5]], kind: 'drive' }],
      bounces: [[5, 5.5]],
      zones: [{ x: 3.8, y: 3.5, w: 2.4, h: 6, tone: 'good', label: 'Mitte' }],
    },
    question: 'Beide Gegner stehen am Netz und stehen etwas weit auseinander. Wohin spielst du am sichersten?',
    options: [
      'Hart die Linie entlang',
      'Flach zwischen die beiden durch die Mitte',
      'Stopp kurz hinters Netz',
      'Hoch auf die Rückwand',
    ],
    correct: 1,
    explanation:
      'Die Mitte bietet die niedrigste Netzkante, nimmt dem Gegner die Winkel und provoziert Missverständnisse. Die Linie ist höheres Risiko für wenig Gewinn.',
    drill: 'Zielspiel: Zwei Hütchen 1,5 m auseinander in der gegnerischen Mitte. 30 Volleys, zählen, wie viele durchs Tor gehen.',
  },
  {
    id: 'seil',
    title: 'Wie an einem Seil: als Paar verschieben',
    category: 'Teamplay',
    summary:
      'Stell dir vor, du und dein Partner seid mit einem 3–4 m langen Seil verbunden. Wird einer nach außen gezogen, rückt der andere zur Mitte nach – die Mitte bleibt immer zu.',
    keyPoints: [
      'Wandert der Ball auf eine Seite, verschiebt sich das ganze Paar dorthin.',
      'Gleiche Höhe halten: beide am Netz oder beide hinten.',
      'Der Abstand zueinander bleibt ungefähr konstant.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: [1.4, 12.8], focus: true },
        { id: 'A2', at: NET_R },
        { id: 'B1', at: OPP_BACK_L },
        { id: 'B2', at: OPP_BACK_R },
      ],
      shots: [{ path: [[2.5, 1.8], [1.2, 12.6]], kind: 'drive' }],
      moves: [
        { from: NET_L, to: [1.4, 12.8] },
        { from: NET_R, to: [5.4, 12.8] },
      ],
      ghosts: [{ id: 'A2', at: [5.4, 12.8] }],
    },
    question: 'Dein Partner (links) wird durch einen Ball nach außen gezogen. Was machst du rechts?',
    options: [
      'Auf meiner Seite bleiben, um die Linie zu decken',
      'Mit Richtung Mitte verschieben',
      'Nach hinten an die Rückwand gehen',
      'Noch näher ans Netz gehen',
    ],
    correct: 1,
    explanation:
      'Die Mitte ist die gefährlichste Lücke. Die Linie auf deiner Seite ist weiter weg vom Ball und schwerer zu treffen – also mitgehen.',
    drill: 'Seil-Drill: Mit einem echten Seil/Band (3 m) zwischen euch Schattenpadel spielen, Trainer zeigt Richtung an.',
  },
  {
    id: 'chiquita',
    title: 'Chiquita: der Ball auf die Füße',
    category: 'Angriff',
    summary:
      'Stehen die Gegner am Netz und ihr hinten, ist ein langsamer, flacher Ball auf die Füße des Netzspielers („Chiquita“) die Alternative zum Lob. Er zwingt zu einem Schlag nach oben.',
    keyPoints: [
      'Langsam und knapp übers Netz – Tempo ist hier dein Feind.',
      'Ziel: Füße oder hinter die Aufschlaglinie des vorrückenden Spielers.',
      'Nach einer guten Chiquita gemeinsam nach vorne.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: [2.8, 17.5], focus: true },
        { id: 'A2', at: BACK_R },
        { id: 'B1', at: OPP_NET_L },
        { id: 'B2', at: OPP_NET_R },
      ],
      shots: [{ path: [[2.8, 17.5], [6.8, 8.6]], kind: 'soft' }],
      bounces: [[6.8, 8.6]],
      moves: [
        { from: [2.8, 17.5], to: [3, 14] },
        { from: BACK_R, to: [7.2, 14.5] },
      ],
    },
    question: 'Du stehst hinten, beide Gegner am Netz. Der Ball kommt langsam und tief. Welcher Schlag bereitet deinen Netzangriff am besten vor?',
    options: [
      'Harter Drive auf den Körper',
      'Chiquita: flach und langsam auf die Füße',
      'Stopp direkt hinters Netz',
      'Ball an die eigene Rückwand spielen',
    ],
    correct: 1,
    explanation:
      'Harte Bälle geben Netzspielern Tempo für den Volley. Ein langsamer Ball auf die Füße zwingt sie, von unten nach oben zu spielen – deine Chance vorzurücken.',
    drill: 'Chiquita-Serie: Partner am Netz, du spielst aus der Grundposition 20 Bälle, die unterhalb seiner Kniehöhe ankommen.',
  },
  {
    id: 'wand-lassen',
    title: 'Die Rückwand ist dein Freund',
    category: 'Verteidigung',
    summary:
      'Viele Einsteiger nehmen tiefe Bälle hektisch als Volley. Lässt du den Ball von der Rückwand abprallen, gewinnst du Zeit und bekommst einen kontrollierten, langsameren Ball.',
    keyPoints: [
      'Früh drehen: Schulter zur Seitenwand, Blick zum Ball.',
      'Mit dem Ball mitgehen, nicht an der Wand kleben.',
      'Treffpunkt vor dem Körper, wenn der Ball wieder herunterkommt.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: [3, 17], focus: true },
        { id: 'A2', at: BACK_R },
        { id: 'B1', at: OPP_NET_L },
        { id: 'B2', at: OPP_NET_R },
      ],
      shots: [
        { path: [OPP_NET_R, [3.3, 17.3], [3.4, 20], [3.2, 17.9]], kind: 'drive' },
        { path: [[3.2, 17.9], [5, 2.5]], kind: 'lob' },
      ],
      bounces: [[3.3, 17.3]],
      labels: [{ at: [5.5, 19.5], text: 'Rückwand' }],
    },
    question: 'Ein tiefer, schneller Ball fliegt auf dich zu, du stehst hinten. Was ist in den meisten Fällen besser?',
    options: [
      'Volley um jeden Preis, bevor er aufspringt',
      'Aufspringen und von der Rückwand abprallen lassen, dann spielen',
      'Nach vorne laufen und ihn als Halbvolley nehmen',
      'Den Ball durchlassen und hoffen, dass er ins Aus geht',
    ],
    correct: 1,
    explanation:
      'Die Wand nimmt dem Ball Tempo und gibt dir Zeit. Ein Volley aus der Grundposition gegen einen Netzspieler endet oft zu hoch oder im Netz.',
    drill: 'Wand-Solo: Ball selbst an die Rückwand werfen, drehen, nach dem Abprall Vorhand/Rückhand in ein Zielfeld – 3 × 15.',
  },
  {
    id: 'netz-abstand',
    title: 'Richtige Distanz am Netz',
    category: 'Positionsspiel',
    summary:
      'Am Netz stehst du ca. 2–3 m vom Netz entfernt. Zu nah = leicht zu lobben, zu weit = Bälle fallen dir vor die Füße.',
    keyPoints: [
      'Faustregel: etwa auf halber Strecke zwischen Netz und Aufschlaglinie.',
      'Gegner in Not → ein Schritt näher. Gegner kann angreifen/lobben → ein Schritt zurück.',
      'Immer Split-Step, wenn der Gegner schlägt.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: NET_L, focus: true },
        { id: 'A2', at: NET_R, focus: true },
        { id: 'B1', at: OPP_BACK_L },
        { id: 'B2', at: OPP_BACK_R },
      ],
      zones: [
        { x: 0, y: 10, w: 10, h: 1.2, tone: 'bad', label: 'zu nah: Lob-Gefahr' },
        { x: 0, y: 11.5, w: 10, h: 2.2, tone: 'good', label: 'ideal 2–3 m' },
        { x: 0, y: 14.8, w: 10, h: 2.1, tone: 'bad', label: 'zu weit: Füße' },
      ],
    },
    question: 'Wie weit solltest du normalerweise vom Netz entfernt stehen, wenn ihr am Netz seid?',
    options: ['ca. 0,5 m', 'ca. 2–3 m', 'direkt auf der Aufschlaglinie (~7 m)', 'egal, Hauptsache vorne'],
    correct: 1,
    explanation:
      'Mit 2–3 m Abstand erreichst du flache Bälle vor dir und kannst gleichzeitig auf Lobs reagieren.',
    drill: 'Netzpositions-Drill: Partner spielt abwechselnd Lob und Chiquita, du musst nach jedem Ball zurück in die 2–3-m-Zone (mit Hütchen markieren).',
  },
  {
    id: 'aufschlag',
    title: 'Aufschlag und direkt ans Netz',
    category: 'Aufschlag & Return',
    summary:
      'Im Padel hat das aufschlagende Team den Vorteil, weil es sofort das Netz besetzen kann. Der Aufschlag muss nicht hart sein – er muss sicher und unangenehm platziert sein.',
    keyPoints: [
      'Unterhalb der Hüfte treffen (Regel), Ball vorher aufspringen lassen.',
      'Ziele: an die Seitenwand (Glas) oder in die Mitte auf den Körper.',
      'Nach dem Aufschlag direkt nach vorne, Partner steht schon am Netz.',
    ],
    diagram: {
      players: [
        { id: 'A2', at: [6.2, 17.6], focus: true },
        { id: 'A1', at: NET_L },
        { id: 'B1', at: [2.3, 1.6] },
        { id: 'B2', at: [7.5, 8] },
      ],
      shots: [{ path: [[6.2, 17.6], [1.3, 4.2], [0, 2.8]], kind: 'soft' }],
      bounces: [[1.3, 4.2]],
      moves: [{ from: [6.2, 17.6], to: NET_R }],
      ghosts: [{ id: 'A2', at: NET_R }],
      zones: [{ x: 0, y: 3.05, w: 5, h: 6.95, tone: 'info', label: 'Aufschlagfeld' }],
    },
    question: 'Du hast aufgeschlagen, dein Partner steht am Netz. Was tust du?',
    options: [
      'Hinten bleiben, der Return kommt ja zu mir',
      'Direkt nach vorne ans Netz neben den Partner',
      'In die Mitte der Rückwand stellen',
      'Zur Seitenwand, um den Winkel zu decken',
    ],
    correct: 1,
    explanation:
      'Das Netz ist die stärkste Position. Als Aufschläger hast du den Zeitvorteil, sie zu besetzen – Split-Step, wenn der Returnspieler trifft.',
    drill: 'Aufschlag + Vorrücken: 20 Aufschläge an die Seitenwand, nach jedem Aufschlag 3–4 Schritte vor, Split-Step, einen Volley zugespielt bekommen.',
  },
  {
    id: 'return',
    title: 'Return gegen den vorrückenden Aufschläger',
    category: 'Aufschlag & Return',
    summary:
      'Der Aufschläger läuft nach vorne. Dein Return sollte ihm das Leben schwer machen: langsam und tief auf die Füße oder ein Lob – nicht hart in seine Schlägerhöhe.',
    keyPoints: [
      'Cross zurück zum Aufschläger ist meist am sichersten (längste Strecke, tiefstes Netz Richtung Mitte).',
      'Lob-Return, wenn der Netzspieler sehr nah steht.',
      'Harte Returns auf Brusthöhe sind ein Geschenk für den Volley.',
    ],
    diagram: {
      players: [
        { id: 'B1', at: [3, 5.2] },
        { id: 'B2', at: OPP_NET_R },
        { id: 'A2', at: [7.9, 18.4], focus: true },
        { id: 'A1', at: NET_L },
      ],
      shots: [{ path: [[7.9, 18.4], [3.3, 6.6]], kind: 'soft' }],
      moves: [{ from: [3, 2.4], to: [3, 5.2] }],
      bounces: [[3.3, 6.6]],
      labels: [{ at: [5.6, 4.6], text: 'Füße des Aufschlägers' }],
    },
    question: 'Der Aufschläger (B1) rückt nach seinem Aufschlag ans Netz vor. Welcher Return ist meist am besten?',
    options: [
      'Harter Ball auf Brusthöhe',
      'Langsam und tief auf die Füße des vorrückenden Spielers (oder Lob)',
      'Kurzer Stopp hinter das Netz',
      'Winner die Linie entlang',
    ],
    correct: 1,
    explanation:
      'Ein Ball auf die Füße zwingt den Aufschläger zu einem schwierigen Halbvolley nach oben. Hohe Tempobälle kann er dagegen einfach abblocken.',
    drill: 'Return-Serie: Partner schlägt auf und rückt vor, du spielst 20 Returns – Punkt, wenn sein erster Volley unter Netzhöhe getroffen wird.',
  },
  {
    id: 'cambio',
    title: '„Cambio!“ – Seitenwechsel beim Lob',
    category: 'Teamplay',
    summary:
      'Geht ein Lob über deinen Partner und er kommt nicht hin, läufst du diagonal zurück und übernimmst. Dein Partner wechselt auf deine Seite. Laut „Cambio!“ rufen.',
    keyPoints: [
      'Der Spieler, über den gelobbt wurde, entscheidet früh: „Ich!“ oder „Cambio!“.',
      'Der Helfer läuft diagonal hinter den Partner – nie beide zum selben Ball.',
      'Nach dem Schlag: neu formieren, meist beide hinten, dann wieder vorrücken.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: NET_L },
        { id: 'A2', at: NET_R, focus: true },
        { id: 'B1', at: OPP_BACK_L },
        { id: 'B2', at: OPP_BACK_R },
      ],
      shots: [{ path: [[7.5, 2], [2.3, 18.2]], kind: 'lob' }],
      bounces: [[2.3, 18.2]],
      moves: [
        { from: NET_R, to: [3, 18] },
        { from: NET_L, to: [7, 17.2] },
      ],
      labels: [{ at: [5, 15.6], text: 'Cambio!' }],
    },
    question: 'Ein Lob geht über deinen Partner (links), er kommt nicht mehr hin. Du stehst rechts am Netz. Was tun?',
    options: [
      'Stehen bleiben, es ist sein Ball',
      'Diagonal zurücklaufen und übernehmen – Partner wechselt auf deine Seite',
      'Ebenfalls auf der rechten Seite zurücklaufen',
      'Am Netz bleiben und auf den nächsten Ball warten',
    ],
    correct: 1,
    explanation:
      'Du hast den besseren Laufweg zum Ball (diagonal, Blick zum Ball). Mit dem Seitenwechsel bleibt jede Seite besetzt.',
    drill: 'Cambio-Drill: Trainer lobbt abwechselnd über links und rechts, das Paar entscheidet laut „Ich“ / „Cambio“ – 3 × 10 Bälle.',
  },
  {
    id: 'mitte-wer',
    title: 'Wer nimmt den Ball in der Mitte?',
    category: 'Teamplay',
    summary:
      'Bälle durch die Mitte entscheiden viele Punkte. Klare Regeln helfen: Meist nimmt der Spieler, der die Vorhand in der Mitte hat – bei zwei Rechtshändern also der Linke. Wichtiger als jede Regel: früh ansagen.',
    keyPoints: [
      'Ansage schlägt Regel: „Mía!“ (meiner) / „Tuya!“ (deiner).',
      'Diagonal gespielte Bälle nimmt oft der Spieler, der dem Schläger des Gegners gegenübersteht.',
      'Wer näher am Netz steht, hat Vorrang (früher treffen = besser).',
    ],
    diagram: {
      players: [
        { id: 'A1', at: NET_L, focus: true },
        { id: 'A2', at: NET_R },
        { id: 'B1', at: OPP_BACK_L },
        { id: 'B2', at: OPP_BACK_R },
      ],
      shots: [{ path: [OPP_BACK_R, [5, 12.4]], kind: 'drive' }],
      moves: [{ from: NET_L, to: [4.1, 12.4] }],
      labels: [{ at: [5, 14.2], text: '„Mía!“' }],
    },
    question: 'Zwei Rechtshänder am Netz, ein Ball kommt genau durch die Mitte. Wer nimmt ihn typischerweise?',
    options: [
      'Der rechte Spieler mit der Rückhand',
      'Der linke Spieler, weil er die Vorhand in der Mitte hat',
      'Immer der, der zuletzt geschlagen hat',
      'Keiner – der Ball geht meistens ins Aus',
    ],
    correct: 1,
    explanation:
      'Die Vorhand ist der stärkere, sicherere Schlag. Trotzdem gilt: Wer früher „Mía!“ ruft, nimmt ihn – Hauptsache, niemand zögert.',
    drill: 'Mitte-Drill: Trainer spielt 30 Bälle zufällig durch die Mitte, ihr müsst jeden laut ansagen. Fehler = beide 5 Squats.',
  },
  {
    id: 'smash-x3',
    title: 'Smash „por 3“ – nur wenn alles passt',
    category: 'Angriff',
    summary:
      'Der harte Smash, der über die Seitenwand aus dem Court fliegt („por 3“), ist spektakulär – aber nur bei kurzem, hohem Lob nahe am Netz sinnvoll. Sonst ist die Bandeja/Vibora die bessere Wahl.',
    keyPoints: [
      'Voraussetzung: Ball kurz (vor der Aufschlaglinie), du stehst stabil darunter.',
      'Flach in die Ecke Richtung Seitenwand beim Gegner, damit er seitlich rausspringt.',
      'Ball, der nur an die Rückwand geht, kommt zurück – dann bist du ungeordnet.',
    ],
    diagram: {
      players: [
        { id: 'A2', at: [6.8, 11.6], focus: true },
        { id: 'A1', at: NET_L },
        { id: 'B1', at: OPP_BACK_L },
        { id: 'B2', at: OPP_BACK_R },
      ],
      shots: [{ path: [[6.8, 11.6], [8.2, 5], [10, 2.2], [11.2, 0.6]], kind: 'smash' }],
      bounces: [[8.2, 5]],
      zones: [{ x: 0, y: 10, w: 10, h: 2.8, tone: 'good', label: 'kurzer Lob = Smash-Chance' }],
      labels: [{ at: [9.1, 0.8], text: 'raus!' }],
    },
    question: 'Wann lohnt sich ein harter Smash (por 3) wirklich?',
    options: [
      'Bei jedem Lob, der hoch genug ist',
      'Bei einem kurzen, hohen Lob nahe am Netz, wenn ich sauber darunter stehe',
      'Wenn ich rückwärts laufen muss',
      'Nur beim Aufschlag',
    ],
    correct: 1,
    explanation:
      'Von weit hinten oder aus der Rückwärtsbewegung prallt der Smash nur von der Rückwand zurück – der Gegner bekommt einen leichten Ball und du bist nicht am Netz.',
    drill: 'Smash-Entscheidung: Partner lobbt kurz oder tief (zufällig). Kurz = Smash in die Seitenwand-Ecke, tief = Bandeja. 20 Bälle, bewusst entscheiden.',
  },
  {
    id: 'volley-tief',
    title: 'Volley gegen Grundlinienspieler: tief und flach',
    category: 'Angriff',
    summary:
      'Stehen die Gegner hinten, sollte dein Volley tief in die Ecken oder an die Seitenwand gehen – flach, damit er nicht hoch von der Rückwand zurückspringt.',
    keyPoints: [
      'Harte Volleys in die Rückwand kommen als leichter Ball zurück.',
      'Tief an die Seitenwand = unberechenbarer Absprung.',
      'Auf die Füße spielen, wenn ein Gegner vorrückt.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: NET_L, focus: true },
        { id: 'A2', at: NET_R },
        { id: 'B1', at: OPP_BACK_L },
        { id: 'B2', at: OPP_BACK_R },
      ],
      shots: [{ path: [NET_L, [9.2, 2.6], [10, 1.9]], kind: 'drive' }],
      bounces: [[9.2, 2.6]],
      zones: [
        { x: 7.5, y: 0.2, w: 2.3, h: 3.3, tone: 'good', label: 'Ecke' },
        { x: 3.5, y: 0.2, w: 3, h: 1.5, tone: 'bad', label: 'Rückwand-Mitte' },
      ],
    },
    question: 'Die Gegner stehen hinten. Wohin spielst du deinen Volley am besten?',
    options: [
      'Hart in die Mitte der Rückwand',
      'Flach und tief in die Ecke bzw. an die Seitenwand',
      'Hoch als Lob zurück',
      'Immer kurz hinters Netz',
    ],
    correct: 1,
    explanation:
      'Die Ecke nimmt dem Gegner Zeit und Winkel. Ein Ball in die Mitte der Rückwand springt schön zurück – ideal für seinen Lob.',
    drill: 'Volley-Ziele: Zwei Handtücher in die gegnerischen Ecken legen. 3 × 15 Volleys, Punkte für Treffer im Eckbereich.',
  },
  {
    id: 'contrapared',
    title: 'Contrapared – der Notausgang',
    category: 'Verteidigung',
    summary:
      'Bist du vom Ball überlaufen, kannst du ihn gegen die eigene Rückwand schlagen, sodass er über das Netz zurückfliegt. Kein Standard-Schlag, aber eine Rettung.',
    keyPoints: [
      'Mit offener Schlagfläche nach oben/hinten gegen die Rückwand.',
      'Kräftig genug, dass der Ball übers Netz kommt – aber im Feld bleibt.',
      'Danach sofort neu positionieren, der Gegner wird angreifen.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: [3, 18.8], focus: true },
        { id: 'A2', at: BACK_R },
        { id: 'B1', at: OPP_NET_L },
        { id: 'B2', at: OPP_NET_R },
      ],
      shots: [{ path: [[3, 18.8], [3.4, 20], [5.5, 4]], kind: 'lob' }],
      labels: [{ at: [5.6, 19.4], text: 'eigene Rückwand' }],
    },
    question: 'Ein Lob hat dich überlaufen, der Ball ist schon hinter dir und fällt Richtung Rückwand. Notlösung?',
    options: [
      'Punkt aufgeben',
      'Contrapared: Ball gegen die eigene Rückwand schlagen, damit er übers Netz fliegt',
      'Mit dem Rücken zum Netz blind übers Netz schlagen',
      'Den Ball über die eigene Rückwand aus dem Feld spielen',
    ],
    correct: 1,
    explanation:
      'Der Schlag gegen die eigene Wand ist erlaubt (der Ball darf nur nicht vorher den Boden zweimal berühren). Er rettet Punkte, die schon verloren scheinen.',
    drill: 'Contrapared-Technik: Ball selbst über den Kopf nach hinten werfen, einmal aufspringen lassen, dann gegen die Rückwand schlagen – 3 × 8.',
  },
  {
    id: 'cross-lob',
    title: 'Cross-Lob für mehr Sicherheit',
    category: 'Verteidigung',
    summary:
      'Der diagonale Lob hat mehr Strecke (etwa 22 m statt 20 m) – dadurch mehr Platz, um ihn hoch und tief zu spielen, ohne dass er ins Aus geht.',
    keyPoints: [
      'Cross: mehr Länge, mehr Sicherheit.',
      'Linie: überraschender, aber weniger Fehlertoleranz.',
      'Lob über den Spieler mit dem schwächeren Überkopf spielen.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: BACK_L, focus: true },
        { id: 'A2', at: BACK_R },
        { id: 'B1', at: OPP_NET_L },
        { id: 'B2', at: OPP_NET_R },
      ],
      shots: [
        { path: [BACK_L, [8, 1.5]], kind: 'lob' },
        { path: [BACK_L, [2.2, 1.8]], kind: 'soft' },
      ],
      bounces: [[8, 1.5], [2.2, 1.8]],
      labels: [
        { at: [6.6, 5], text: 'cross ≈ 22 m' },
        { at: [1.6, 5], text: 'Linie 20 m' },
      ],
    },
    question: 'Warum ist der Cross-Lob oft die sicherere Variante?',
    options: [
      'Weil das Netz diagonal höher ist',
      'Weil die Strecke länger ist – mehr Platz für Höhe und Tiefe',
      'Weil der Gegner cross nicht smashen darf',
      'Weil der Ball cross langsamer fliegt',
    ],
    correct: 1,
    explanation:
      'Mehr Strecke heißt mehr Spielraum. Die Linie ist die Überraschungsvariante, wenn der Gegner schon cross wartet.',
    drill: 'Lob-Korridor: 10 Lobs cross, 10 Lobs Linie – zähle, wie viele hinter der Aufschlaglinie und vor der Rückwand landen.',
  },
  {
    id: 'bajada',
    title: 'Bajada de pared: Angriff aus der Rückwand',
    category: 'Angriff',
    summary:
      'Prallt ein zu langer Lob hoch von deiner Rückwand ab, kannst du ihn im Herunterkommen aggressiv spielen („Bajada“) – ein Angriffsball aus der Defensive.',
    keyPoints: [
      'Ball kommt hoch von der Wand → seitlich stellen, Ball fallen lassen.',
      'Flach und hart auf die Füße oder durch die Mitte.',
      'Danach Netz übernehmen.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: [3, 16.5], focus: true },
        { id: 'A2', at: BACK_R },
        { id: 'B1', at: OPP_NET_L },
        { id: 'B2', at: OPP_NET_R },
      ],
      shots: [
        { path: [OPP_NET_L, [3.2, 18.6], [3.3, 20], [3, 16.5]], kind: 'lob' },
        { path: [[3, 16.5], [5.2, 7.5]], kind: 'smash' },
      ],
      bounces: [[3.2, 18.6]],
      moves: [{ from: [3, 16.5], to: [3, 13] }],
    },
    question: 'Der Lob des Gegners war zu lang und springt hoch von deiner Rückwand ab. Was ist deine Chance?',
    options: [
      'Nochmal lobben, sicher ist sicher',
      'Bajada: den Ball im Fallen flach und aggressiv angreifen und nachrücken',
      'Den Ball weiter an die Seitenwand abprallen lassen',
      'Ein Stopp aus der Rückwand',
    ],
    correct: 1,
    explanation:
      'Ein hoch abspringender Ball gibt dir Zeit und Höhe – perfekt, um Druck zu machen. Dann nachrücken.',
    drill: 'Bajada: Partner wirft Bälle hoch an deine Rückwand, du greifst 3 × 10 auf ein Ziel in der Mitte an.',
  },
  {
    id: 'grundposition',
    title: 'Abwehrposition: nicht am Glas kleben',
    category: 'Verteidigung',
    summary:
      'In der Defensive stehst du ca. 1–2 m vor der Rückwand. Wer direkt am Glas steht, hat keinen Platz, den Ball aus der Wand zu spielen.',
    keyPoints: [
      'Etwa ein großer Schritt hinter der Aufschlaglinie bis 2 m vor der Wand.',
      'Seitlich leicht zur Mitte versetzt.',
      'Blick zum Ball, nicht zur Wand.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: [2.8, 18], focus: true },
        { id: 'A2', at: [7.2, 18], focus: true },
        { id: 'B1', at: OPP_NET_L },
        { id: 'B2', at: OPP_NET_R },
      ],
      zones: [
        { x: 0, y: 19.1, w: 10, h: 0.9, tone: 'bad', label: 'zu nah am Glas' },
        { x: 0, y: 17.2, w: 10, h: 1.8, tone: 'good', label: 'Abwehrzone' },
      ],
    },
    question: 'Wo stehst du in der Abwehr idealerweise?',
    options: [
      'Direkt mit dem Rücken am Glas',
      'Ca. 1–2 m vor der Rückwand',
      'Auf der Aufschlaglinie',
      'An der Seitenwand',
    ],
    correct: 1,
    explanation:
      'Du brauchst Platz, damit der Ball aus der Wand zu dir kommt. Direkt am Glas bekommst du ihn nur eingeklemmt.',
    drill: 'Abwehr-Spiel: 2 gegen 2, das Abwehrpaar darf nur mit Lob oder Chiquita antworten – 5 Minuten, danach tauschen.',
  },
  {
    id: 'split-step',
    title: 'Split-Step im richtigen Moment',
    category: 'Positionsspiel',
    summary:
      'Der kleine Hüpfer, genau wenn der Gegner trifft, lädt deine Beine vor – du kannst in jede Richtung explodieren. Besonders am Netz entscheidet er über schnelle Reflexe.',
    keyPoints: [
      'Timing: Landung, wenn der Gegner den Ball trifft.',
      'Schulterbreit, Knie leicht gebeugt, Schläger vor dem Körper.',
      'Auch beim Vorrücken ans Netz: stoppen, Split-Step, dann reagieren.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: [2.7, 13.2], focus: true },
        { id: 'A2', at: NET_R },
        { id: 'B1', at: OPP_BACK_L, focus: true },
        { id: 'B2', at: OPP_BACK_R },
      ],
      moves: [{ from: [2.7, 16.5], to: [2.7, 13.4] }],
      labels: [
        { at: [2.5, 3.2], text: 'Treffpunkt' },
        { at: [2.5, 11.2], text: 'Split-Step!' },
      ],
    },
    question: 'Wann ist der ideale Moment für den Split-Step?',
    options: [
      'Nachdem der Ball bei mir aufgesprungen ist',
      'Genau dann, wenn der Gegner den Ball trifft',
      'Wenn ich selbst den Ball treffe',
      'Nur beim Return',
    ],
    correct: 1,
    explanation:
      'In dem Moment weißt du gerade noch nicht, wohin der Ball fliegt – aber deine Beine sind geladen und du kannst sofort reagieren.',
    drill: 'Reaktions-Split-Step: Partner zeigt nach dem Split-Step eine Richtung, 3 schnelle Schritte dorthin – 4 × 30 s.',
  },
  {
    id: 'rollen',
    title: 'Rollen: Links- und Rechtsspieler',
    category: 'Teamplay',
    summary:
      'Im Padel gibt es feste Seiten. Der Linke (Revés-Seite) ist oft der Aggressivere mit gutem Überkopf, der Rechte (Drive-Seite) der konstante Aufbauspieler.',
    keyPoints: [
      'Links: viele Überkopfbälle, Abschluss, Mitte mit der Vorhand.',
      'Rechts: Konstanz, Chiquitas, Lobs, Punkte aufbauen.',
      'Die Rollen ergänzen sich – nicht beide wollen den Punkt beenden.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: NET_L, focus: true },
        { id: 'A2', at: NET_R },
        { id: 'B1', at: OPP_BACK_L },
        { id: 'B2', at: OPP_BACK_R },
      ],
      zones: [
        { x: 0.2, y: 10.2, w: 4.6, h: 9.6, tone: 'info', label: 'Revés: Abschluss' },
        { x: 5.2, y: 10.2, w: 4.6, h: 9.6, tone: 'good', label: 'Drive: Aufbau' },
      ],
    },
    question: 'Welche Rolle hat klassischerweise der Spieler auf der rechten Seite (Drive)?',
    options: [
      'Er beendet fast alle Punkte mit dem Smash',
      'Er baut konstant auf, spielt Chiquitas und Lobs',
      'Er steht immer hinten',
      'Er nimmt alle Bälle durch die Mitte',
    ],
    correct: 1,
    explanation:
      'Der Drive-Spieler sorgt für Stabilität, der Revés-Spieler hat mehr Abschlussaufgaben. Das ist eine Tendenz, keine starre Regel.',
    drill: 'Rollenspiel: Satz spielen, bei dem nur der Revés-Spieler smashen darf und der Drive-Spieler Punkte für jede erfolgreiche Chiquita bekommt.',
  },
  {
    id: 'volley-block',
    title: 'Tiefen Ball am Netz: blocken statt schlagen',
    category: 'Positionsspiel',
    summary:
      'Kommt eine gute Chiquita auf deine Füße, kannst du nicht angreifen. Kurzer, kontrollierter Block-Volley tief ins Feld – und in Position bleiben.',
    keyPoints: [
      'Tief in die Knie, Schlägerkopf über dem Handgelenk.',
      'Kurze Bewegung, Tempo des Gegners nutzen.',
      'Ziel: tief und in die Mitte – nicht aus schlechter Lage auf Winner gehen.',
    ],
    diagram: {
      players: [
        { id: 'A1', at: NET_L, focus: true },
        { id: 'A2', at: NET_R },
        { id: 'B1', at: [2.5, 2.2] },
        { id: 'B2', at: [7.5, 3.2] },
      ],
      shots: [
        { path: [[2.5, 2.2], [2.8, 12.2]], kind: 'soft' },
        { path: [[2.8, 12.2], [5, 2.6]], kind: 'soft' },
      ],
      labels: [{ at: [4.4, 13.8], text: 'Block tief' }],
    },
    question: 'Eine gute Chiquita kommt tief auf deine Füße, du stehst am Netz. Was tust du?',
    options: [
      'Mit voller Kraft nach unten schlagen',
      'Kontrollierter Block-Volley tief ins Feld und in Position bleiben',
      'Den Ball durchlassen',
      'Sofort zurück an die Rückwand laufen',
    ],
    correct: 1,
    explanation:
      'Aus tiefer Position kannst du nur nach oben schlagen – Angriff wäre ein Risiko. Der Block hält den Punkt neutral und dich am Netz.',
    drill: 'Block-Drill: Partner spielt aus der Grundlinie Chiquitas, du blockst 3 × 15 tief in ein Zielfeld hinter der Aufschlaglinie.',
  },
]

export interface PadelDrill {
  id: string
  title: string
  focus: 'Technik' | 'Beinarbeit' | 'Athletik' | 'Solo'
  duration: string
  description: string
  steps: string[]
}

export const PADEL_DRILLS: PadelDrill[] = [
  {
    id: 'shadow-footwork',
    title: 'Schatten-Beinarbeit Netz ↔ Grundlinie',
    focus: 'Beinarbeit',
    duration: '10 Min.',
    description: 'Laufwege ohne Ball: Vorrücken, Split-Step, Rückwärts zur Bandeja, wieder vor.',
    steps: [
      '3 Schritte vor, Split-Step, 2 Volleys schattieren',
      'Seitlich rückwärts (Kreuzschritt) zur Bandeja-Position, Schlag schattieren',
      'Sofort wieder vor in die Netzposition',
      '6 × 45 s, 30 s Pause',
    ],
  },
  {
    id: 'wall-solo',
    title: 'Wand-Solo (allein auf dem Court)',
    focus: 'Solo',
    duration: '15 Min.',
    description: 'Rückwand- und Seitenwand-Bälle ohne Partner trainieren.',
    steps: [
      'Ball an die Rückwand werfen, drehen, nach dem Abprall Vorhand spielen – 15 ×',
      'Dasselbe mit Rückhand – 15 ×',
      'Doppelwand: Ball in die Ecke werfen (Seiten- + Rückwand), Abstand halten, spielen – 10 ×',
    ],
  },
  {
    id: 'volley-wall',
    title: 'Volley gegen die Wand',
    focus: 'Technik',
    duration: '8 Min.',
    description: 'Kurze, kompakte Volleys an eine Wand – Reflexe und Schlägerkopfkontrolle.',
    steps: [
      '2–3 m vor einer Wand, Vorhand-Volleys ohne Bodenkontakt – 60 s',
      'Rückhand-Volleys – 60 s',
      'Abwechselnd VH/RH – 60 s',
      '3 Runden',
    ],
  },
  {
    id: 'reaction-split',
    title: 'Reaktions-Split-Step',
    focus: 'Beinarbeit',
    duration: '6 Min.',
    description: 'Split-Step auf Signal, dann explosiv in die angezeigte Richtung.',
    steps: [
      'Partner/App gibt Signal, du machst den Split-Step',
      'Sofort 2–3 schnelle Schritte in die gezeigte Richtung, Schlag schattieren',
      '4 × 30 s, 30 s Pause',
    ],
  },
  {
    id: 'lateral-power',
    title: 'Padel-Athletik: seitliche Explosivität (kniefreundlich)',
    focus: 'Athletik',
    duration: '12 Min.',
    description: 'Seitliche Stabilität und Antritt ohne harte Sprunglandungen.',
    steps: [
      'Monster-Walks mit Miniband – 3 × 12 Schritte je Richtung',
      'Lateral Step-Ups auf niedrige Box (20 cm) – 3 × 8/Seite, kontrolliert',
      'Seitliche Shuffles 5 m hin und her – 4 × 15 s',
      'Kabel-/Band-Rotation (Holzhacker) – 3 × 10/Seite',
    ],
  },
  {
    id: 'shoulder-prehab',
    title: 'Schulter-Prehab für Überkopfschläge',
    focus: 'Athletik',
    duration: '8 Min.',
    description: 'Rotatorenmanschette stärken – Bandeja, Vibora und Smash danken es dir.',
    steps: [
      'Außenrotation mit Band (Ellbogen am Körper) – 3 × 15',
      'Y-T-W auf der Bank/im Stand vorgebeugt – 2 × 8 je Position',
      'Face Pulls – 3 × 12',
    ],
  },
  {
    id: 'lob-target',
    title: 'Lob-Korridor',
    focus: 'Technik',
    duration: '10 Min.',
    description: 'Tiefe Lobs mit Zielbereich (1–2 m vor der gegnerischen Rückwand).',
    steps: [
      'Zielband/Handtücher als Korridor auslegen',
      '10 Lobs cross, 10 Lobs Linie',
      'Nach jedem Lob 3 Schritte vor + Split-Step',
    ],
  },
  {
    id: 'bandeja-shadow',
    title: 'Bandeja-Schattenschläge',
    focus: 'Technik',
    duration: '6 Min.',
    description: 'Bewegungsablauf der Bandeja einschleifen.',
    steps: [
      'Seitlich stellen, nicht-Schlaghand zeigt zum Ball',
      'Schläger hinter dem Kopf auf Schulterhöhe, Treffpunkt vor dem Körper',
      'Durchschwung Richtung Ziel, Schulter bleibt eher geschlossen',
      '3 × 10 mit Kreuzschritt rückwärts davor',
    ],
  },
]
