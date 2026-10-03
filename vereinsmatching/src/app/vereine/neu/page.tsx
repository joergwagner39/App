import { requireUser } from '@/lib/scouting/guard'
import { ClubForm } from '@/components/scouting/ClubForm'
import { ErrorBanner } from '@/components/scouting/ui'
import { saveClubAction } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function NewClubPage({ searchParams }: { searchParams: Promise<{ fehler?: string }> }) {
  const sp = await searchParams
  await requireUser()
  return (
    <div className="space-y-6">
      <h1 className="font-marke text-3xl uppercase tracking-wide text-rogon-100">Verein anlegen</h1>
      <ErrorBanner message={sp.fehler} />
      <ClubForm action={saveClubAction} />
    </div>
  )
}
