import { DataProvider, ProviderClub, ProviderInjury, ProviderPlayer } from './types'

/**
 * Demo-Provider ohne externe Abhängigkeit.
 *
 * Die Namen sind frei erfunden — bewusst keine echten Spieler, damit keine
 * ausgedachten Werte an reale Personen geheftet werden. Der Provider dient dazu,
 * die App ohne Lizenzvertrag vorführen und testen zu können.
 */

const CLUBS: ProviderClub[] = [
  { ref: 'demo:c1', name: 'FC Nordstadt', country: 'Deutschland', league: 'Bundesliga', leagueLevel: 1 },
  { ref: 'demo:c2', name: 'SV Rheinbach', country: 'Deutschland', league: 'Bundesliga', leagueLevel: 1 },
  { ref: 'demo:c3', name: 'TSV Hafenkamp', country: 'Deutschland', league: '2. Bundesliga', leagueLevel: 2 },
  { ref: 'demo:c4', name: 'SC Talburg', country: 'Deutschland', league: '2. Bundesliga', leagueLevel: 2 },
  { ref: 'demo:c5', name: 'FC Moorfeld', country: 'Deutschland', league: '3. Liga', leagueLevel: 3 },
  { ref: 'demo:c6', name: 'Racing Vaux', country: 'Frankreich', league: 'Ligue 1', leagueLevel: 1 },
  { ref: 'demo:c7', name: 'AC Farnese', country: 'Italien', league: 'Serie A', leagueLevel: 1 },
  { ref: 'demo:c8', name: 'Deportivo Ríos', country: 'Spanien', league: 'La Liga', leagueLevel: 1 },
  { ref: 'demo:c9', name: 'Zaanstad FC', country: 'Niederlande', league: 'Eredivisie', leagueLevel: 2 },
  { ref: 'demo:c10', name: 'Kingsbridge United', country: 'England', league: 'Championship', leagueLevel: 2 },
]

const PLAYERS: ProviderPlayer[] = [
  {
    ref: 'demo:p1',
    name: 'Milan Kovacs',
    position: 'IV',
    altPositions: ['LV'],
    age: 24,
    birthDate: '2002-03-11',
    nationality: 'Kroatien',
    foot: 'links',
    heightCm: 189,
    clubRef: 'demo:c3',
    clubName: 'TSV Hafenkamp',
    marketValueEur: 4_500_000,
    contractUntil: '2027-06-30',
    leagueName: '2. Bundesliga',
    country: 'Deutschland',
    minutesLastSeason: 2610,
    appearances: 31,
    goals: 3,
    assists: 1,
    currentlyInjured: false,
  },
  {
    ref: 'demo:p2',
    name: 'Tobias Renner',
    position: 'ST',
    altPositions: ['LA'],
    age: 21,
    birthDate: '2005-01-22',
    nationality: 'Deutschland',
    foot: 'rechts',
    heightCm: 183,
    clubRef: 'demo:c5',
    clubName: 'FC Moorfeld',
    marketValueEur: 1_800_000,
    contractUntil: '2026-06-30',
    leagueName: '3. Liga',
    country: 'Deutschland',
    minutesLastSeason: 2280,
    appearances: 34,
    goals: 17,
    assists: 6,
    currentlyInjured: false,
  },
  {
    ref: 'demo:p3',
    name: 'Elias Fournier',
    position: 'ZM',
    altPositions: ['DM', 'OM'],
    age: 28,
    birthDate: '1998-08-04',
    nationality: 'Frankreich',
    foot: 'beidfüßig',
    heightCm: 178,
    clubRef: 'demo:c6',
    clubName: 'Racing Vaux',
    marketValueEur: 12_000_000,
    contractUntil: '2027-06-30',
    leagueName: 'Ligue 1',
    country: 'Frankreich',
    minutesLastSeason: 2890,
    appearances: 33,
    goals: 5,
    assists: 9,
    currentlyInjured: false,
  },
  {
    ref: 'demo:p4',
    name: 'Nuno Barreto',
    position: 'RA',
    altPositions: ['LA', 'OM'],
    age: 26,
    birthDate: '2000-05-19',
    nationality: 'Portugal',
    foot: 'links',
    heightCm: 175,
    clubRef: 'demo:c9',
    clubName: 'Zaanstad FC',
    marketValueEur: 7_500_000,
    contractUntil: '2026-06-30',
    leagueName: 'Eredivisie',
    country: 'Niederlande',
    minutesLastSeason: 2450,
    appearances: 30,
    goals: 11,
    assists: 12,
    currentlyInjured: true,
  },
  {
    ref: 'demo:p5',
    name: 'Jonas Wieland',
    position: 'TW',
    altPositions: [],
    age: 30,
    birthDate: '1996-02-27',
    nationality: 'Deutschland',
    foot: 'rechts',
    heightCm: 193,
    clubRef: 'demo:c4',
    clubName: 'SC Talburg',
    marketValueEur: 2_200_000,
    contractUntil: '2026-06-30',
    leagueName: '2. Bundesliga',
    country: 'Deutschland',
    minutesLastSeason: 3060,
    appearances: 34,
    goals: 0,
    assists: 0,
    currentlyInjured: false,
  },
  {
    ref: 'demo:p6',
    name: 'Deniz Aslan',
    position: 'DM',
    altPositions: ['IV'],
    age: 23,
    birthDate: '2003-07-30',
    nationality: 'Türkei',
    foot: 'rechts',
    heightCm: 185,
    clubRef: 'demo:c10',
    clubName: 'Kingsbridge United',
    marketValueEur: 5_200_000,
    contractUntil: '2028-06-30',
    leagueName: 'Championship',
    country: 'England',
    minutesLastSeason: 2130,
    appearances: 29,
    goals: 1,
    assists: 3,
    currentlyInjured: false,
  },
]

const INJURIES: ProviderInjury[] = [
  {
    playerRef: 'demo:p4',
    type: 'Muskelfaserriss Oberschenkel',
    severity: 3,
    startDate: isoDaysAgo(40),
    endDate: null,
  },
  {
    playerRef: 'demo:p4',
    type: 'Sprunggelenksverletzung',
    severity: 3,
    startDate: isoDaysAgo(400),
    endDate: isoDaysAgo(330),
  },
  {
    playerRef: 'demo:p1',
    type: 'Muskelverhärtung',
    severity: 1,
    startDate: isoDaysAgo(210),
    endDate: isoDaysAgo(200),
  },
  {
    playerRef: 'demo:p5',
    type: 'Kreuzbandriss',
    severity: 5,
    startDate: isoDaysAgo(690),
    endDate: isoDaysAgo(470),
  },
]

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 10)
}

export const demoProvider: DataProvider = {
  id: 'demo',
  label: 'Demo-Daten (ohne API)',

  isConfigured() {
    return true
  },

  setupHint() {
    return 'Läuft ohne Konfiguration. Für echte Daten SCOUTING_DATA_PROVIDER auf api-football oder sportmonks setzen.'
  },

  async searchPlayers(query: string) {
    const q = query.trim().toLowerCase()
    if (!q) return PLAYERS
    return PLAYERS.filter((p) => p.name.toLowerCase().includes(q))
  },

  async listClubs() {
    return CLUBS
  },

  async listInjuries({ playerRef }) {
    return playerRef ? INJURIES.filter((i) => i.playerRef === playerRef) : INJURIES
  },
}

export const DEMO_CLUBS = CLUBS
export const DEMO_PLAYERS = PLAYERS
