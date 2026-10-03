/**
 * Spaltenkatalog und Werteerkennung für den Tabellen-Import.
 *
 * Bewusst ohne Datenbankzugriff: die Zuordnungsoberfläche läuft im Browser und
 * nutzt dieselbe Logik wie der Import auf dem Server.
 */

import { parseNumber } from './format'
import { Foot, Position, POSITIONS, POSITION_LABEL } from './types'

export type TargetKind = 'players' | 'clubs'

export interface FieldDef {
  key: string
  label: string
  /** Kleingeschriebene Varianten, unter denen die Spalte erkannt wird */
  aliases: string[]
  hint?: string
}

// ---------------------------------------------------------------------------
// Feldkatalog
// ---------------------------------------------------------------------------

export const PLAYER_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Name', aliases: ['name', 'spieler', 'player', 'spielername', 'player name', 'full name', 'vollständiger name'] },
  { key: 'position', label: 'Hauptposition', aliases: ['position', 'pos', 'hauptposition', 'primary position', 'main position', 'detailed position'] },
  { key: 'altPositions', label: 'Nebenpositionen', aliases: ['nebenposition', 'nebenpositionen', 'weitere positionen', 'secondary position', 'other positions', 'alt positions'], hint: 'mehrere durch Komma oder Schrägstrich getrennt' },
  { key: 'age', label: 'Alter', aliases: ['alter', 'age'] },
  { key: 'birthDate', label: 'Geburtsdatum', aliases: ['geburtsdatum', 'geboren', 'birth date', 'date of birth', 'dob', 'birthday'] },
  { key: 'nationality', label: 'Nationalität', aliases: ['nationalität', 'nationalitaet', 'nation', 'nationality', 'country of birth', 'land'] },
  { key: 'foot', label: 'Starker Fuß', aliases: ['fuß', 'fuss', 'starker fuß', 'foot', 'preferred foot', 'strong foot'] },
  { key: 'heightCm', label: 'Größe (cm)', aliases: ['größe', 'groesse', 'height', 'height cm', 'körpergröße'] },
  { key: 'currentClubName', label: 'Aktueller Verein', aliases: ['verein', 'club', 'current club', 'aktueller verein', 'team', 'mannschaft'], hint: 'wird mit angelegten Vereinen abgeglichen' },
  { key: 'marketValueEur', label: 'Marktwert', aliases: ['marktwert', 'market value', 'wert', 'value', 'mw'], hint: '„4,5 Mio“ oder 4500000' },
  { key: 'salaryEur', label: 'Jahresgehalt', aliases: ['gehalt', 'jahresgehalt', 'salary', 'wage', 'wages', 'gehaltsvorstellung'] },
  { key: 'contractUntil', label: 'Vertrag bis', aliases: ['vertrag bis', 'vertragsende', 'contract until', 'contract expiry', 'contract expires', 'vertrag'] },
  { key: 'leagueLevel', label: 'Ligenniveau (1–5)', aliases: ['ligenniveau', 'niveau', 'league level', 'level', 'stufe'] },
  { key: 'minutesLastSeason', label: 'Minuten', aliases: ['minuten', 'minutes', 'spielminuten', 'minutes played', 'min'] },
  { key: 'appearances', label: 'Einsätze', aliases: ['einsätze', 'einsaetze', 'spiele', 'appearances', 'apps', 'matches', 'games'] },
  { key: 'goals', label: 'Tore', aliases: ['tore', 'goals', 'tor'] },
  { key: 'assists', label: 'Vorlagen', aliases: ['vorlagen', 'assists', 'assist'] },
  { key: 'pace', label: 'Tempo (0–100)', aliases: ['tempo', 'pace', 'speed', 'schnelligkeit'] },
  { key: 'technique', label: 'Technik (0–100)', aliases: ['technik', 'technique', 'technical'] },
  { key: 'physique', label: 'Physis (0–100)', aliases: ['physis', 'physique', 'physical', 'athletik'] },
  { key: 'defensiveWork', label: 'Defensivarbeit (0–100)', aliases: ['defensivarbeit', 'defensive work', 'defending', 'defensive'] },
  { key: 'preferredCountries', label: 'Wunschländer', aliases: ['wunschländer', 'wunschland', 'preferred countries', 'wunsch'] },
  { key: 'willingToRelocate', label: 'Wechselbereit', aliases: ['wechselbereit', 'wechselbereitschaft', 'willing to relocate', 'available'] },
  { key: 'notes', label: 'Notizen', aliases: ['notiz', 'notizen', 'bemerkung', 'bemerkungen', 'notes', 'comment', 'kommentar'] },
]

