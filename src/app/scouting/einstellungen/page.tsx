import { requireUser } from '@/lib/scouting/guard'
import { listUsers } from '@/lib/scouting/auth'
import { getWeights, listSyncLog } from '@/lib/scouting/repo'
import { CRITERIA, CRITERION_META } from '@/lib/scouting/criteria'
import { activeProvider, PROVIDERS } from '@/lib/scouting/providers'
import { formatDate } from '@/lib/scouting/format'
import {
  Badge,
  Card,
  ErrorBanner,
  Field,
  InfoBanner,
  buttonClass,
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
} from '@/components/scouting/ui'
import {
  createUserAction,
  deleteUserAction,
  resetWeightsAction,
  saveWeightsAction,
  seedDemoAction,
  syncClubsAction,
} from '../actions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { fehler?: string; gespeichert?: string; abgeglichen?: string }
}) {
  const user = await requireUser()
  const { provider, fellBack, requested } = activeProvider()
  const [weights, users, syncLog] = await Promise.all([
    getWeights(user.id),
    user.role === 'admin' ? listUsers() : Promise.resolve([]),
    listSyncLog(5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Einstellungen</h1>
        <p className="mt-1 text-sm text-slate-400">
          Gewichtung der Kriterien, Datenanbindung und Benutzerverwaltung.
        </p>
      </div>

      <ErrorBanner message={searchParams.fehler} />
      {searchParams.gespeichert === '1' && <InfoBanner>Gewichtung gespeichert.</InfoBanner>}
      {searchParams.abgeglichen === '1' && <InfoBanner>Vereine wurden abgeglichen.</InfoBanner>}

      <Card
        title="Gewichtung der Kriterien"
        subtitle="Gilt für das eigene Konto. 0 blendet ein Kriterium aus der Bewertung aus."
      >
        <form action={saveWeightsAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CRITERIA.map((key) => (
              <Field
                key={key}
                label={CRITERION_META[key].label}
                hint={CRITERION_META[key].description}
              >
                <input
                  className={inputClass}
                  name={`w_${key}`}
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={weights[key]}
                />
              </Field>
            ))}
          </div>
          <div className="flex gap-2">
            <button className={buttonClass} type="submit">
              Gewichtung speichern
            </button>
            <button className={secondaryButtonClass} type="submit" formAction={resetWeightsAction}>
              Auf Standard zurücksetzen
            </button>
          </div>
        </form>
      </Card>

      <Card
        title="Datenanbindung"
        subtitle="Der Anbieter liefert Stammdaten, Statistik und Verletzungen. Budgets, Positionsbedarf und Spielstil bleiben eigene Eintragungen."
      >
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-400">Aktiv:</span>
          <Badge tone={fellBack ? 'warn' : 'good'}>{provider.label}</Badge>
          {fellBack && (
            <span className="text-xs text-amber-300">
              Angefordert war „{requested}“ — nicht konfiguriert, daher Demo-Daten.
            </span>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
          {Object.values(PROVIDERS).map((p) => (
            <div key={p.id} className="py-0.5">
              <span className="text-slate-300">{p.id}</span> — {p.setupHint()}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={syncClubsAction} className="flex flex-wrap gap-2">
            <input
              className={inputClass}
              name="league"
              placeholder="Liga-ID (optional)"
              style={{ width: '12rem' }}
            />
            <button className={buttonClass} type="submit">
              Vereine abgleichen
            </button>
          </form>
          <form action={seedDemoAction}>
            <button className={secondaryButtonClass} type="submit">
              Demo-Daten nachladen
            </button>
          </form>
        </div>

        {syncLog.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-slate-500">
            {syncLog.map((entry) => (
              <li key={entry.id}>
                {formatDate(entry.createdAt)} · {entry.provider} · {entry.scope} · neu{' '}
                {entry.created}, aktualisiert {entry.updated}
                {entry.message ? ` — ${entry.message}` : ''}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {user.role === 'admin' && (
        <Card title="Benutzer" subtitle="Jeder Benutzer hat eine eigene Gewichtung und eigene Einschätzungen.">
          <ul className="mb-4 space-y-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-200">{u.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{u.email}</span>
                  {u.role === 'admin' && (
                    <Badge tone="info">
                      <span className="ml-0">Admin</span>
                    </Badge>
                  )}
                </div>
                {u.id !== user.id && (
                  <form action={deleteUserAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className={dangerButtonClass} type="submit">
                      Entfernen
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>

          <form action={createUserAction} className="grid gap-3 sm:grid-cols-4">
            <input className={inputClass} name="name" placeholder="Name" required />
            <input className={inputClass} name="email" type="email" placeholder="E-Mail" required />
            <input
              className={inputClass}
              name="password"
              type="password"
              placeholder="Passwort (min. 8)"
              minLength={8}
              required
            />
            <div className="flex gap-2">
              <select className={inputClass} name="role" defaultValue="berater">
                <option value="berater">Berater</option>
                <option value="admin">Admin</option>
              </select>
              <button className={buttonClass} type="submit">
                Anlegen
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
