import { useState, useMemo } from 'react'
import { X, Music, Sparkles, Check, ListMusic } from 'lucide-react'
import type { Song } from '../../types/song'
import { parseRawLyrics, compileSongSlides } from '../../services/songs/lyricParser'

interface Props {
  song?: Song | null
  isOpen: boolean
  onClose: () => void
  onSave: (song: Song) => void
}

export function SongEditorModal({ song, isOpen, onClose, onSave }: Props) {
  const isEditing = Boolean(song)

  const [title, setTitle] = useState(song?.title ?? '')
  const [artist, setArtist] = useState(song?.artist ?? '')
  const [key, setKey] = useState(song?.key ?? 'C')
  const [tempo, setTempo] = useState<number>(song?.tempo ?? 72)
  const [arrangement, setArrangement] = useState(song?.arrangement ?? '')
  const [ccli, setCcli] = useState(song?.ccli ?? '')
  const [rawLyrics, setRawLyrics] = useState(
    song?.rawLyrics ??
      song?.slides.map((s) => `[${s.badge ?? 'Verse'}]\n${s.lines.join('\n')}`).join('\n\n') ??
      '',
  )

  // Realtime parse to preview slides
  const parsedSections = useMemo(() => parseRawLyrics(rawLyrics), [rawLyrics])
  const previewSlides = useMemo(
    () =>
      compileSongSlides(
        parsedSections,
        { title: title || 'Judul Lagu', artist, key, ccli },
        arrangement,
      ),
    [parsedSections, title, artist, key, ccli, arrangement],
  )

  const handleSave = () => {
    if (!title.trim()) return

    const newSong: Song = {
      id: song?.id ?? `song-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim(),
      key: key.trim().toUpperCase() || 'C',
      tempo: Number(tempo) || 72,
      arrangement: arrangement.trim(),
      ccli: ccli.trim(),
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-ink-800 flex items-center justify-between bg-ink-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Music size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isEditing ? `Edit Lagu: ${song?.title}` : 'Tambah Lagu Baru'}
              </h2>
              <p className="text-[11px] text-ink-400">
                Lirik akan otomatis dipecah menjadi kartu slide panggung.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body: 2 Columns */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Form & Raw Lyrics */}
          <div className="w-full md:w-1/2 p-5 border-b md:border-b-0 md:border-r border-ink-800 overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink-300 uppercase tracking-wider mb-1">
                  Judul Lagu *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Kebaikan Allah"
                  className="w-full h-8 px-2.5 rounded-lg bg-ink-900 border border-ink-800 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-amber-400/70"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-300 uppercase tracking-wider mb-1">
                  Artis / Pencipta
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Contoh: Bethel Music"
                  className="w-full h-8 px-2.5 rounded-lg bg-ink-900 border border-ink-800 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-amber-400/70"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink-300 uppercase tracking-wider mb-1">
                  Nada Dasar (Key)
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="C, G, Dm..."
                  className="w-full h-8 px-2.5 rounded-lg bg-ink-900 border border-ink-800 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-amber-400/70 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-300 uppercase tracking-wider mb-1">
                  Tempo (BPM)
                </label>
                <input
                  type="number"
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  placeholder="72"
                  className="w-full h-8 px-2.5 rounded-lg bg-ink-900 border border-ink-800 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-amber-400/70 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-300 uppercase tracking-wider mb-1">
                  CCLI / Hak Cipta
                </label>
                <input
                  type="text"
                  value={ccli}
                  onChange={(e) => setCcli(e.target.value)}
                  placeholder="Opsional"
                  className="w-full h-8 px-2.5 rounded-lg bg-ink-900 border border-ink-800 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-amber-400/70"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-300 uppercase tracking-wider mb-1">
                Alur / Arrangement (Opsional)
              </label>
              <input
                type="text"
                value={arrangement}
                onChange={(e) => setArrangement(e.target.value)}
                placeholder="Contoh: V1 → C → V2 → C → B → C → Tag"
                className="w-full h-8 px-2.5 rounded-lg bg-ink-900 border border-ink-800 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-amber-400/70 font-mono text-[11px]"
              />
              <p className="text-[10px] text-ink-500 mt-1">
                Kosongkan untuk mengikuti urutan bait penulisan di bawah.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
                  Teks Lirik Lengkap *
                </label>
                <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                  <Sparkles size={11} /> Smart Parser
                </span>
              </div>
              <textarea
                rows={11}
                value={rawLyrics}
                onChange={(e) => setRawLyrics(e.target.value)}
                placeholder="Tempel lirik di sini...
Contoh format:
[Verse 1]
Ku mengasihi-Mu
Tak pernah Kau gagal

[Chorus]
Seumur hidupku Kau setia
Seumur hidupku Kau sangat baik"
                className="w-full p-3 rounded-lg bg-ink-900 border border-ink-800 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-amber-400/70 font-mono leading-relaxed"
              />
              <p className="text-[10px] text-ink-500 mt-1">
                Gunakan header seperti <code className="text-ink-400">[Verse 1]</code>, <code className="text-ink-400">[Chorus]</code>, <code className="text-ink-400">[Bridge]</code> atau baris kosong antar bait.
              </p>
            </div>
          </div>

          {/* Right Column: Live Pratinjau Slide */}
          <div className="w-full md:w-1/2 p-5 bg-ink-950 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-ink-800 mb-3">
              <div className="flex items-center gap-2">
                <ListMusic size={14} className="text-ink-400" />
                <span className="text-xs font-bold text-ink-300 uppercase tracking-wider">
                  Hasil Slide Panggung
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-800 text-amber-400 font-medium">
                {previewSlides.length} Slide
              </span>
            </div>

            {previewSlides.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink-500">
                <p className="text-xs">Belum ada slide terbuat.</p>
                <p className="text-[11px] text-ink-600 mt-1">
                  Mulai ketik atau tempel lirik di sebelah kiri.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {previewSlides.map((slide, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl bg-ink-900/60 border border-ink-800/80 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-800 text-amber-300 border border-amber-500/20">
                        {slide.badge}
                      </span>
                      <span className="text-[9px] text-ink-500 font-mono">
                        {slide.slideProgress}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-200 space-y-0.5 my-1">
                      {slide.lines.map((line, lIdx) => (
                        <div key={lIdx} className="truncate">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-3.5 border-t border-ink-800 flex items-center justify-between bg-ink-900/80">
          <span className="text-[11px] text-ink-500">
            {previewSlides.length > 0
              ? `${previewSlides.length} slide siap ditayangkan.`
              : 'Isi judul dan lirik untuk menyimpan.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 h-8 rounded-lg bg-ink-800 hover:bg-ink-700 text-xs font-medium text-ink-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              disabled={!title.trim() || previewSlides.length === 0}
              onClick={handleSave}
              className="px-4 h-8 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Check size={14} />
              <span>Simpan Lagu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
