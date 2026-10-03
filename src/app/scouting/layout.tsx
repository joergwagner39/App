import type { Metadata } from 'next'
import Link from 'next/link'
import { Antonio } from 'next/font/google'
import { getCurrentUser } from '@/lib/scouting/auth'
import { configProblem } from '@/lib/scouting/db'
import { SetupNeeded } from '@/components/scouting/SetupNeeded'
import { logoutAction } from './actions'

/**
 * Hausschrift der Marke. Antonio läuft schmal und ist für Fließtext und
 * Tabellen zu eng — sie wird deshalb über die Klasse `font-marke` gezielt für
 * Überschriften, Navigation und Kennzahlen gesetzt, nicht global.
 */
const antonio = Antonio({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-marke',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ROGON Vereinsmatching',
  description: 'Passende Vereine für Spieler finden, mit nachvollziehbarer Bewertung.',
}

const NAV = [
  { href: '/scouting', label: 'Spieler' },
  { href: '/scouting/vereine', label: 'Vereine' },
  { href: '/scouting/import/tabelle', label: 'Import' },
  { href: '/scouting/einstellungen', label: 'Einstellungen' },
]

export default async function ScoutingLayout({ children }: { children: React.ReactNode }) {
  // Vor jedem Datenbankzugriff: fehlt die Konfiguration, wird sie erklärt statt
  // in eine Fehlerseite zu laufen.
  const problem = configProblem()
  if (problem) {
    return (
      <div className={`${antonio.variable} min-h-screen bg-rogon-950`}>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <SetupNeeded problem={problem} />
        </main>
      </div>
    )
  }

  const user = await getCurrentUser()

  return (
    <div className={`${antonio.variable} min-h-screen bg-rogon-950`}>
      {user && (
        <header className="border-b border-rogon-800 bg-rogon-900/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
            <Link href="/scouting" className="flex items-center gap-3">
              {/* Bewusst ohne next/image: ein 7-KB-Logo profitiert nicht von der
                  Bildoptimierung, die in Produktion zusätzlich sharp verlangt. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marke/rogon-logo-weiss.png" alt="ROGON" className="h-7 w-auto" />
              <span className="font-marke text-sm uppercase tracking-[0.2em] text-rogon-300">
                Vereinsmatching
              </span>
            </Link>

            <nav className="flex flex-1 flex-wrap gap-x-5 gap-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-marke text-sm uppercase tracking-wider text-rogon-400 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <span className="text-xs text-rogon-500">
                {user.name}
                {user.role === 'admin' ? ' · Admin' : ''}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-xs text-rogon-400 underline-offset-2 transition hover:text-white hover:underline"
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
