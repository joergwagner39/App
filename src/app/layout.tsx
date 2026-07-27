import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegistration from '@/components/journal/ServiceWorkerRegistration'

export const metadata: Metadata = {
  title: 'Heute war schön',
  description: 'Dein Dankbarkeits-Tagebuch für abends, mit Stimmungsverlauf',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Heute war schön',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
