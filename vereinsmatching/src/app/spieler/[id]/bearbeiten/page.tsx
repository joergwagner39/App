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
  params: Promise<{ id: string }>
  searchParams: Promise<{ fehler?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  await requireUser()
  const player = await getPlayer(id)
  if (!player) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-marke text-3xl uppercase tracking-wide text-rogon-100">{player.name} bearbeiten</h1>
      <ErrorBanner message={sp.fehler} />
      <PlayerForm player={player} clubs={await listClubs()} action={savePlayerAction} />
    </div>
  )
}
