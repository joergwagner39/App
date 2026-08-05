import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/scouting/auth'
import { logoutAction } from './actions'

export const metadata: Metadata = {
  title: 'Vereinsmatching – Spielerberatung',
  description: 'Passende Vereine für Spieler finden, mit nachvollziehbarer Bewertung.',
}

const NAV = [
  { href: '/scouting', label: 'Spieler' },
  { href: '/scouting/vereine', label: 'Vereine' },
  { href: '/scouting/import', label: 'Import' },
  { href: '/scouting/einstellungen', label: 'Einstellungen' },
]

export default async function ScoutingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-slate-950">
      {user && (
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/scouting" className="text-sm font-semibold text-slate-100">
              Vereinsmatching
            </Link>
            <nav className="flex flex-1 flex-wrap gap-x-4 gap-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-400 transition hover:text-slate-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {user.name}
                {user.role === 'admin' ? ' · Admin' : ''}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-xs text-slate-400 underline-offset-2 transition hover:text-slate-100 hover:underline"
                >
                  Abmelden
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
