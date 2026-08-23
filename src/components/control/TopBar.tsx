import { useEffect, useState } from 'react'
import { Search, CornerDownLeft } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { Select } from '../ui/controls'
import { OutputButton } from './OutputButton'

/**
 * The omnibox doubles as reference jump and full-text search.
 *
 * Typing something that parses as a reference ("yoh 3:16") and pressing Enter
 * navigates straight there; anything else searches the active translation. One
 * box means the operator never has to decide which field to use mid-service.
 */
export function TopBar() {
  const translations = useAppStore((s) => s.translations)
  const activeTranslationId = useAppStore((s) => s.activeTranslationId)
  const setTranslation = useAppStore((s) => s.setTranslation)
  const runSearch = useAppStore((s) => s.runSearch)
  const clearSearch = useAppStore((s) => s.clearSearch)
  const jumpToReference = useAppStore((s) => s.jumpToReference)

  const [query, setQuery] = useState('')
  const [flash, setFlash] = useState<'none' | 'miss'>('none')

  const installed = translations.filter((t) => t.installed)

  // Search as the operator types, but never on a reference-looking string —
  // those are meant for Enter, and searching them would only churn the list.
  useEffect(() => {
    const looksLikeReference = /\d/.test(query)
    if (looksLikeReference) return
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) runSearch(query)
      else clearSearch()
    }, 180)
    return () => clearTimeout(timer)
  }, [query, runSearch, clearSearch])

  async function onSubmit() {
    const value = query.trim()
    if (!value) return
    const jumped = await jumpToReference(value)
    if (jumped) {
      clearSearch()
      setQuery('')
    } else {
      await runSearch(value)
      setFlash('miss')
      setTimeout(() => setFlash('none'), 600)
    }
  }

  return (
    <header className="h-12 shrink-0 flex items-center gap-3 px-3 border-b border-ink-800 bg-ink-900">
      <div className="flex items-center gap-2 pr-1">
        <div className="h-6 w-6 rounded-md bg-brand-500 text-ink-950 grid place-items-center text-[11px] font-bold">
          BP
        </div>
        <span className="text-[13px] font-semibold tracking-tight">Bible Point</span>
      </div>

      <Select
        value={activeTranslationId}
        onChange={(id) => setTranslation(id)}
        options={installed.map((t) => ({ value: t.id, label: `${t.abbrev} — ${t.name}` }))}
        className="h-8 max-w-[210px]"
      />

      <div
        className={clsx(
          'relative flex-1 max-w-[520px] h-8 flex items-center rounded-lg border bg-ink-950 transition-colors',
          flash === 'miss' ? 'border-red-500/60' : 'border-ink-800 focus-within:border-ink-600',
        )}
      >
        <Search size={13} className="absolute left-2.5 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
            if (e.key === 'Escape') { setQuery(''); clearSearch() }
          }}
          placeholder="Cari kata atau ketik referensi — mis. yoh 3:16"
          className="w-full h-full bg-transparent pl-8 pr-16 text-xs text-white placeholder:text-ink-400 focus:outline-none"
        />
        <kbd className="absolute right-2 flex items-center gap-1 text-[9px] text-ink-400 border border-ink-700 rounded px-1 py-0.5">
          <CornerDownLeft size={9} /> jump
        </kbd>
      </div>

      <div className="flex-1" />

      <OutputButton />
    </header>
  )
}
