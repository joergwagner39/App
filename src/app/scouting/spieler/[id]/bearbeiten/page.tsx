import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/scouting/guard'
import { getPlayer, listClubs } from '@/lib/scouting/repo'
import { PlayerForm } from '@/components/scouting/PlayerForm'
import { ErrorBanner } from '@/components/scouting/ui'
import { savePlayerAction } from '../../../actions'

export const dynamic = 'force-dynamic'

export default async function EditPlayerPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { fehler?: string }
}) {
  await requireUser()
  const player = await getPlayer(params.id)
  if (!player) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">{player.name} bearbeiten</h1>
      <ErrorBanner message={searchParams.fehler} />
      <PlayerForm player={player} clubs={await listClubs()} action={savePlayerAction} />
    </div>
  )
}
