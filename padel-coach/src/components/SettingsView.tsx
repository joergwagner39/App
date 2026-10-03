'use client'

import { useRef, useState } from 'react'
import { Download, Upload, Cloud, CloudOff } from 'lucide-react'
import type { CoachSettings, CoachState, Signals } from '@/lib/coach/types'
import type { WearableData } from '@/lib/wearables'
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
  local: 'Nur auf diesem Gerät gespeichert (Server-Speicher nicht eingerichtet)',
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
  data,
}: {
  state: CoachState
  update: (fn: (s: CoachState) => CoachState) => void
  replace: (s: CoachState) => void
  sync: SyncStatus
  resync: () => void
  signals: Signals
  data: WearableData | null
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

  const input = 'bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 w-full min-w-0 focus:outline-none focus:border-emerald-400'
  const maxHr = resolveMaxHr(s, signals)

  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start [&>*]:min-w-0">
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
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="text-xs text-gray-400 space-y-1">
            <span>Geschlecht (für VO2max-Klasse)</span>
            <select className={input} value={s.sex ?? 'm'} onChange={(e) => set({ sex: e.target.value as 'm' | 'f' })}>
              <option value="m">männlich</option>
              <option value="f">weiblich</option>
            </select>
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            <span>VO2max-Ziel</span>
            <input
              type="number"
              step="0.5"
              inputMode="decimal"
              className={input}
              placeholder={signals.vo2max ? `aktuell ${signals.vo2max}` : 'z. B. 52'}
              value={s.vo2maxTarget ?? ''}
              onChange={(e) => set({ vo2maxTarget: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Aktuell genutzt: {maxHr ? `${maxHr} bpm` : 'keine – Pulsbereiche werden in % angezeigt'}. Reihenfolge: Eingabe → Garmin → Alter (208 − 0,7 × Alter).
        </p>


        <label className="flex items-center gap-3 mt-4 text-sm text-gray-200">
          <input type="checkbox" className="w-4 h-4 accent-emerald-400" checked={s.allowRunning} onChange={(e) => set({ allowRunning: e.target.checked })} />
          Laufen erlauben (nur an Tagen mit Knie ≤ 2/10)
        </label>
      </Card>

      <Card className="lg:col-span-2 border-amber-500/30">
        <SectionTitle title="🎯 Deine Ziele" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-gray-400 space-y-1">
            <span>Hyrox-Wettkampf (Datum)</span>
            <input type="date" className={input} value={s.hyroxRaceDate ?? ''} onChange={(e) => set({ hyroxRaceDate: e.target.value || undefined })} />
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            <span>Division</span>
            <select
              className={input}
              value={s.hyroxDivision ?? ''}
              onChange={(e) => set({ hyroxDivision: (e.target.value || undefined) as CoachSettings['hyroxDivision'] })}
            >
              <option value="">–</option>
              <option value="open">Open</option>
              <option value="pro">Pro</option>
              <option value="doubles">Doubles</option>
              <option value="relay">Relay</option>
            </select>
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            <span>Zielzeit</span>
            <input className={input} placeholder="z. B. 1:25:00" value={s.hyroxTargetTime ?? ''} onChange={(e) => set({ hyroxTargetTime: e.target.value || undefined })} />
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            <span>Padel pro Woche</span>
            <input
              type="number"
              min={0}
              max={7}
              inputMode="numeric"
              className={input}
              value={s.padelPerWeek}
              onChange={(e) => set({ padelPerWeek: Math.max(0, Math.min(7, Number(e.target.value) || 0)) })}
            />
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            <span>Neuro & Ballgefühl</span>
            <select
              className={input}
              value={s.neuroEvery ?? 2}
              onChange={(e) => set({ neuroEvery: Number(e.target.value) as 1 | 2 | 3 })}
            >
              <option value={1}>täglich</option>
              <option value={2}>alle 2 Tage</option>
              <option value={3}>alle 3 Tage</option>
            </select>
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            <span>Zone-2-Grundlage am Anfang</span>
            <select className={input} value={s.baseWeeks ?? 6} onChange={(e) => set({ baseWeeks: Number(e.target.value) })}>
              <option value={0}>aus</option>
              <option value={4}>4 Wochen</option>
              <option value={6}>6 Wochen</option>
              <option value={8}>8 Wochen</option>
              <option value={10}>10 Wochen</option>
            </select>
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            <span>Start der Grundlage</span>
            <input type="date" className={input} value={s.baseStart ?? ''} onChange={(e) => set({ baseStart: e.target.value || undefined })} />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Zone-2-Grundlage: zuerst 3 × Zone 2 und 2 × Kraft pro Woche, in der zweiten Hälfte dazu 1 kurzer VO2max-Reiz – danach gezielter VO2max-Aufbau.
          Ohne Startdatum beginnt sie mit deinem ersten Check-in. Liegt der Hyrox-Wettkampf näher als 8 Wochen, hat er Vorrang.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Mit Wettkampfdatum plant der Coach in Phasen: Grundlage → Aufbau → spezifischer Aufbau (mehr Hyrox) → wettkampfnah → Tapering.
        </p>
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
          Check-ins, Quiz-Antworten und Einstellungen werden über den Server-Speicher zwischen Handy und Laptop abgeglichen. Auf jedem Gerät dieselbe Coach-PIN verwenden.
        </p>
        <div className="flex gap-2">
          <input type="password" className={input} placeholder="Coach-PIN" value={pin} onChange={(e) => setPinInput(e.target.value)} />
          <button
            onClick={() => {
              setPin(pin.trim())
              resync()
            }}
            className="shrink-0 px-4 rounded-xl bg-emerald-500 text-gray-950 text-sm font-semibold"
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
        <ul className="text-sm space-y-3 mb-4">
          <li>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${signals.sources.oura ? 'bg-emerald-400' : 'bg-gray-600'}`} />
              <span className="text-gray-200">Oura</span>
              <span className="text-gray-500">{signals.sources.oura ? 'verbunden' : 'nicht verbunden'}</span>
            </div>
            {data?.oura.error && <p className="text-xs text-rose-300 mt-1">Fehler: {data.oura.error}</p>}
            {data && !data.status.ouraOAuth ? (
              <>
                <OuraAppForm />
                <details className="mt-3">
                  <summary className="text-xs text-gray-500 cursor-pointer">Alternative: Personal Access Token</summary>
                  <OuraTokenForm onSaved={resync} connected={signals.sources.oura} />
                </details>
              </>
            ) : data && !data.status.kv ? (
              <p className="text-xs text-gray-500 mt-1">Zuerst den Server-Speicher (Upstash) einrichten.</p>
            ) : (
              <a
                href={`/api/oura/auth?pin=${encodeURIComponent(getPin())}`}
                className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/40 text-violet-200 text-xs font-medium"
              >
                {signals.sources.oura ? 'Oura neu verbinden' : 'Mit Oura verbinden'}
              </a>
            )}
          </li>
          <li>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${signals.sources.garmin ? 'bg-emerald-400' : 'bg-gray-600'}`} />
              <span className="text-gray-200">Garmin</span>
              <span className="text-gray-500">
                {data?.garmin.connected && data.garmin.syncedAt
                  ? `letzter Sync ${new Date(data.garmin.syncedAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}`
                  : 'noch kein Sync'}
              </span>
            </div>
            {!signals.sources.garmin && <p className="text-xs text-gray-500 mt-1">Wird per GitHub Action „Padel Coach – Garmin Sync“ geladen (siehe README).</p>}
          </li>
          {data && (
            <li className="text-xs text-gray-500">
              Server-Speicher: {data.status.kv ? '✅ eingerichtet' : '❌ fehlt'} · PIN-Schutz: {data.status.pinRequired ? '✅ aktiv' : '⚠️ aus (COACH_PIN setzen!)'}
            </li>
          )}
        </ul>
        {data && !data.demo && <RawDataTable data={data} />}
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

function OuraTokenForm({ onSaved, connected }: { onSaved: () => void; connected: boolean }) {
  const [token, setToken] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    setMsg(null)
    const res = await fetch('/api/oura/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-coach-pin': getPin() },
      body: JSON.stringify({ token }),
    })
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    setBusy(false)
    if (res.ok) {
      setToken('')
      setMsg('Gespeichert ✅ – Daten werden neu geladen …')
      setTimeout(() => window.location.reload(), 800)
      onSaved()
    } else setMsg(body.error ?? 'Fehler beim Speichern')
  }
  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-gray-500">
        {connected ? 'Neuen Token eintragen, falls du ihn geändert hast:' : 'Oura Personal Access Token einfügen (cloud.ouraring.com → Personal Access Tokens):'}
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Oura-Token"
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 w-full min-w-0 focus:outline-none focus:border-violet-400"
        />
        <button
          onClick={save}
          disabled={busy || token.trim().length < 20}
          className="shrink-0 px-3 rounded-xl bg-violet-500/80 text-white text-sm font-medium disabled:bg-gray-700 disabled:text-gray-400"
        >
          {busy ? '…' : 'Speichern'}
        </button>
      </div>
      {msg && <p className="text-xs text-gray-300">{msg}</p>}
    </div>
  )
}

