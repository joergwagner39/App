import type { Metadata, Viewport } from 'next'
import { Oswald, Inter } from 'next/font/google'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
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
  themeColor: '#0d1622',
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
