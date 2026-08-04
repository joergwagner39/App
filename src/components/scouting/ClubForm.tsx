import Link from 'next/link'
import { Club, POSITIONS, POSITION_LABEL } from '@/lib/scouting/types'
import { Card, Field, buttonClass, inputClass, secondaryButtonClass } from './ui'

/**
 * Vereinsprofil. Budgets, Bedarf und Spielstil liefert keine API — das sind die
 * Einschätzungen, die den Unterschied zwischen zwei Vereinen im Matching ausmachen.
 */
export function ClubForm({
  club,
  action,
}: {
  club?: Club
  action: (formData: FormData) => void | Promise<void>
}) {
  const c = club

  return (
    <form action={action} className="space-y-6">
      {c && <input type="hidden" name="id" value={c.id} />}

      <Card title="Verein">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name" className="sm:col-span-2">
            <input className={inputClass} name="name" defaultValue={c?.name} required />
          </Field>
          <Field label="Land">
            <input className={inputClass} name="country" defaultValue={c?.country ?? ''} />
          </Field>
          <Field label="Liga">
            <input className={inputClass} name="league" defaultValue={c?.league ?? ''} />
          </Field>
          <Field label="Ligenniveau" hint="1 = Top-Liga … 5 = unterklassig">
            <input
              className={inputClass}
              name="leagueLevel"
              type="number"
              min={1}
              max={5}
              defaultValue={c?.leagueLevel ?? 3}
            />
          </Field>
          <Field label="Formation">
            <input
              className={inputClass}
              name="formation"
              placeholder="4-2-3-1"
              defaultValue={c?.formation ?? ''}
            />
          </Field>
          <Field label="Kaderaltersschnitt">
            <input
              className={inputClass}
              name="avgSquadAge"
              type="number"
              step="0.1"
              min={16}
              max={35}
              defaultValue={c?.avgSquadAge ?? ''}
            />
          </Field>
        </div>
      </Card>

      <Card title="Finanzen" subtitle="Eingabe als Zahl oder mit Einheit, z. B. „12 Mio“.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Transferbudget">
            <input className={inputClass} name="transferBudgetEur" defaultValue={c?.transferBudgetEur ?? ''} />
          </Field>
          <Field label="Gehaltssumme p. a.">
            <input className={inputClass} name="salaryBudgetEur" defaultValue={c?.salaryBudgetEur ?? ''} />
          </Field>
          <Field label="Durchschnittsgehalt">
            <input className={inputClass} name="avgSalaryEur" defaultValue={c?.avgSalaryEur ?? ''} />
          </Field>
        </div>
      </Card>

      <Card
        title="Positionsbedarf"
        subtitle="0 = kein Bedarf, 100 = dringend gesucht. Nur Positionen mit Wert über 0 zählen."
      >
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {POSITIONS.map((pos) => (
            <Field key={pos} label={`${pos} — ${POSITION_LABEL[pos]}`}>
              <input
                className={inputClass}
                name={`need_${pos}`}
                type="number"
                min={0}
                max={100}
                defaultValue={c?.needs?.[pos] ?? ''}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card title="Spielstil & Transferpolitik" subtitle="Skala 0–100.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Tempo" hint="Umschaltspiel, hohes Tempo">
            <input className={inputClass} name="styleTempo" type="number" min={0} max={100} defaultValue={c?.styleTempo ?? ''} />
          </Field>
          <Field label="Ballbesitz" hint="niedrig = direktes Spiel">
            <input className={inputClass} name="stylePossession" type="number" min={0} max={100} defaultValue={c?.stylePossession ?? ''} />
          </Field>
          <Field label="Pressing">
            <input className={inputClass} name="stylePressing" type="number" min={0} max={100} defaultValue={c?.stylePressing ?? ''} />
          </Field>
          <Field label="Jugendstrategie" hint="100 = setzt konsequent auf junge Spieler">
            <input className={inputClass} name="youthPolicy" type="number" min={0} max={100} defaultValue={c?.youthPolicy ?? ''} />
          </Field>
          <Field label="Risikobereitschaft" hint="Umgang mit Verletzungshistorie">
            <input className={inputClass} name="riskTolerance" type="number" min={0} max={100} defaultValue={c?.riskTolerance ?? ''} />
          </Field>
        </div>
      </Card>

      <Card title="Notizen">
        <textarea className={inputClass} name="notes" rows={4} defaultValue={c?.notes ?? ''} />
      </Card>

      <div className="flex gap-2">
        <button className={buttonClass} type="submit">
          Speichern
        </button>
        <Link href="/scouting/vereine" className={secondaryButtonClass}>
          Abbrechen
        </Link>
      </div>
    </form>
  )
}