export const CLUB_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Vereinsname', aliases: ['verein', 'name', 'club', 'club name', 'vereinsname', 'team', 'mannschaft'] },
  { key: 'country', label: 'Land', aliases: ['land', 'country', 'nation'] },
  { key: 'league', label: 'Liga', aliases: ['liga', 'league', 'competition', 'wettbewerb'] },
  { key: 'leagueLevel', label: 'Ligenniveau (1–5)', aliases: ['ligenniveau', 'niveau', 'league level', 'level', 'stufe'] },
  { key: 'transferBudgetEur', label: 'Transferbudget', aliases: ['transferbudget', 'budget', 'transfer budget', 'ablösebudget'] },
  { key: 'salaryBudgetEur', label: 'Gehaltssumme', aliases: ['gehaltssumme', 'gehaltsbudget', 'salary budget', 'wage bill', 'wage budget'] },
  { key: 'avgSalaryEur', label: 'Durchschnittsgehalt', aliases: ['durchschnittsgehalt', 'average salary', 'avg salary', 'schnitt gehalt'] },
  { key: 'avgSquadAge', label: 'Kaderaltersschnitt', aliases: ['altersschnitt', 'kaderalter', 'average age', 'avg age', 'squad age'] },
  { key: 'formation', label: 'Formation', aliases: ['formation', 'system', 'grundordnung'] },
  { key: 'styleTempo', label: 'Tempo (0–100)', aliases: ['tempo', 'style tempo', 'pace'] },
  { key: 'stylePossession', label: 'Ballbesitz (0–100)', aliases: ['ballbesitz', 'possession', 'style possession'] },
  { key: 'stylePressing', label: 'Pressing (0–100)', aliases: ['pressing', 'style pressing', 'press'] },
  { key: 'youthPolicy', label: 'Jugendstrategie (0–100)', aliases: ['jugendstrategie', 'youth policy', 'jugend', 'youth'] },
  { key: 'riskTolerance', label: 'Risikobereitschaft (0–100)', aliases: ['risikobereitschaft', 'risk tolerance', 'risiko', 'risk'] },
  { key: 'notes', label: 'Notizen', aliases: ['notiz', 'notizen', 'bemerkung', 'notes', 'comment'] },
  ...POSITIONS.map((pos) => ({
    key: `need_${pos}`,
    label: `Bedarf ${pos} (0–100)`,
    aliases: [
      `bedarf ${pos.toLowerCase()}`,
      `need ${pos.toLowerCase()}`,
      `bedarf ${POSITION_LABEL[pos].toLowerCase()}`,
      pos.toLowerCase(),
    ],
  })),
]

export function fieldsFor(kind: TargetKind): FieldDef[] {
  return kind === 'players' ? PLAYER_FIELDS : CLUB_FIELDS
}

// ---------------------------------------------------------------------------
// Automatische Spaltenzuordnung
// ---------------------------------------------------------------------------

const normalize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\(.*?\)/g, '')
    .trim()

/**
 * Ordnet Spaltenüberschriften den Zielfeldern zu. Rückgabe ist ein Feldschlüssel
 * je Spaltenindex, leer wenn nichts passt. Jedes Feld wird höchstens einmal
 * vergeben — sonst landen „Tore" und „Tor" auf demselben Ziel.
 */
export function autoMap(headers: string[], kind: TargetKind): string[] {
  const fields = fieldsFor(kind)
  const taken = new Set<string>()
  const exact: string[] = headers.map(() => '')

  // Erst exakte Treffer, damit „Position" nicht an eine Teilübereinstimmung geht.
  headers.forEach((header, i) => {
    const h = normalize(header)
    const hit = fields.find((f) => !taken.has(f.key) && f.aliases.includes(h))
    if (hit) {
      exact[i] = hit.key
      taken.add(hit.key)
    }
  })

  headers.forEach((header, i) => {
    if (exact[i]) return
    const h = normalize(header)
    if (!h) return
    const hit = fields.find(
      (f) =>
        !taken.has(f.key) &&
        f.aliases.some((a) => a.length >= 4 && (h.includes(a) || a.includes(h))),
    )
    if (hit) {
      exact[i] = hit.key
      taken.add(hit.key)
    }
  })

  return exact
}

// ---------------------------------------------------------------------------
// Wertumwandlung
// ---------------------------------------------------------------------------

