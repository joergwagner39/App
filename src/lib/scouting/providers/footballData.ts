import {
  DataProvider,
  ProviderClub,
  ProviderInjury,
  ProviderPlayer,
  guessLeagueLevel,
  mapCoarsePosition,
} from './types'

/**
 * Adapter für football-data.org (v4).
 *
 * Konfiguration:
 *   SCOUTING_DATA_PROVIDER=football-data
 *   FOOTBALL_DATA_TOKEN=<dein Token>
 *   FOOTBALL_DATA_COMPETITIONS=BL1        (optional, Standard: BL1)
 *   FOOTBALL_DATA_SEASON=2025             (optional)
 *
 * Eigenheiten, die den Umgang bestimmen:
 *
 * - Der kostenlose Zugang deckt nur eine feste Auswahl an Wettbewerben ab. Die
 *   Bundesliga (BL1) ist dabei, die 2. Bundesliga in aller Regel nicht; ein
 *   gesperrter Wettbewerb antwortet mit HTTP 403.
 * - Das Minutenlimit ist knapp (im kostenlosen Zugang zehn Abfragen). Der
 *   Kaderabruf wartet deshalb bei HTTP 429 und versucht es erneut, statt den
 *   ganzen Abgleich abzubrechen.
 * - Geliefert werden Stammdaten und Kader. Marktwerte, Gehälter, Verträge,
 *   Einsatzminuten und Verletzungen gibt es nicht — die werden in der App
 *   gepflegt oder kommen aus einer anderen Quelle.
 */

const BASE = 'https://api.football-data.org/v4'

function currentSeason(): number {
  const env = process.env.FOOTBALL_DATA_SEASON
  if (env && /^\d{4}$/.test(env)) return Number(env)
  const now = new Date()
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
}

function competitions(): string[] {
  return (process.env.FOOTBALL_DATA_COMPETITIONS ?? 'BL1')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function call<T = any>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  attempt = 0,
): Promise<T> {
  const token = process.env.FOOTBALL_DATA_TOKEN
  if (!token) throw new Error('FOOTBALL_DATA_TOKEN ist nicht gesetzt.')

  const url = new URL(`${BASE}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }

  const res = await fetch(url, {
    headers: { 'X-Auth-Token': token },
    cache: 'no-store',
  })

  if (res.status === 429 && attempt < 3) {
    // Minutenlimit erreicht — kurz warten statt abbrechen.
    const wait = Number(res.headers.get('X-RequestCounter-Reset') ?? 0) * 1000 || 12_000
    await sleep(Math.min(wait + 1_000, 70_000))
    return call<T>(path, params, attempt + 1)
  }

  if (!res.ok) {
    const body = await res.text()
    let message = body
    try {
      message = JSON.parse(body).message ?? body
    } catch {
      // Klartext belassen
    }
    if (res.status === 403) {
      throw new Error(
        `football-data.org verweigert den Zugriff: ${message} — im kostenlosen Zugang sind nur ausgewählte Wettbewerbe freigeschaltet (die Bundesliga als BL1).`,
      )
    }
    if (res.status === 400 && /token/i.test(message)) {
      throw new Error('Das Token von football-data.org wurde nicht akzeptiert.')
    }
    throw new Error(`football-data.org antwortete mit HTTP ${res.status}: ${message}`)
  }

  return (await res.json()) as T
}

/** Kadereintrag der API auf unser Spielerformat bringen. */
function toPlayer(
  entry: any,
  context: { clubRef: string | null; clubName: string | null; league: string | null; country: string | null },
): ProviderPlayer {
  return {
    ref: `football-data:${entry.id}`,
    name: entry.name ?? 'Unbekannt',
    position: mapCoarsePosition(entry.position),
    altPositions: [],
    age: entry.dateOfBirth ? ageFromBirthDate(entry.dateOfBirth) : null,
    birthDate: entry.dateOfBirth ?? null,
    nationality: entry.nationality ?? null,
    foot: null,
    heightCm: null,
    clubRef: context.clubRef,
    clubName: context.clubName,
    marketValueEur: null,
    contractUntil: entry.contract?.until ?? null,
    leagueName: context.league,
    country: context.country,
    minutesLastSeason: null,
    appearances: null,
    goals: null,
    assists: null,
    currentlyInjured: null,
  }
}

function ageFromBirthDate(iso: string): number | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / (1000 * 3600 * 24 * 365.25))
}

export const footballDataProvider: DataProvider = {
  id: 'football-data',
  label: 'football-data.org',

  isConfigured() {
    return !!process.env.FOOTBALL_DATA_TOKEN
  },

  setupHint() {
    return 'FOOTBALL_DATA_TOKEN in der .env setzen (Token unter football-data.org/client/register). Optional: FOOTBALL_DATA_COMPETITIONS (Standard BL1), FOOTBALL_DATA_SEASON.'
  },

  async listClubs({ league, season }): Promise<ProviderClub[]> {
    const codes = league ? [league.toUpperCase()] : competitions()
    const out: ProviderClub[] = []

    for (const code of codes) {
      const data = await call<any>(`/competitions/${code}/teams`, { season: season ?? currentSeason() })
      const leagueName: string = data?.competition?.name ?? code
      const country: string = data?.competition?.area?.name ?? ''

      for (const team of data?.teams ?? []) {
        out.push({
          ref: `football-data:${team.id}`,
          name: team.name ?? team.shortName ?? 'Unbekannt',
          country: team.area?.name ?? country,
          league: leagueName,
          leagueLevel: guessLeagueLevel(country, leagueName),
        })
      }
    }
    return out
  },

  async listSquad({ clubRef }): Promise<ProviderPlayer[]> {
    const teamId = clubRef.split(':')[1]
    if (!teamId) throw new Error(`Unbrauchbare Vereinsreferenz: ${clubRef}`)

    const team = await call<any>(`/teams/${teamId}`)
    const context = {
      clubRef,
      clubName: team?.name ?? null,
      league: team?.runningCompetitions?.[0]?.name ?? null,
      country: team?.area?.name ?? null,
    }

    const squad: any[] = team?.squad ?? []
    return squad.map((entry) => toPlayer(entry, context))
  },

  async searchPlayers(query: string): Promise<ProviderPlayer[]> {
    const q = query.trim().toLowerCase()
    if (q.length < 3) return []

    // Die API kennt keine Spielersuche über alle Wettbewerbe. Gesucht wird
    // deshalb in den Kadern der freigeschalteten Wettbewerbe — das kostet pro
    // Verein eine Abfrage und ist bewusst auf die konfigurierten Ligen begrenzt.
    const clubs = await this.listClubs({})
    const found: ProviderPlayer[] = []

    for (const club of clubs) {
      const squad = await this.listSquad({ clubRef: club.ref })
      for (const player of squad) {
        if (player.name.toLowerCase().includes(q)) found.push(player)
      }
      if (found.length >= 25) break
    }
    return found
  },

  async listInjuries(): Promise<ProviderInjury[]> {
    // Verletzungen gehören nicht zum Angebot dieser Schnittstelle.
    return []
  },
}
