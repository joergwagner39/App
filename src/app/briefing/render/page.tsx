import MarktBriefing, { CARD_HEIGHT, CARD_WIDTH } from '@/components/MarktBriefing'
import { sampleBriefing } from '@/lib/briefing'
import { loadBriefing } from '@/lib/briefingStore'

export const dynamic = 'force-dynamic'

/**
 * Nackte Karte ohne jede Umgebung – exakt 1080 x 1920. Von hier zieht
 * scripts/briefing/render.mjs den Screenshot fürs Tages-PNG.
 */
export default async function BriefingRenderPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const found = await loadBriefing(searchParams.date)
  return (
    <div
      id="briefing-card"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className="bg-[#f4f3ef]"
    >
      <MarktBriefing data={found?.data ?? sampleBriefing} />
    </div>
  )
}
