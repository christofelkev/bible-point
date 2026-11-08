import { useState, useMemo } from 'react'
import { X, Search, Check, Music } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import type { SongPlaylist } from '../../types/song'

interface Props {
  isOpen: boolean
  onClose: () => void
  playlist: SongPlaylist
}

export function AddSongsToPlaylistModal({ isOpen, onClose, playlist }: Props) {
  const songs = useAppStore((s) => s.songs)
  const reorderSongsInSongPlaylist = useAppStore((s) => s.reorderSongsInSongPlaylist)

  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(playlist.songIds))

  // Filter songs based on search query
  const filteredSongs = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return songs
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q),
    )
  }, [songs, query])

  if (!isOpen) return null

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleSave = async () => {
    // Preserve existing order of songs in playlist, append any newly selected songs
    const nextList: string[] = []
    for (const id of playlist.songIds) {
      if (selectedIds.has(id)) {
        nextList.push(id)
      }
    }
    for (const song of songs) {
      if (selectedIds.has(song.id) && !nextList.includes(song.id)) {
        nextList.push(song.id)
      }
    }

    await reorderSongsInSongPlaylist(playlist.id, nextList)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-ink-900 border border-ink-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm font-semibold text-white truncate">
              Pilih Lagu untuk Playlist
            </h2>
            <p className="text-xs text-ink-400 truncate">
              {playlist.name} ({selectedIds.size} lagu dipilih)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-ink-800 bg-ink-950/40">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul lagu atau artis..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-ink-950 border border-ink-800 text-xs text-white placeholder:text-ink-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Song List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSongs.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-500">
              {query ? 'Tidak ada lagu yang cocok dengan pencarian' : 'Belum ada lagu di library'}
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isChecked = selectedIds.has(song.id)
              return (
                <div
                  key={song.id}
                  onClick={() => toggleSelect(song.id)}
                  className={clsx(
                    'flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer select-none',
                    isChecked
                      ? 'bg-amber-500/15 border-amber-500/40 text-white'
                      : 'bg-ink-950/40 border-ink-800/60 text-ink-300 hover:bg-ink-800/40 hover:text-white',
                  )}
                >
                  <div
                    className={clsx(
                      'w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors border',
                      isChecked
                        ? 'bg-amber-500 border-amber-400 text-ink-950'
                        : 'border-ink-600 bg-ink-900',
                    )}
                  >
                    {isChecked && <Check size={11} strokeWidth={3} />}
                  </div>

                  <div className="shrink-0 text-ink-400">
                    <Music size={13} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{song.title}</div>
                    {song.artist && (
                      <div className="text-[10px] text-ink-500 truncate">{song.artist}</div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-ink-800 flex items-center justify-between bg-ink-950/60">
          <span className="text-xs text-ink-400">
            {selectedIds.size} dari {songs.length} lagu
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-ink-700 hover:bg-ink-800 text-xs text-ink-300 hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-ink-950 transition-colors cursor-pointer"
            >
              Simpan ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
