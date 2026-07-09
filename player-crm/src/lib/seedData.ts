import { Player } from './types'

function monthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function seedPlayers(): Player[] {
  const now = new Date().toISOString()
  return [
    {
      id: crypto.randomUUID(),
      firstName: 'Noah',
      lastName: 'Katterbach',
      club: 'Hamburger SV',
      birthDate: '2001-04-13',
      birthCountry: 'Deutschland',
      height: '1,80 m',
      clothingSize: 'M',
      photoUrl: '',
      address: {
        street: 'Musterweg 12 (Beispiel)',
        zip: '52152',
        city: 'Simmerath',
        country: 'Deutschland',
      },
      staff: {
        playerRelations: 'Jörg Wagner (Beispiel)',
        ceo: 'Max Mustermann (Beispiel)',
        scout: 'Erika Musterfrau (Beispiel)',
      },
      idCard: {},
      insurance: {
        private: true,
        liability: true,
        sickPay: true,
        sickPaySum: '150 € / Tag (Beispiel)',
        disability: false,
        disabilitySum: '',
        broker: 'Musterhaus Versicherungsmakler (Beispiel)',
        brokerContact: 'makler@beispiel.de',
        note: 'Sportversicherung über den Verein',
        files: [],
      },
      tax: {
        managedByUs: true,
        taxAdvisor: '',
        taxAdvisorEmail: '',
        years: [
          { year: 2024, done: true },
          { year: 2025, done: false },
        ],
        note: 'Steuererklärung 2025 in Bearbeitung',
        files: [],
      },
      satisfaction: 8,
      satisfactionHistory: [
        { month: monthsAgo(4), value: 5, reason: 'Wenig Einsatzzeit, unzufrieden mit Trainer (Beispiel)' },
        { month: monthsAgo(3), value: 6 },
        { month: monthsAgo(2), value: 7 },
        { month: monthsAgo(1), value: 6 },
        { month: monthsAgo(0), value: 8 },
      ],
      lastContact: now.slice(0, 10),
      lastPersonalVisit: now.slice(0, 10),
      todos: [
        {
          id: crypto.randomUUID(),
          text: 'Vertragsverlängerung besprechen',
          done: false,
          reminderDate: '',
        },
        {
          id: crypto.randomUUID(),
          text: 'Ausweis-Kopie beim Verein anfordern',
          done: false,
          reminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
      ],
      family: 'In fester Beziehung (Beispielangabe, bitte durch echte Daten ersetzen).',
      notes: 'Beispieldatensatz – Eckdaten von Transfermarkt/Wikipedia übernommen. Adresse, Familie und Ausrüster sind frei erfunden. Foto-URL kann oben unter dem Namen manuell ergänzt werden (z.B. Bildadresse von Transfermarkt kopieren).',
      conversationNotes: 'Spielt gerne Playstation, Fan von Tischtennis in der Freizeit.',
      outfitter: { has: true, brand: 'Nike (Beispiel)' },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      firstName: 'Lena',
      lastName: 'Beispiel',
      club: 'SC Musterstadt',
      birthDate: '2003-09-21',
      birthCountry: 'Deutschland',
      height: '1,72 m',
      clothingSize: 'S',
      photoUrl: '',
      address: {
        street: 'Beispielallee 5',
        zip: '10115',
        city: 'Musterstadt',
        country: 'Deutschland',
      },
      staff: {
        playerRelations: 'Jörg Wagner (Beispiel)',
        ceo: 'Max Mustermann (Beispiel)',
        scout: '',
      },
      idCard: {},
      insurance: {
        private: false,
        liability: true,
        sickPay: false,
        sickPaySum: '',
        disability: false,
        disabilitySum: '',
        broker: '',
        brokerContact: '',
        note: '',
        files: [],
      },
      tax: {
        managedByUs: false,
        taxAdvisor: 'Kanzlei Beispiel & Partner',
        taxAdvisorEmail: 'kontakt@kanzlei-beispiel.de',
        years: [],
        note: '',
        files: [],
      },
      satisfaction: 4,
      satisfactionHistory: [{ month: monthsAgo(0), value: 4, reason: 'Unzufrieden mit Spielzeit (Beispiel)' }],
      lastContact: '',
      lastPersonalVisit: '',
      todos: [
        {
          id: crypto.randomUUID(),
          text: 'Erstgespräch vereinbaren',
          done: false,
          reminderDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
      ],
      family: '',
      notes: 'Zweiter Beispieldatensatz, komplett frei erfunden, zum Testen mehrerer Spieler.',
      conversationNotes: '',
      outfitter: { has: false, brand: '' },
      createdAt: now,
      updatedAt: now,
    },
  ]
}
