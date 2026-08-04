import { redirect } from 'next/navigation'
import { userCount } from '@/lib/scouting/auth'
import { Card, ErrorBanner, Field, buttonClass, inputClass } from '@/components/scouting/ui'
import { setupAction } from '../actions'

export const dynamic = 'force-dynamic'

export default function SetupPage({ searchParams }: { searchParams: { fehler?: string } }) {
  if (userCount() > 0) redirect('/scouting/login')

  return (
    <div className="mx-auto mt-12 max-w-md">
      <h1 className="mb-1 text-2xl font-semibold text-slate-100">Ersteinrichtung</h1>
      <p className="mb-6 text-sm text-slate-400">
        Das erste Konto wird als Administrator angelegt. Weitere Benutzer lassen sich später in den
        Einstellungen hinzufügen.
      </p>

      <Card>
        <ErrorBanner message={searchParams.fehler} />
        <form action={setupAction} className="space-y-4">
          <Field label="Name">
            <input className={inputClass} name="name" required />
          </Field>
          <Field label="E-Mail">
            <input className={inputClass} type="email" name="email" required />
          </Field>
          <Field label="Passwort" hint="Mindestens 8 Zeichen.">
            <input
              className={inputClass}
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          <label className="flex items-start gap-2 text-sm text-slate-300">
            <input type="checkbox" name="seed" defaultChecked className="mt-0.5" />
            <span>
              Demo-Datensatz anlegen (10 erfundene Vereine mit Bedarf und Budget, 6 erfundene
              Spieler) — zum Ausprobieren des Matchings.
            </span>
          </label>
          <button className={`${buttonClass} w-full`} type="submit">
            Konto anlegen
          </button>
        </form>
      </Card>
    </div>
  )
}
