import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Health Dashboard – Oura & Garmin',
  description: 'Dein persönliches Health & Training Dashboard',
  appleWebApp: {
    capable: true,
    title: "Heute war schön",
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // verhindert das Zoom-Springen beim Antippen von Textfeldern auf dem iPad
  maximumScale: 1,
  themeColor: '#0a0f1e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
