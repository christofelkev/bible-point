import { useState } from 'react'
import {
  Folder,
  FolderPlus,
  ListMusic,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Library,
  Layers,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { ItemPromptModal } from './ItemPromptModal'

export function SongPlaylistTree() {
  const songs = useAppStore((s) => s.songs)
  const songFolders = useAppStore((s) => s.songFolders)
  const songPlaylists = useAppStore((s) => s.songPlaylists)
  const selectedLibraryPlaylistId = useAppStore((s) => s.selectedLibraryPlaylistId)
  const setSelectedLibraryPlaylistId = useAppStore((s) => s.setSelectedLibraryPlaylistId)
  const expandedFolderIds = useAppStore((s) => s.expandedFolderIds)
  const toggleFolderExpanded = useAppStore((s) => s.toggleFolderExpanded)

  const createSongFolder = useAppStore((s) => s.createSongFolder)
  const renameSongFolder = useAppStore((s) => s.renameSongFolder)
  const deleteSongFolder = useAppStore((s) => s.deleteSongFolder)

  const createSongPlaylist = useAppStore((s) => s.createSongPlaylist)
  const renameSongPlaylist = useAppStore((s) => s.renameSongPlaylist)
  const deleteSongPlaylist = useAppStore((s) => s.deleteSongPlaylist)

  // Modals state
  const [promptState, setPromptState] = useState<{
    isOpen: boolean
    type: 'createFolder' | 'renameFolder' | 'createPlaylist' | 'renamePlaylist'
    targetId?: string
    folderId?: string | null
    title: string
    initialValue?: string
  }>({
    isOpen: false,
    type: 'createFolder',
    title: '',
  })

  // Collapsible entire section toggle
  const [isSectionOpen, setIsSectionOpen] = useState(true)

  const handleOpenCreateFolder = () => {
    setPromptState({
      isOpen: true,
      type: 'createFolder',
      title: 'Buat Folder Baru',
      initialValue: '',
    })
  }

  const handleOpenRenameFolder = (id: string, currentName: string) => {
    setPromptState({
      isOpen: true,
      type: 'renameFolder',
      targetId: id,
      title: 'Ubah Nama Folder',
      initialValue: currentName,
    })
  }

  const handleDeleteFolder = (id: string, name: string) => {
    if (
      window.confirm(
        `Hapus folder "${name}" beserta semua playlist di dalamnya?\n(Lagu di master library tidak akan terhapus)`,
      )
    ) {
      void deleteSongFolder(id)
    }
  }

  const handleOpenCreatePlaylist = (folderId: string | null = null, folderName?: string) => {
    setPromptState({
      isOpen: true,
      type: 'createPlaylist',
      folderId,
      title: folderName ? `Playlist Baru di "${folderName}"` : 'Buat Playlist Baru',
      initialValue: '',
    })
  }

  const handleOpenRenamePlaylist = (id: string, currentName: string) => {
    setPromptState({
      isOpen: true,
      type: 'renamePlaylist',
      targetId: id,
      title: 'Ubah Nama Playlist',
      initialValue: currentName,
    })
  }

  const handleDeletePlaylist = (id: string, name: string) => {
    if (
      window.confirm(
        `Hapus playlist "${name}"?\n(Lagu di master library tidak akan terhapus)`,
      )
    ) {
      void deleteSongPlaylist(id)
    }
  }

  const handlePromptSubmit = async (val: string) => {
    if (promptState.type === 'createFolder') {
      await createSongFolder(val)
    } else if (promptState.type === 'renameFolder' && promptState.targetId) {
      await renameSongFolder(promptState.targetId, val)
    } else if (promptState.type === 'createPlaylist') {
      await createSongPlaylist(val, promptState.folderId)
    } else if (promptState.type === 'renamePlaylist' && promptState.targetId) {
      await renameSongPlaylist(promptState.targetId, val)
    }
  }

  // Find active playlist and folder name for compact bar
  const activePlaylist = songPlaylists.find((p) => p.id === selectedLibraryPlaylistId)
  const activeFolder = activePlaylist?.folderId
    ? songFolders.find((f) => f.id === activePlaylist.folderId)
    : null

  return (
    <div className="border-b border-ink-800 bg-ink-950/70 flex flex-col">
      {/* Section Header */}
      <div className="h-8 px-2.5 flex items-center justify-between border-b border-ink-800/60 bg-ink-950/90 select-none">
        <button
          onClick={() => setIsSectionOpen(!isSectionOpen)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-300 hover:text-white transition-colors cursor-pointer"
        >
          {isSectionOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <Layers size={12} className="text-amber-400" />
          <span>FOLDER & PLAYLIST</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenCreateFolder}
            title="Buat Folder Baru (misal: Umum, Sekolah Minggu)"
            className="h-6 px-1.5 rounded text-[10px] font-medium flex items-center gap-1 text-ink-300 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <FolderPlus size={11} className="text-amber-400" />
            <span>Folder</span>
          </button>
          <button
            onClick={() => handleOpenCreatePlaylist(null)}
            title="Buat Playlist Mandiri"
            className="h-6 px-1.5 rounded text-[10px] font-medium flex items-center gap-1 text-ink-300 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <Plus size={11} className="text-amber-400" />
            <span>Playlist</span>
          </button>
        </div>
      </div>

      {/* When section is collapsed: compact status indicator */}
      {!isSectionOpen && (
        <div
          onClick={() => setIsSectionOpen(true)}
          className="px-2.5 py-1.5 flex items-center justify-between text-xs text-ink-300 hover:bg-ink-900/50 cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5 truncate">
            {selectedLibraryPlaylistId === null ? (
              <>
                <Library size={12} className="text-amber-400 shrink-0" />
                <span className="font-semibold text-white truncate">Semua Lagu</span>
                <span className="text-[10px] text-ink-500">({songs.length})</span>
              </>
            ) : (
              <>
                <ListMusic size={12} className="text-amber-400 shrink-0" />
                <span className="text-ink-400 truncate">
                  {activeFolder ? `${activeFolder.name} / ` : ''}
                </span>
                <span className="font-semibold text-white truncate">
                  {activePlaylist?.name}
                </span>
                <span className="text-[10px] text-ink-500">
                  ({activePlaylist?.songIds.length ?? 0})
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] text-ink-500 hover:text-amber-400">Buka</span>
        </div>
      )}

      {/* Expanded Tree List */}
      {isSectionOpen && (
        <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5 text-xs">
          {/* Master Library Item */}
          <div
            onClick={() => setSelectedLibraryPlaylistId(null)}
            className={clsx(
              'group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors',
              selectedLibraryPlaylistId === null
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-ink-300 hover:bg-ink-850 hover:text-white',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Library size={13} className="shrink-0 text-amber-400" />
              <span className="truncate">Semua Lagu</span>
            </div>
            <span className="text-[10px] font-mono text-ink-400 tabular-nums">
              {songs.length}
            </span>
          </div>

          {/* Folder List */}
          {songFolders.map((folder) => {
            const isExpanded = expandedFolderIds.includes(folder.id)
            const folderPlaylists = songPlaylists.filter((p) => p.folderId === folder.id)

            return (
              <div key={folder.id} className="space-y-0.5">
                {/* Folder Row */}
                <div
                  className="group flex items-center justify-between px-1.5 py-1 rounded-md text-ink-300 hover:bg-ink-850 hover:text-white transition-colors"
                >
                  <div
                    onClick={() => toggleFolderExpanded(folder.id)}
                    className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <button
                      type="button"
                      className="p-0.5 text-ink-400 hover:text-white cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    <Folder size={13} className="text-amber-400/80 shrink-0" />
                    <span className="font-medium truncate">{folder.name}</span>
                    <span className="text-[10px] text-ink-500">({folderPlaylists.length})</span>
                  </div>

                  {/* Actions on Folder hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenCreatePlaylist(folder.id, folder.name)}
                      title={`Tambah Playlist ke ${folder.name}`}
                      className="p-1 rounded text-ink-400 hover:text-amber-300 hover:bg-ink-800 transition-colors cursor-pointer"
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      onClick={() => handleOpenRenameFolder(folder.id, folder.name)}
                      title="Ubah Nama Folder"
                      className="p-1 rounded text-ink-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id, folder.name)}
                      title="Hapus Folder"
                      className="p-1 rounded text-ink-400 hover:text-rose-400 hover:bg-ink-800 transition-colors cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Indented Playlist Items inside this Folder */}
                {isExpanded && (
                  <div className="pl-4 space-y-0.5 border-l border-ink-800/60 ml-2.5">
                    {folderPlaylists.length === 0 ? (
                      <div className="py-1 px-2 text-[10px] text-ink-500 italic">
                        Belum ada playlist.{' '}
                        <button
                          onClick={() => handleOpenCreatePlaylist(folder.id, folder.name)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                    ) : (
                      folderPlaylists.map((playlist) => {
                        const isSelected = selectedLibraryPlaylistId === playlist.id
                        return (
                          <div
                            key={playlist.id}
                            className={clsx(
                              'group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors',
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                                : 'text-ink-400 hover:bg-ink-850 hover:text-white',
                            )}
                          >
                            <div
                              onClick={() => setSelectedLibraryPlaylistId(playlist.id)}
                              className="flex items-center gap-1.5 min-w-0 flex-1"
                            >
                              <ListMusic size={12} className="shrink-0 text-amber-400/80" />
                              <span className="truncate">{playlist.name}</span>
                              <span className="text-[10px] text-ink-500 tabular-nums">
                                ({playlist.songIds.length})
                              </span>
                            </div>

                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenRenamePlaylist(playlist.id, playlist.name)
                                }}
                                title="Ubah Nama Playlist"
                                className="p-1 rounded text-ink-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeletePlaylist(playlist.id, playlist.name)
                                }}
                                title="Hapus Playlist"
                                className="p-1 rounded text-ink-400 hover:text-rose-400 hover:bg-ink-800 transition-colors cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Root/Standalone Playlists (not in any folder) */}
          {songPlaylists
            .filter((p) => !p.folderId)
            .map((playlist) => {
              const isSelected = selectedLibraryPlaylistId === playlist.id
              return (
                <div
                  key={playlist.id}
                  className={clsx(
                    'group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-ink-400 hover:bg-ink-850 hover:text-white',
                  )}
                >
                  <div
                    onClick={() => setSelectedLibraryPlaylistId(playlist.id)}
                    className="flex items-center gap-1.5 min-w-0 flex-1"
                  >
                    <ListMusic size={12} className="shrink-0 text-amber-400" />
                    <span className="truncate">{playlist.name}</span>
                    <span className="text-[10px] text-ink-500 tabular-nums">
                      ({playlist.songIds.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenRenamePlaylist(playlist.id, playlist.name)
                      }}
                      title="Ubah Nama Playlist"
                      className="p-1 rounded text-ink-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePlaylist(playlist.id, playlist.name)
                      }}
                      title="Hapus Playlist"
                      className="p-1 rounded text-ink-400 hover:text-rose-400 hover:bg-ink-800 transition-colors cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )
            })}

          {/* Empty state hint */}
          {songFolders.length === 0 && songPlaylists.length === 0 && (
            <div className="py-2 px-2 text-[11px] text-ink-500 text-center">
              Belum ada folder ibadah.{' '}
              <button
                onClick={handleOpenCreateFolder}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                + Buat Folder
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prompt Modal */}
      <ItemPromptModal
        isOpen={promptState.isOpen}
        title={promptState.title}
        initialValue={promptState.initialValue}
        placeholder="Masukkan nama..."
        onClose={() => setPromptState((s) => ({ ...s, isOpen: false }))}
        onSubmit={handlePromptSubmit}
      />
    </div>
  )
}
