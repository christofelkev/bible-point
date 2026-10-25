import { useState, useMemo } from 'react'
import { X, Music, Check, ListMusic } from 'lucide-react'
import type { Song } from '../../types/song'
import {
  parseRawLyrics,
  compileSongSlides,
  applySectionTag,
  removeSectionStart,
  serializeSlidesToRawLyrics,
} from '../../services/songs/lyricParser'
import { SectionContextMenu } from './SectionContextMenu'
import { getGroupColorClasses } from '../../data/songHotkeys'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  song?: Song | null
  isOpen: boolean
  onClose: () => void
  onSave: (song: Song) => void
}

export function SongEditorModal({ song, isOpen, onClose, onSave }: Props) {
  const isEditing = Boolean(song)
  const sectionHotkeys = useAppStore((s) => s.sectionHotkeys)

  const [title, setTitle] = useState(song?.title ?? '')
  const [rawLyrics, setRawLyrics] = useState(
    song?.rawLyrics ??
      song?.slides.map((s) => `[${s.badge ?? 'Verse 1'}]\n${s.lines.join('\n')}`).join('\n\n') ??
      '',
  )
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    slideIndex: number
  } | null>(null)

  const parsedSections = useMemo(() => parseRawLyrics(rawLyrics), [rawLyrics])
  const previewSlides = useMemo(
    () =>
      compileSongSlides(
        parsedSections,
        { title: title || 'Judul Lagu', artist: '', key: '', ccli: '' },
        '',
      ),
    [parsedSections, title],
  )

  const handleSelectGroup = (groupName: string) => {
    if (!contextMenu) return
    const newSlides = applySectionTag(previewSlides, contextMenu.slideIndex, groupName)
    setRawLyrics(serializeSlidesToRawLyrics(newSlides))
  }

  const handleRemoveSectionStart = () => {
    if (!contextMenu) return
    const newSlides = removeSectionStart(previewSlides, contextMenu.slideIndex)
    setRawLyrics(serializeSlidesToRawLyrics(newSlides))
  }

  const handleSave = () => {
    if (!title.trim()) return

    const newSong: Song = {
      id: song?.id ?? `song-${Date.now()}`,
      title: title.trim(),
      artist: '',
      key: '',
      tempo: 0,
      arrangement: '',
      ccli: '',
      rawLyrics,
      slides: previewSlides,
      updatedAt: new Date().toISOString(),
      createdAt: song?.createdAt ?? new Date().toISOString(),
    }

    onSave(newSong)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-ink-950 border border-ink-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-ink-100">
        <div className="px-6 py-4 border-b border-ink-800 flex items-center justify-between bg-ink-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Music size={16} />
            </div>
            <h2 className="text-sm font-bold text-white">
              {isEditing ? `Edit Lagu: ${song?.title}` : 'Tambah Lagu'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/2 p-5 border-b md:border-b-0 md:border-r border-ink-800 overflow-y-auto space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1.5">
                Judul Lagu
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul lagu..."
                className="w-full h-9 px-3 rounded-lg bg-ink-900 border border-ink-800 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-amber-400/70"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-semibold text-ink-300 mb-1.5">
                Teks Lirik
              </label>
              <textarea
                rows={16}
                value={rawLyrics}
                onChange={(e) => setRawLyrics(e.target.value)}
                placeholder="Tempel atau ketik lirik di sini..."
                className="w-full p-3 rounded-lg bg-ink-900 border border-ink-800 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-amber-400/70 font-mono leading-relaxed"
              />
            </div>
          </div>

          <div className="w-full md:w-1/2 p-5 bg-ink-950 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-ink-800 mb-3">
              <div className="flex items-center gap-2">
                <ListMusic size={14} className="text-ink-400" />
                <span className="text-xs font-bold text-ink-300">
                  Pratinjau Slide
                </span>
              </div>
              <span className="text-xs text-ink-400 font-medium">
                {previewSlides.length} Slide
              </span>
            </div>

            {previewSlides.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-500">
                <p className="text-xs">Belum ada slide terbuat</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {previewSlides.map((slide, sIdx) => {
                  const badgeStyle = getGroupColorClasses(slide.badge)
                  const hotkey = sectionHotkeys[slide.badge ?? '']

                  return (
                    <div
                      key={sIdx}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          slideIndex: sIdx,
                        })
                      }}
                      className="p-3 rounded-xl bg-ink-900/60 border border-ink-800/80 flex flex-col justify-between cursor-context-menu hover:border-ink-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1.5 ${badgeStyle}`}
                        >
                          <span>{slide.badge}</span>
                          {hotkey && (
                            <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 border border-white/20 text-white font-bold">
                              {hotkey}
                            </kbd>
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-ink-200 space-y-0.5 my-1">
                        {slide.lines.map((line, lIdx) => (
                          <div key={lIdx} className="truncate">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-ink-800 flex items-center justify-end gap-2 bg-ink-900/80">
          <button
            onClick={onClose}
            className="px-4 h-8 rounded-lg bg-ink-800 hover:bg-ink-700 text-xs font-medium text-ink-300 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            disabled={!title.trim() || previewSlides.length === 0}
            onClick={handleSave}
            className="px-4 h-8 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Check size={14} />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {contextMenu && (
        <SectionContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetIndex={contextMenu.slideIndex}
          currentBadge={previewSlides[contextMenu.slideIndex]?.badge}
          isSectionStart={previewSlides[contextMenu.slideIndex]?.isSectionStart}
          onSelectGroup={handleSelectGroup}
          onRemoveSectionStart={handleRemoveSectionStart}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
