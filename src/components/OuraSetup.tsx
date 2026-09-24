'use client'

import { useEffect, useState } from 'react'
import { Key, ExternalLink, CheckCircle, LogOut, Loader2 } from 'lucide-react'

interface OuraSetupProps {
  onConnected: (connected: boolean) => void
}

export default function OuraSetup({ onConnected }: OuraSetupProps) {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    fetch('/api/oura/me')
      .then(r => r.json())
      .then(d => {
        if (d.connected) {
          setStatus('connected')
          setEmail(d.email ?? '')
          onConnected(true)
        } else {
          setStatus('disconnected')
          onConnected(false)
        }
      })
      .catch(() => { setStatus('disconnected'); onConnected(false) })
  }, [onConnected])

  async function disconnect() {
    await fetch('/api/oura/me', { method: 'DELETE' })
    setStatus('disconnected')
    setEmail('')
    onConnected(false)
  }

  if (status === 'loading') {
    return (
      <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl p-5 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
        <span className="text-sm text-gray-400">Verbindung prüfen…</span>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <div className="bg-gray-900/50 border border-emerald-500/30 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">Oura Ring verbunden</span>
          </div>
          <button
            onClick={disconnect}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3 h-3" /> Trennen
          </button>
        </div>
        {email && <p className="text-xs text-gray-500 mt-1 ml-6">{email}</p>}
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-medium text-white">Oura Ring verbinden</h3>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Verbinde deinen Oura Ring sicher über OAuth2 — kein Token-Kopieren nötig.
      </p>

      <a
        href="/api/oura/auth"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Mit Oura verbinden
      </a>

      <p className="text-xs text-gray-600 mt-3">
        Du wirst zu Oura weitergeleitet und kommst danach automatisch zurück.
      </p>
    </div>
  )
}