function OuraAppForm() {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const field =
    'bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 w-full min-w-0 focus:outline-none focus:border-violet-400'
  async function save() {
    setBusy(true)
    setMsg(null)
    const res = await fetch('/api/oura/app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-coach-pin': getPin() },
      body: JSON.stringify({ clientId, clientSecret }),
    })
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    setBusy(false)
    if (!res.ok) return setMsg(body.error ?? 'Fehler beim Speichern')
    setMsg('Gespeichert ✅ – weiter zu Oura …')
    // direkt den Oura-Login starten
    setTimeout(() => (window.location.href = `/api/oura/auth?pin=${encodeURIComponent(getPin())}`), 600)
  }
  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-gray-500">
        Client ID und Client Secret deiner Oura-App einfügen (Redirect-URI dort:{' '}
        <span className="text-gray-300 break-all">{typeof window !== 'undefined' ? window.location.origin : ''}/api/oura/callback</span>):
      </p>
      <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Client ID" className={field} autoComplete="off" />
      <input
        type="password"
        value={clientSecret}
        onChange={(e) => setClientSecret(e.target.value)}
        placeholder="Client Secret"
        className={field}
        autoComplete="off"
      />
      <button
        onClick={save}
        disabled={busy || clientId.trim().length < 8 || clientSecret.trim().length < 8}
        className="w-full py-2 rounded-xl bg-violet-500/80 text-white text-sm font-medium disabled:bg-gray-700 disabled:text-gray-400"
      >
        {busy ? '…' : 'Speichern & mit Oura verbinden'}
      </button>
      {msg && <p className="text-xs text-gray-300">{msg}</p>}
    </div>
  )
}

