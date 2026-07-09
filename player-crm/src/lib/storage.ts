import { Player } from './types'

const STORAGE_KEY = 'player-crm.players.v1'

function migrateInsurance(raw: any) {
  if (!raw) return { private: false, liability: false, sickPay: false, disability: false, note: '' }
  if ('valid' in raw) {
    // old shape: a single valid flag
    return {
      private: !!raw.valid,
      liability: !!raw.valid,
      sickPay: !!raw.valid,
      disability: !!raw.valid,
      note: raw.note ?? '',
    }
  }
  return {
    private: raw.private ?? false,
    liability: raw.liability ?? false,
    sickPay: raw.sickPay ?? false,
    disability: raw.disability ?? false,
    note: raw.note ?? '',
  }
}

function migrateTax(raw: any) {
  if (!raw) return { managedByUs: false, years: [], note: '' }
  if ('valid' in raw) {
    // old shape: a single valid flag
    return { managedByUs: !!raw.valid, years: [], note: raw.note ?? '' }
  }
  return {
    managedByUs: raw.managedByUs ?? false,
    years: raw.years ?? [],
    note: raw.note ?? '',
  }
}

// Backfills fields added after a player may have already been saved to
// localStorage, so older records don't crash newer UI code.
function migrate(raw: any): Player {
  return {
    ...raw,
    idCard: raw.idCard ?? {},
    insurance: migrateInsurance(raw.insurance),
    tax: migrateTax(raw.tax),
    outfitter: raw.outfitter ?? { has: false, brand: '' },
    address: raw.address ?? { street: '', zip: '', city: '', country: '' },
    todos: raw.todos ?? [],
    family: raw.family ?? '',
    notes: raw.notes ?? '',
    conversationNotes: raw.conversationNotes ?? '',
    photoUrl: raw.photoUrl ?? '',
    lastPersonalVisit: raw.lastPersonalVisit ?? '',
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
