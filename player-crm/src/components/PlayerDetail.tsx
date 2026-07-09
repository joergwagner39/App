'use client'

import { Player, Todo } from '@/lib/types'
import {
  daysUntilNextSatisfactionCheckIn,
  idCardStatus,
  insuranceStatus,
  lastContactStatus,
  lastPersonalVisitStatus,
  satisfactionCheckInDoneThisMonth,
  taxStatus,
} from '@/lib/status'
import StatusBadge from './StatusBadge'
import SatisfactionScore from './SatisfactionScore'
import SatisfactionChart from './SatisfactionChart'
import FileList from './FileList'
import { detectExpiryDate } from '@/lib/ocr'
import { getBrandLogoUrl } from '@/lib/brandLogos'
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Plus,
  ScanSearch,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none'

export default function PlayerDetail({
  player,
  onChange,
  onDelete,
}: {
  player: Player
  onChange: (p: Player) => void
  onDelete: () => void
}) {
  const [newTodo, setNewTodo] = useState('')
  const [newReminder, setNewReminder] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [todoTab, setTodoTab] = useState<'open' | 'done'>('open')
  const [ocrRunning, setOcrRunning] = useState(false)
  const [ocrHint, setOcrHint] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState(false)

  useEffect(() => {
    setPhotoError(false)
  }, [player.photoUrl])

  function update(patch: Partial<Player>) {
    onChange({ ...player, ...patch, updatedAt: new Date().toISOString() })
  }

  function updateAddress(patch: Partial<Player['address']>) {
    update({ address: { ...player.address, ...patch } })
  }

  function updateInsurance(patch: Partial<Player['insurance']>) {
    update({ insurance: { ...player.insurance, ...patch } })
  }

  function updateTax(patch: Partial<Player['tax']>) {
    update({ tax: { ...player.tax, ...patch } })
  }

  function updateOutfitter(patch: Partial<Player['outfitter']>) {
    update({ outfitter: { ...player.outfitter, ...patch } })
  }

  async function handleIdCardUpload(file: File) {
    const dataUrl = await fileToDataUrl(file)
    update({ idCard: { ...player.idCard, fileDataUrl: dataUrl, fileName: file.name } })

    setOcrRunning(true)
    setOcrHint(null)
    try {
      const detected = await detectExpiryDate(dataUrl)
      if (detected) {
        update({
          idCard: { ...player.idCard, fileDataUrl: dataUrl, fileName: file.name, validUntil: detected },
        })
        setOcrHint(`Gültig bis automatisch erkannt: ${detected}. Bitte prüfen.`)
      } else {
        setOcrHint('Kein Ablaufdatum automatisch erkannt – bitte manuell eintragen.')
      }
    } catch {
      setOcrHint('Automatische Erkennung fehlgeschlagen – bitte manuell eintragen.')
    } finally {
      setOcrRunning(false)
    }
  }

  const brandLogoUrl = player.outfitter.brand ? getBrandLogoUrl(player.outfitter.brand) : null

  function monthKeyFor(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  function setSatisfactionValue(monthKey: string, value: number | null) {
    const existing = player.satisfactionHistory.find((h) => h.month === monthKey)
    const history = player.satisfactionHistory.filter((h) => h.month !== monthKey)
    const nextHistory =
      value === null
        ? history
        : [...history, { month: monthKey, value, reason: existing?.reason }]
    const patch: Partial<Player> = { satisfactionHistory: nextHistory }
    if (monthKey === currentMonthKey && value !== null) {
      patch.satisfaction = value
    }
    update(patch)
  }

  function setSatisfactionReason(monthKey: string, reason: string) {
    update({
      satisfactionHistory: player.satisfactionHistory.map((h) =>
        h.month === monthKey ? { ...h, reason } : h
      ),
    })
  }

  const [draftSatisfaction, setDraftSatisfaction] = useState(player.satisfaction)

  const checkInDone = satisfactionCheckInDoneThisMonth(player)
  const daysUntilCheckIn = daysUntilNextSatisfactionCheckIn()
  const nextCheckInDate = new Date()
  nextCheckInDate.setMonth(nextCheckInDate.getMonth() + 1, 1)
  const nextCheckInLabel = nextCheckInDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  })

  const currentMonthKey = monthKeyFor(new Date())
  const currentMonthLabel = new Date().toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (11 - i), 1)
    return {
      key: monthKeyFor(d),
      label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
    }
  })
  const currentMonthEntry = player.satisfactionHistory.find((h) => h.month === currentMonthKey)

  function addTodo() {
    if (!newTodo.trim()) return
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: newTodo.trim(),
      done: false,
      reminderDate: newReminder || undefined,
      dueDate: newDueDate || undefined,
    }
    update({ todos: [...player.todos, todo] })
    setNewTodo('')
    setNewReminder('')
    setNewDueDate('')
  }

  function toggleTodo(id: string) {
    update({
      todos: player.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })
  }

  function updateTodo(id: string, patch: Partial<Todo>) {
    update({
      todos: player.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })
  }

  function removeTodo(id: string) {
    update({ todos: player.todos.filter((t) => t.id !== id) })
  }

  const openTodos = player.todos.filter((t) => !t.done)
  const doneTodos = player.todos.filter((t) => t.done)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {player.photoUrl && !photoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photoUrl}
                alt={`${player.firstName} ${player.lastName}`}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setPhotoError(true)}
                onLoad={() => setPhotoError(false)}
              />
            ) : (
              <User className="h-8 w-8 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex gap-3">
              <input
                className="rounded-lg border border-transparent px-2 py-1 text-2xl font-semibold hover:border-slate-200 focus:border-brand-500 focus:outline-none"
                value={player.firstName}
                placeholder="Vorname"
                onChange={(e) => update({ firstName: e.target.value })}
              />
              <input
                className="rounded-lg border border-transparent px-2 py-1 text-2xl font-semibold hover:border-slate-200 focus:border-brand-500 focus:outline-none"
                value={player.lastName}
                placeholder="Nachname"
                onChange={(e) => update({ lastName: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 px-2">
              <input
                className="w-64 rounded-lg border border-transparent px-0 py-1 text-xs text-slate-400 hover:border-slate-200 hover:px-2 focus:border-brand-500 focus:px-2 focus:outline-none"
                value={player.photoUrl ?? ''}
                placeholder="Bild-URL einfügen…"
                onChange={(e) => update({ photoUrl: e.target.value })}
              />
              <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />
                oder Foto hochladen
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const dataUrl = await fileToDataUrl(file)
                    update({ photoUrl: dataUrl })
                  }}
                />
              </label>
            </div>
            {player.photoUrl && photoError && (
              <p className="mt-0.5 px-2 text-xs text-red-500">
                Bild-URL konnte nicht geladen werden – die Quelle blockt evtl. externe
                Einbettung. Lade das Bild stattdessen direkt hoch (Foto speichern, dann
                „oder Foto hochladen“).
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-2 px-2">
              <StatusBadge color={idCardStatus(player)} label="Ausweis" />
              <StatusBadge color={insuranceStatus(player)} label="Versicherung" />
              <StatusBadge color={taxStatus(player)} label="Steuer" />
              <StatusBadge color={lastContactStatus(player)} label="Letzter Kontakt" />
              <StatusBadge color={lastPersonalVisitStatus(player)} label="Letzter Besuch" />
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Löschen
        </button>
      </div>

      {/* Stammdaten */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">
          Stammdaten
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Verein">
            <input
              className={inputClass}
              value={player.club}
              onChange={(e) => update({ club: e.target.value })}
            />
          </Field>
          <Field label="Geburtsdatum">
            <input
              type="date"
              className={inputClass}
              value={player.birthDate ?? ''}
              onChange={(e) => update({ birthDate: e.target.value })}
            />
          </Field>
          <Field label="Geburtsland">
            <input
              className={inputClass}
              value={player.birthCountry ?? ''}
              onChange={(e) => update({ birthCountry: e.target.value })}
            />
          </Field>
          <Field label="Größe">
            <input
              className={inputClass}
              placeholder="z.B. 1,84 m"
              value={player.height ?? ''}
              onChange={(e) => update({ height: e.target.value })}
            />
          </Field>
          <Field label="Konfektionsgröße">
            <input
              className={inputClass}
              placeholder="z.B. L"
              value={player.clothingSize ?? ''}
              onChange={(e) => update({ clothingSize: e.target.value })}
            />
          </Field>
        </div>

        <h3 className="mb-2 mt-4 text-sm font-medium text-slate-500">Adresse</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Straße & Hausnr.">
            <input
              className={inputClass}
              value={player.address.street}
              onChange={(e) => updateAddress({ street: e.target.value })}
            />
          </Field>
          <Field label="PLZ">
            <input
              className={inputClass}
              value={player.address.zip}
              onChange={(e) => updateAddress({ zip: e.target.value })}
            />
          </Field>
          <Field label="Stadt">
            <input
              className={inputClass}
              value={player.address.city}
              onChange={(e) => updateAddress({ city: e.target.value })}
            />
          </Field>
          <Field label="Land">
            <input
              className={inputClass}
              value={player.address.country}
              onChange={(e) => updateAddress({ country: e.target.value })}
            />
          </Field>
        </div>
      </section>

      {/* Ausweis */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Ausweis</h2>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-32 w-48 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
            {player.idCard.fileDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.idCard.fileDataUrl}
                alt="Ausweis"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-2 text-center text-xs text-slate-400">
                Kein Ausweis hinterlegt
              </span>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Ausweis hochladen
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleIdCardUpload(file)
                }}
              />
            </label>
            <Field label="Gültig bis">
              <input
                type="date"
                className={inputClass}
                value={player.idCard.validUntil ?? ''}
                onChange={(e) =>
                  update({ idCard: { ...player.idCard, validUntil: e.target.value } })
                }
              />
            </Field>
            {ocrRunning && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Ablaufdatum wird automatisch erkannt…
              </div>
            )}
            {!ocrRunning && ocrHint && (
              <div className="flex items-start gap-1.5 text-xs text-brand-700">
                <ScanSearch className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {ocrHint}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Versicherung, Steuer, Zufriedenheit & Kontakt */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Versicherung</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['private', 'Private Versicherung'],
                ['liability', 'Haftpflichtversicherung'],
                ['sickPay', 'Krankentagegeldversicherung'],
                ['disability', 'Invaliditätsversicherung'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => updateInsurance({ [key]: !player.insurance[key] })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  player.insurance[key]
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {player.insurance.sickPay && (
            <div className="mt-3">
              <Field label="Krankentagegeld – abgesicherte Summe/Tagessatz">
                <input
                  className={inputClass}
                  placeholder="z.B. 150 € / Tag"
                  value={player.insurance.sickPaySum ?? ''}
                  onChange={(e) => updateInsurance({ sickPaySum: e.target.value })}
                />
              </Field>
            </div>
          )}

          {player.insurance.disability && (
            <div className="mt-3">
              <Field label="Invalidität – Summe der Absicherung">
                <input
                  className={inputClass}
                  placeholder="z.B. 500.000 €"
                  value={player.insurance.disabilitySum ?? ''}
                  onChange={(e) => updateInsurance({ disabilitySum: e.target.value })}
                />
              </Field>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Versicherungsmakler">
              <input
                className={inputClass}
                placeholder="Name / Kanzlei"
                value={player.insurance.broker ?? ''}
                onChange={(e) => updateInsurance({ broker: e.target.value })}
              />
            </Field>
            <Field label="Kontaktdaten Makler">
              <input
                className={inputClass}
                placeholder="Telefon / E-Mail"
                value={player.insurance.brokerContact ?? ''}
                onChange={(e) => updateInsurance({ brokerContact: e.target.value })}
              />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Notiz">
              <input
                className={inputClass}
                value={player.insurance.note ?? ''}
                onChange={(e) => updateInsurance({ note: e.target.value })}
              />
            </Field>
          </div>

          <div className="mt-3">
            <span className="mb-1 block text-xs font-medium text-slate-500">Unterlagen</span>
            <FileList
              files={player.insurance.files}
              onChange={(files) => updateInsurance({ files })}
              label="Versicherungsunterlagen hochladen"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Steuer</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateTax({ managedByUs: true })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                player.tax.managedByUs
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              Läuft über uns
            </button>
            <button
              onClick={() => updateTax({ managedByUs: false })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !player.tax.managedByUs
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              Läuft nicht über uns
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Steuerberater">
              <input
                className={inputClass}
                placeholder="Name / Kanzlei"
                value={player.tax.taxAdvisor ?? ''}
                onChange={(e) => updateTax({ taxAdvisor: e.target.value })}
              />
            </Field>
            <Field label="E-Mail Steuerberater">
              <input
                type="email"
                className={inputClass}
                placeholder="name@kanzlei.de"
                value={player.tax.taxAdvisorEmail ?? ''}
                onChange={(e) => updateTax({ taxAdvisorEmail: e.target.value })}
              />
            </Field>
          </div>

          {player.tax.managedByUs && (
            <div className="mt-3">
              <span className="mb-1 block text-xs font-medium text-slate-500">Jahre</span>
              <div className="flex flex-wrap gap-2">
                {[...player.tax.years]
                  .sort((a, b) => a.year - b.year)
                  .map((y) => (
                    <button
                      key={y.year}
                      onClick={() =>
                        updateTax({
                          years: player.tax.years.map((x) =>
                            x.year === y.year ? { ...x, done: !x.done } : x
                          ),
                        })
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        y.done ? 'bg-green-500 text-white' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {y.year} {y.done ? '✓' : '– offen'}
                    </button>
                  ))}
                <button
                  onClick={() => {
                    const usedYears = player.tax.years.map((y) => y.year)
                    const currentYear = new Date().getFullYear()
                    let nextYear = currentYear
                    while (usedYears.includes(nextYear)) nextYear -= 1
                    updateTax({
                      years: [...player.tax.years, { year: nextYear, done: false }],
                    })
                  }}
                  className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                >
                  + Jahr hinzufügen
                </button>
              </div>
            </div>
          )}

          <div className="mt-3">
            <Field label="Notiz">
              <input
                className={inputClass}
                value={player.tax.note ?? ''}
                onChange={(e) => updateTax({ note: e.target.value })}
              />
            </Field>
          </div>

          <div className="mt-3">
            <span className="mb-1 block text-xs font-medium text-slate-500">Unterlagen</span>
            <FileList
              files={player.tax.files}
              onChange={(files) => updateTax({ files })}
              label="Steuerunterlagen hochladen"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Letzter Kontakt</h2>
          <Field label="Datum (Anruf/Nachricht/E-Mail)">
            <input
              type="date"
              className={inputClass}
              value={player.lastContact ?? ''}
              onChange={(e) => update({ lastContact: e.target.value })}
            />
          </Field>
          <button
            onClick={() => update({ lastContact: new Date().toISOString().slice(0, 10) })}
            className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            Heute als Kontakt setzen
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Letzter persönlicher Besuch</h2>
          <Field label="Datum (vor Ort/Termin)">
            <input
              type="date"
              className={inputClass}
              value={player.lastPersonalVisit ?? ''}
              onChange={(e) => update({ lastPersonalVisit: e.target.value })}
            />
          </Field>
          <button
            onClick={() => update({ lastPersonalVisit: new Date().toISOString().slice(0, 10) })}
            className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            Heute als Besuch setzen
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">
            Zufriedenheit
          </h2>
          {checkInDone ? (
            <span className="text-xs text-slate-400">
              Diesen Monat erledigt · nächste Abfrage in {daysUntilCheckIn} Tag
              {daysUntilCheckIn === 1 ? '' : 'en'} (am {nextCheckInLabel})
            </span>
          ) : (
            <span className="text-xs font-medium text-red-500">
              Abfrage für diesen Monat noch offen · nächste Abfrage in {daysUntilCheckIn} Tag
              {daysUntilCheckIn === 1 ? '' : 'en'} (am {nextCheckInLabel})
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SatisfactionScore value={draftSatisfaction} onChange={setDraftSatisfaction} />
          <button
            onClick={() => setSatisfactionValue(currentMonthKey, draftSatisfaction)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Jetzt eintragen ({currentMonthLabel})
          </button>
        </div>

        {currentMonthEntry && currentMonthEntry.value <= 5 && (
          <div className="mt-2 max-w-sm">
            <Field label="Grund (Wert 5 oder darunter)">
              <input
                className={`${inputClass} border-red-200 focus:border-red-400`}
                placeholder="Warum ist die Zufriedenheit niedrig?"
                value={currentMonthEntry.reason ?? ''}
                onChange={(e) => setSatisfactionReason(currentMonthKey, e.target.value)}
              />
            </Field>
          </div>
        )}

        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
          <div>
            <span className="mb-2 block text-xs font-medium text-slate-500">
              Verlauf (nur Anzeige – Eintragen nur für den aktuellen Monat)
            </span>
            <div className="max-h-48 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="py-1 pr-2 font-medium">Monat</th>
                    <th className="py-1 pr-2 font-medium">Wert</th>
                    <th className="py-1 font-medium">Grund</th>
                  </tr>
                </thead>
                <tbody>
                  {last12Months.map(({ key, label }) => {
                    const entry = player.satisfactionHistory.find((h) => h.month === key)
                    const critical = entry ? entry.value <= 5 : false
                    return (
                      <tr key={key} className="border-t border-slate-100">
                        <td className="py-1 pr-2 text-slate-600">{label}</td>
                        <td className="py-1 pr-2">
                          {entry ? (
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                                critical
                                  ? 'border-red-300 bg-red-50 text-red-600'
                                  : 'border-green-300 bg-green-50 text-green-700'
                              }`}
                            >
                              {entry.value}
                            </span>
                          ) : (
                            <span className="text-slate-300">–</span>
                          )}
                        </td>
                        <td className="py-1 text-slate-600">
                          {entry && entry.value <= 5 ? entry.reason || '–' : ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <SatisfactionChart history={player.satisfactionHistory} />
        </div>
      </section>

      {/* To-Dos */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">
          To-Dos & Erinnerungen
        </h2>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <Field label="To-Do">
              <input
                className={inputClass}
                placeholder="Neues To-Do…"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              />
            </Field>
          </div>
          <Field label="Erinnerung">
            <input
              type="date"
              className={inputClass}
              value={newReminder}
              onChange={(e) => setNewReminder(e.target.value)}
            />
          </Field>
          <Field label="Zu erledigen bis">
            <input
              type="date"
              className={inputClass}
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </Field>
          <button
            onClick={addTodo}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Hinzufügen
          </button>
        </div>

        <div className="mb-3 flex gap-1 border-b border-slate-200">
          <button
            onClick={() => setTodoTab('open')}
            className={`px-3 py-1.5 text-sm font-medium ${
              todoTab === 'open'
                ? 'border-b-2 border-brand-600 text-brand-700'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Offen ({openTodos.length})
          </button>
          <button
            onClick={() => setTodoTab('done')}
            className={`px-3 py-1.5 text-sm font-medium ${
              todoTab === 'done'
                ? 'border-b-2 border-brand-600 text-brand-700'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Erledigt ({doneTodos.length})
          </button>
        </div>

        <ul className="space-y-1.5">
          {(todoTab === 'open' ? openTodos : doneTodos).length === 0 && (
            <li className="text-sm text-slate-400">
              {todoTab === 'open' ? 'Keine offenen To-Dos.' : 'Noch nichts erledigt.'}
            </li>
          )}
          {(todoTab === 'open' ? openTodos : doneTodos).map((t) => {
            const today = new Date(new Date().toDateString())
            const overdue =
              !t.done &&
              ((t.reminderDate && new Date(t.reminderDate) <= today) ||
                (t.dueDate && new Date(t.dueDate) <= today))
            return (
              <li
                key={t.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  t.done
                    ? 'border-slate-100 bg-slate-50 text-slate-400 line-through'
                    : overdue
                    ? 'border-red-200 bg-red-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTodo(t.id)}
                  className="h-4 w-4"
                />
                <span className="flex-1">{t.text}</span>
                <label
                  className="flex items-center gap-1 text-xs text-slate-500"
                  title="Erinnerung"
                >
                  <Bell className="h-3.5 w-3.5 shrink-0" />
                  <input
                    type="date"
                    value={t.reminderDate ?? ''}
                    onChange={(e) => updateTodo(t.id, { reminderDate: e.target.value || undefined })}
                    className="w-32 border-none bg-transparent p-0 text-xs text-inherit focus:outline-none"
                  />
                </label>
                <label
                  className="flex items-center gap-1 text-xs text-slate-500"
                  title="Zu erledigen bis"
                >
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <input
                    type="date"
                    value={t.dueDate ?? ''}
                    onChange={(e) => updateTodo(t.id, { dueDate: e.target.value || undefined })}
                    className="w-32 border-none bg-transparent p-0 text-xs text-inherit focus:outline-none"
                  />
                </label>
                <button onClick={() => removeTodo(t.id)}>
                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Familie & weitere Infos */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Familie & weitere Infos</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Familie">
            <textarea
              className={`${inputClass} h-24 resize-none`}
              value={player.family}
              onChange={(e) => update({ family: e.target.value })}
            />
          </Field>
          <Field label="Weitere Infos">
            <textarea
              className={`${inputClass} h-24 resize-none`}
              value={player.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Hobbys & Gesprächsnotizen (für den nächsten Call/Termin)">
            <textarea
              className={`${inputClass} h-24 resize-none`}
              placeholder="z.B. Hobbys, Anekdoten, Themen fürs nächste Gespräch…"
              value={player.conversationNotes}
              onChange={(e) => update({ conversationNotes: e.target.value })}
            />
          </Field>
        </div>
      </section>

      {/* Ausrüster */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Ausrüster</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateOutfitter({ has: !player.outfitter.has })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              player.outfitter.has ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {player.outfitter.has ? 'Ja' : 'Nein'}
          </button>
        </div>
        {player.outfitter.has && (
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <Field label="Marke">
              <input
                className={inputClass}
                placeholder="z.B. Nike, adidas, Puma…"
                value={player.outfitter.brand ?? ''}
                onChange={(e) => updateOutfitter({ brand: e.target.value })}
              />
            </Field>
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2">
              {brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandLogoUrl} alt={`${player.outfitter.brand} Logo`} className="h-full w-full object-contain" />
              ) : (
                <span className="text-center text-[10px] text-slate-400">
                  {player.outfitter.brand ? 'Kein Logo gefunden' : 'Logo'}
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
