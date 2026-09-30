'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyState, DEFAULT_SETTINGS, type CoachState } from './types'
import { mergeStates } from './engine'

const LS_KEY = 'coach_state_v1'
const PIN_KEY = 'coach_pin'

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error' | 'unauthorized'

function readLocal(): CoachState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as CoachState
    return { ...emptyState(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } }
  } catch {
    return emptyState()
  }
}

function writeLocal(s: CoachState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s))
  } catch {
    /* Speicher voll oder privat – ignorieren */
  }
}

export function getPin(): string {
  try {
    return localStorage.getItem(PIN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setPin(pin: string) {
  try {
    if (pin) localStorage.setItem(PIN_KEY, pin)
    else localStorage.removeItem(PIN_KEY)
  } catch {
    /* ignore */
  }
}

export function useCoachState() {
  const [state, setState] = useState<CoachState | null>(null)
  const [sync, setSync] = useState<SyncStatus>('local')
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const push = useCallback(async (s: CoachState) => {
    const pin = getPin()
    if (!pin) return
    setSync('syncing')
    try {
      const res = await fetch('/api/coach/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-coach-pin': pin },
        body: JSON.stringify(s),
      })
      if (res.status === 401) return setSync('unauthorized')
      if (!res.ok) return setSync(res.status === 501 ? 'local' : 'error')
      const merged = mergeStates(s, (await res.json()) as CoachState)
      writeLocal(merged)
      setState(merged)
      setSync('synced')
    } catch {
      setSync('error')
    }
  }, [])

  const pull = useCallback(async () => {
    const local = readLocal()
    setState(local)
    const pin = getPin()
    if (!pin) return setSync('local')
    setSync('syncing')
    try {
      const res = await fetch('/api/coach/state', { headers: { 'x-coach-pin': pin }, cache: 'no-store' })
      if (res.status === 401) return setSync('unauthorized')
      if (!res.ok) return setSync(res.status === 501 ? 'local' : 'error')
      const remote = (await res.json()) as CoachState
      const merged = mergeStates(local, remote)
      writeLocal(merged)
      setState(merged)
      setSync('synced')
      // lokale Änderungen, die der Server noch nicht kennt, hochladen
      if (JSON.stringify(merged) !== JSON.stringify(remote)) void push(merged)
    } catch {
      setSync('error')
    }
  }, [push])

  useEffect(() => {
    void pull()
  }, [pull])

  const update = useCallback(
    (fn: (s: CoachState) => CoachState) => {
      setState((prev) => {
        const next = fn(prev ?? readLocal())
        writeLocal(next)
        if (pushTimer.current) clearTimeout(pushTimer.current)
        pushTimer.current = setTimeout(() => void push(next), 600)
        return next
      })
    },
    [push],
  )

  const replace = useCallback(
    (s: CoachState) => {
      writeLocal(s)
      setState(s)
      void push(s)
    },
    [push],
  )

  return { state, update, replace, sync, resync: pull }
}
