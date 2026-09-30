import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Health Dashboard – Oura & Garmin',
  description: 'Dein persönliches Health & Training Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
