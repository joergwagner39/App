import { Player } from './types'

const STORAGE_KEY = 'player-crm.players.v1'

function migrateInsurance(raw: any) {
  if (!raw) {
    return {
      none: false,
      private: false,
      liability: false,
      sickPay: false,
      sickPaySum: '',
      disability: false,
      disabilitySum: '',
      broker: '',
      brokerContact: '',
      note: '',
      files: [],
      reviewYears: [],
    }
  }
  if ('valid' in raw) {
    // old shape: a single valid flag
    return {
      none: false,
      private: !!raw.valid,
      liability: !!raw.valid,
      sickPay: !!raw.valid,
      sickPaySum: '',
      disability: !!raw.valid,
      disabilitySum: '',
      broker: '',
      brokerContact: '',
      note: raw.note ?? '',
      files: [],
      reviewYears: [],
    }
  }
  return {
    none: raw.none ?? false,
    private: raw.private ?? false,
    liability: raw.liability ?? false,
    sickPay: raw.sickPay ?? false,
    sickPaySum: raw.sickPaySum ?? '',
    disability: raw.disability ?? false,
    disabilitySum: raw.disabilitySum ?? '',
    broker: raw.broker ?? '',
    brokerContact: raw.brokerContact ?? '',
    note: raw.note ?? '',
    files: raw.files ?? [],
    reviewYears: raw.reviewYears ?? [],
  }
}

function migrateTax(raw: any) {
  if (!raw) {
    return {
      managedByUs: false,
      notNeeded: false,
      taxAdvisor: '',
      taxAdvisorEmail: '',
      years: [],
      note: '',
      files: [],
    }
  }
  if ('valid' in raw) {
    // old shape: a single valid flag
    return {
      managedByUs: !!raw.valid,
      notNeeded: false,
      taxAdvisor: '',
      taxAdvisorEmail: '',
      years: [],
      note: raw.note ?? '',
      files: [],
    }
  }
  return {
    managedByUs: raw.managedByUs ?? false,
    notNeeded: raw.notNeeded ?? false,
    taxAdvisor: raw.taxAdvisor ?? '',
    taxAdvisorEmail: raw.taxAdvisorEmail ?? '',
    years: raw.years ?? [],
    note: raw.note ?? '',
    files: raw.files ?? [],
  }
}

function migrateSatisfactionHistory(raw: any[] | undefined) {
  if (!raw) return []
  // old shape kept one entry per day ("date"); collapse to one per month,
  // keeping the latest value/reason recorded in that month.
  const byMonth = new Map<string, { value: number; reason?: string }>()
  for (const entry of raw) {
    const month = entry.month ?? (entry.date ? String(entry.date).slice(0, 7) : null)
    if (!month) continue
    byMonth.set(month, { value: entry.value, reason: entry.reason })
  }
  return Array.from(byMonth.entries()).map(([month, v]) => ({ month, ...v }))
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
    staff: raw.staff ?? { playerRelations: '', ceo: '', scout: '' },
    todos: raw.todos ?? [],
    family: raw.family ?? '',
    notes: raw.notes ?? '',
    conversationNotes: raw.conversationNotes ?? '',
    photoUrl: raw.photoUrl ?? '',
    contactHistory: raw.contactHistory ?? [],
    lastPersonalVisit: raw.lastPersonalVisit ?? '',
    personalVisitHistory: raw.personalVisitHistory ?? [],
    satisfactionHistory: migrateSatisfactionHistory(raw.satisfactionHistory),
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
