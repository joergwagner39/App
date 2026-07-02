'use client'

import { useEffect, useState } from 'react'
import { Player, createEmptyPlayer } from '@/lib/types'
import { loadPlayers, savePlayers } from '@/lib/storage'
import PlayerList from '@/components/PlayerList'
import PlayerDetail from '@/components/PlayerDetail'
import { Users } from 'lucide-react'

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = loadPlayers()
    setPlayers(loaded)
    if (loaded.length > 0) setSelectedId(loaded[0].id)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) savePlayers(players)
  }, [players, hydrated])

  const selected = players.find((p) => p.id === selectedId)

  function handleCreate() {
    const p = createEmptyPlayer()
    setPlayers((prev) => [p, ...prev])
    setSelectedId(p.id)
  }

  function handleChange(updated: Player) {
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  function handleDelete() {
    if (!selected) return
    if (!confirm(`${selected.firstName} ${selected.lastName} wirklich löschen?`)) return
    setPlayers((prev) => prev.filter((p) => p.id !== selected.id))
    setSelectedId(undefined)
  }

  if (!hydrated) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Lädt…</div>
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-4">
        <Users className="h-5 w-5 text-brand-600" />
        <h1 className="text-lg font-semibold">Player Relations CRM</h1>
        <span className="ml-auto text-xs text-slate-400">
          Daten werden lokal im Browser gespeichert
        </span>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 shrink-0 border-r border-slate-200 bg-slate-50">
          <PlayerList
            players={players}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={handleCreate}
          />
        </aside>
        <main className="flex-1 overflow-y-auto">
          {selected ? (
            <PlayerDetail player={selected} onChange={handleChange} onDelete={handleDelete} />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              Wähle einen Spieler aus oder lege einen neuen an.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
