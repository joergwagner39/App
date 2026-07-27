'use client'

import { Player, Todo } from '@/lib/types'
import {
  CONTACT_THRESHOLD_DAYS,
  VISIT_THRESHOLD_DAYS,
  daysUntilNextSatisfactionCheckIn,
  describeRecency,
  dueReminderCount,
  idCardReason,
  idCardStatus,
  insuranceReason,
  insuranceStatus,
  lastContactStatus,
  lastPersonalVisitStatus,
  openTodoCount,
  satisfactionCheckInDoneThisMonth,
  satisfactionStatus,
  taxReason,
  taxStatus,
} from '@/lib/status'
import StatusBadge from './StatusBadge'
import SatisfactionScore from './SatisfactionScore'
import SatisfactionChart from './SatisfactionChart'
import FileList from './FileList'
import { detectExpiryDate } from '@/lib/ocr'
import { getBrandLogoUrl } from '@/lib/brandLogos'
import { downloadTodoAsIcs, openReminderMail } from '@/lib/ics'
import {
  Bell,
  CalendarClock,
  CalendarPlus,
  Mail,
  CheckCircle2,
  Loader2,
  Plus,
  ScanSearch,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'

function formatDateDE(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return isoDate
  const [, year, month, day] = match
  return `${day}.${month}.${year}`
}

function recencyLabel(prefix: string, isoDate: string | undefined, thresholdDays: number): string {
  const info = describeRecency(isoDate, thresholdDays)
  if (!isoDate || !info) return prefix
  const dateText = formatDateDE(isoDate)
  if (info.daysRemaining >= 0) {
    return `✓ ${prefix}: ${dateText} · noch ${info.daysRemaining} Tag${info.daysRemaining === 1 ? '' : 'e'} grün`
  }
  return `${prefix}: ${dateText} · seit ${info.daysAgo} Tagen (Grenze: ${thresholdDays} Tage)`
}

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
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null)
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

  function updateStaff(patch: Partial<Player['staff']>) {
    update({ staff: { ...player.staff, ...patch } })
  }

  function addContact(date: string) {
    if (!date) return
    const history = player.contactHistory.includes(date)
      ? player.contactHistory
      : [...player.contactHistory, date]
    update({ lastContact: date, contactHistory: history })
  }

  function addPersonalVisit(date: string) {
    if (!date) return
    const history = player.personalVisitHistory.includes(date)
      ? player.personalVisitHistory
      : [...player.personalVisitHistory, date]
    update({ lastPersonalVisit: date, personalVisitHistory: history })
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

  useEffect(() => {
    setDraftSatisfaction(player.satisfaction)
  }, [player.id])

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
        <div className="flex items-start gap-8">
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
            <div className="mt-2 flex items-center gap-2 px-2">
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
              <StatusBadge
                color={idCardStatus(player)}
                label={idCardReason(player) ? `Ausweis: ${idCardReason(player)}` : 'Ausweis'}
                onClick={() => scrollToSection('section-ausweis')}
              />
              <StatusBadge
                color={insuranceStatus(player)}
                label={
                  insuranceReason(player)
                    ? `Versicherung: ${insuranceReason(player)}`
                    : 'Versicherung'
                }
                onClick={() => scrollToSection('section-versicherung')}
              />
              <StatusBadge
                color={taxStatus(player)}
                label={taxReason(player) ? `Steuer: ${taxReason(player)}` : 'Steuer'}
                onClick={() => scrollToSection('section-steuer')}
              />
              <StatusBadge
                color={lastContactStatus(player)}
                label={recencyLabel('Letzter Kontakt', player.lastContact, CONTACT_THRESHOLD_DAYS)}
                title={`Grün, wenn der letzte Kontakt max. ${CONTACT_THRESHOLD_DAYS} Tage her ist. Klicken, um heute als Kontakt einzutragen und zum Bereich zu springen.`}
                onClick={() => {
                  addContact(new Date().toISOString().slice(0, 10))
                  scrollToSection('section-kontakt')
                }}
              />
              <StatusBadge
                color={lastPersonalVisitStatus(player)}
                label={recencyLabel('Letzter Besuch', player.lastPersonalVisit, VISIT_THRESHOLD_DAYS)}
                title={`Grün, wenn der letzte persönliche Besuch max. ${VISIT_THRESHOLD_DAYS} Tage her ist. Klicken, um heute als Besuch einzutragen und zum Bereich zu springen.`}
                onClick={() => {
                  addPersonalVisit(new Date().toISOString().slice(0, 10))
                  scrollToSection('section-besuch')
                }}
              />
              <StatusBadge
                color={satisfactionStatus(player)}
                label={`Zufriedenheit: ${player.satisfaction}/10`}
                onClick={() => scrollToSection('section-zufriedenheit')}
              />
              <StatusBadge
                color={dueReminderCount(player) > 0 ? 'red' : 'green'}
                label={
                  openTodoCount(player) > 0
                    ? `To-Dos: ${openTodoCount(player)} offen`
                    : 'To-Dos: keine offen'
                }
                onClick={() => scrollToSection('section-todos')}
              />
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
          <Field label="Vertrag bis">
            <input
              type="date"
              className={inputClass}
              value={player.contractUntil ?? ''}
              onChange={(e) => update({ contractUntil: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Bisherige Verletzungen">
            <textarea
              className={`${inputClass} h-20 resize-none`}
              placeholder="z.B. Kreuzbandriss 2023 (6 Monate), Sprunggelenk 2024…"
              value={player.injuries}
              onChange={(e) => update({ injuries: e.target.value })}
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

        <h3 className="mb-2 mt-4 text-sm font-medium text-slate-500">Zuständigkeiten</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Mitarbeiter Player Relations">
            <input
              className={inputClass}
              value={player.staff.playerRelations ?? ''}
              onChange={(e) => updateStaff({ playerRelations: e.target.value })}
            />
          </Field>
          <Field label="Geschäftsführer / Partner">
            <input
              className={inputClass}
              value={player.staff.ceo ?? ''}
              onChange={(e) => updateStaff({ ceo: e.target.value })}
            />
          </Field>
          <Field label="Talentberater">
            <input
              className={inputClass}
              value={player.staff.scout ?? ''}
              onChange={(e) => updateStaff({ scout: e.target.value })}
            />
          </Field>
        </div>
      </section>

      {/* Ausweis */}
      <section id="section-ausweis" className="rounded-xl border border-slate-200 bg-white p-4 scroll-mt-4">
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
        <div id="section-versicherung" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Versicherung</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateInsurance({ none: !player.insurance.none })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                player.insurance.none ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}
              title="Bewusste Auswahl, z.B. bei Jugendspielern"
            >
              Keine Versicherung
            </button>
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
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Jährliche Überprüfung (am besten im Sommer)
            </span>
            <div className="flex flex-wrap gap-2">
              {[...player.insurance.reviewYears]
                .sort((a, b) => a.year - b.year)
                .map((y) => (
                  <button
                    key={y.year}
                    onClick={() =>
                      updateInsurance({
                        reviewYears: player.insurance.reviewYears.map((x) =>
                          x.year === y.year ? { ...x, done: !x.done } : x
                        ),
                      })
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      y.done ? 'bg-green-500 text-white' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {y.year} {y.done ? 'überprüft' : '– noch nicht überprüft'}
                  </button>
                ))}
              <button
                onClick={() => {
                  const usedYears = player.insurance.reviewYears.map((y) => y.year)
                  const currentYear = new Date().getFullYear()
                  let nextYear = currentYear
                  while (usedYears.includes(nextYear)) nextYear -= 1
                  updateInsurance({
                    reviewYears: [...player.insurance.reviewYears, { year: nextYear, done: false }],
                  })
                }}
                className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
              >
                + Jahr hinzufügen
              </button>
            </div>
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

          {insuranceReason(player) && (
            <p className="mt-3 text-xs font-medium text-red-600">
              Bitte Auswahl treffen – aktuell wurde nichts ausgewählt.
            </p>
          )}

          <div className="mt-3">
            <span className="mb-1 block text-xs font-medium text-slate-500">Unterlagen</span>
            <FileList
              files={player.insurance.files}
              onChange={(files) => updateInsurance({ files })}
              label="Versicherungsunterlagen hochladen"
            />
          </div>
        </div>

        <div id="section-steuer" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Steuer</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateTax({ managedByUs: true, notNeeded: false })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                player.tax.managedByUs && !player.tax.notNeeded
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              Läuft über uns
            </button>
            <button
              onClick={() => updateTax({ managedByUs: false, notNeeded: false })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !player.tax.managedByUs && !player.tax.notNeeded
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              Läuft nicht über uns
            </button>
            <button
              onClick={() => updateTax({ notNeeded: !player.tax.notNeeded })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                player.tax.notNeeded ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}
              title="Bewusste Auswahl, z.B. bei Jugendspielern"
            >
              Steuererklärung noch nicht benötigt
            </button>
          </div>

          {!player.tax.notNeeded && (
            <>
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

              <div className="mt-3">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Jährliche Überprüfung (am besten im Sommer) – nur das zuletzt erfasste Jahr muss
                  erledigt sein, damit "Steuer" grün ist
                </span>
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
            </>
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

          {taxReason(player) && (
            <p className="mt-3 text-xs font-medium text-red-600">
              {player.tax.years.length === 0
                ? 'Bitte Auswahl treffen – aktuell wurde nichts ausgewählt.'
                : taxReason(player)}
            </p>
          )}

          <div className="mt-3">
            <span className="mb-1 block text-xs font-medium text-slate-500">Unterlagen</span>
            <FileList
              files={player.tax.files}
              onChange={(files) => updateTax({ files })}
              label="Steuerunterlagen hochladen"
            />
          </div>
        </div>

        <div id="section-kontakt" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-1 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Letzter Kontakt</h2>
          <p className="mb-1 text-xs text-slate-400">
            Grün, solange der letzte Kontakt max. {CONTACT_THRESHOLD_DAYS} Tage her ist.
          </p>
          <p
            className={`mb-3 text-xs font-medium ${
              lastContactStatus(player) === 'green' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {recencyLabel('Status', player.lastContact, CONTACT_THRESHOLD_DAYS)}
          </p>
          <Field label="Datum (Anruf/Nachricht/E-Mail)">
            <input
              type="date"
              className={inputClass}
              value={player.lastContact ?? ''}
              onChange={(e) => addContact(e.target.value)}
            />
          </Field>
          <button
            onClick={() => addContact(new Date().toISOString().slice(0, 10))}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Jetzt als Kontakt eintragen
          </button>
          {player.contactHistory.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto border-t border-slate-100 pt-2">
              <span className="mb-1 block text-xs font-medium text-slate-500">Verlauf</span>
              <ul className="space-y-1 text-xs text-slate-500">
                {[...player.contactHistory]
                  .sort()
                  .reverse()
                  .map((d) => (
                    <li key={d}>{formatDateDE(d)}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <div id="section-besuch" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-1 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Letzter persönlicher Besuch</h2>
          <p className="mb-1 text-xs text-slate-400">
            Grün, solange der letzte Besuch max. {VISIT_THRESHOLD_DAYS} Tage her ist.
          </p>
          <p
            className={`mb-3 text-xs font-medium ${
              lastPersonalVisitStatus(player) === 'green' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {recencyLabel('Status', player.lastPersonalVisit, VISIT_THRESHOLD_DAYS)}
          </p>
          <Field label="Datum (vor Ort/Termin)">
            <input
              type="date"
              className={inputClass}
              value={player.lastPersonalVisit ?? ''}
              onChange={(e) => addPersonalVisit(e.target.value)}
            />
          </Field>
          <button
            onClick={() => addPersonalVisit(new Date().toISOString().slice(0, 10))}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Jetzt als Besuch eintragen
          </button>
          {player.personalVisitHistory.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto border-t border-slate-100 pt-2">
              <span className="mb-1 block text-xs font-medium text-slate-500">Verlauf</span>
              <ul className="space-y-1 text-xs text-slate-500">
                {[...player.personalVisitHistory]
                  .sort()
                  .reverse()
                  .map((d) => (
                    <li key={d}>{formatDateDE(d)}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section id="section-zufriedenheit" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-4">
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
      <section id="section-todos" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-4">
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
            const expanded = expandedTodoId === t.id
            return (
              <li
                key={t.id}
                className={`rounded-lg border text-sm ${
                  t.done
                    ? 'border-slate-100 bg-slate-50 text-slate-400'
                    : overdue
                    ? 'border-red-200 bg-red-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleTodo(t.id)}
                    className="h-4 w-4 shrink-0"
                  />
                  <button
                    onClick={() => setExpandedTodoId(expanded ? null : t.id)}
                    className={`flex-1 text-left ${t.done ? 'line-through' : ''}`}
                  >
                    {t.text}
                  </button>
                  <label
                    className="flex items-center gap-1 text-xs text-slate-500"
                    title="Erinnerung"
                  >
                    <Bell className="h-3.5 w-3.5 shrink-0" />
                    <input
                      type="date"
                      value={t.reminderDate ?? ''}
                      onChange={(e) =>
                        updateTodo(t.id, { reminderDate: e.target.value || undefined })
                      }
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
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 px-3 py-2">
                    <Field label="Weitere Infos">
                      <textarea
                        className={`${inputClass} h-20 resize-none`}
                        placeholder="Details, Kontext, nächste Schritte…"
                        value={t.details ?? ''}
                        onChange={(e) => updateTodo(t.id, { details: e.target.value })}
                      />
                    </Field>
                    <div className="mt-2">
                      <Field label="Erinnerung an E-Mail">
                        <input
                          type="email"
                          className={inputClass}
                          placeholder="name@firma.de"
                          value={t.reminderEmail ?? ''}
                          onChange={(e) =>
                            updateTodo(t.id, { reminderEmail: e.target.value || undefined })
                          }
                        />
                      </Field>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {(t.reminderDate || t.dueDate) && (
                        <button
                          onClick={() =>
                            downloadTodoAsIcs(t, `${player.firstName} ${player.lastName}`.trim())
                          }
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                          title={
                            t.reminderEmail
                              ? 'Kalender-Datei mit Empfänger – beim Import verschickt Outlook/Google die Einladung samt Erinnerung.'
                              : 'Kalender-Datei für den eigenen Kalender.'
                          }
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Als Kalender-Termin exportieren (.ics)
                        </button>
                      )}
                      <button
                        onClick={() =>
                          openReminderMail(t, `${player.firstName} ${player.lastName}`.trim())
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                        title="Öffnet das Mailprogramm mit vorausgefüllter Erinnerung"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Erinnerungs-Mail schreiben
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Hinweis: Automatisch zeitgesteuerte Mails brauchen einen Server. Trag die
                      E-Mail ein und exportiere den Termin – Outlook/Google verschickt dann die
                      Einladung und erinnert am Tag selbst.
                    </p>
                  </div>
                )}
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
