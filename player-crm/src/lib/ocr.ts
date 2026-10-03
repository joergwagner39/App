import { createWorker } from 'tesseract.js'

// Matches dates like 13.04.2030, 13/04/2030, 13-04-2030, 2030-04-13
const DATE_REGEX = /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/g

function parseToIso(raw: string): string | null {
  const parts = raw.split(/[./-]/)
  if (parts.length !== 3) return null

  let [a, b, c] = parts
  let day: number, month: number, year: number

  if (a.length === 4) {
    // yyyy-mm-dd
    year = Number(a)
    month = Number(b)
    day = Number(c)
  } else {
    // dd.mm.yyyy or dd.mm.yy
    day = Number(a)
    month = Number(b)
    year = Number(c)
    if (year < 100) year += 2000
  }

  if (
    !year || !month || !day ||
    month < 1 || month > 12 ||
    day < 1 || day > 31
  ) {
    return null
  }

  const iso = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return iso
}

/**
 * Runs OCR on an ID card image and returns the most plausible expiry date
 * (the latest future date found on the card) as an ISO date string, or
 * null if no usable date was detected. Always needs user confirmation —
 * OCR on ID photos is unreliable.
 */
export async function detectExpiryDate(fileDataUrl: string): Promise<string | null> {
  const worker = await createWorker('deu')
  try {
    const { data } = await worker.recognize(fileDataUrl)
    const matches = data.text.match(DATE_REGEX) ?? []
    const isoDates = matches
      .map(parseToIso)
      .filter((d): d is string => d !== null)

    if (isoDates.length === 0) return null

    const today = new Date().toISOString().slice(0, 10)
    const futureDates = isoDates.filter((d) => d > today)
    const candidates = futureDates.length > 0 ? futureDates : isoDates

    return candidates.sort().reverse()[0]
  } finally {
    await worker.terminate()
  }
}
