import type { ReactNode } from 'react'
import clsx from 'clsx'

/** A titled group of controls inside the right-hand panel. */
export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-ink-800 px-4 py-4">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">{title}</h3>
        {action}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

/** Label on the left, control on the right — the panel's standard row. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-[86px] shrink-0 text-xs text-ink-300 leading-tight">
        {label}
        {hint && <span className="block text-[10px] text-ink-400/70">{hint}</span>}
      </label>
      <div className="flex-1 min-w-0 flex items-center gap-2">{children}</div>
    </div>
  )
}

export function Slider({
  value, min, max, step = 1, suffix, onChange,
}: {
  value: number; min: number; max: number; step?: number; suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <>
      <input
        type="range"
        className="flex-1 min-w-0"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="w-[46px] shrink-0 text-right text-[11px] tabular-nums text-ink-300">
        {Number.isInteger(value) ? value : value.toFixed(step < 0.1 ? 2 : 1)}
        {suffix}
      </span>
    </>
  )
}

export function Segmented<T extends string>({
  value, options, onChange,
}: {
  value: T
  options: Array<{ value: T; label: ReactNode; title?: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="flex-1 flex rounded-lg bg-ink-900 border border-ink-800 p-0.5 gap-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={clsx(
            'flex-1 h-7 rounded-[6px] text-[11px] font-medium transition-colors flex items-center justify-center',
            value === o.value
              ? 'bg-ink-700 text-white shadow-sm'
              : 'text-ink-400 hover:text-ink-300 hover:bg-ink-850',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex-1 flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-9 shrink-0"
      />
      <input
        type="text"
        value={value.toUpperCase()}
        onChange={(e) => {
          const next = e.target.value.trim()
          if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next.toLowerCase())
        }}
        className="flex-1 min-w-0 h-7 px-2 rounded-md bg-ink-900 border border-ink-800 text-[11px] font-mono text-ink-300 focus:outline-none focus:border-ink-600"
      />
    </div>
  )
}

export function Select<T extends string>({
  value, options, onChange, className,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={clsx(
        'h-7 px-2 rounded-md bg-ink-900 border border-ink-800 text-xs text-ink-300',
        'focus:outline-none focus:border-ink-600 cursor-pointer',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-ink-850">
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand-500' : 'bg-ink-700',
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function Button({
  children, onClick, variant = 'ghost', size = 'md', disabled, title, className,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'ghost' | 'solid' | 'brand' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  title?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
        'disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap',
        size === 'sm' ? 'h-7 px-2.5 text-[11px]' : 'h-9 px-3.5 text-xs',
        variant === 'ghost' && 'text-ink-300 hover:bg-ink-800 hover:text-white',
        variant === 'solid' && 'bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-white border border-ink-700',
        variant === 'brand' && 'bg-brand-500 text-ink-950 hover:bg-brand-400',
        variant === 'danger' && 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/25',
        className,
      )}
    >
      {children}
    </button>
  )
}
