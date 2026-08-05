import { redirect } from 'next/navigation'
import { getCurrentUser, userCount } from '@/lib/scouting/auth'
import { Card, ErrorBanner, Field, buttonClass, inputClass } from '@/components/scouting/ui'
import { loginAction } from '../actions'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { fehler?: string }
}) {
  if ((await userCount()) === 0) redirect('/scouting/einrichten')
  if (await getCurrentUser()) redirect('/scouting')

  return (
    <div className="mx-auto mt-16 max-w-md">
      <h1 className="mb-1 text-2xl font-semibold text-slate-100">Vereinsmatching</h1>
      <p className="mb-6 text-sm text-slate-400">
        Bitte anmelden, um Spieler und Vereine zu bearbeiten.
      </p>

      <Card>
        <ErrorBanner message={searchParams.fehler} />
        <form action={loginAction} className="space-y-4">
          <Field label="E-Mail">
            <input className={inputClass} type="email" name="email" required autoComplete="email" />
          </Field>
          <Field label="Passwort">
            <input
              className={inputClass}
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </Field>
          <button className={`${buttonClass} w-full`} type="submit">
            Anmelden
          </button>
        </form>
      </Card>
    </div>
  )
}
