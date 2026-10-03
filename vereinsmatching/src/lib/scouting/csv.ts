/**
 * Lesen von Tabellen aus Zwischenablage oder Datei.
 *
 * Bewusst ohne Bibliothek: die Eingaben sind Exporte aus Excel, Numbers oder
 * einem Anbieter-Portal. Wichtig sind nur Trennzeichen-Erkennung, Anführungs-
 * zeichen und Zeilenumbrüche innerhalb von Feldern.
 */

export interface Table {
  headers: string[]
  rows: string[][]
  delimiter: string
}

const CANDIDATES = ['\t', ';', ',', '|'] as const

/** Welches Trennzeichen ergibt über die ersten Zeilen die gleichmäßigste Spaltenzahl? */
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 20)
  if (!lines.length) return ','

  let best = ','
  let bestScore = -1
  for (const d of CANDIDATES) {
    const counts = lines.map((l) => splitLine(l, d).length)
    const first = counts[0]
    if (first < 2) continue
    // Gleichmäßige Spaltenzahl über alle Zeilen ist das stärkste Signal.
    const consistent = counts.filter((c) => c === first).length / counts.length
    const score = consistent * 10 + Math.min(first, 30) / 30
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return best
}

/** Eine einzelne Zeile zerlegen, Anführungszeichen beachtet. */
function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      out.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  out.push(current)
  return out
}

/**
 * Tabelle zerlegen. Zeilenumbrüche innerhalb von Anführungszeichen gehören zum
 * Feld und beenden die Zeile nicht — sonst zerfallen mehrzeilige Notizen.
 */
export function parseTable(text: string, delimiter?: string): Table {
  const clean = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const d = delimiter ?? detectDelimiter(clean)

  const lines: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (ch === '"') {
      if (inQuotes && clean[i + 1] === '"') {
        current += '""'
        i++
        continue
      }
      inQuotes = !inQuotes
      current += ch
      continue
    }
    if (ch === '\n' && !inQuotes) {
      lines.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) lines.push(current)

  const parsed = lines.filter((l) => l.trim()).map((l) => splitLine(l, d).map((c) => c.trim()))
  if (!parsed.length) return { headers: [], rows: [], delimiter: d }

  const headers = parsed[0]
  const width = headers.length
  const rows = parsed.slice(1).map((r) => {
    const padded = r.slice(0, width)
    while (padded.length < width) padded.push('')
    return padded
  })

  return { headers, rows, delimiter: d }
}
