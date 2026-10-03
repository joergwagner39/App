import { Contact, CONTACT_ROLES, CONTACT_ROLE_LABEL, User } from '@/lib/scouting/types'
import { formatDate } from '@/lib/scouting/format'
import {
  Badge,
  Card,
  EmptyState,
  Field,
  buttonClass,
  dangerButtonClass,
  inputClass,
} from './ui'

/**
 * Ansprechpartner beim Verein. Der Draht zu den Entscheidern ist das Kapital
 * einer Beratung und steht in keiner Datenbank — hier wird er gepflegt und
 * fließt als eigenes Kriterium in die Vereinsvorschläge ein.
 */
export function ClubContacts({
  contacts,
  clubId,
  users,
  currentUserId,
  addAction,
  deleteAction,
}: {
  contacts: Contact[]
  clubId: string
  users: User[]
  currentUserId: string
  addAction: (formData: FormData) => void | Promise<void>
  deleteAction: (formData: FormData) => void | Promise<void>
}) {
  const today = new Date().toISOString().slice(0, 10)
  const userName = new Map(users.map((u) => [u.id, u.name]))

  return (
    <Card
      title="Ansprechpartner & Draht zum Verein"
      subtitle="Rolle, Güte der Verbindung und wann zuletzt gesprochen wurde — fließt gewichtet in die Vereinsvorschläge ein."
    >
      {contacts.length === 0 ? (
        <EmptyState title="Noch kein Ansprechpartner erfasst.">
          Solange bei keinem Verein Kontakte stehen, bleibt das Kriterium „Draht zum Verein“ in der
          Bewertung außen vor.
        </EmptyState>
      ) : (
        <ul className="mb-4 space-y-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 px-3 py-2 text-sm"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-200">{c.name}</span>
                  <Badge tone={c.role === 'sportdirektor' ? 'info' : 'neutral'}>
                    {CONTACT_ROLE_LABEL[c.role]}
                  </Badge>
                  <Badge tone={c.relationship >= 70 ? 'good' : c.relationship >= 40 ? 'warn' : 'bad'}>
                    Beziehung {c.relationship}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {c.lastContact ? `zuletzt ${formatDate(c.lastContact)}` : 'kein Kontaktdatum'}
                  {c.ownerUserId ? ` · Draht über ${userName.get(c.ownerUserId) ?? 'unbekannt'}` : ' · Haus-Kontakt'}
                </div>
                {c.notes && <div className="mt-1 text-xs text-slate-400">{c.notes}</div>}
              </div>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="clubId" value={clubId} />
                <button className={dangerButtonClass} type="submit">
                  Entfernen
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={addAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input type="hidden" name="clubId" value={clubId} />

        <Field label="Name">
          <input className={inputClass} name="name" required placeholder="Vor- und Nachname" />
        </Field>

        <Field label="Rolle">
          <select className={inputClass} name="role" defaultValue="sportdirektor">
            {CONTACT_ROLES.map((r) => (
              <option key={r} value={r}>
                {CONTACT_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Beziehung 0–100" hint="100 = enges Vertrauensverhältnis">
          <input
            className={inputClass}
            name="relationship"
            type="number"
            min={0}
            max={100}
            defaultValue={50}
          />
        </Field>

        <Field label="Letzter Austausch">
          <input className={inputClass} name="lastContact" type="date" defaultValue={today} />
        </Field>

        <Field label="Draht über" hint="Wer in der Beratung hält die Verbindung?">
          <select className={inputClass} name="ownerUserId" defaultValue={currentUserId}>
            <option value="">Haus-Kontakt</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Notiz">
          <input className={inputClass} name="notes" placeholder="z. B. Kontakt über Ex-Spieler" />
        </Field>

        <div>
          <button className={buttonClass} type="submit">
            Ansprechpartner hinzufügen
          </button>
        </div>
      </form>
    </Card>
  )
}
