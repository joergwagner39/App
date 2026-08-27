'use client'

import type { AlpacaPosition } from '@/types/trading'

export default function PositionsTable({ positions }: { positions: AlpacaPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center text-sm text-gray-500">
        Aktuell keine offenen Positionen.
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-800">
            <th className="text-left font-medium px-4 py-3">Symbol</th>
            <th className="text-right font-medium px-4 py-3">Stück</th>
            <th className="text-right font-medium px-4 py-3">Einstieg</th>
            <th className="text-right font-medium px-4 py-3">Kurs</th>
            <th className="text-right font-medium px-4 py-3">Wert</th>
            <th className="text-right font-medium px-4 py-3">G/V</th>
          </tr>
        </thead>
        <tbody>
          {positions.map(position => (
            <tr key={position.symbol} className="border-b border-gray-800/50 last:border-0">
              <td className="px-4 py-3 font-medium text-white">{position.symbol}</td>
              <td className="px-4 py-3 text-right text-gray-300">{position.qty}</td>
              <td className="px-4 py-3 text-right text-gray-400">{position.avgEntryPrice.toFixed(2)} $</td>
              <td className="px-4 py-3 text-right text-gray-300">{position.currentPrice.toFixed(2)} $</td>
              <td className="px-4 py-3 text-right text-gray-300">{position.marketValue.toFixed(2)} $</td>
              <td className={`px-4 py-3 text-right font-medium ${position.unrealizedPl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {position.unrealizedPl >= 0 ? '+' : ''}{position.unrealizedPl.toFixed(2)} $
                <span className="block text-[11px] font-normal">
                  {position.unrealizedPlPct >= 0 ? '+' : ''}{position.unrealizedPlPct.toFixed(2)} %
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
