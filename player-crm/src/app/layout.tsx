import type { Metadata, Viewport } from 'next'
import { Antonio, Inter } from 'next/font/google'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import './globals.css'

// Antonio ist die Hausschrift von rogon.tv (dort als Webfont eingebunden).
const heading = Antonio({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-heading',
})

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Player Relations CRM',
  description: 'Übersicht und Betreuung der Spieler',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Player CRM',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a4165',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${heading.variable} ${body.variable} font-sans`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
