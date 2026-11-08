import { useEffect, useRef, useState } from 'react'
import {
  Folder,
  ListMusic,
  Plus,
  Check,
  ListPlus,
  Edit3,
  Trash2,
  ChevronRight,
  Music,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import type { Song } from '../../types/song'

interface Props {
  x: number
  y: number
  song: Song
  onClose: () => void
  onEditSong: (song: Song) => void
  onDeleteSong: (song: Song) => void
  onAddToRundown: (song: Song) => void
  onCreatePlaylist: (folderId: string | null) => void
}

export function SongContextMenu({
  x,
  y,
  song,
  onClose,
  onEditSong,
  onDeleteSong,
  onAddToRundown,
  onCreatePlaylist,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const songFolders = useAppStore((s) => s.songFolders)
  const songPlaylists = useAppStore((s) => s.songPlaylists)
  const addSongsToSongPlaylist = useAppStore((s) => s.addSongsToSongPlaylist)
  const removeSongFromSongPlaylist = useAppStore((s) => s.removeSongFromSongPlaylist)

  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  // Viewport bounds detection
  const menuWidth = 230
  const menuHeight = 240
  const left = Math.max(8, Math.min(x, window.innerWidth - menuWidth - 10))
  const top = Math.max(8, Math.min(y, window.innerHeight - menuHeight - 10))

  // Determine if submenu should open to the left or right
  const openSubmenuLeft = left + menuWidth + 210 > window.innerWidth

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

  const handleTogglePlaylist = async (playlistId: string, playlistName: string, currentlyIn: boolean) => {
    if (currentlyIn) {
      await removeSongFromSongPlaylist(playlistId, song.id)
      setFeedbackMsg(`Dikeluarkan dari "${playlistName}"`)
    } else {
      await addSongsToSongPlaylist(playlistId, [song.id])
      setFeedbackMsg(`Ditambahkan ke "${playlistName}"`)
    }

    setTimeout(() => {
      onClose()
    }, 600)
  }

  return (
    <div
      ref={menuRef}
      style={{ left, top }}
      className="fixed z-50 w-56 rounded-xl border border-ink-800 bg-ink-900/95 backdrop-blur-md shadow-2xl py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header Info */}
      <div className="px-3 py-2 border-b border-ink-800/80 bg-ink-950/60">
        <div className="flex items-center gap-1.5 text-ink-400 mb-0.5">
          <Music size={11} className="text-amber-400" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400">
            Pilihan Lagu
          </span>
        </div>
        <div className="font-semibold text-white truncate">{song.title}</div>
        {song.artist && <div className="text-[10px] text-ink-500 truncate">{song.artist}</div>}
      </div>

      {feedbackMsg ? (
        <div className="p-3 text-center text-xs text-amber-300 font-medium animate-in fade-in">
          {feedbackMsg}
        </div>
      ) : (
        <div className="py-1">
          {/* Submenu Item: Masukkan ke Playlist */}
          <div
            className="relative"
            onMouseEnter={() => setIsSubmenuOpen(true)}
            onMouseLeave={() => setIsSubmenuOpen(false)}
          >
            <button
              onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
              className="w-full px-3 py-2 flex items-center justify-between text-left text-ink-200 hover:text-white hover:bg-ink-800/80 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Folder size={14} className="text-amber-400 shrink-0" />
                <span>Masukkan ke Playlist</span>
              </div>
              <ChevronRight
                size={13}
                className={clsx(
                  'text-ink-500 group-hover:text-white transition-transform',
                  isSubmenuOpen && 'translate-x-0.5',
                )}
              />
            </button>

            {/* Nested Submenu */}
            {isSubmenuOpen && (
              <div
                className={clsx(
                  'absolute top-0 w-52 rounded-xl border border-ink-800 bg-ink-900/98 backdrop-blur-md shadow-2xl p-1 max-h-72 overflow-y-auto z-50 animate-in fade-in duration-100',
                  openSubmenuLeft ? 'right-full mr-1' : 'left-full ml-1',
                )}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-500 border-b border-ink-800/60 mb-1">
                  Pilih Playlist
                </div>

                {songFolders.length === 0 && songPlaylists.length === 0 ? (
                  <div className="p-3 text-center text-[11px] text-ink-500">
                    Belum ada playlist
                  </div>
                ) : (
                  <>
                    {/* Folders & Playlists */}
                    {songFolders.map((folder) => {
                      const playlists = songPlaylists.filter((p) => p.folderId === folder.id)
                      return (
                        <div key={folder.id} className="mb-1.5 last:mb-0">
                          <div className="px-2 py-0.5 text-[10px] font-semibold text-ink-400 flex items-center gap-1 truncate">
                            <Folder size={10} className="text-amber-400/80 shrink-0" />
                            <span className="truncate">{folder.name}</span>
                          </div>

                          {playlists.length === 0 ? (
                            <div className="pl-4 py-0.5 text-[10px] text-ink-600 italic">
                              (Kosong)
                            </div>
                          ) : (
                            playlists.map((playlist) => {
                              const isIn = playlist.songIds.includes(song.id)
                              return (
                                <button
                                  key={playlist.id}
                                  onClick={() =>
                                    handleTogglePlaylist(playlist.id, playlist.name, isIn)
                                  }
                                  className={clsx(
                                    'w-full pl-4 pr-2 py-1.5 rounded-lg flex items-center justify-between text-left text-xs transition-colors cursor-pointer',
                                    isIn
                                      ? 'text-amber-300 bg-amber-500/15 font-medium'
                                      : 'text-ink-300 hover:text-white hover:bg-ink-800/80',
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <ListMusic size={11} className="shrink-0 text-amber-400/80" />
                                    <span className="truncate">{playlist.name}</span>
                                  </div>
                                  {isIn && <Check size={12} className="text-amber-400 shrink-0" />}
                                </button>
                              )
                            })
                          )}
                        </div>
                      )
                    })}

                    {/* Standalone Playlists (root) */}
                    {songPlaylists.filter((p) => !p.folderId).map((playlist) => {
                      const isIn = playlist.songIds.includes(song.id)
                      return (
                        <button
                          key={playlist.id}
                          onClick={() => handleTogglePlaylist(playlist.id, playlist.name, isIn)}
                          className={clsx(
                            'w-full px-2 py-1.5 rounded-lg flex items-center justify-between text-left text-xs transition-colors cursor-pointer',
                            isIn
                              ? 'text-amber-300 bg-amber-500/15 font-medium'
                              : 'text-ink-300 hover:text-white hover:bg-ink-800/80',
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <ListMusic size={11} className="shrink-0 text-amber-400" />
                            <span className="truncate">{playlist.name}</span>
                          </div>
                          {isIn && <Check size={12} className="text-amber-400 shrink-0" />}
                        </button>
                      )
                    })}
                  </>
                )}

                <div className="border-t border-ink-800/80 pt-1 mt-1">
                  <button
                    onClick={() => {
                      onCreatePlaylist(null)
                      onClose()
                    }}
                    className="w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-medium text-amber-400 hover:text-amber-300 hover:bg-ink-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Buat Playlist Baru...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add to Live Rundown Queue */}
          <button
            onClick={() => {
              onAddToRundown(song)
              onClose()
            }}
            className="w-full px-3 py-2 flex items-center gap-2 text-left text-ink-200 hover:text-white hover:bg-ink-800/80 transition-colors cursor-pointer"
          >
            <ListPlus size={14} className="text-amber-400 shrink-0" />
            <span>Tambahkan ke Antrian</span>
          </button>

          {/* Edit Song */}
          <button
            onClick={() => {
              onEditSong(song)
              onClose()
            }}
            className="w-full px-3 py-2 flex items-center gap-2 text-left text-ink-200 hover:text-white hover:bg-ink-800/80 transition-colors cursor-pointer"
          >
            <Edit3 size={14} className="text-sky-400 shrink-0" />
            <span>Edit Lagu</span>
          </button>

          <div className="h-px bg-ink-800/80 my-1" />

          {/* Delete Song from Library */}
          <button
            onClick={() => {
              onDeleteSong(song)
              onClose()
            }}
            className="w-full px-3 py-2 flex items-center gap-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 size={14} className="shrink-0" />
            <span>Hapus dari Library</span>
          </button>
        </div>
      )}
    </div>
  )
}
