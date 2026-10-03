import assert from 'node:assert/strict'
import test from 'node:test'
import { detectDelimiter, parseTable } from './csv'
import { autoMap, parseDate, parsePosition, sampleTable } from './tableFields'

test('Trennzeichen: Semikolon, Komma und Tabulator werden erkannt', () => {
  assert.equal(detectDelimiter('a;b;c\n1;2;3'), ';')
  assert.equal(detectDelimiter('a,b,c\n1,2,3'), ',')
  assert.equal(detectDelimiter('a\tb\tc\n1\t2\t3'), '\t')
})

test('Trennzeichen: gleichmäßige Spaltenzahl schlägt häufigeres Zeichen', () => {
  // Kommas stecken in den Werten, die echte Trennung ist das Semikolon.
  const text = 'Name;Notiz\nMüller;schnell, robust, kopfballstark\nSchmidt;technisch, ruhig'
  assert.equal(detectDelimiter(text), ';')
})

test('Tabelle: Überschriften und Zeilen werden getrennt', () => {
  const t = parseTable('Name;Alter\nMüller;24\nSchmidt;31')
  assert.deepEqual(t.headers, ['Name', 'Alter'])
  assert.equal(t.rows.length, 2)
  assert.deepEqual(t.rows[1], ['Schmidt', '31'])
})

test('Tabelle: Anführungszeichen schützen Trennzeichen im Feld', () => {
  const t = parseTable('Name;Notiz\n"Müller, Jan";"sagt ""ja"" dazu"')
  assert.deepEqual(t.rows[0], ['Müller, Jan', 'sagt "ja" dazu'])
})

test('Tabelle: Zeilenumbruch im Anführungszeichen beendet die Zeile nicht', () => {
  const t = parseTable('Name;Notiz\nMüller;"erste Zeile\nzweite Zeile"\nSchmidt;kurz')
  assert.equal(t.rows.length, 2)
  assert.equal(t.rows[0][1], 'erste Zeile\nzweite Zeile')
  assert.equal(t.rows[1][0], 'Schmidt')
})

test('Tabelle: zu kurze Zeilen werden auf die Spaltenzahl aufgefüllt', () => {
  const t = parseTable('A;B;C\n1;2')
  assert.deepEqual(t.rows[0], ['1', '2', ''])
})

test('Tabelle: BOM am Dateianfang stört die erste Überschrift nicht', () => {
  const t = parseTable('﻿Name;Alter\nMüller;24')
  assert.equal(t.headers[0], 'Name')
})

test('Positionen: deutsche, englische und Kurzformen', () => {
  assert.equal(parsePosition('Innenverteidiger'), 'IV')
  assert.equal(parsePosition('IV'), 'IV')
  assert.equal(parsePosition('Centre-Back'), 'IV')
  assert.equal(parsePosition('Linksaußen'), 'LA')
  assert.equal(parsePosition('Right Winger'), 'RA')
  assert.equal(parsePosition('Torwart'), 'TW')
  assert.equal(parsePosition('Mittelstürmer'), 'ST')
  assert.equal(parsePosition('irgendwas'), null)
})

test('Datum: ISO, deutsches und englisches Format', () => {
  assert.equal(parseDate('2028-06-30'), '2028-06-30')
  assert.equal(parseDate('30.06.2028'), '2028-06-30')
  assert.equal(parseDate('1.7.28'), '2028-07-01')
  assert.equal(parseDate('Jun 30, 2028'), '2028-06-30')
  assert.equal(parseDate(''), null)
})

test('Zuordnung: deutsche Überschriften werden erkannt', () => {
  const map = autoMap(['Name', 'Position', 'Alter', 'Verein', 'Marktwert'], 'players')
  assert.deepEqual(map, ['name', 'position', 'age', 'currentClubName', 'marketValueEur'])
})

test('Zuordnung: englische Überschriften werden erkannt', () => {
  const map = autoMap(['Player', 'Main Position', 'Age', 'Current Club', 'Market Value'], 'players')
  assert.deepEqual(map, ['name', 'position', 'age', 'currentClubName', 'marketValueEur'])
})

test('Zuordnung: ein Feld wird nicht zweimal vergeben', () => {
  const map = autoMap(['Tore', 'Tor'], 'players')
  assert.equal(map[0], 'goals')
  assert.notEqual(map[1], 'goals')
})

test('Zuordnung: unbekannte Spalten bleiben leer', () => {
  const map = autoMap(['Name', 'Lieblingsfarbe'], 'players')
  assert.equal(map[0], 'name')
  assert.equal(map[1], '')
})

test('Zuordnung: Vereinsspalten inklusive Positionsbedarf', () => {
  const map = autoMap(['Verein', 'Liga', 'Transferbudget', 'Bedarf IV', 'Bedarf ST'], 'clubs')
  assert.deepEqual(map, ['name', 'league', 'transferBudgetEur', 'need_IV', 'need_ST'])
})

test('Beispieltabellen sind mit der eigenen Zuordnung vollständig lesbar', () => {
  for (const kind of ['players', 'clubs'] as const) {
    const table = parseTable(sampleTable(kind))
    const map = autoMap(table.headers, kind)
    assert.ok(map.includes('name'), `${kind}: Namensspalte nicht erkannt`)
    assert.ok(
      map.every((m) => m !== ''),
      `${kind}: nicht zugeordnete Spalten — ${table.headers.filter((_, i) => !map[i]).join(', ')}`,
    )
    assert.ok(table.rows.length >= 2)
  }
})
