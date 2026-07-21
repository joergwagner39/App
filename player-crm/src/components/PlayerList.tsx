'use client'

import { Player } from '@/lib/types'
import {
  idCardStatus,
  insuranceStatus,
  lastContactStatus,
  lastPersonalVisitStatus,
  openTodoCount,
  satisfactionStatus,
  taxStatus,
} from '@/lib/status'
import StatusBadge from './StatusBadge'
import Avatar from './Avatar'
import { Filter, Plus, Search, Shirt } from 'lucide-react'
import { useMemo, useState } from 'react'

function distinctValues(values: (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v && v.trim() !== ''))).sort()
}

export default function PlayerList({
  players,
  selectedId,
  onSelect,
  onCreate,
}: {
  players: Player[]
  selectedId?: string
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [clubFilter, setClubFilter] = useState('')
  const [prFilter, setPrFilter] = useState('')
  const [ceoFilter, setCeoFilter] = useState('')
  const [scoutFilter, setScoutFilter] = useState('')

  const clubs = useMemo(() => distinctValues(players.map((p) => p.club)), [players])
  const prStaff = useMemo(
    () => distinctValues(players.map((p) => p.staff.playerRelations)),
    [players]
  )
  const ceos = useMemo(() => distinctValues(players.map((p) => p.staff.ceo)), [players])
  const scouts = useMemo(() => distinctValues(players.map((p) => p.staff.scout)), [players])

  const activeFilterCount = [clubFilter, prFilter, ceoFilter, scoutFilter].filter(Boolean).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return players.filter((p) => {
      if (q && !`${p.firstName} ${p.lastName} ${p.club}`.toLowerCase().includes(q)) return false
      if (clubFilter && p.club !== clubFilter) return false
      if (prFilter && p.staff.playerRelations !== prFilter) return false
      if (ceoFilter && p.staff.ceo !== ceoFilter) return false
      if (scoutFilter && p.staff.scout !== scoutFilter) return false
      return true
    })
  }, [players, query, clubFilter, prFilter, ceoFilter, scoutFilter])

  const filterSelectClass =
    'w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none'

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 p-4 pb-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Spieler suchen…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`relative flex items-center gap-1 rounded-lg border px-2.5 py-2 text-sm ${
            showFilters || activeFilterCount > 0
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
          }`}
          title="Filter"
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="text-xs font-semibold">{activeFilterCount}</span>
          )}
        </button>
        <button
          onClick={onCreate}
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Neu
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-400">Verein</span>
            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="">Alle</option>
              {clubs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-400">
              Player Relations
            </span>
            <select
              value={prFilter}
              onChange={(e) => setPrFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="">Alle</option>
              {prStaff.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-400">
              Geschäftsführer / Partner
            </span>
            <select
              value={ceoFilter}
              onChange={(e) => setCeoFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="">Alle</option>
              {ceos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium text-slate-400">
              Talentberater
            </span>
            <select
              value={scoutFilter}
              onChange={(e) => setScoutFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="">Alle</option>
              {scouts.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setClubFilter('')
                setPrFilter('')
                setCeoFilter('')
                setScoutFilter('')
              }}
              className="col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-slate-400">
            Keine Spieler gefunden.
          </p>
        )}
        <ul className="space-y-1.5">
          {filtered.map((p) => {
            const todos = openTodoCount(p)
            return (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedId === p.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 bg-white hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        photoUrl={p.photoUrl}
                        alt=""
                        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500"
                        iconClassName="h-4 w-4"
                      />
                      <div>
                        <div className="font-medium text-slate-800">
                          {p.firstName || p.lastName
                            ? `${p.firstName} ${p.lastName}`
                            : 'Unbenannter Spieler'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.club || 'Kein Verein'}
                        </div>
                      </div>
                    </div>
                    {p.outfitter.has && (
                      <span title="Ausrüster hinterlegt">
                        <Shirt className="h-4 w-4 text-slate-400" />
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatusBadge color={idCardStatus(p)} label="Ausweis" />
                    <StatusBadge color={insuranceStatus(p)} label="Versicherung" />
                    <StatusBadge color={taxStatus(p)} label="Steuer" />
                    <StatusBadge color={satisfactionStatus(p)} label={`Zufr. ${p.satisfaction}`} />
                    <StatusBadge color={lastContactStatus(p)} label="Kontakt" />
                    <StatusBadge color={lastPersonalVisitStatus(p)} label="Besuch" />
                    {todos > 0 && (
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {todos} offene To-Do{todos > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
