'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { Signal } from '@/types/trading'

const ACTION_STYLES = {
  buy: { label: 'KAUFEN', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', Icon: TrendingUp },
  sell: { label: 'VERKAUFEN', badge: 'bg-red-500/15 text-red-400 border-red-500/30', Icon: TrendingDown },
  hold: { label: 'ABWARTEN', badge: 'bg-gray-500/15 text-gray-400 border-gray-500/30', Icon: Minus },
} as const

function fmt(value: number | null, digits = 2): string {
  return value === null ? '–' : value.toFixed(digits)
}

export default function SignalCard({ signal }: { signal: Signal }) {
  const [open, setOpen] = useState(false)
  const style = ACTION_STYLES[signal.action]
  const { Icon } = style
  const change = signal.indicators.changePct1d

  // Score von -100..100 auf eine Balkenposition 0..100 % abbilden
  const scorePosition = (signal.score + 100) / 2

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">{signal.symbol}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${style.badge}`}>
              {style.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-semibold text-white">{fmt(signal.indicators.price)} $</span>
            {change !== null && (
              <span className={`text-xs ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)} %
              </span>
            )}
          </div>
        </div>
        <Icon className={`w-5 h-5 ${signal.action === 'buy' ? 'text-emerald-400' : signal.action === 'sell' ? 'text-red-400' : 'text-gray-500'}`} />
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>bearish</span>
          <span>Score {signal.score} · Vertrauen {signal.confidence} %</span>
          <span>bullish</span>
        </div>
        <div className="relative h-1.5 rounded-full bg-gray-800">
          <div className="absolute inset-y-0 left-1/2 w-px bg-gray-600" />
          <div
            className={`absolute -top-1 w-3 h-3.5 rounded-sm ${signal.score >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
            style={{ left: `calc(${scorePosition}% - 6px)` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4 text-center">
        {[
          { label: 'RSI', value: fmt(signal.indicators.rsi14, 1) },
          { label: 'SMA20', value: fmt(signal.indicators.sma20) },
          { label: 'SMA50', value: fmt(signal.indicators.sma50) },
          { label: 'ATR', value: fmt(signal.indicators.atr14) },
        ].map(item => (
          <div key={item.label} className="bg-gray-800/40 rounded-lg py-1.5">
            <p className="text-[10px] text-gray-500">{item.label}</p>
            <p className="text-xs text-gray-200">{item.value}</p>
          </div>
        ))}
      </div>

      {signal.action === 'buy' && (
        <div className="flex gap-3 mt-3 text-xs">
          <span className="text-red-400">Stop-Loss {fmt(signal.stopLoss)} $</span>
          <span className="text-emerald-400">Ziel {fmt(signal.takeProfit)} $</span>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
      >
        {open ? 'Begründung ausblenden' : `Warum? ${signal.reasons.length} Regeln ausgewertet`}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <ul className="mt-3 space-y-2">
          {signal.reasons.map(reason => (
            <li key={reason.rule} className="bg-gray-800/40 rounded-lg p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-200">{reason.rule}</span>
                <span className={`text-[10px] font-mono ${reason.weight > 0 ? 'text-emerald-400' : reason.weight < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {reason.weight > 0 ? '+' : ''}{reason.weight}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{reason.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
