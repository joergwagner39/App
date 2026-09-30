'use client'

import { useRef, useState } from 'react'
import { Download, Upload, Cloud, CloudOff } from 'lucide-react'
import type { CoachSettings, CoachState, Signals } from '@/lib/coach/types'
import { mergeStates, resolveMaxHr } from '@/lib/coach/engine'
import { getPin, setPin, type SyncStatus } from '@/lib/coach/useCoachState'
import { Card, SectionTitle } from './ui'

const EQUIPMENT: { k: keyof CoachSettings['equipment']; label: string }[] = [
  { k: 'bike', label: 'Rad-Ergometer / Wattbike' },
  { k: 'rower', label: 'Rudergerät' },
  { k: 'skierg', label: 'SkiErg' },
  { k: 'pool', label: 'Schwimmbad' },
  { k: 'sled', label: 'Schlitten (Sled)' },
  { k: 'wallball', label: 'Wall Ball' },
  { k: 'kettlebell', label: 'Kettlebells' },
]

const SYNC_TEXT: Record<SyncStatus, string> = {
  local: 'Nur auf diesem Gerät gespeichert',
  syncing: 'Synchronisiere …',
  synced: 'Mit allen Geräten synchronisiert',
  error: 'Sync fehlgeschlagen – Daten bleiben lokal',
  unauthorized: 'PIN falsch',
}

export default function SettingsView({
  state,
  update,
  replace,
  sync,
  resync,
  signals,
}: {
  state: CoachState
  update: (fn: (s: CoachState) => CoachState) => void
  replace: (s: CoachState) => void
  sync: SyncStatus
  resync: () => void
  signals: Signals
}) {
  const [pin, setPinInput] = useState(getPin())
  const fileRef = useRef<HTMLInputElement>(null)
  const s = state.settings

  const set = (patch: Partial<CoachSettings>) =>
    update((st) => ({ ...st, settings: { ...st.settings, ...patch, updatedAt: Date.now() } }))

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `coach-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function importJson(f: File) {
    try {
      const parsed = JSON.parse(await f.text()) as CoachState
      if (parsed.version !== 1 || typeof parsed.days !== 'object') throw new Error('format')
      replace(mergeStates(state, parsed))
      alert('Import erfolgreich.')
    } catch {
      alert('Datei konnte nicht gelesen werden.')
    }
  }

  const input = 'bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 w-full focus:outline-none focus:border-emerald-400'
  const maxHr = resolveMaxHr(s, signals)

  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      <Card>
        <SectionTitle title="Herzfrequenz & Körper" />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-400 space-y-1">
            <span>Max. Herzfrequenz</span>
            <input
              type="number"
              inputMode="numeric"
              className={input}
              placeholder={signals.maxHr ? `Garmin: ${signals.maxHr}` : 'z. B. 185'}
              value={s.maxHr ?? ''}
              onChange={(e) => set({ maxHr: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            <span>Alter</span>
            <input
              type="number"
              inputMode="numeric"
              className={input}
              value={s.age ?? ''}
              onChange={(e) => set({ age: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Aktuell genutzt: {maxHr ? `${maxHr} bpm` : 'keine – Pulsbereiche werden in % angezeigt'}. Reihenfolge: Eingabe → Garmin → Alter (208 − 0,7 × Alter).
        </p>

        <label className="text-xs text-gray-400 space-y-1 block mt-4">
          <span>Hyrox-Wettkampf (optional)</span>
          <input type="date" className={input} value={s.hyroxRaceDate ?? ''} onChange={(e) => set({ hyroxRaceDate: e.target.value || undefined })} />
        </label>

        <label className="flex items-center gap-3 mt-4 text-sm text-gray-200">
          <input type="checkbox" className="w-4 h-4 accent-emerald-400" checked={s.allowRunning} onChange={(e) => set({ allowRunning: e.target.checked })} />
          Laufen erlauben (nur an Tagen mit Knie ≤ 2/10)
        </label>
      </Card>

      <Card>
        <SectionTitle title="Verfügbares Equipment" />
        <div className="grid grid-cols-2 gap-2">
          {EQUIPMENT.map(({ k, label }) => (
            <label key={k} className="flex items-center gap-2 text-sm text-gray-200 bg-gray-800/40 rounded-xl px-3 py-2">
              <input
                type="checkbox"
                className="w-4 h-4 accent-emerald-400"
                checked={s.equipment[k]}
                onChange={(e) => set({ equipment: { ...s.equipment, [k]: e.target.checked } })}
              />
              {label}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Handy ↔ Laptop synchronisieren"
          right={sync === 'synced' ? <Cloud className="w-4 h-4 text-emerald-400" /> : <CloudOff className="w-4 h-4 text-gray-500" />}
        />
        <p className="text-sm text-gray-400 mb-3">
          Gib auf jedem Gerät dieselbe Coach-PIN ein (in Vercel als <code className="text-gray-300">COACH_PIN</code> hinterlegt). Dann landen Check-ins und Quiz-Antworten überall.
        </p>
        <div className="flex gap-2">
          <input type="password" className={input} placeholder="Coach-PIN" value={pin} onChange={(e) => setPinInput(e.target.value)} />
          <button
            onClick={() => {
              setPin(pin.trim())
              resync()
            }}
            className="px-4 rounded-xl bg-emerald-500 text-gray-950 text-sm font-semibold"
          >
            Speichern
          </button>
        </div>
        <p className={`text-xs mt-2 ${sync === 'synced' ? 'text-emerald-400' : sync === 'error' || sync === 'unauthorized' ? 'text-rose-300' : 'text-gray-500'}`}>
          {SYNC_TEXT[sync]}
        </p>
      </Card>

      <Card>
        <SectionTitle title="Datenquellen & Backup" />
        <ul className="text-sm space-y-1.5 mb-4">
          <li className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${signals.sources.oura ? 'bg-emerald-400' : 'bg-gray-600'}`} />
            Oura {signals.sources.oura ? 'verbunden' : '– nicht verbunden (im Dashboard unter Einstellungen verbinden)'}
          </li>
          <li className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${signals.sources.garmin ? 'bg-emerald-400' : 'bg-gray-600'}`} />
            Garmin {signals.sources.garmin ? 'synchronisiert' : '– noch kein Sync (GitHub Action „Garmin Sync“ einrichten)'}
          </li>
        </ul>
        <div className="flex gap-2">
          <button onClick={exportJson} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-700 text-sm text-gray-200 hover:border-gray-500">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-700 text-sm text-gray-200 hover:border-gray-500">
            <Upload className="w-4 h-4" /> Import
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
      </Card>
    </div>
  )
}
