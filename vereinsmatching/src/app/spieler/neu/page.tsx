import { requireUser } from '@/lib/scouting/guard'
import { listClubs } from '@/lib/scouting/repo'
import { PlayerForm } from '@/components/scouting/PlayerForm'
import { ErrorBanner } from '@/components/scouting/ui'
import { savePlayerAction } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function NewPlayerPage({ searchParams }: { searchParams: Promise<{ fehler?: string }> }) {
  const sp = await searchParams
  await requireUser()
  const clubs = await listClubs()

  return (
    <div className="space-y-6">
      <h1 className="font-marke text-3xl uppercase tracking-wide text-rogon-100">Spieler anlegen</h1>
      <ErrorBanner message={sp.fehler} />
      <PlayerForm clubs={clubs} action={savePlayerAction} />
    </div>
  )
}
