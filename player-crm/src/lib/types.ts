export interface Todo {
  id: string
  text: string
  done: boolean
  details?: string
  reminderDate?: string // ISO date – wann erinnert werden soll
  dueDate?: string // ISO date – bis wann es erledigt sein soll
}

export interface UploadedFile {
  id: string
  name: string
  dataUrl: string
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
  photoUrl?: string
  contractUntil?: string // ISO date – Vertrag bis
  injuries: string // bisherige Verletzungen (Freitext)

  address: {
    street: string
    zip: string
    city: string
    country: string
  }

  staff: {
    playerRelations?: string // zuständiger Mitarbeiter Player Relations
    ceo?: string // Geschäftsführer / Partner
    scout?: string // Talentberater
  }

  idCard: {
    fileDataUrl?: string
    fileName?: string
    validUntil?: string // ISO date
  }

  insurance: {
    none: boolean // Keine Versicherung (bewusst, z.B. Jugendspieler)
    private: boolean
    liability: boolean // Haftpflichtversicherung
    sickPay: boolean // Krankentagegeldversicherung
    sickPaySum?: string // abgesicherte Summe/Tagessatz
    disability: boolean // Invaliditätsversicherung
    disabilitySum?: string // Summe der Absicherung
    broker?: string // Versicherungsmakler
    brokerContact?: string // Kontaktdaten des Maklers
    note?: string
    files: UploadedFile[]
    reviewYears: { year: number; done: boolean }[] // jährliche Überprüfung, am besten im Sommer
  }

  tax: {
    managedByUs: boolean
    notNeeded: boolean // Steuererklärung noch nicht benötigt (z.B. Jugendspieler)
    taxAdvisor?: string // Steuerberater
    taxAdvisorEmail?: string
    years: { year: number; done: boolean }[]
    note?: string
    files: UploadedFile[]
  }

  satisfaction: number // 1-10
  satisfactionHistory: { month: string; value: number; reason?: string }[] // "YYYY-MM" -> value

  lastContact?: string // ISO date
  contactHistory: string[] // ISO dates, most recent last
  lastPersonalVisit?: string // ISO date
  personalVisitHistory: string[] // ISO dates, most recent last

  todos: Todo[]

  family: string
  notes: string
  conversationNotes: string

  outfitter: {
    has: boolean
    brand?: string
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
    photoUrl: '',
    contractUntil: '',
    injuries: '',
    address: { street: '', zip: '', city: '', country: '' },
    staff: { playerRelations: '', ceo: '', scout: '' },
    idCard: {},
    insurance: {
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
    },
    tax: {
      managedByUs: false,
      notNeeded: false,
      taxAdvisor: '',
      taxAdvisorEmail: '',
      years: [],
      note: '',
      files: [],
    },
    satisfaction: 5,
    satisfactionHistory: [],
    lastContact: '',
    contactHistory: [],
    lastPersonalVisit: '',
    personalVisitHistory: [],
    todos: [],
    family: '',
    notes: '',
    conversationNotes: '',
    outfitter: { has: false, brand: '' },
    createdAt: now,
    updatedAt: now,
  }
}
