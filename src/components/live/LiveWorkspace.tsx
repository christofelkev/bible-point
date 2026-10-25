import { useState } from 'react'
import {
  Music,
  Plus,
  Radio,
  Play,
  Edit3,
  Trash2,
  ListPlus,
  Presentation,
  FileText,
  Upload,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import type { ProjectionSlide } from '../../types/projection'
import type { Song } from '../../types/song'
import { SongEditorModal } from './SongEditorModal'
import { MediaBinPanel } from './MediaBinPanel'
import { ImportPresentationModal } from './ImportPresentationModal'
import { SectionContextMenu } from './SectionContextMenu'
import { getGroupColorClasses } from '../../data/songHotkeys'
import { applySectionTag, removeSectionStart, serializeSlidesToRawLyrics } from '../../services/songs/lyricParser'

export function LiveWorkspace() {
  const presentationSubTab = useAppStore((s) => s.presentationSubTab)
  const setPresentationSubTab = useAppStore((s) => s.setPresentationSubTab)

  // Songs store
  const songs = useAppStore((s) => s.songs)
  const activeSongId = useAppStore((s) => s.activeSongId)
  const setActiveSongId = useAppStore((s) => s.setActiveSongId)
  const saveSong = useAppStore((s) => s.saveSong)
  const deleteSong = useAppStore((s) => s.deleteSong)
  const addSongToPlaylist = useAppStore((s) => s.addSongToPlaylist)
  const sectionHotkeys = useAppStore((s) => s.sectionHotkeys)

  // Presentations store
  const presentations = useAppStore((s) => s.presentations)
  const activeDeckId = useAppStore((s) => s.activeDeckId)
  const setActiveDeckId = useAppStore((s) => s.setActiveDeckId)
  const saveDeck = useAppStore((s) => s.saveDeck)
  const deleteDeck = useAppStore((s) => s.deleteDeck)
  const addDeckToPlaylist = useAppStore((s) => s.addDeckToPlaylist)

  // Modals & local state
  const [songSearch, setSongSearch] = useState('')
  const [deckSearch, setDeckSearch] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    slideIndex: number
  } | null>(null)

  // Live state
  const liveSlide = useAppStore((s) => s.liveSlide)
  const activeLiveSlideIndex = useAppStore((s) => s.activeLiveSlideIndex)
  const mode = useAppStore((s) => s.mode)
  const goLiveSlide = useAppStore((s) => s.goLiveSlide)

  const activeSong = songs.find((s) => s.id === activeSongId) ?? songs[0]
  const activeDeck = presentations.find((d) => d.id === activeDeckId) ?? presentations[0]

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      s.artist.toLowerCase().includes(songSearch.toLowerCase()),
  )

  const filteredDecks = presentations.filter(
    (d) =>
      d.title.toLowerCase().includes(deckSearch.toLowerCase()) ||
      d.sourceFileName.toLowerCase().includes(deckSearch.toLowerCase()),
  )

  // Mapped presentation slides for live output
  const activeDeckSlides: ProjectionSlide[] = activeDeck
    ? activeDeck.slides.map((s, idx) => ({
        kind: 'presentation',
        lines: [],
        imageUrl: s.imageUrl,
        imagePath: s.imagePath,
        badge: s.badge ?? `Slide ${idx + 1}`,
        reference: activeDeck.title,
        slideProgress: `${idx + 1} / ${activeDeck.slides.length}`,
      }))
    : []

  const isSlideLive = (slide: ProjectionSlide, index: number) => {
    if (mode !== 'live' || !liveSlide) return false
    if (activeLiveSlideIndex !== index) return false
    if (slide.imageUrl && liveSlide.imageUrl) {
      return slide.imageUrl === liveSlide.imageUrl
    }
    return liveSlide.lines.join('|') === slide.lines.join('|')
  }

  const handleOpenAddSong = () => {
    setEditingSong(null)
    setIsEditorOpen(true)
  }

  const handleOpenEditSong = () => {
    if (!activeSong) return
    setEditingSong(activeSong)
    setIsEditorOpen(true)
  }

  const handleDeleteActiveSong = () => {
    if (!activeSong) return
    if (window.confirm(`Hapus lagu "${activeSong.title}"?`)) {
      void deleteSong(activeSong.id)
    }
  }

  const handleDeleteActiveDeck = () => {
    if (!activeDeck) return
    if (window.confirm(`Hapus presentasi "${activeDeck.title}" dan seluruh gambarnya?`)) {
      void deleteDeck(activeDeck.id)
    }
  }

  const handleSelectGroup = (groupName: string) => {
    if (!contextMenu || !activeSong) return
    const newSlides = applySectionTag(activeSong.slides, contextMenu.slideIndex, groupName)
    const updatedSong: Song = {
      ...activeSong,
      slides: newSlides,
      rawLyrics: serializeSlidesToRawLyrics(newSlides),
      updatedAt: new Date().toISOString(),
    }
    void saveSong(updatedSong)

    if (mode === 'live' && activeLiveSlideIndex >= 0 && activeLiveSlideIndex < newSlides.length) {
      goLiveSlide(newSlides[activeLiveSlideIndex], newSlides, activeLiveSlideIndex)
    }
  }

  const handleRemoveSectionStart = () => {
    if (!contextMenu || !activeSong) return
    const newSlides = removeSectionStart(activeSong.slides, contextMenu.slideIndex)
    const updatedSong: Song = {
      ...activeSong,
      slides: newSlides,
      rawLyrics: serializeSlidesToRawLyrics(newSlides),
      updatedAt: new Date().toISOString(),
    }
    void saveSong(updatedSong)

    if (mode === 'live' && activeLiveSlideIndex >= 0 && activeLiveSlideIndex < newSlides.length) {
      goLiveSlide(newSlides[activeLiveSlideIndex], newSlides, activeLiveSlideIndex)
    }
  }

  return (
    <div className="flex-1 min-h-0 flex bg-ink-950 text-white">
      {/* Kolom Kiri: Library (Lagu / Presentasi Switcher) */}
      <div className="w-72 shrink-0 border-r border-ink-800 flex flex-col bg-ink-900/60">
        {/* Sub-Tab Selector: [ Lagu ] [ Presentasi ] */}
        <div className="p-2 border-b border-ink-800 flex gap-1 bg-ink-950/40">
          <button
            onClick={() => setPresentationSubTab('songs')}
            className={clsx(
              'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer',
              presentationSubTab === 'songs'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                : 'text-ink-400 hover:text-white hover:bg-ink-800/60',
            )}
          >
            <Music size={13} />
            <span>Lagu ({songs.length})</span>
          </button>
          <button
            onClick={() => setPresentationSubTab('presentations')}
            className={clsx(
              'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer',
              presentationSubTab === 'presentations'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-xs'
                : 'text-ink-400 hover:text-white hover:bg-ink-800/60',
            )}
          >
            <Presentation size={13} />
            <span>Presentasi ({presentations.length})</span>
          </button>
        </div>

        {/* Mode Lagu */}
        {presentationSubTab === 'songs' ? (
          <>
            <div className="p-2 border-b border-ink-800">
              <input
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                placeholder="Cari lagu..."
                className="w-full h-7 rounded bg-ink-950 border border-ink-800 px-2 text-xs placeholder:text-ink-500 focus:outline-none focus:border-ink-600"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredSongs.length === 0 ? (
                <div className="p-4 text-center text-xs text-ink-500">
                  {songSearch ? 'Lagu tidak ditemukan' : 'Belum ada lagu'}
                </div>
              ) : (
                filteredSongs.map((song) => {
                  const isSelected = song.id === activeSong?.id
                  return (
                    <button
                      key={song.id}
                      onClick={() => setActiveSongId(song.id)}
                      className={clsx(
                        'w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer group',
                        isSelected
                          ? 'bg-ink-800/90 border-amber-500/50 text-white shadow-sm'
                          : 'bg-ink-900/40 border-ink-800/80 text-ink-300 hover:bg-ink-850 hover:text-white',
                      )}
                    >
                      <div className="text-xs font-semibold truncate">
                        {song.title}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="p-2.5 border-t border-ink-800">
              <button
                onClick={handleOpenAddSong}
                className="w-full h-8 rounded-lg bg-ink-800 hover:bg-ink-700 text-xs font-medium flex items-center justify-center gap-1.5 text-ink-200 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Tambah Lagu</span>
              </button>
            </div>
          </>
        ) : (
          /* Mode Presentasi */
          <>
            <div className="p-2 border-b border-ink-800">
              <input
                value={deckSearch}
                onChange={(e) => setDeckSearch(e.target.value)}
                placeholder="Cari presentasi..."
                className="w-full h-7 rounded bg-ink-950 border border-ink-800 px-2 text-xs placeholder:text-ink-500 focus:outline-none focus:border-ink-600"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredDecks.length === 0 ? (
                <div className="p-4 text-center text-xs text-ink-500">
                  {deckSearch ? 'Presentasi tidak ditemukan' : 'Belum ada presentasi'}
                </div>
              ) : (
                filteredDecks.map((deck) => {
                  const isSelected = deck.id === activeDeck?.id
                  return (
                    <button
                      key={deck.id}
                      onClick={() => setActiveDeckId(deck.id)}
                      className={clsx(
                        'w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer group',
                        isSelected
                          ? 'bg-ink-800/90 border-amber-500/50 text-white shadow-sm'
                          : 'bg-ink-900/40 border-ink-800/80 text-ink-300 hover:bg-ink-850 hover:text-white',
                      )}
                    >
                      <div className="text-xs font-semibold truncate">
                        {deck.title}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="p-2.5 border-t border-ink-800">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="w-full h-8 rounded-lg bg-ink-800 hover:bg-ink-700 text-xs font-medium flex items-center justify-center gap-1.5 text-ink-200 transition-colors cursor-pointer"
              >
                <Upload size={13} />
                <span>Import File</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Kolom Tengah: Slide Matrix / Grid Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-ink-950">
        {presentationSubTab === 'songs' ? (
          /* Tampilan Slide Lagu */
          !activeSong ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-500">
              <Music size={32} className="text-ink-600 mb-2" />
              <p className="text-sm font-semibold text-ink-300">Belum Ada Lagu Dipilih</p>
              <p className="text-xs text-ink-500 mt-1 max-w-sm">
                Pilih lagu dari daftar di sebelah kiri atau klik Tambah Lagu untuk memulai.
              </p>
              <button
                onClick={handleOpenAddSong}
                className="mt-4 px-4 h-8 rounded-lg bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Tambah Lagu Baru</span>
              </button>
            </div>
          ) : (
            <>
              {/* Header Lagu Aktif */}
              <div className="px-5 py-3 border-b border-ink-800 flex items-center justify-between bg-ink-900/40">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {activeSong.title}
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenEditSong}
                    title="Edit Lagu"
                    className="h-8 px-2.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-ink-700/60"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeSong) addSongToPlaylist(activeSong)
                    }}
                    title="Tambahkan lagu ini ke antrian ibadah"
                    className="h-8 px-2.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-ink-700/60"
                  >
                    <ListPlus size={13} />
                    <span>Antrian</span>
                  </button>

                  <button
                    onClick={handleDeleteActiveSong}
                    title="Hapus Lagu"
                    className="h-8 w-8 rounded-lg bg-ink-800 hover:bg-red-950/40 text-ink-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer border border-ink-700/60"
                  >
                    <Trash2 size={13} />
                  </button>

                  <button
                    onClick={() => {
                      if (activeSong.slides.length > 0) {
                        goLiveSlide(activeSong.slides[0], activeSong.slides, 0)
                      }
                    }}
                    className="h-8 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Play size={12} className="fill-current" />
                    <span>Mulai dari Awal</span>
                  </button>
                </div>
              </div>

              {/* Slide Grid / Matrix Lagu */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {activeSong.slides.map((slide, index) => {
                    const live = isSlideLive(slide, index)
                    const badgeStyle = getGroupColorClasses(slide.badge)
                    const hotkey = sectionHotkeys[slide.badge ?? '']

                    return (
                      <div
                        key={index}
                        onClick={() => goLiveSlide(slide, activeSong.slides, index)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            slideIndex: index,
                          })
                        }}
                        className={clsx(
                          'relative rounded-xl border p-4 flex flex-col justify-between transition-all cursor-pointer aspect-video select-none group',
                          live
                            ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                            : 'border-ink-800 bg-ink-900/50 hover:border-ink-600 hover:bg-ink-900',
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span
                            className={clsx(
                              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1.5',
                              badgeStyle,
                            )}
                          >
                            <span>{slide.badge ?? `Slide ${index + 1}`}</span>
                            {hotkey && (
                              <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 border border-white/20 text-white font-bold">
                                {hotkey}
                              </kbd>
                            )}
                          </span>

                          {live && (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                              <Radio size={9} /> Live
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-center text-center px-1 overflow-hidden">
                          {slide.lines.map((line, lIdx) => (
                            <div
                              key={lIdx}
                              className={clsx(
                                'text-xs leading-snug line-clamp-2',
                                live ? 'text-white font-semibold' : 'text-ink-300 group-hover:text-ink-100',
                              )}
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Media Bin: Panel Ganti Latar Belakang Live */}
              <MediaBinPanel />
            </>
          )
        ) : (
          /* Tampilan Slide Presentasi */
          !activeDeck ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-500">
              <Presentation size={36} className="text-ink-600 mb-2" />
              <p className="text-sm font-semibold text-ink-300">Belum Ada Presentasi Dipilih</p>
              <p className="text-xs text-ink-500 mt-1 max-w-sm">
                Pilih presentasi dari daftar atau klik tombol di bawah untuk mengimpor berkas PDF atau PowerPoint.
              </p>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="mt-4 px-4 h-8 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Upload size={13} />
                <span>Import Presentasi (PDF / PPTX)</span>
              </button>
            </div>
          ) : (
            <>
              {/* Header Presentasi Aktif */}
              <div className="px-5 py-3 border-b border-ink-800 flex items-center justify-between bg-ink-900/40">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {activeDeck.title}
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeDeck) addDeckToPlaylist(activeDeck)
                    }}
                    title="Tambahkan presentasi ini ke antrian ibadah"
                    className="h-8 px-2.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-ink-700/60"
                  >
                    <ListPlus size={13} />
                    <span>Antrian</span>
                  </button>

                  <button
                    onClick={handleDeleteActiveDeck}
                    title="Hapus Presentasi"
                    className="h-8 w-8 rounded-lg bg-ink-800 hover:bg-red-950/40 text-ink-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer border border-ink-700/60"
                  >
                    <Trash2 size={13} />
                  </button>

                  <button
                    onClick={() => {
                      if (activeDeckSlides.length > 0) {
                        goLiveSlide(activeDeckSlides[0], activeDeckSlides, 0)
                      }
                    }}
                    className="h-8 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Play size={12} className="fill-current" />
                    <span>Mulai dari Awal</span>
                  </button>
                </div>
              </div>

              {/* Slide Grid / Matrix Presentasi */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {activeDeckSlides.map((slide, index) => {
                    const live = isSlideLive(slide, index)

                    return (
                      <div
                        key={index}
                        onClick={() => goLiveSlide(slide, activeDeckSlides, index)}
                        className={clsx(
                          'relative rounded-xl border flex flex-col justify-between transition-all cursor-pointer aspect-video select-none group overflow-hidden bg-black',
                          live
                            ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10'
                            : 'border-ink-800 hover:border-ink-600',
                        )}
                      >
                        {/* Slide Image Preview */}
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                          {slide.imageUrl ? (
                            <img
                              src={slide.imageUrl}
                              alt=""
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="text-ink-600 flex items-center justify-center">
                              <FileText size={28} />
                            </div>
                          )}
                        </div>

                        {/* Top Minimal Index */}
                        <div className="relative z-10 p-2 flex items-center justify-between w-full pointer-events-none">
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/60 text-white/90 backdrop-blur-xs">
                            {index + 1}
                          </span>

                          {live && (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-black/80 px-1.5 py-0.5 rounded border border-amber-400/50">
                              <Radio size={9} /> Live
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Media Bin: Panel Ganti Latar Belakang Live */}
              <MediaBinPanel />
            </>
          )
        )}
      </div>

      {/* Modal Editor Lagu */}
      <SongEditorModal
        isOpen={isEditorOpen}
        song={editingSong}
        onClose={() => setIsEditorOpen(false)}
        onSave={(saved) => {
          void saveSong(saved)
        }}
      />

      {/* Modal Import Presentasi (PDF / PPTX) */}
      <ImportPresentationModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(deck) => {
          void saveDeck(deck)
        }}
      />

      {/* Context Menu Tag Seksi Lagu */}
      {contextMenu && activeSong && (
        <SectionContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetIndex={contextMenu.slideIndex}
          currentBadge={activeSong.slides[contextMenu.slideIndex]?.badge}
          isSectionStart={activeSong.slides[contextMenu.slideIndex]?.isSectionStart}
          onSelectGroup={handleSelectGroup}
          onRemoveSectionStart={handleRemoveSectionStart}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
