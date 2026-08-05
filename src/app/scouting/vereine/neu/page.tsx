import { requireUser } from '@/lib/scouting/guard'
import { ClubForm } from '@/components/scouting/ClubForm'
import { ErrorBanner } from '@/components/scouting/ui'
import { saveClubAction } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function NewClubPage({ searchParams }: { searchParams: { fehler?: string } }) {
  await requireUser()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">Verein anlegen</h1>
      <ErrorBanner message={searchParams.fehler} />
      <ClubForm action={saveClubAction} />
    </div>
  )
}
