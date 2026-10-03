'use client'

import { useEffect, useState } from 'react'
import { Player, createEmptyPlayer } from '@/lib/types'
import { loadPlayers, savePlayers } from '@/lib/storage'
import { seedPlayers } from '@/lib/seedData'
import PlayerList from '@/components/PlayerList'
import PlayerDetail from '@/components/PlayerDetail'
import { ChevronLeft, Users } from 'lucide-react'

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [hydrated, setHydrated] = useState(false)
  // On phones the list and the detail view share the screen, so only one of
  // them is visible at a time. From md upwards both are shown side by side and
  // this flag is ignored.
  const [showDetailOnPhone, setShowDetailOnPhone] = useState(false)

  useEffect(() => {
    const loaded = loadPlayers()
    const initial = loaded.length > 0 ? loaded : seedPlayers()
    setPlayers(initial)
    if (initial.length > 0) setSelectedId(initial[0].id)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) savePlayers(players)
  }, [players, hydrated])

  const selected = players.find((p) => p.id === selectedId)

  function handleSelect(id: string) {
    setSelectedId(id)
    setShowDetailOnPhone(true)
  }

  function handleCreate() {
    const p = createEmptyPlayer()
    setPlayers((prev) => [p, ...prev])
    setSelectedId(p.id)
    setShowDetailOnPhone(true)
  }

  function handleChange(updated: Player) {
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  function handleDelete() {
    if (!selected) return
    if (!confirm(`${selected.firstName} ${selected.lastName} wirklich löschen?`)) return
    setPlayers((prev) => prev.filter((p) => p.id !== selected.id))
    setSelectedId(undefined)
    setShowDetailOnPhone(false)
  }

  if (!hydrated) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Lädt…</div>
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="relative overflow-hidden border-b-4 border-brand-400 bg-navy-500 text-white">
        {/* Diagonale Markenformen wie auf rogon.tv */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-brand-400/15"
          style={{ clipPath: 'polygon(42% 0, 100% 0, 100% 100%, 0 100%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-2 right-24 h-10 w-40 bg-brand-400/25"
          style={{ clipPath: 'polygon(28% 0, 100% 0, 72% 100%, 0 100%)' }}
        />
        <div className="relative flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Users className="h-5 w-5 shrink-0 text-brand-400" />
          <h1 className="font-heading text-lg font-semibold uppercase tracking-[0.12em] sm:text-2xl">
            Player Relations <span className="text-brand-400">CRM</span>
          </h1>
          <span className="ml-auto hidden text-xs text-navy-100 lg:block">
            Daten werden lokal im Browser gespeichert
          </span>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${
            showDetailOnPhone ? 'hidden md:block' : 'block'
          } w-full shrink-0 overflow-y-auto border-slate-200 bg-slate-50 md:w-96 md:border-r`}
        >
          <PlayerList
            players={players}
            selectedId={selectedId}
            onSelect={handleSelect}
            onCreate={handleCreate}
          />
        </aside>
        <main
          className={`${
            showDetailOnPhone ? 'block' : 'hidden md:block'
          } min-w-0 flex-1 overflow-y-auto`}
        >
          {selected ? (
            <>
              <button
                onClick={() => setShowDetailOnPhone(false)}
                className="sticky top-0 z-10 flex w-full items-center gap-1.5 border-b border-slate-200 bg-white/95 px-4 py-2.5 text-sm font-medium text-navy-600 backdrop-blur md:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
                Zur Spielerliste
              </button>
              <PlayerDetail player={selected} onChange={handleChange} onDelete={handleDelete} />
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-slate-400">
              Wähle einen Spieler aus oder lege einen neuen an.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
