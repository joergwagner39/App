import Link from 'next/link'
import { Club, Player, POSITIONS, POSITION_LABEL } from '@/lib/scouting/types'
import { Card, Field, buttonClass, inputClass, secondaryButtonClass } from './ui'

/**
 * Formular für Stammdaten eines Spielers. Wird für Neuanlage und Bearbeitung
 * verwendet; die Server-Action kommt von außen.
 */
export function PlayerForm({
  player,
  clubs,
  action,
}: {
  player?: Player
  clubs: Club[]
  action: (formData: FormData) => void | Promise<void>
}) {
  const p = player

  return (
    <form action={action} className="space-y-6">
      {p && <input type="hidden" name="id" value={p.id} />}

      <Card title="Stammdaten">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name" className="sm:col-span-2">
            <input className={inputClass} name="name" defaultValue={p?.name} required />
          </Field>
          <Field label="Nationalität">
            <input className={inputClass} name="nationality" defaultValue={p?.nationality ?? ''} />
          </Field>

          <Field label="Hauptposition">
            <select className={inputClass} name="position" defaultValue={p?.position ?? 'ZM'}>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos} — {POSITION_LABEL[pos]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nebenpositionen" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-2">
              {POSITIONS.map((pos) => (
                <label
                  key={pos}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    name="altPositions"
                    value={pos}
                    defaultChecked={p?.altPositions.includes(pos)}
                  />
                  {pos}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Alter">
            <input className={inputClass} name="age" type="number" min={14} max={45} defaultValue={p?.age ?? ''} />
          </Field>
          <Field label="Geburtsdatum">
            <input className={inputClass} name="birthDate" type="date" defaultValue={p?.birthDate ?? ''} />
          </Field>
          <Field label="Größe (cm)">
            <input className={inputClass} name="heightCm" type="number" min={150} max={215} defaultValue={p?.heightCm ?? ''} />
          </Field>

          <Field label="Starker Fuß">
            <select className={inputClass} name="foot" defaultValue={p?.foot ?? ''}>
              <option value="">—</option>
              <option value="links">links</option>
              <option value="rechts">rechts</option>
              <option value="beidfüßig">beidfüßig</option>
            </select>
          </Field>

          <Field label="Aktueller Verein">
            <select className={inputClass} name="currentClubId" defaultValue={p?.currentClubId ?? ''}>
              <option value="">— nicht in der Liste —</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Verein (Freitext)" hint="Falls der Verein nicht angelegt ist.">
            <input
              className={inputClass}
              name="currentClubName"
              defaultValue={p?.currentClubName ?? ''}
            />
          </Field>
        </div>
      </Card>

      <Card title="Vertrag & Wert">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Marktwert" hint="z. B. 4,5 Mio oder 4500000">
            <input className={inputClass} name="marketValueEur" defaultValue={p?.marketValueEur ?? ''} />
          </Field>
          <Field label="Jahresgehalt" hint="Aktuell bzw. gefordert">
            <input className={inputClass} name="salaryEur" defaultValue={p?.salaryEur ?? ''} />
          </Field>
          <Field label="Vertrag bis">
            <input className={inputClass} name="contractUntil" type="date" defaultValue={p?.contractUntil ?? ''} />
          </Field>
          <Field label="Ligenniveau bisher" hint="1 = Top-Liga … 5 = unterklassig">
            <input
              className={inputClass}
              name="leagueLevel"
              type="number"
              min={1}
              max={5}
              defaultValue={p?.leagueLevel ?? ''}
            />
          </Field>
        </div>
      </Card>

      <Card title="Saisonleistung">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Minuten">
            <input className={inputClass} name="minutesLastSeason" type="number" min={0} defaultValue={p?.minutesLastSeason ?? ''} />
          </Field>
          <Field label="Einsätze">
            <input className={inputClass} name="appearances" type="number" min={0} defaultValue={p?.appearances ?? ''} />
          </Field>
          <Field label="Tore">
            <input className={inputClass} name="goals" type="number" min={0} defaultValue={p?.goals ?? ''} />
          </Field>
          <Field label="Vorlagen">
            <input className={inputClass} name="assists" type="number" min={0} defaultValue={p?.assists ?? ''} />
          </Field>
        </div>
      </Card>

      <Card
        title="Spielerprofil"
        subtitle="Skala 0–100. Grundlage für den Spielstil-Abgleich mit dem Verein."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tempo">
            <input className={inputClass} name="pace" type="number" min={0} max={100} defaultValue={p?.pace ?? ''} />
          </Field>
          <Field label="Technik">
            <input className={inputClass} name="technique" type="number" min={0} max={100} defaultValue={p?.technique ?? ''} />
          </Field>
          <Field label="Physis">
            <input className={inputClass} name="physique" type="number" min={0} max={100} defaultValue={p?.physique ?? ''} />
          </Field>
          <Field label="Defensivarbeit">
            <input className={inputClass} name="defensiveWork" type="number" min={0} max={100} defaultValue={p?.defensiveWork ?? ''} />
          </Field>
        </div>
      </Card>

      <Card title="Wechselwunsch & Notizen">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Wunschländer" hint="Komma-getrennt, z. B. Deutschland, Niederlande">
            <input
              className={inputClass}
              name="preferredCountries"
              defaultValue={p?.preferredCountries.join(', ') ?? ''}
            />
          </Field>
          <label className="mt-6 flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="willingToRelocate"
              defaultChecked={p ? p.willingToRelocate : true}
            />
            Spieler ist wechselbereit
          </label>
          <Field label="Notizen" className="sm:col-span-2">
            <textarea className={inputClass} name="notes" rows={4} defaultValue={p?.notes ?? ''} />
          </Field>
        </div>
      </Card>

      <div className="flex gap-2">
        <button className={buttonClass} type="submit">
          Speichern
        </button>
        <Link href={p ? `/scouting/spieler/${p.id}` : '/scouting'} className={secondaryButtonClass}>
          Abbrechen
        </Link>
      </div>
    </form>
  )
}
