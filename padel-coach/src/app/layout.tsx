import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Padel & Fitness Coach',
  description: 'Tägliches Training aus Oura- und Garmin-Daten, Padel-Taktik, Quiz und Fakt des Tages.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon.svg', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Coach', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: '#0a0f1e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
