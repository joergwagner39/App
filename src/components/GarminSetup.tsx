'use client'

import { useState } from 'react'
import { Watch, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

interface GarminSetupProps {
  onCredentialsSaved: (email: string, password: string, displayName: string) => void
  currentEmail?: string
  isConnected?: boolean
}

export default function GarminSetup({ onCredentialsSaved, currentEmail, isConnected }: GarminSetupProps) {
  const [email, setEmail] = useState(currentEmail ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function testAndSave() {
    if (!email.trim() || !password.trim()) return
    setTesting(true)
    setStatus('idle')
    setErrorMsg('')

    try {
      const res = await fetch('/api/verify-garmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()

      if (!data.valid) {
        setStatus('error')
        setErrorMsg(data.error ?? 'Login fehlgeschlagen')
      } else {
        setStatus('ok')
        onCredentialsSaved(email.trim(), password, data.displayName ?? email)
      }
    } catch {
      setStatus('error')
      setErrorMsg('Verbindungsfehler — bitte erneut versuchen')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Watch className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-medium text-white">Garmin Connect verbinden</h3>
        {isConnected && (
          <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
            Verbunden
          </span>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-xs text-blue-300">
        Deine normalen <strong>Garmin Connect Zugangsdaten</strong> — dieselben wie in der App.
        Werden nur in deinem Browser gespeichert.
      </div>

      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
          placeholder="Garmin Connect Email"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setStatus('idle') }}
            placeholder="Passwort"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {status === 'ok' && (
        <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Verbunden! Garmin-Daten werden geladen…
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errorMsg}
        </p>
      )}

      <button
        onClick={testAndSave}
        disabled={!email.trim() || !password.trim() || testing}
        className="mt-3 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        {testing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Verbinde mit Garmin…
          </>
        ) : (
          <>
            <Watch className="w-4 h-4" />
            Verbinden
          </>
        )}
      </button>

      <p className="text-xs text-gray-600 mt-3">
        Hinweis: Bei aktivierter Zwei-Faktor-Authentifizierung kann der Login fehlschlagen.
        In diesem Fall 2FA kurz deaktivieren oder FIT-Dateien manuell hochladen.
      </p>
    </div>
  )
}
