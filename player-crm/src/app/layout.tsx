import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Player Relations CRM',
  description: 'Übersicht und Betreuung der Spieler',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
