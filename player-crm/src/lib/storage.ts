import { Player } from './types'

const STORAGE_KEY = 'player-crm.players.v1'

export function loadPlayers(): Player[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Player[]
  } catch {
    return []
  }
}

export function savePlayers(players: Player[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
}
