import { Player } from './types'

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
      address: { street: '', zip: '', city: 'Simmerath', country: 'Deutschland' },
      idCard: {},
      insurance: { valid: true, note: '' },
      tax: { valid: true, note: 'Steuererklärung 2025 eingereicht' },
      satisfaction: 8,
      lastContact: now.slice(0, 10),
      todos: [
        {
          id: crypto.randomUUID(),
          text: 'Vertragsverlängerung besprechen',
          done: false,
          reminderDate: '',
        },
      ],
      family: '',
      notes: 'Beispieldatensatz – Eckdaten von Transfermarkt/Wikipedia übernommen.',
      conversationNotes: 'Spielt gerne Playstation, Fan von Tischtennis in der Freizeit.',
      outfitter: { has: false, brand: '', logoDataUrl: '' },
      createdAt: now,
      updatedAt: now,
    },
  ]
}
