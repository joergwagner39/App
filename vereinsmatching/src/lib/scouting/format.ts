export function formatEur(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 1_000_000) {
    const mio = value / 1_000_000
    return `${mio.toLocaleString('de-DE', { maximumFractionDigits: mio >= 10 ? 0 : 1 })} Mio. €`
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 0 })} Tsd. €`
  }
  return `${value.toLocaleString('de-DE')} €`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function parseEur(input: string | null | undefined): number | null {
  if (input == null) return null
  const raw = String(input).trim().toLowerCase()
  if (!raw) return null
  const cleaned = raw.replace(/[€\s.]/g, '').replace(',', '.')
  const mio = /mio|m$/.test(cleaned)
  const tsd = /tsd|k$/.test(cleaned)
  const num = parseFloat(cleaned.replace(/[^0-9.\-]/g, ''))
  if (!Number.isFinite(num)) return null
  if (mio) return Math.round(num * 1_000_000)
  if (tsd) return Math.round(num * 1_000)
  return Math.round(num)
}

export function parseNumber(input: unknown): number | null {
  if (input == null || input === '') return null
  const n = typeof input === 'number' ? input : parseFloat(String(input).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Farbklasse für eine Passungsangabe in Prozent. */
export function matchTone(percent: number): { bar: string; text: string; ring: string } {
  if (percent >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/30' }
  if (percent >= 55) return { bar: 'bg-lime-500', text: 'text-lime-400', ring: 'ring-lime-500/30' }
  if (percent >= 40) return { bar: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/30' }
  return { bar: 'bg-rose-500', text: 'text-rose-400', ring: 'ring-rose-500/30' }
}
