import { ChevronDown, ChevronUp, ListMusic, Play, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/controls'

/**
 * The service order: verses queued ahead of time so the operator is not
 * searching mid-sermon. Each entry remembers the theme it was queued with.
 */
export function PlaylistPanel() {
  const playlist = useAppStore((s) => s.playlist)
  const activePlaylistId = useAppStore((s) => s.activePlaylistId)
  const projectPlaylistItem = useAppStore((s) => s.projectPlaylistItem)
  const removeFromPlaylist = useAppStore((s) => s.removeFromPlaylist)
  const movePlaylistItem = useAppStore((s) => s.movePlaylistItem)
  const clearPlaylist = useAppStore((s) => s.clearPlaylist)
  const themes = useAppStore((s) => s.themes)

  if (playlist.length === 0) {
    return (
      <div className="flex-1 grid place-items-center px-8 text-center">
        <div>
          <ListMusic size={24} className="mx-auto text-ink-600 mb-3" />
          <p className="text-xs text-ink-300">Antrian masih kosong</p>
          <p className="mt-1.5 text-[11px] text-ink-400 leading-relaxed">
            Pilih ayat di daftar tengah, lalu tekan <b className="text-ink-300">Antrian</b> untuk
            menyusun urutan ibadah sebelum mulai.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-9 shrink-0 flex items-center justify-between px-3 border-b border-ink-800">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          {playlist.length} item
        </span>
        <Button size="sm" variant="ghost" onClick={clearPlaylist}>
          <Trash2 size={11} /> Kosongkan
        </Button>
      </div>

      <ol className="flex-1 overflow-y-auto p-2 space-y-1">
        {playlist.map((item, index) => {
          const active = item.id === activePlaylistId
          const themeName = themes.find((t) => t.id === item.themeId)?.name
          return (
            <li
              key={item.id}
              className={clsx(
                'group rounded-lg border transition-colors',
                active ? 'bg-red-500/10 border-red-500/35' : 'bg-ink-900 border-ink-800 hover:border-ink-700',
              )}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                <span className="w-4 shrink-0 text-[10px] tabular-nums text-ink-400">{index + 1}</span>
                <button
                  onClick={() => projectPlaylistItem(item.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className={clsx('text-xs font-medium truncate', active ? 'text-red-300' : 'text-white')}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-ink-400 truncate">
                    {item.verses.length} ayat{themeName ? ` · ${themeName}` : ''}
                  </div>
                </button>

                <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton title="Naik" onClick={() => movePlaylistItem(item.id, -1)}>
                    <ChevronUp size={12} />
                  </IconButton>
                  <IconButton title="Turun" onClick={() => movePlaylistItem(item.id, 1)}>
                    <ChevronDown size={12} />
                  </IconButton>
                  <IconButton title="Hapus" onClick={() => removeFromPlaylist(item.id)}>
                    <Trash2 size={11} />
                  </IconButton>
                </div>

                <IconButton title="Tayangkan" onClick={() => projectPlaylistItem(item.id)}>
                  <Play size={12} className={active ? 'text-red-400' : 'text-brand-400'} />
                </IconButton>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function IconButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="h-6 w-6 grid place-items-center rounded text-ink-400 hover:text-white hover:bg-ink-800 transition-colors"
    >
      {children}
    </button>
  )
}
