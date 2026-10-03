'use client'

import { useMemo, useState } from 'react'
import { parseTable } from '@/lib/scouting/csv'
import { autoMap, fieldsFor, sampleTable, type TargetKind } from '@/lib/scouting/tableFields'
import {
  Badge,
  Card,
  Field,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from './ui'

const MAX_PREVIEW = 8

/**
 * Tabellen-Import im Browser: einfügen, Spalten zuordnen, prüfen, importieren.
 *
 * Das Zerlegen passiert hier und nicht auf dem Server, damit die Vorschau beim
 * Tippen steht und die Rohdaten nicht durch die URL müssen — echte Exporte
 * sprengen jede URL-Längenbegrenzung.
 */
export function TableImportForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>
}) {
  const [kind, setKind] = useState<TargetKind>('players')
  const [raw, setRaw] = useState('')
  const [overrides, setOverrides] = useState<Record<number, string>>({})
  const [fileName, setFileName] = useState<string | null>(null)

  const table = useMemo(() => (raw.trim() ? parseTable(raw) : null), [raw])
  const suggested = useMemo(() => (table ? autoMap(table.headers, kind) : []), [table, kind])

  const mapping = useMemo(
    () => suggested.map((value, i) => overrides[i] ?? value),
    [suggested, overrides],
  )

  const activeFields = fieldsFor(kind)
  const importableCount = useMemo(() => {
    if (!table) return 0
    const nameIndex = mapping.indexOf('name')
    if (nameIndex < 0) return 0
    return table.rows.filter((row) => row[nameIndex]?.trim()).length
  }, [table, mapping])
  const hasName = mapping.includes('name')
  const mappedCount = mapping.filter(Boolean).length
  const nameLabel = kind === 'players' ? 'Name' : 'Vereinsname'

  function switchKind(next: TargetKind) {
    setKind(next)
    setOverrides({})
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setRaw(await file.text())
    setOverrides({})
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="art" value={kind} />
      <input type="hidden" name="daten" value={raw} />
      {mapping.map((value, i) => (
        <input key={i} type="hidden" name={`spalte_${i}`} value={value} />
      ))}

      <Card
        title="1. Daten einfügen"
        subtitle="Die erste Zeile muss die Spaltenüberschriften enthalten. Semikolon, Komma und Tabulator werden erkannt — aus Excel kopierte Zellen funktionieren direkt."
      >
        <div className="mb-4 flex flex-wrap gap-4">
          {(['players', 'clubs'] as TargetKind[]).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="radio"
                name="artAuswahl"
                checked={kind === k}
                onChange={() => switchKind(k)}
              />
              {k === 'players' ? 'Spieler' : 'Vereine'}
            </label>
          ))}
        </div>

        <Field label="Tabelle einfügen">
          <textarea
            className={`${inputClass} font-mono text-xs`}
            rows={10}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value)
              setOverrides({})
            }}
            placeholder={sampleTable(kind)}
          />
        </Field>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className={`${secondaryButtonClass} cursor-pointer`}>
            CSV-Datei wählen
            <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFile} />
          </label>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              setRaw(sampleTable(kind))
              setOverrides({})
              setFileName(null)
            }}
          >
            Beispiel einsetzen
          </button>
          {fileName && <span className="text-xs text-slate-500">{fileName}</span>}
          {raw && (
            <button
              type="button"
              className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
              onClick={() => {
                setRaw('')
                setOverrides({})
                setFileName(null)
              }}
            >
              leeren
            </button>
          )}
        </div>
      </Card>

      {table && table.headers.length > 0 && (
        <>
          <Card
            title="2. Spalten zuordnen"
            subtitle={`${table.rows.length} Datenzeilen erkannt, ${mappedCount} von ${table.headers.length} Spalten automatisch zugeordnet. Nicht zugeordnete Spalten werden ignoriert.`}
          >
            {!hasName && (
              <div className="mb-4 rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                Keine Spalte ist dem Feld „{nameLabel}“ zugeordnet. Ohne diese Zuordnung lässt sich
                nichts importieren.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {table.headers.map((header, i) => (
                <Field
                  key={i}
                  label={header || `Spalte ${i + 1}`}
                  hint={table.rows[0]?.[i] ? `z. B. ${table.rows[0][i].slice(0, 40)}` : undefined}
                >
                  <select
                    className={inputClass}
                    value={mapping[i] ?? ''}
                    onChange={(e) => setOverrides((o) => ({ ...o, [i]: e.target.value }))}
                  >
                    <option value="">— ignorieren —</option>
                    {activeFields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          </Card>

          <Card
            title="3. Vorschau"
            subtitle={`Die ersten ${Math.min(MAX_PREVIEW, table.rows.length)} von ${table.rows.length} Zeilen.`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-500">
                  <tr>
                    {table.headers.map((header, i) => (
                      <th key={i} className="px-2 py-2 align-bottom">
                        <div className="whitespace-nowrap text-slate-400">
                          {header || `Spalte ${i + 1}`}
                        </div>
                        <div className="mt-1">
                          {mapping[i] ? (
                            <Badge tone="good">
                              {activeFields.find((f) => f.key === mapping[i])?.label ?? mapping[i]}
                            </Badge>
                          ) : (
                            <Badge>ignoriert</Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {table.rows.slice(0, MAX_PREVIEW).map((row, r) => {
                    // Ohne Namen lässt sich die Zeile nicht zuordnen — das soll
                    // hier schon sichtbar sein, nicht erst in der Erfolgsmeldung.
                    const nameIndex = mapping.indexOf('name')
                    const willSkip = nameIndex < 0 || !row[nameIndex]?.trim()
                    return (
                      <tr key={r} className={willSkip ? 'opacity-50' : undefined}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={`px-2 py-1.5 ${mapping[c] ? 'text-slate-200' : 'text-slate-600'}`}
                          >
                            {cell}
                            {willSkip && c === 0 && (
                              <span className="ml-2 text-amber-400">wird übersprungen</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="4. Importieren">
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  name="modus"
                  value="create_and_update"
                  defaultChecked
                  className="mt-1"
                />
                <span>
                  Neue anlegen und vorhandene aktualisieren
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Abgleich über den Namen. Leere Zellen überschreiben vorhandene Werte nicht —
                    eigene Eintragungen wie Bedarf oder Budget bleiben stehen.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-300">
                <input type="radio" name="modus" value="create_only" className="mt-1" />
                <span>
                  Nur neue anlegen
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Vorhandene Einträge bleiben vollständig unberührt.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4">
              <button className={buttonClass} type="submit" disabled={!hasName}>
                {importableCount} {importableCount === 1 ? 'Zeile' : 'Zeilen'} importieren
              </button>
            </div>
          </Card>
        </>
      )}

      {table && table.headers.length === 0 && (
        <Card>
          <p className="text-sm text-slate-400">
            Aus der Eingabe ließ sich keine Tabelle lesen. Bitte prüfen, ob die erste Zeile
            Spaltenüberschriften enthält.
          </p>
        </Card>
      )}
    </form>
  )
}
