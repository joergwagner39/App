'use client'

import { useState } from 'react'
import { Key, ExternalLink, CheckCircle, Loader2 } from 'lucide-react'

interface OuraSetupProps {
  onTokenSaved: (token: string) => void
  currentToken?: string
}

export default function OuraSetup({ onTokenSaved, currentToken }: OuraSetupProps) {
  const [token, setToken] = useState(currentToken ?? '')
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  async function testAndSave() {
    if (!token.trim()) return
    setTesting(true)
    setStatus('idle')

    try {
      const res = await fetch('https://api.ouraring.com/v2/usercollection/personal_info', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      })
      if (!res.ok) throw new Error()
      setStatus('ok')
      onTokenSaved(token.trim())
    } catch {
      setStatus('error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-medium text-white">Oura Ring verbinden</h3>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-4 text-xs text-purple-300">
        <strong>So holst du deinen Token:</strong><br />
        1. Öffne im Browser:{' '}
        <a
          href="https://cloud.ouraring.com/personal-access-tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="underline inline-flex items-center gap-1"
        >
          cloud.ouraring.com <ExternalLink className="w-3 h-3" />
        </a><br />
        2. Einloggen → &ldquo;Create new token&rdquo; → kopieren
      </div>

      <div className="flex gap-2">
        <input
          type="password"
          value={token}
          onChange={(e) => { setToken(e.target.value); setStatus('idle') }}
          placeholder="Oura Personal Access Token"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={testAndSave}
          disabled={!token.trim() || testing}
          className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {testing ? '' : 'Verbinden'}
        </button>
      </div>

      {status === 'ok' && (
        <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Verbunden! Daten werden geladen…
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400 mt-2">
          Token ungültig. Bitte nochmal prüfen.
        </p>
      )}

      <p className="text-xs text-gray-600 mt-3">
        Der Token wird nur in deinem Browser gespeichert (localStorage) — nie übertragen.
      </p>
    </div>
  )
}
