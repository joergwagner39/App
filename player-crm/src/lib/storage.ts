import { Player } from './types'

const STORAGE_KEY = 'player-crm.players.v1'

// Backfills fields added after a player may have already been saved to
// localStorage, so older records don't crash newer UI code.
function migrate(raw: any): Player {
  return {
    ...raw,
    idCard: raw.idCard ?? {},
    insurance: raw.insurance ?? { valid: false, note: '' },
    tax: raw.tax ?? { valid: false, note: '' },
    outfitter: raw.outfitter ?? { has: false, brand: '', logoDataUrl: '' },
    address: raw.address ?? { street: '', zip: '', city: '', country: '' },
    todos: raw.todos ?? [],
    family: raw.family ?? '',
    notes: raw.notes ?? '',
    conversationNotes: raw.conversationNotes ?? '',
  }
}

export function loadPlayers(): Player[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as any[]
    return parsed.map(migrate)
  } catch {
    return []
  }
}

export function savePlayers(players: Player[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
}
