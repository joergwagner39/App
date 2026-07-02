'use client'

import { Player, Todo } from '@/lib/types'
import {
  idCardStatus,
  insuranceStatus,
  lastContactStatus,
  taxStatus,
} from '@/lib/status'
import StatusBadge from './StatusBadge'
import SatisfactionScore from './SatisfactionScore'
import { detectExpiryDate } from '@/lib/ocr'
import { Bell, Loader2, Plus, ScanSearch, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'

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
  const [ocrRunning, setOcrRunning] = useState(false)
  const [ocrHint, setOcrHint] = useState<string | null>(null)

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

  async function handleLogoUpload(file: File) {
    const dataUrl = await fileToDataUrl(file)
    updateOutfitter({ logoDataUrl: dataUrl })
  }

  function addTodo() {
    if (!newTodo.trim()) return
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: newTodo.trim(),
      done: false,
      reminderDate: newReminder || undefined,
    }
    update({ todos: [...player.todos, todo] })
    setNewTodo('')
    setNewReminder('')
  }

  function toggleTodo(id: string) {
    update({
      todos: player.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })
  }

  function removeTodo(id: string) {
    update({ todos: player.todos.filter((t) => t.id !== id) })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
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
          <div className="mt-1 flex flex-wrap gap-2 px-2">
            <StatusBadge color={idCardStatus(player)} label="Ausweis" />
            <StatusBadge color={insuranceStatus(player)} label="Versicherung" />
            <StatusBadge color={taxStatus(player)} label="Steuer" />
            <StatusBadge color={lastContactStatus(player)} label="Letzter Kontakt" />
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateInsurance({ valid: !player.insurance.valid })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                player.insurance.valid
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {player.insurance.valid ? 'Gültig' : 'Nicht gültig'}
            </button>
            <span className="text-xs text-slate-400">Klicken zum Umschalten</span>
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
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Steuer</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateTax({ valid: !player.tax.valid })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                player.tax.valid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {player.tax.valid ? 'Erledigt' : 'Offen'}
            </button>
            <span className="text-xs text-slate-400">Klicken zum Umschalten</span>
          </div>
          <div className="mt-3">
            <Field label="Notiz">
              <input
                className={inputClass}
                value={player.tax.note ?? ''}
                onChange={(e) => updateTax({ note: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Letzter Kontakt</h2>
          <Field label="Datum">
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
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">Zufriedenheit</h2>
        <SatisfactionScore
          value={player.satisfaction}
          onChange={(v) => update({ satisfaction: v })}
        />
      </section>

      {/* To-Dos */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold uppercase tracking-wide text-navy-600">
          Offene To-Dos & Erinnerungen
        </h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className={`${inputClass} flex-1`}
            placeholder="Neues To-Do…"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          />
          <input
            type="date"
            className={inputClass}
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
          />
          <button
            onClick={addTodo}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Hinzufügen
          </button>
        </div>
        <ul className="space-y-1.5">
          {player.todos.length === 0 && (
            <li className="text-sm text-slate-400">Keine To-Dos.</li>
          )}
          {player.todos.map((t) => {
            const overdue =
              !t.done &&
              t.reminderDate &&
              new Date(t.reminderDate) <= new Date(new Date().toDateString())
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
                {t.reminderDate && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Bell className="h-3.5 w-3.5" />
                    {t.reminderDate}
                  </span>
                )}
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
                value={player.outfitter.brand ?? ''}
                onChange={(e) => updateOutfitter({ brand: e.target.value })}
              />
            </Field>
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
              {player.outfitter.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.outfitter.logoDataUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-slate-400">Logo</span>
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Logo hochladen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoUpload(file)
                }}
              />
            </label>
          </div>
        )}
      </section>
    </div>
  )
}
