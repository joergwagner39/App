import { Cpu } from 'lucide-react'
import type { AiStock } from '@/lib/aiStocks'
import { SIGNAL_LABELS, type ScreenerStock } from '@/lib/screener'

function pct(v: number | null) {
  if (v === null) return '–'
  return `${v > 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')} %`
}

export default function AiStockOfDay({ stock, quote }: { stock: AiStock; quote: ScreenerStock | null }) {
  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <section className="mb-8 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 to-gray-950 p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
            <Cpu className="h-4 w-4" /> KI-Aktie des Tages · {today}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            {stock.name} <span className="text-base font-normal text-gray-400">{stock.ticker}</span>
          </h2>
          <p className="mt-1 inline-block rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs text-violet-200">
            KI-Wertschöpfungskette: {stock.layer}
          </p>
        </div>

        {quote && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            <div>
              <div className="text-xs text-gray-500">Kurs</div>
              <div className="font-semibold text-white">
                {quote.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quote.currency}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">vom 52W-Hoch</div>
              <div className="font-semibold text-white">{pct(quote.drawdown)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">zum SMA 200 T</div>
              <div className="font-semibold text-white">{pct(quote.dist.sma200d)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">RSI Tag</div>
              <div className="font-semibold text-white">{quote.rsiD?.toFixed(0) ?? '–'}</div>
            </div>
            {quote.signals.length > 0 && (
              <div className="col-span-2 mt-1 flex flex-wrap gap-1 sm:col-span-4">
                {quote.signals.map((k) => (
                  <span key={k} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                    {SIGNAL_LABELS[k]}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-lg text-gray-100">{stock.pitch}</p>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <div className="md:col-span-2">
          <h3 className="mb-1 text-sm font-semibold text-violet-200">Geschäftsmodell</h3>
          <p className="text-sm leading-relaxed text-gray-300">{stock.model}</p>
          <h3 className="mb-1 mt-4 text-sm font-semibold text-violet-200">Rolle in der KI</h3>
          <p className="text-sm leading-relaxed text-gray-300">{stock.aiRole}</p>
        </div>
        <div>
          <h3 className="mb-1 text-sm font-semibold text-violet-200">Umsatzquellen</h3>
          <ul className="list-inside list-disc text-sm text-gray-300">
            {stock.revenue.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <h3 className="mb-1 mt-4 text-sm font-semibold text-violet-200">Risiken</h3>
          <p className="text-sm leading-relaxed text-gray-300">{stock.risks}</p>
        </div>
      </div>
    </section>
  )
}
