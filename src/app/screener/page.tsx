import { loadScreener } from '@/lib/screenerStore'
import { aiStockOfDay } from '@/lib/aiStocks'
import ScreenerTable from '@/components/ScreenerTable'
import AiStockOfDay from '@/components/AiStockOfDay'

// Bei jedem Aufruf frisch lesen, damit ein neuer Screener-Lauf sofort sichtbar ist
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Pullback-Screener' }

export default async function ScreenerPage() {
  const data = await loadScreener()
  const ai = aiStockOfDay()
  const aiQuote = data?.stocks.find((s) => s.ticker === ai.ticker) ?? null

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pullback-Screener</h1>
        <p className="mt-1 text-sm text-gray-400">
          Qualitäts- und Wachstumsaktien an SMA 50 (Tag), SMA 200 (Tag), SMA 200 (Woche) und am
          61,8 %-Fibonacci-Retracement – plus überverkaufte Werte (RSI &lt; 30).
          {data && (
            <>
              {' '}
              Stand:{' '}
              {new Date(data.generatedAt).toLocaleString('de-DE', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Europe/Berlin',
              })}
            </>
          )}
        </p>
      </header>

      <AiStockOfDay stock={ai} quote={aiQuote} />

      {data ? (
        <ScreenerTable data={data} />
      ) : (
        <p className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-400">
          Noch keine Daten. Einmal <code className="text-gray-200">python scripts/screener/run_screener.py</code>{' '}
          ausführen – danach aktualisiert die GitHub Action die Daten jeden Handelstag.
        </p>
      )}

      <p className="mt-8 text-xs text-gray-500">
        Kursdaten: Yahoo Finance, verzögert. Keine Anlageberatung – der Screener zeigt nur, wo ein
        Kurs technisch steht.
      </p>
    </main>
  )
}
