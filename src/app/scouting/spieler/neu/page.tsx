import { requireUser } from '@/lib/scouting/guard'
import { listClubs } from '@/lib/scouting/repo'
import { PlayerForm } from '@/components/scouting/PlayerForm'
import { ErrorBanner } from '@/components/scouting/ui'
import { savePlayerAction } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function NewPlayerPage({ searchParams }: { searchParams: { fehler?: string } }) {
  await requireUser()
  const clubs = await listClubs()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">Spieler anlegen</h1>
      <ErrorBanner message={searchParams.fehler} />
      <PlayerForm clubs={clubs} action={savePlayerAction} />
    </div>
  )
}
