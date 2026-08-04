import { ReactNode } from 'react'
import { matchTone } from '@/lib/scouting/format'

export const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 ' +
  'placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500'

export const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium ' +
  'text-white transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400'

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 ' +
  'text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500'

export const dangerButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-1.5 ' +
  'text-xs font-medium text-rose-300 transition hover:bg-rose-900/60'

export function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm ${className}`}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info'
}) {
  const tones = {
    neutral: 'border-slate-700 bg-slate-800/60 text-slate-300',
    good: 'border-emerald-800 bg-emerald-950/50 text-emerald-300',
    warn: 'border-amber-800 bg-amber-950/50 text-amber-300',
    bad: 'border-rose-800 bg-rose-950/50 text-rose-300',
    info: 'border-sky-800 bg-sky-950/50 text-sky-300',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/** Waagerechter Balken für eine Prozentangabe. */
export function ScoreBar({ percent, className = '' }: { percent: number; className?: string }) {
  const tone = matchTone(percent)
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-800 ${className}`}>
      <div
        className={`h-full rounded-full ${tone.bar}`}
        style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
      />
    </div>
  )
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="mb-4 rounded-xl border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
      {message}
    </div>
  )
}

export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-sky-900 bg-sky-950/30 px-4 py-3 text-sm text-sky-200">
      {children}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  )
}
