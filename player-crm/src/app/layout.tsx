import type { Metadata } from 'next'
import { Oswald, Inter } from 'next/font/google'
import './globals.css'

const heading = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
})

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Player Relations CRM',
  description: 'Übersicht und Betreuung der Spieler',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${heading.variable} ${body.variable} font-sans`}>{children}</body>
    </html>
  )
}
