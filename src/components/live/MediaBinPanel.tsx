import { useState, useRef, useId } from 'react'
import {
  Upload,
  RotateCcw,
  Film,
  Layers,
  Trash2,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import type { Background } from '../../types/theme'
import { STOCK_BACKGROUNDS } from '../../data/stockMedia'
import { importBackgroundFile } from '../../services/media'
import { backgroundCss } from '../stage/StageBackground'

export function MediaBinPanel() {
  const theme = useAppStore((s) => s.theme)
  const liveBackgroundOverride = useAppStore((s) => s.liveBackgroundOverride)
  const mediaLibrary = useAppStore((s) => s.mediaLibrary)
  const setLiveBackgroundOverride = useAppStore((s) => s.setLiveBackgroundOverride)
  const addMediaAsset = useAppStore((s) => s.addMediaAsset)
  const removeMediaAsset = useAppStore((s) => s.removeMediaAsset)

  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'gradient'>('all')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()

  const allMedia: Array<{ bg: Background; isUser: boolean; userIndex?: number }> = [
    ...mediaLibrary.map((bg, idx) => ({ bg, isUser: true, userIndex: idx })),
    ...STOCK_BACKGROUNDS.map((bg) => ({ bg, isUser: false })),
  ]

  const filtered = allMedia.filter(({ bg }) => {
    if (filter === 'all') return true
    if (filter === 'image') return bg.kind === 'image'
    if (filter === 'video') return bg.kind === 'video'
    if (filter === 'gradient') return bg.kind === 'gradient' || bg.kind === 'solid'
    return true
  })

  const currentBg = liveBackgroundOverride ?? theme.background

  const isCurrentActive = (bg: Background) => {
    if (bg.kind === 'solid' && currentBg.kind === 'solid') {
      return bg.color === currentBg.color
    }
    if (bg.kind === 'gradient' && currentBg.kind === 'gradient') {
      return (
        bg.shape === currentBg.shape &&
        bg.angle === currentBg.angle &&
        JSON.stringify(bg.stops) === JSON.stringify(currentBg.stops)
      )
    }
    if ((bg.kind === 'image' || bg.kind === 'video') && (currentBg.kind === 'image' || currentBg.kind === 'video')) {
      return bg.path ? bg.path === currentBg.path : bg.src === currentBg.src
    }
    return false
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setIsUploading(true)
    try {
      const imported = await importBackgroundFile(file)
      addMediaAsset(imported)
      // Instant switch on upload
      setLiveBackgroundOverride(imported)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Gagal mengunggah media')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="border-t border-ink-800 bg-ink-900/90 flex flex-col shrink-0">
      {/* Top Bar Media Bin */}
      <div className="px-4 py-2 border-b border-ink-800/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-amber-400" />
          <span className="font-semibold text-ink-200 text-xs">
            Latar Belakang
          </span>
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-ink-950 p-0.5 rounded-lg border border-ink-800 text-[10px]">
            <button
              onClick={() => setFilter('all')}
              className={clsx(
                'px-2 py-0.5 rounded transition-colors',
                filter === 'all' ? 'bg-ink-800 text-white font-semibold' : 'text-ink-400 hover:text-ink-200',
              )}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('image')}
              className={clsx(
                'px-2 py-0.5 rounded transition-colors',
                filter === 'image' ? 'bg-ink-800 text-white font-semibold' : 'text-ink-400 hover:text-ink-200',
              )}
            >
              Gambar
            </button>
            <button
              onClick={() => setFilter('video')}
              className={clsx(
                'px-2 py-0.5 rounded transition-colors',
                filter === 'video' ? 'bg-ink-800 text-white font-semibold' : 'text-ink-400 hover:text-ink-200',
              )}
            >
              Video
            </button>
            <button
              onClick={() => setFilter('gradient')}
              className={clsx(
                'px-2 py-0.5 rounded transition-colors',
                filter === 'gradient' ? 'bg-ink-800 text-white font-semibold' : 'text-ink-400 hover:text-ink-200',
              )}
            >
              Gradien
            </button>
          </div>

          {/* Reset Override Button */}
          {liveBackgroundOverride && (
            <button
              onClick={() => setLiveBackgroundOverride(null)}
              title="Kembalikan latar belakang ke tema asal"
              className="h-6 px-2 rounded bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-ink-700"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          )}

          {/* Upload Button */}
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-6 px-2.5 rounded bg-amber-400/90 hover:bg-amber-300 text-ink-950 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Upload size={10} />
            <span>{isUploading ? 'Mengunggah...' : 'Unggah Media'}</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="px-4 py-1.5 bg-red-950/60 border-b border-red-800/50 text-[10px] text-red-300 flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-white">
            Tutup
          </button>
        </div>
      )}

      {/* Horizontal Scroll Thumbnail List */}
      <div className="p-3 overflow-x-auto flex items-center gap-3 min-h-[96px]">
        {filtered.map(({ bg, isUser, userIndex }, idx) => {
          const active = isCurrentActive(bg)
          const isVideo = bg.kind === 'video'

          return (
            <div
              key={`${bg.kind}-${idx}`}
              onClick={() => setLiveBackgroundOverride(bg)}
              className={clsx(
                'relative w-28 h-16 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer group shadow-sm select-none',
                active
                  ? 'border-amber-400 ring-2 ring-amber-400/50 scale-[1.03]'
                  : 'border-ink-800 hover:border-ink-600 hover:scale-[1.01]',
              )}
            >
              {/* Background Thumbnail Canvas */}
              {isVideo ? (
                <div className="w-full h-full bg-black relative flex items-center justify-center">
                  <video
                    src={bg.src}
                    muted
                    loop
                    className="w-full h-full object-cover pointer-events-none opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <Film size={16} className="absolute text-white/90 drop-shadow" />
                </div>
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: backgroundCss(bg) }}
                />
              )}

              {/* Active Indicator Overlay */}
              {active && (
                <div className="absolute top-1 right-1 bg-amber-400 text-ink-950 text-[7px] font-bold px-1.5 py-0.2 rounded shadow">
                  LIVE
                </div>
              )}

              {/* Delete button for user-uploaded assets */}
              {isUser && userIndex !== undefined && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeMediaAsset(userIndex)
                    if (active) setLiveBackgroundOverride(null)
                  }}
                  title="Hapus dari pustaka media"
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-950/80 hover:bg-red-800 text-red-200 p-0.5 rounded"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
