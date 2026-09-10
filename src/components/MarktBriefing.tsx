import { accentClasses, type Briefing } from '@/lib/briefing'

/**
 * Story-Karte im 9:16-Format. Die Grundbreite ist fix 1080px – skaliert wird
 * ausschliesslich per CSS-transform von aussen, damit der PNG-Export exakt
 * 1080 x 1920 gross ist.
 */
export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1920

export default function MarktBriefing({ data }: { data: Briefing }) {
  return (
    <div
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className="relative flex flex-col overflow-hidden bg-[#f4f3ef] text-[#111315]"
    >
      {/* Story-Progressbar */}
      <div className="flex gap-2 px-10 pt-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full bg-black/10">
            {i === 0 && <div className="h-full w-2/3 rounded-full bg-black/50" />}
          </div>
        ))}
      </div>

      {/* Story-Header */}
      <div className="flex items-center gap-4 px-10 pt-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111315] text-[26px] font-black text-[#f4f3ef] ring-2 ring-black/10">
          {data.handle.charAt(0).toUpperCase()}
        </div>
        <span className="text-[26px] font-semibold tracking-tight text-black/70">{data.handle}</span>
        {data.verified && (
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#3897f0]" fill="currentColor" aria-hidden="true">
            <path d="M12 1.5l2.4 2.1 3.2-.4 1.2 3 3 1.2-.4 3.2 2.1 2.4-2.1 2.4.4 3.2-3 1.2-1.2 3-3.2-.4L12 22.5l-2.4-2.1-3.2.4-1.2-3-3-1.2.4-3.2L.5 11l2.1-2.4-.4-3.2 3-1.2 1.2-3 3.2.4L12 1.5zm-1.3 13.8l5.9-5.9-1.6-1.6-4.3 4.3-2-2-1.6 1.6 3.6 3.6z" />
          </svg>
        )}
        {data.age && <span className="text-[24px] text-black/45">{data.age}</span>}
        <span className="ml-auto text-[20px] font-medium uppercase tracking-[0.12em] text-black/30">
          {data.date}
        </span>
      </div>

      {/* Titel */}
      <div className="px-10 pt-10">
        <p className="text-[24px] font-semibold uppercase tracking-[0.22em] text-teal-700">
          {data.kicker}
        </p>
        <h1 className="mt-3 whitespace-pre-line text-[104px] font-black leading-[0.9] tracking-[-0.035em]">
          {data.title}
        </h1>
        <div className="mt-5 h-[6px] w-[120px] rounded-full bg-teal-600" />
      </div>

      {/* News des Tages */}
      <div className="px-10 pt-8">
        <SectionLabel accent="teal" label={data.newsLabel} />
        <div className="mt-4">
          {data.news.map((item, i) => (
            <div key={i} className="border-b border-black/10 py-4 last:border-b-0">
              <p className="text-[27px] leading-[1.34] text-[#2b2f33]">
                <span className="mr-1 text-teal-700">▸</span>
                <span className="font-bold text-black">{item.headline}:</span> {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Weitere Sektionen */}
      {data.sections.map((section) => (
        <div key={section.label} className="px-10 pt-7">
          <SectionLabel accent={section.accent} label={section.label} />
          <div className="mt-3 space-y-3">
            {section.rows.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-6 overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <div className={`h-[92px] w-[7px] shrink-0 ${accentClasses[section.accent].bar}`} />
                <div className="min-w-0 flex-1 py-4">
                  <p className="truncate text-[29px] font-bold leading-tight">{row.title}</p>
                  {row.meta && (
                    <p className="mt-1 truncate text-[21px] text-black/45">{row.meta}</p>
                  )}
                </div>
                <div className="shrink-0 pr-7 text-right">
                  <p className={`text-[26px] font-bold ${accentClasses[section.accent].value}`}>
                    {row.value}
                  </p>
                  {row.valueMeta && (
                    <p className={`mt-0.5 text-[19px] font-semibold ${accentClasses[section.accent].value}`}>
                      {row.valueMeta}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.footer && (
        <p className="mt-auto px-10 pb-7 pt-5 text-right text-[19px] uppercase tracking-[0.18em] text-black/25">
          {data.footer}
        </p>
      )}
    </div>
  )
}

function SectionLabel({ accent, label }: { accent: keyof typeof accentClasses; label: string }) {
  const c = accentClasses[accent]
  return (
    <div className="flex items-center gap-4 border-b border-black/10 pb-3">
      <span className={`h-3.5 w-3.5 rounded-full ${c.dot}`} />
      <span className={`text-[24px] font-bold uppercase tracking-[0.16em] ${c.label}`}>{label}</span>
    </div>
  )
}