const POSITION_ALIASES: Record<string, Position> = {
  tw: 'TW', gk: 'TW', torwart: 'TW', torhüter: 'TW', goalkeeper: 'TW', keeper: 'TW',
  iv: 'IV', cb: 'IV', innenverteidiger: 'IV', innenverteidigung: 'IV', 'centre back': 'IV',
  'center back': 'IV', 'central defender': 'IV', abwehr: 'IV', defender: 'IV', verteidiger: 'IV',
  lv: 'LV', lb: 'LV', linksverteidiger: 'LV', 'left back': 'LV', 'linker verteidiger': 'LV',
  rv: 'RV', rb: 'RV', rechtsverteidiger: 'RV', 'right back': 'RV', 'rechter verteidiger': 'RV',
  dm: 'DM', cdm: 'DM', 'defensives mittelfeld': 'DM', sechser: 'DM', 'defensive midfield': 'DM',
  zm: 'ZM', cm: 'ZM', 'zentrales mittelfeld': 'ZM', achter: 'ZM', 'central midfield': 'ZM',
  mittelfeld: 'ZM', midfielder: 'ZM',
  om: 'OM', cam: 'OM', 'offensives mittelfeld': 'OM', zehner: 'OM', 'attacking midfield': 'OM',
  la: 'LA', lw: 'LA', linksaußen: 'LA', 'left wing': 'LA', 'left winger': 'LA', 'linker flügel': 'LA',
  ra: 'RA', rw: 'RA', rechtsaußen: 'RA', 'right wing': 'RA', 'right winger': 'RA', 'rechter flügel': 'RA',
  st: 'ST', cf: 'ST', sturm: 'ST', stürmer: 'ST', mittelstürmer: 'ST', striker: 'ST',
  forward: 'ST', attacker: 'ST', angreifer: 'ST',
}

export function parsePosition(raw: string): Position | null {
  const v = normalize(raw)
  if (!v) return null
  const upper = raw.trim().toUpperCase()
  if ((POSITIONS as readonly string[]).includes(upper)) return upper as Position
  if (POSITION_ALIASES[v]) return POSITION_ALIASES[v]
  const partial = Object.keys(POSITION_ALIASES).find((a) => a.length >= 4 && v.includes(a))
  return partial ? POSITION_ALIASES[partial] : null
}

export function parsePositionList(raw: string): Position[] {
  return Array.from(
    new Set(
      raw
        .split(/[,/;|]+/)
        .map((part) => parsePosition(part))
        .filter((p): p is Position => p != null),
    ),
  )
}

/** Datumsangaben aus Exporten: ISO, deutsch, oder „Jun 30, 2027“. */
export function parseDate(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  const de = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})$/.exec(v)
  if (de) {
    const year = de[3].length === 2 ? `20${de[3]}` : de[3]
    return `${year}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}`
  }

  const parsed = new Date(v)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return null
}

export function parseFoot(raw: string): Foot | null {
  const v = normalize(raw)
  if (!v) return null
  if (/(beid|both|either)/.test(v)) return 'beidfüßig'
  if (/(link|left)/.test(v)) return 'links'
  if (/(recht|right)/.test(v)) return 'rechts'
  return null
}

export function parseBool(raw: string): boolean | null {
  const v = normalize(raw)
  if (!v) return null
  if (/^(ja|j|yes|y|true|wahr|1|x)$/.test(v)) return true
  if (/^(nein|n|no|false|falsch|0)$/.test(v)) return false
  return null
}

export function clampScale(value: number | null): number | null {
  if (value == null) return null
  return Math.max(0, Math.min(100, Math.round(value)))
}

/** Beispieltabelle als Starthilfe und Vorlage für eigene Exporte. */
export function sampleTable(kind: TargetKind): string {
  if (kind === 'players') {
    return [
      'Name;Position;Alter;Verein;Marktwert;Vertrag bis;Nationalität;Ligenniveau;Minuten;Tore;Vorlagen',
      'Lukas Berger;Innenverteidiger;23;SC Talburg;2,5 Mio;30.06.2028;Deutschland;2;2340;1;2',
      'Mateo Silva;Linksaußen;26;Zaanstad FC;6 Mio;30.06.2027;Portugal;2;1980;9;7',
    ].join('\n')
  }
  return [
    'Verein;Land;Liga;Ligenniveau;Transferbudget;Gehaltssumme;Bedarf IV;Bedarf ST;Jugendstrategie',
    'FC Beispielstadt;Deutschland;Bundesliga;1;25 Mio;60 Mio;80;40;60',
    'SV Musterdorf;Deutschland;2. Bundesliga;2;5 Mio;14 Mio;30;90;75',
  ].join('\n')
}