/** Rohdaten zum Nachprüfen: genau die Werte, die Oura und Garmin geliefert haben. */
function RawDataTable({ data }: { data: WearableData }) {
  const dates = Array.from(
    new Set([...data.oura.sleep.map((d) => d.date), ...data.oura.readiness.map((d) => d.date), ...data.garmin.daily.map((d) => d.date)]),
  )
    .sort()
    .reverse()
    .slice(0, 5)
  const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
  const cell = (v: number | undefined, digits = 0) => (v === undefined || v === null ? '–' : v.toFixed(digits))
  return (
    <details className="mb-4">
      <summary className="text-xs text-sky-300 cursor-pointer">Rohdaten prüfen (letzte Tage, wie geliefert)</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs text-gray-300 tabular-nums">
          <thead>
            <tr className="text-gray-500 text-left">
              <th className="py-1 pr-2 font-normal">Tag</th>
              <th className="py-1 pr-2 font-normal">Schlaf-Score</th>
              <th className="py-1 pr-2 font-normal">Schlaf h</th>
              <th className="py-1 pr-2 font-normal">Readiness</th>
              <th className="py-1 pr-2 font-normal">HRV</th>
              <th className="py-1 pr-2 font-normal">Ruhepuls</th>
              <th className="py-1 font-normal">Body Battery</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((d) => {
              const sl = data.oura.sleep.find((x) => x.date === d)
              const rd = data.oura.readiness.find((x) => x.date === d)
              const g = data.garmin.daily.find((x) => x.date === d)
              return (
                <tr key={d} className="border-t border-gray-800">
                  <td className="py-1 pr-2 text-gray-400">{fmtDay(d)}</td>
                  <td className="py-1 pr-2">{cell(sl?.score)}</td>
                  <td className="py-1 pr-2">{cell(sl?.totalSleepSeconds ? sl.totalSleepSeconds / 3600 : undefined, 1)}</td>
                  <td className="py-1 pr-2">{cell(rd?.score)}</td>
                  <td className="py-1 pr-2">{cell(sl?.averageHrv)}</td>
                  <td className="py-1 pr-2">{cell(sl?.lowestHeartRate)}</td>
                  <td className="py-1">{cell(g?.bodyBatteryHighestValue)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-gray-500 mt-1">
          Schlaf, Readiness, HRV, Ruhepuls: Oura (live abgerufen). Body Battery: Garmin
          {data.garmin.syncedAt ? ` (Stand ${new Date(data.garmin.syncedAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })})` : ''}.
          Oura ordnet eine Nacht dem Tag zu, an dem du aufwachst.
        </p>
      </div>
    </details>
  )
}
