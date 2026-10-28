import { BookMarked, ListMusic, Paintbrush } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { LivePreview } from './LivePreview'
import { DesignPanel } from './DesignPanel'
import { PlaylistPanel } from './PlaylistPanel'
import { LibraryPanel } from './LibraryPanel'
import type { PanelTab } from '../../store/useAppStore'

const TABS: Array<{ id: PanelTab; label: string; icon: typeof Paintbrush }> = [
  { id: 'design', label: 'Tampilan', icon: Paintbrush },
  { id: 'playlist', label: 'Antrian', icon: ListMusic },
  { id: 'library', label: 'Alkitab', icon: BookMarked },
]

/** Preview stays pinned at the top; the tabs below it swap the working surface. */
export function RightPanel() {
  const panelTab = useAppStore((s) => s.panelTab)
  const setPanelTab = useAppStore((s) => s.setPanelTab)
  const playlistCount = useAppStore((s) => s.playlist.length)

  return (
    <aside className="w-[300px] xl:w-[348px] shrink-0 flex flex-col border-l border-ink-800 bg-ink-900 overflow-hidden">
      <LivePreview />

      <nav className="h-9 shrink-0 flex border-b border-ink-800 px-2 gap-1 items-center">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = panelTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setPanelTab(tab.id)}
              className={clsx(
                'h-7 px-2.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors',
                active ? 'bg-ink-800 text-white' : 'text-ink-400 hover:text-ink-300 hover:bg-ink-850',
              )}
            >
              <Icon size={12} />
              {tab.label}
              {tab.id === 'playlist' && playlistCount > 0 && (
                <span className="ml-0.5 text-[9px] tabular-nums bg-brand-500 text-ink-950 rounded-full px-1.5 font-bold">
                  {playlistCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {panelTab === 'design' && <DesignPanel />}
      {panelTab === 'playlist' && <PlaylistPanel />}
      {panelTab === 'library' && <LibraryPanel />}
    </aside>
  )
}
