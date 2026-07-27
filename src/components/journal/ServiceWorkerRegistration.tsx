'use client'

import { useEffect } from 'react'

/** Meldet den Service Worker an, sobald die Seite steht. */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service Worker konnte nicht registriert werden', err)
      })
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
