import {
  DataProvider,
  ProviderClub,
  ProviderInjury,
  ProviderPlayer,
  guessLeagueLevel,
  mapCoarsePosition,
} from './types'

/**
 * Adapter für Sportmonks Football API v3.
 *
 * Konfiguration:
 *   SCOUTING_DATA_PROVIDER=sportmonks
 *   SPORTMONKS_TOKEN=<dein Token>
 *   SPORTMONKS_LEAGUE_IDS=82,8        (optional, Ligen für den Vereins-Import)
 */

const BASE = 'https://api.sportmonks.com/v3/football'

async function call<T = any>(path: string, params: Record<string, string | number | undefined> = {}) {
  const token = process.env.SPORTMONKS_TOKEN
  if (!token) throw new Error('SPORTMONKS_TOKEN ist nicht gesetzt.')

  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('api_token', token)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Sportmonks antwortete mit HTTP ${res.status}: ${await res.text()}`)
  }
  const json = (await res.json()) as { data: T; message?: string }
  return json.data
}

const FOOT_MAP: Record<string, 'links' | 'rechts' | 'beidfüßig'> = {
  left: 'links',
  right: 'rechts',
  both: 'beidfüßig',
}

export const sportmonksProvider: DataProvider = {
  id: 'sportmonks',
  label: 'Sportmonks Football API',

  isConfigured() {
    return !!process.env.SPORTMONKS_TOKEN
  },

  setupHint() {
    return 'SPORTMONKS_TOKEN in der .env setzen (Token im Sportmonks-Dashboard). Optional: SPORTMONKS_LEAGUE_IDS.'
  },

  async searchPlayers(query: string): Promise<ProviderPlayer[]> {
    if (query.trim().length < 3) return []
    const data = await call<any[]>(`/players/search/${encodeURIComponent(query.trim())}`, {
      include: 'nationality;position;detailedPosition;teams.team',
    })

    return (data ?? []).map((p) => {
      const team = p.teams?.[0]?.team ?? null
      const detailed = p.detailedPosition?.name ?? p.position?.name ?? null
      return {
        ref: `sportmonks:${p.id}`,
        name: p.display_name ?? p.name ?? [p.firstname, p.lastname].filter(Boolean).join(' '),
        position: mapCoarsePosition(detailed),
        altPositions: [],
        age: p.date_of_birth ? ageFromBirthDate(p.date_of_birth) : null,
        birthDate: p.date_of_birth ?? null,
        nationality: p.nationality?.name ?? null,
        foot: p.foot ? (FOOT_MAP[String(p.foot).toLowerCase()] ?? null) : null,
        heightCm: typeof p.height === 'number' ? p.height : null,
        clubRef: team?.id ? `sportmonks:${team.id}` : null,
        clubName: team?.name ?? null,
        marketValueEur: null,
        contractUntil: null,
        leagueName: null,
        country: p.nationality?.name ?? null,
        minutesLastSeason: null,
        appearances: null,
        goals: null,
        assists: null,
        currentlyInjured: null,
      }
    })
  },

  async listClubs({ league }): Promise<ProviderClub[]> {
    const leagueIds = league
      ? [league]
      : (process.env.SPORTMONKS_LEAGUE_IDS ?? '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)

    if (!leagueIds.length) {
      throw new Error(
        'Keine Liga angegeben. Bitte SPORTMONKS_LEAGUE_IDS setzen oder eine Liga-ID übergeben.',
      )
    }

    const out: ProviderClub[] = []
    for (const id of leagueIds) {
      const data = await call<any>(`/leagues/${id}`, { include: 'currentSeason.teams;country' })
      const leagueLabel: string = data?.name ?? ''
      const country: string = data?.country?.name ?? ''
      const teams: any[] = data?.currentseason?.teams ?? data?.currentSeason?.teams ?? []
      for (const t of teams) {
        out.push({
          ref: `sportmonks:${t.id}`,
          name: t.name,
          country: t.country?.name ?? country,
          league: leagueLabel,
          leagueLevel: guessLeagueLevel(country, leagueLabel),
        })
      }
    }
    return out
  },

  async listInjuries({ playerRef }): Promise<ProviderInjury[]> {
    if (!playerRef) {
      throw new Error('Für den Verletzungsabruf wird ein Spieler benötigt.')
    }
    const id = playerRef.split(':')[1]
    const data = await call<any[]>(`/players/${id}`, { include: 'sidelined.type' })
    const sidelined: any[] = (data as any)?.sidelined ?? []
    return sidelined.map((s) => ({
      playerRef,
      type: s.type?.name ?? s.category ?? 'unbekannt',
      severity: null,
      startDate: s.start_date ?? new Date().toISOString(),
      endDate: s.end_date ?? null,
    }))
  },
}

function ageFromBirthDate(iso: string): number | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (1000 * 3600 * 24 * 365.25))
}
