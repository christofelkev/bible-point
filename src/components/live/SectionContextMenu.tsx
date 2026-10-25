import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { DEFAULT_SONG_GROUPS } from '../../data/songHotkeys'

interface Props {
  x: number
  y: number
  targetIndex: number
  currentBadge?: string
  isSectionStart?: boolean
  onSelectGroup: (groupName: string) => void
  onRemoveSectionStart?: () => void
  onClose: () => void
}

export function SectionContextMenu({
  x,
  y,
  targetIndex,
  currentBadge,
  isSectionStart,
  onSelectGroup,
  onRemoveSectionStart,
  onClose,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const sectionHotkeys = useAppStore((s) => s.sectionHotkeys)

  // Keep menu within viewport
  const left = Math.max(8, Math.min(x, window.innerWidth - 210))
  const top = Math.max(8, Math.min(y, window.innerHeight - 380))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const dotColors: Record<string, string> = {
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    purple: 'bg-purple-400',
    yellow: 'bg-yellow-400',
    emerald: 'bg-emerald-400',
    slate: 'bg-slate-400',
    rose: 'bg-rose-400',
  }

  return (
    <div
      ref={menuRef}
      style={{ left, top }}
      className="fixed z-50 w-52 bg-ink-950/95 backdrop-blur-md border border-ink-800 rounded-xl shadow-2xl p-1.5 text-xs select-none"
    >
      <div className="px-2 py-1 text-[10px] font-bold text-ink-500 uppercase tracking-wider">
        Tentukan Seksi
      </div>

      <div className="space-y-0.5">
        {DEFAULT_SONG_GROUPS.map((group) => {
          const isSelected = currentBadge === group.name && isSectionStart
          const hotkey = sectionHotkeys[group.name] ?? group.defaultKey

          return (
            <button
              key={group.name}
              onClick={() => {
                onSelectGroup(group.name)
                onClose()
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-ink-800 text-white font-semibold'
                  : 'text-ink-300 hover:text-white hover:bg-ink-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dotColors[group.color] ?? 'bg-ink-500'}`} />
                <span>{group.name}</span>
              </div>
              {hotkey && (
                <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ink-900 border border-ink-700/80 text-ink-400 font-bold">
                  {hotkey}
                </kbd>
              )}
            </button>
          )
        })}
      </div>

      {targetIndex > 0 && onRemoveSectionStart && (
        <>
          <div className="my-1 border-t border-ink-800/80" />
          <button
            onClick={() => {
              onRemoveSectionStart()
              onClose()
            }}
            className="w-full px-2.5 py-1.5 text-left rounded-lg text-ink-400 hover:text-ink-200 hover:bg-ink-900 transition-colors cursor-pointer text-[11px]"
          >
            Gabung ke seksi sebelumnya
          </button>
        </>
      )}
    </div>
  )
}
