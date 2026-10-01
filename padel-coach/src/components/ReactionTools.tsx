'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

function beep(freq = 880, ms = 120) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    gain.gain.value = 0.15
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    setTimeout(() => {
      osc.stop()
      ctx.close()
    }, ms)
  } catch {
    /* kein Audio verfügbar */
  }
}

function Overlay({ children, onClose, className = '' }: { children: React.ReactNode; onClose: () => void; className?: string }) {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none ${className}`}>
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-3 rounded-full bg-black/40 text-white" aria-label="Schließen" style={{ marginTop: 'env(safe-area-inset-top)' }}>
        <X className="w-6 h-6" />
      </button>
      {children}
    </div>
  )
}

/** Reaktionstest: 5 Durchgänge, Bildschirm wird grün → so schnell wie möglich tippen. */
export function ReactionTest({ onDone, onClose }: { onDone: (avgMs: number) => void; onClose: () => void }) {
  const ROUNDS = 5
  const [phase, setPhase] = useState<'intro' | 'wait' | 'go' | 'early' | 'result'>('intro')
  const [times, setTimes] = useState<number[]>([])
  const goAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function startRound() {
    setPhase('wait')
    timer.current = setTimeout(() => {
      goAt.current = performance.now()
      setPhase('go')
    }, 1200 + Math.random() * 2800)
  }

  function tap() {
    if (phase === 'intro' || phase === 'early') return startRound()
    if (phase === 'wait') {
      if (timer.current) clearTimeout(timer.current)
      return setPhase('early')
    }
    if (phase === 'go') {
      const t = Math.round(performance.now() - goAt.current)
      const next = [...times, t]
      setTimes(next)
      if (next.length >= ROUNDS) {
        setPhase('result')
        onDone(Math.round(next.reduce((a, b) => a + b, 0) / next.length))
      } else startRound()
    }
  }

  const bg =
    phase === 'go' ? 'bg-emerald-500' : phase === 'wait' ? 'bg-rose-600' : phase === 'early' ? 'bg-amber-500' : 'bg-gray-950'
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0

  return (
    <Overlay onClose={onClose} className={bg}>
      <button onPointerDown={phase === 'result' ? undefined : tap} className="absolute inset-0 w-full h-full" aria-label="Tippen" />
      <div className="pointer-events-none relative text-center px-8 text-white">
        {phase === 'intro' && (
          <>
            <p className="text-3xl font-bold mb-3">Reaktionstest</p>
            <p className="text-lg opacity-80">Tippe, sobald der Bildschirm grün wird. {ROUNDS} Durchgänge.</p>
            <p className="mt-8 text-xl font-semibold">Zum Starten tippen</p>
          </>
        )}
        {phase === 'wait' && <p className="text-4xl font-bold">Warten …</p>}
        {phase === 'go' && <p className="text-6xl font-black">JETZT!</p>}
        {phase === 'early' && (
          <>
            <p className="text-4xl font-bold">Zu früh 😅</p>
            <p className="mt-4 text-lg">Tippen zum Wiederholen</p>
          </>
        )}
        {phase === 'result' && (
          <>
            <p className="text-lg opacity-80">Dein Schnitt</p>
            <p className="text-7xl font-black my-2">{avg} ms</p>
            <p className="opacity-80">{times.join(' · ')} ms</p>
            <p className="mt-6 text-sm opacity-70">Typisch: 200–300 ms. Ausgeschlafen bist du meist schneller – vergleiche dich mit dir selbst.</p>
          </>
        )}
        {phase !== 'intro' && phase !== 'result' && (
          <p className="absolute left-0 right-0 -bottom-24 text-sm opacity-70">
            {times.length}/{ROUNDS}
          </p>
        )}
      </div>
      {phase === 'result' && (
        <button onClick={onClose} className="relative mt-10 px-8 py-3 rounded-xl bg-white text-gray-950 font-semibold">
          Fertig
        </button>
      )}
    </Overlay>
  )
}

const ARROWS = [
  { sym: '←', label: 'links' },
  { sym: '→', label: 'rechts' },
  { sym: '↑', label: 'vor ans Netz' },
  { sym: '↓', label: 'zurück' },
  { sym: '↖', label: 'vorne links' },
  { sym: '↗', label: 'vorne rechts' },
]

/** 60 s Reaktionspfeile: Split-Step, Pfeil erscheint → in die Richtung bewegen. */
export function ArrowDrill({ onClose, seconds = 60 }: { onClose: () => void; seconds?: number }) {
  const [left, setLeft] = useState(seconds)
  const [arrow, setArrow] = useState<(typeof ARROWS)[number] | null>(null)
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!started) return
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    let cue: ReturnType<typeof setTimeout>
    let hide: ReturnType<typeof setTimeout>
    const next = () => {
      cue = setTimeout(() => {
        const a = ARROWS[Math.floor(Math.random() * ARROWS.length)]
        setArrow(a)
        setCount((c) => c + 1)
        beep(a.sym === '↑' || a.sym === '↓' ? 660 : 880)
        if ('vibrate' in navigator) navigator.vibrate?.(60)
        hide = setTimeout(() => setArrow(null), 900)
        next()
      }, 1500 + Math.random() * 1500)
    }
    next()
    return () => {
      clearInterval(tick)
      clearTimeout(cue)
      clearTimeout(hide)
    }
  }, [started])

  const done = started && left === 0

  return (
    <Overlay onClose={onClose} className="bg-gray-950">
      {!started ? (
        <div className="text-center px-8 text-white">
          <p className="text-3xl font-bold mb-3">Reaktionspfeile</p>
          <p className="opacity-80">
            Handy auf Augenhöhe, 2–3 m Abstand. Split-Step-Position. Pfeil erscheint → Schritt/Ausfallschritt in die Richtung, Schlag schattieren, zurück in die Mitte.
          </p>
          <button onClick={() => setStarted(true)} className="mt-8 px-8 py-3 rounded-xl bg-emerald-500 text-gray-950 font-semibold">
            Start ({seconds} s)
          </button>
        </div>
      ) : done ? (
        <div className="text-center text-white">
          <p className="text-4xl font-bold">Stark! 💪</p>
          <p className="mt-2 opacity-80">{count} Reaktionen in {seconds} s</p>
          <button onClick={onClose} className="mt-8 px-8 py-3 rounded-xl bg-white text-gray-950 font-semibold">
            Fertig
          </button>
        </div>
      ) : (
        <div className="text-center text-white">
          <p className="text-[11rem] leading-none font-black text-emerald-400" style={{ minHeight: '11rem' }}>
            {arrow?.sym ?? '·'}
          </p>
          <p className="text-xl h-8">{arrow?.label ?? ''}</p>
          <p className="mt-10 text-sm opacity-60">{left} s</p>
        </div>
      )}
    </Overlay>
  )
}
