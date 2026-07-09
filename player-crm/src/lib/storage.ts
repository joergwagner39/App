import { Player } from './types'

const STORAGE_KEY = 'player-crm.players.v1'

function migrateInsurance(raw: any) {
  if (!raw) {
    return {
      private: false,
      liability: false,
      sickPay: false,
      sickPaySum: '',
      disability: false,
      disabilitySum: '',
      note: '',
      files: [],
    }
  }
  if ('valid' in raw) {
    // old shape: a single valid flag
    return {
      private: !!raw.valid,
      liability: !!raw.valid,
      sickPay: !!raw.valid,
      sickPaySum: '',
      disability: !!raw.valid,
      disabilitySum: '',
      note: raw.note ?? '',
      files: [],
    }
  }
  return {
    private: raw.private ?? false,
    liability: raw.liability ?? false,
    sickPay: raw.sickPay ?? false,
    sickPaySum: raw.sickPaySum ?? '',
    disability: raw.disability ?? false,
    disabilitySum: raw.disabilitySum ?? '',
    note: raw.note ?? '',
    files: raw.files ?? [],
  }
}

function migrateTax(raw: any) {
  if (!raw) return { managedByUs: false, taxAdvisor: '', years: [], note: '', files: [] }
  if ('valid' in raw) {
    // old shape: a single valid flag
    return {
      managedByUs: !!raw.valid,
      taxAdvisor: '',
      years: [],
      note: raw.note ?? '',
      files: [],
    }
  }
  return {
    managedByUs: raw.managedByUs ?? false,
    taxAdvisor: raw.taxAdvisor ?? '',
    years: raw.years ?? [],
    note: raw.note ?? '',
    files: raw.files ?? [],
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
