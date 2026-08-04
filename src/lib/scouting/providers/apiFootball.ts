import {
  DataProvider,
  ProviderClub,
  ProviderInjury,
  ProviderPlayer,
  guessLeagueLevel,
  mapCoarsePosition,
} from './types'

/**
 * Adapter für API-Football (api-sports.io, v3).
 *
 * Konfiguration:
 *   SCOUTING_DATA_PROVIDER=api-football
 *   API_FOOTBALL_KEY=<dein Key>
 *   API_FOOTBALL_SEASON=2025            (optional, Standard: laufende Saison)
 *   API_FOOTBALL_LEAGUE_IDS=78,79,61    (optional, Ligen für den Vereins-Import)
 *
 * Der Anbieter liefert Stammdaten, Saisonstatistik und Verletzungen. Marktwerte,
 * Gehälter und Vertragsenden sind nicht Teil des Angebots und bleiben leer —
 * die werden in der App gepflegt.
 */

const BASE = 'https://v3.football.api-sports.io'

function currentSeason(): number {
  const env = process.env.API_FOOTBALL_SEASON
  if (env && /^\d{4}$/.test(env)) return Number(env)
  const now = new Date()
  // Europäische Saison beginnt im Sommer.
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
}

async function call<T = any>(path: string, params: Record<string, string | number | undefined>) {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) throw new Error('API_FOOTBALL_KEY ist nicht gesetzt.')

  const url = new URL(`${BASE}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }

  const res = await fetch(url, {
    headers: { 'x-apisports-key': key },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`API-Football antwortete mit HTTP ${res.status}: ${await res.text()}`)
  }
  const json = (await res.json()) as { response: T; errors?: unknown }
  const errors = json.errors
  if (errors && !Array.isArray(errors) && Object.keys(errors as object).length) {
    throw new Error(`API-Football meldet: ${JSON.stringify(errors)}`)
  }
  return json.response
}

export const apiFootballProvider: DataProvider = {
  id: 'api-football',
  label: 'API-Football (api-sports.io)',

  isConfigured() {
    return !!process.env.API_FOOTBALL_KEY
  },

  setupHint() {
    return 'API_FOOTBALL_KEY in der .env setzen (Key unter dashboard.api-football.com). Optional: API_FOOTBALL_SEASON, API_FOOTBALL_LEAGUE_IDS.'
  },

  async searchPlayers(query: string): Promise<ProviderPlayer[]> {
    if (query.trim().length < 3) return []
    const season = currentSeason()
    const response = await call<any[]>('/players', { search: query.trim(), season })

    return (response ?? []).map((entry) => {
      const p = entry.player ?? {}
      // Die Statistik mit den meisten Minuten gilt als Hauptverein der Saison.
      const stats: any[] = Array.isArray(entry.statistics) ? entry.statistics : []
      const main =
        stats
          .slice()
          .sort((a, b) => (b?.games?.minutes ?? 0) - (a?.games?.minutes ?? 0))[0] ?? {}

      const minutes = stats.reduce((sum, s) => sum + (s?.games?.minutes ?? 0), 0)
      const apps = stats.reduce((sum, s) => sum + (s?.games?.appearences ?? 0), 0)
      const goals = stats.reduce((sum, s) => sum + (s?.goals?.total ?? 0), 0)
      const assists = stats.reduce((sum, s) => sum + (s?.goals?.assists ?? 0), 0)

      const heightCm = (() => {
        const m = /(\d{2,3})\s*cm/.exec(p.height ?? '')
        return m ? Number(m[1]) : null
      })()

      return {
        ref: `api-football:${p.id}`,
        name: p.name ?? [p.firstname, p.lastname].filter(Boolean).join(' '),
        position: mapCoarsePosition(main?.games?.position),
        altPositions: [],
        age: typeof p.age === 'number' ? p.age : null,
        birthDate: p.birth?.date ?? null,
        nationality: p.nationality ?? null,
        foot: null,
        heightCm,
        clubRef: main?.team?.id ? `api-football:${main.team.id}` : null,
        clubName: main?.team?.name ?? null,
        marketValueEur: null,
        contractUntil: null,
        leagueName: main?.league?.name ?? null,
        country: main?.league?.country ?? null,
        minutesLastSeason: minutes || null,
        appearances: apps || null,
        goals: goals || null,
        assists: assists || null,
        currentlyInjured: typeof p.injured === 'boolean' ? p.injured : null,
      }
    })
  },

  async listClubs({ league, season }): Promise<ProviderClub[]> {
    const s = season ?? currentSeason()
    const leagueIds = league
      ? [league]
      : (process.env.API_FOOTBALL_LEAGUE_IDS ?? '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)

    if (!leagueIds.length) {
      throw new Error(
        'Keine Liga angegeben. Bitte API_FOOTBALL_LEAGUE_IDS setzen oder eine Liga-ID übergeben.',
      )
    }

    const out: ProviderClub[] = []
    for (const id of leagueIds) {
      const response = await call<any[]>('/teams', { league: id, season: s })
      for (const entry of response ?? []) {
        const t = entry.team ?? {}
        const country = t.country ?? ''
        // Der /teams-Endpunkt liefert den Ligennamen nicht mit; er wird nachgeschlagen.
        const leagueName = entry.league?.name ?? (await leagueName_(id))
        out.push({
          ref: `api-football:${t.id}`,
          name: t.name,
          country,
          league: leagueName ?? '',
          leagueLevel: guessLeagueLevel(country, leagueName),
        })
      }
    }
    return out
  },

  async listInjuries({ playerRef, league, season }): Promise<ProviderInjury[]> {
    const s = season ?? currentSeason()
    const params: Record<string, string | number | undefined> = { season: s }
    if (playerRef) params.player = playerRef.split(':')[1]
    else if (league) params.league = league
    else throw new Error('Für den Verletzungsabruf wird ein Spieler oder eine Liga benötigt.')

    const response = await call<any[]>('/injuries', params)
    return (response ?? []).map((entry) => ({
      playerRef: `api-football:${entry.player?.id}`,
      type: entry.player?.type ?? entry.player?.reason ?? 'unbekannt',
      severity: null,
      startDate: entry.fixture?.date ?? new Date().toISOString(),
      endDate: null,
    }))
  },
}

const leagueNameCache = new Map<string, string | null>()

async function leagueName_(id: string): Promise<string | null> {
  if (leagueNameCache.has(id)) return leagueNameCache.get(id) ?? null
  try {
    const response = await call<any[]>('/leagues', { id })
    const name = response?.[0]?.league?.name ?? null
    leagueNameCache.set(id, name)
    return name
  } catch {
    leagueNameCache.set(id, null)
    return null
  }
}
