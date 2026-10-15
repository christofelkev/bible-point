import { useState } from 'react'
import { Music, Plus, Radio, Play } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import type { ProjectionSlide } from '../../types/projection'

interface DemoSong {
  id: string
  title: string
  artist: string
  key: string
  tempo: number
  arrangement: string
  slides: ProjectionSlide[]
}

const DEMO_SONGS: DemoSong[] = [
  {
    id: 'song-1',
    title: 'Kebaikan Allah (Goodness of God)',
    artist: 'Bethel Music',
    key: 'G',
    tempo: 70,
    arrangement: 'V1 → C → V2 → C → B → C → Tag',
    slides: [
      {
        kind: 'song',
        badge: 'Verse 1',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '1/7',
        lines: [
          'Ku mengasihi-Mu',
          'Tak pernah Kau gagal',
          'Setiap hariku dalam tangan-Mu',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '2/7',
        lines: [
          'Seumur hidupku Kau setia',
          'Seumur hidupku Kau sangat baik',
          'Dengan hembusan nafas yang ada',
          'Ku akan bernyanyi akan kebaikan Allah',
        ],
      },
      {
        kind: 'song',
        badge: 'Verse 2',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '3/7',
        lines: [
          'Ku suka suara-Mu',
          'Membimbing langkahku',
          'Dalam kegelapan Kau dekat denganku',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '4/7',
        lines: [
          'Seumur hidupku Kau setia',
          'Seumur hidupku Kau sangat baik',
          'Dengan hembusan nafas yang ada',
          'Ku akan bernyanyi akan kebaikan Allah',
        ],
      },
      {
        kind: 'song',
        badge: 'Bridge',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '5/7',
        lines: [
          'Kebaikan-Mu selalu mengejarku',
          'Selalu mengejarku',
          'Kuserahkan hidupku pada-Mu',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '6/7',
        lines: [
          'Seumur hidupku Kau setia',
          'Seumur hidupku Kau sangat baik',
          'Dengan hembusan nafas yang ada',
          'Ku akan bernyanyi akan kebaikan Allah',
        ],
      },
      {
        kind: 'song',
        badge: 'Tag',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '7/7',
        lines: [
          'Ku bernyanyi akan kebaikan Allah',
          'Kebaikan Allah',
        ],
      },
    ],
  },
  {
    id: 'song-2',
    title: 'Kemenangan Terjadi Di Sini',
    artist: 'NDC Worship',
    key: 'C',
    tempo: 74,
    arrangement: 'V1 → C → B → C',
    slides: [
      {
        kind: 'song',
        badge: 'Verse 1',
        reference: 'Kemenangan Terjadi Di Sini — NDC Worship',
        secondaryMeta: 'Key: C',
        slideProgress: '1/4',
        lines: [
          'Kumenyembah dalam kudus hadirat-Mu',
          'Hampiri tahta kasih karunia-Mu Bapa',
          'Kekuatanku hanya di dalam hadirat-Mu',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kemenangan Terjadi Di Sini — NDC Worship',
        secondaryMeta: 'Key: C',
        slideProgress: '2/4',
        lines: [
          'Ada mukjizat dalam hadirat-Mu',
          'Ada pemulihan di hadirat-Mu',
          'Kemenangan terjadi di sini',
        ],
      },
      {
        kind: 'song',
        badge: 'Bridge',
        reference: 'Kemenangan Terjadi Di Sini — NDC Worship',
        secondaryMeta: 'Key: C',
        slideProgress: '3/4',
        lines: [
          'Segala perkara dapat kutanggung',
          'Di dalam Dia yang memberi kekuatan',
          'Tuhan Yesus sumber kemenanganku',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kemenangan Terjadi Di Sini — NDC Worship',
        secondaryMeta: 'Key: C',
        slideProgress: '4/4',
        lines: [
          'Ada mukjizat dalam hadirat-Mu',
          'Ada pemulihan di hadirat-Mu',
          'Kemenangan terjadi di sini',
        ],
      },
    ],
  },
]

function getBadgeColor(badge?: string) {
  if (!badge) return 'bg-ink-800 text-ink-300 border-ink-700'
  const b = badge.toLowerCase()
  if (b.includes('chorus') || b.includes('reff')) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  }
  if (b.includes('bridge')) {
    return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  }
  if (b.includes('verse') || b.includes('bait')) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  }
  if (b.includes('tag') || b.includes('outro')) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
  return 'bg-ink-800 text-ink-300 border-ink-700'
}

export function LiveWorkspace() {
  const [songs] = useState<DemoSong[]>(DEMO_SONGS)
  const [activeSongId, setActiveSongId] = useState<string>(DEMO_SONGS[0].id)
  const [search, setSearch] = useState('')

  const liveSlide = useAppStore((s) => s.liveSlide)
  const activeLiveSlideIndex = useAppStore((s) => s.activeLiveSlideIndex)
  const mode = useAppStore((s) => s.mode)
  const goLiveSlide = useAppStore((s) => s.goLiveSlide)

  const activeSong = songs.find((s) => s.id === activeSongId) ?? songs[0]

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase()),
  )

  const isSlideLive = (slide: ProjectionSlide, index: number) => {
    if (mode !== 'live' || !liveSlide) return false
    return (
      activeLiveSlideIndex === index &&
      liveSlide.lines.join('|') === slide.lines.join('|')
    )
  }

  return (
    <div className="flex-1 min-h-0 flex bg-ink-950 text-white">
      {/* Kolom Kiri: Song List / Library */}
      <div className="w-72 shrink-0 border-r border-ink-800 flex flex-col bg-ink-900/60">
        <div className="p-3 border-b border-ink-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music size={15} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink-300">
              Daftar Lagu (Live)
            </span>
          </div>
          <span className="text-[10px] bg-ink-800 px-1.5 py-0.5 rounded text-ink-400">
            {songs.length} Lagu
          </span>
        </div>

        <div className="p-2 border-b border-ink-800">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari lagu..."
            className="w-full h-7 rounded bg-ink-950 border border-ink-800 px-2 text-xs placeholder:text-ink-500 focus:outline-none focus:border-ink-600"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredSongs.map((song) => {
            const isSelected = song.id === activeSong.id
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate pr-2">
                    {song.title}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-ink-950/80 text-ink-400">
                    {song.key}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-ink-400">
                  <span className="truncate">{song.artist}</span>
                  <span className="text-[10px]">{song.slides.length} slide</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="p-2.5 border-t border-ink-800">
          <button
            onClick={() => {
              // Di Task 3 akan membuka Song Editor Modal
            }}
            className="w-full h-8 rounded-lg bg-ink-800 hover:bg-ink-700 text-xs font-medium flex items-center justify-center gap-1.5 text-ink-200 transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Tambah Lagu</span>
          </button>
        </div>
      </div>

      {/* Kolom Tengah: Slide Matrix / Grid Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-ink-950">
        {/* Header Lagu Aktif */}
        <div className="px-5 py-3 border-b border-ink-800 flex items-center justify-between bg-ink-900/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                {activeSong.title}
              </h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-ink-800 text-ink-300 font-medium">
                {activeSong.artist}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-400">
              <span className="font-mono bg-ink-900 px-1 py-0.2 rounded border border-ink-800">
                Nada: {activeSong.key}
              </span>
              <span className="font-mono bg-ink-900 px-1 py-0.2 rounded border border-ink-800">
                Tempo: {activeSong.tempo} BPM
              </span>
              <span className="text-ink-500">•</span>
              <span className="text-ink-400 text-[10px]">
                Susunan: <strong className="text-ink-300">{activeSong.arrangement}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Slide Grid / Matrix */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {activeSong.slides.map((slide, index) => {
              const live = isSlideLive(slide, index)
              const badgeStyle = getBadgeColor(slide.badge)

              return (
                <div
                  key={index}
                  onClick={() => goLiveSlide(slide, activeSong.slides, index)}
                  className={clsx(
                    'relative rounded-xl border p-3.5 flex flex-col justify-between transition-all cursor-pointer aspect-video select-none group',
                    live
                      ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/30 shadow-lg'
                      : 'border-ink-800 bg-ink-900/50 hover:border-ink-600 hover:bg-ink-900',
                  )}
                >
                  {/* Top Bar Card */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={clsx(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
                        badgeStyle,
                      )}
                    >
                      {slide.badge ?? `Slide ${index + 1}`}
                    </span>

                    {live ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30 animate-pulse">
                        <Radio size={9} /> Live
                      </span>
                    ) : (
                      <span className="text-[10px] text-ink-500 font-mono">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Body Text Preview */}
                  <div className="flex-1 flex flex-col justify-center text-center px-1">
                    {slide.lines.map((line, lIdx) => (
                      <div
                        key={lIdx}
                        className={clsx(
                          'text-xs leading-snug line-clamp-1',
                          live ? 'text-white font-medium' : 'text-ink-300 group-hover:text-ink-100',
                        )}
                      >
                        {line}
                      </div>
                    ))}
                  </div>

                  {/* Footer Card */}
                  <div className="mt-2 pt-1.5 border-t border-ink-800/60 flex items-center justify-between text-[9px] text-ink-500">
                    <span className="truncate max-w-[120px]">{slide.reference}</span>
                    <span>{slide.slideProgress}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
