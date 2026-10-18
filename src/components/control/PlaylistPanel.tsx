import { ChevronDown, ChevronUp, ListMusic, Play, Trash2, Music, BookOpen } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/controls'

/**
 * The service order: verses and songs queued ahead of time so the operator is not
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
            Tambahkan ayat Alkitab atau lagu dari workspace untuk menyusun
            rundown ibadah Minggu sebelum mulai.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-9 shrink-0 flex items-center justify-between px-3 border-b border-ink-800">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          {playlist.length} item rundown
        </span>
        <Button size="sm" variant="ghost" onClick={clearPlaylist}>
          <Trash2 size={11} /> Kosongkan
        </Button>
      </div>

      <ol className="flex-1 overflow-y-auto p-2 space-y-1">
        {playlist.map((item, index) => {
          const active = item.id === activePlaylistId
          const isSong = item.kind === 'song' || Boolean(item.slides)
          const themeName = themes.find((t) => t.id === item.themeId)?.name

          return (
            <li
              key={item.id}
              className={clsx(
                'group rounded-lg border transition-colors',
                active
                  ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                  : 'bg-ink-900 border-ink-800 hover:border-ink-700',
              )}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                <span className="w-4 shrink-0 text-[10px] tabular-nums text-ink-400">{index + 1}</span>

                <div className="shrink-0">
                  {isSong ? (
                    <div className="w-6 h-6 rounded bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                      <Music size={11} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-blue-400/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
                      <BookOpen size={11} />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => projectPlaylistItem(item.id)}
                  className="flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={clsx('text-xs font-semibold truncate', active ? 'text-amber-300' : 'text-white')}>
                      {item.label}
                    </span>
                    <span className={clsx('text-[8px] font-bold uppercase tracking-wider px-1 py-0.2 rounded border', isSong ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-blue-500/10 text-blue-300 border-blue-500/30')}>
                      {isSong ? 'Lagu' : 'Alkitab'}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink-400 truncate mt-0.5">
                    {isSong
                      ? `${item.artist ? `${item.artist} · ` : ''}${item.slides?.length ?? 0} slide`
                      : `${item.verses?.length ?? 0} ayat${themeName ? ` · ${themeName}` : ''}`}
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
                  <Play size={12} className={active ? 'text-amber-400 fill-current' : 'text-brand-400'} />
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
