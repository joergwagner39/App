export interface Todo {
  id: string
  text: string
  done: boolean
  reminderDate?: string // ISO date
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  club: string
  birthDate?: string // ISO date
  birthCountry?: string
  height?: string // e.g. "1,84 m"
  clothingSize?: string // e.g. "L"

  address: {
    street: string
    zip: string
    city: string
    country: string
  }

  idCard: {
    fileDataUrl?: string
    fileName?: string
    validUntil?: string // ISO date
  }

  insurance: {
    valid: boolean
    note?: string
  }

  satisfaction: number // 1-10

  lastContact?: string // ISO date

  todos: Todo[]

  family: string
  notes: string

  outfitter: {
    has: boolean
    brand?: string
    logoDataUrl?: string
  }

  createdAt: string
  updatedAt: string
}

export function createEmptyPlayer(): Player {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    firstName: '',
    lastName: '',
    club: '',
    birthDate: '',
    birthCountry: '',
    height: '',
    clothingSize: '',
    address: { street: '', zip: '', city: '', country: '' },
    idCard: {},
    insurance: { valid: false, note: '' },
    satisfaction: 5,
    lastContact: '',
    todos: [],
    family: '',
    notes: '',
    outfitter: { has: false, brand: '', logoDataUrl: '' },
    createdAt: now,
    updatedAt: now,
  }
}
