import { useState, useRef, useEffect } from 'react'
import {
  SkipBack,
  SkipForward,
  Square,
  EyeOff,
  Image as ImageIcon,
  Play,
  Pause,
  Repeat,
  RotateCcw,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { VerseStage } from '../stage/VerseStage'
import type { ProjectionMode } from '../../types/projection'
import type { VideoBackground } from '../../types/theme'

/**
 * The operator's confidence monitor.
 *
 * It mounts the very same `VerseStage` the output window renders, scaled into a
 * 16:9 box, so any typography or background change is verified here before it
 * reaches the congregation.
 */
export function LivePreview() {
  const mode = useAppStore((s) => s.mode)
  const liveVerses = useAppStore((s) => s.liveVerses)
  const liveSlide = useAppStore((s) => s.liveSlide)
  const theme = useAppStore((s) => s.theme)
  const liveBackgroundOverride = useAppStore((s) => s.liveBackgroundOverride)
  const revision = useAppStore((s) => s.revision)
  const outputOpen = useAppStore((s) => s.outputOpen)
  const setMode = useAppStore((s) => s.setMode)
  const stepLive = useAppStore((s) => s.stepLive)

  const previewContainerRef = useRef<HTMLDivElement>(null)

  const toggle = (target: ProjectionMode) => setMode(mode === target ? 'live' : target)
  const hasContent = liveVerses.length > 0 || liveSlide != null
  const effectiveTheme = liveBackgroundOverride ? { ...theme, background: liveBackgroundOverride } : theme
  const isVideoBackground = effectiveTheme.background.kind === 'video'

  return (
    <div className="shrink-0 border-b border-ink-800">
      <div className="flex items-center justify-between px-3 h-8">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          Preview
        </span>
        <span
          className={clsx(
            'flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider',
            outputOpen ? 'text-red-400' : 'text-ink-400',
          )}
        >
          <span className={clsx('h-1.5 w-1.5 rounded-full', outputOpen ? 'bg-red-500 animate-pulse' : 'bg-ink-600')} />
          {outputOpen ? 'On Air' : 'Output tertutup'}
        </span>
      </div>

      <div className="px-3 pb-3">
        <div
          ref={previewContainerRef}
          className="relative w-full aspect-video rounded-lg overflow-hidden border border-ink-700 bg-black"
        >
          <VerseStage
            state={{ mode, verses: liveVerses, slide: liveSlide, theme: effectiveTheme, revision }}
            showSafeArea
          />
        </div>

        {/* Video Player Controls (Active when background is a video) */}
        {isVideoBackground && (
          <VideoTransportBar
            videoBg={effectiveTheme.background as VideoBackground}
            previewContainerRef={previewContainerRef}
          />
        )}

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          <TransportButton
            label="Prev"
            icon={<SkipBack size={13} />}
            onClick={() => stepLive(-1)}
            disabled={!hasContent}
          />
          <TransportButton
            label="Next"
            icon={<SkipForward size={13} />}
            onClick={() => stepLive(1)}
            disabled={!hasContent}
          />
          <TransportButton
            label="Clear"
            icon={<EyeOff size={13} />}
            active={mode === 'clear'}
            onClick={() => toggle('clear')}
          />
          <TransportButton
            label="Black"
            icon={<Square size={13} className="fill-current" />}
            active={mode === 'black'}
            onClick={() => toggle('black')}
          />
        </div>

        <button
          onClick={() => setMode('logo')}
          className={clsx(
            'mt-1.5 w-full h-7 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border',
            mode === 'logo'
              ? 'bg-ink-700 border-ink-600 text-white'
              : 'bg-ink-900 border-ink-800 text-ink-400 hover:text-white hover:bg-ink-850',
          )}
        >
          <ImageIcon size={12} /> Layar Idle
        </button>
      </div>
    </div>
  )
}

function VideoTransportBar({
  videoBg,
  previewContainerRef,
}: {
  videoBg: VideoBackground
  previewContainerRef: React.RefObject<HTMLDivElement | null>
}) {
  const setVideoPlayback = useAppStore((s) => s.setVideoPlayback)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [scrubValue, setScrubValue] = useState(0)

  // Attach event listeners to the <video> element rendered inside the preview box
  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return

    const video = container.querySelector('video')
    if (!video) return

    const handleTimeUpdate = () => {
      if (!isScrubbing) {
        setCurrentTime(video.currentTime)
      }
      if (video.duration && !isNaN(video.duration) && duration !== video.duration) {
        setDuration(video.duration)
      }
    }

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration)
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [previewContainerRef, isScrubbing, duration, videoBg.src])

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const isPaused = videoBg.paused ?? false
  const isLoop = videoBg.loop ?? true

  const togglePlay = () => {
    setVideoPlayback({ paused: !isPaused })
  }

  const toggleLoop = () => {
    setVideoPlayback({ loop: !isLoop })
  }

  const handleRestart = () => {
    setVideoPlayback({ seekTime: 0, paused: false })
  }

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setScrubValue(val)
  }

  const handleScrubStart = () => {
    setIsScrubbing(true)
    setScrubValue(currentTime)
  }

  const handleScrubEnd = () => {
    setIsScrubbing(false)
    setCurrentTime(scrubValue)
    setVideoPlayback({ seekTime: scrubValue })
  }

  const displayTime = isScrubbing ? scrubValue : currentTime

  return (
    <div className="mt-2 p-2 rounded-lg bg-ink-950 border border-ink-800 space-y-2 animate-in fade-in duration-200">
      {/* Timeline Slider & Time indicator */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] tabular-nums font-mono text-ink-400">
          <span className="text-amber-400 font-semibold">{formatTime(displayTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={displayTime}
          onMouseDown={handleScrubStart}
          onTouchStart={handleScrubStart}
          onChange={handleScrubChange}
          onMouseUp={handleScrubEnd}
          onTouchEnd={handleScrubEnd}
          className="w-full h-1 bg-ink-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
        />
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        <div className="flex items-center gap-1">
          <button
            onClick={togglePlay}
            title={isPaused ? 'Putar Video' : 'Jeda Video'}
            className={clsx(
              'h-6 px-2 rounded flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer',
              isPaused
                ? 'bg-amber-400 text-ink-950 hover:bg-amber-300'
                : 'bg-ink-800 text-ink-200 hover:text-white hover:bg-ink-700 border border-ink-700',
            )}
          >
            {isPaused ? <Play size={10} className="fill-current" /> : <Pause size={10} className="fill-current" />}
            <span>{isPaused ? 'Play' : 'Pause'}</span>
          </button>

          <button
            onClick={handleRestart}
            title="Ulangi dari Awal"
            className="h-6 w-6 rounded bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-ink-700"
          >
            <RotateCcw size={10} />
          </button>
        </div>

        <button
          onClick={toggleLoop}
          title={isLoop ? 'Ulangi Otomatis: Aktif' : 'Ulangi Otomatis: Mati'}
          className={clsx(
            'h-6 px-2 rounded flex items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer border',
            isLoop
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-ink-900 border-ink-800 text-ink-400 hover:text-ink-200',
          )}
        >
          <Repeat size={10} />
          <span>Loop</span>
        </button>
      </div>
    </div>
  )
}

function TransportButton({
  label, icon, onClick, active, disabled,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 border transition-colors',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        active
          ? 'bg-red-500/20 border-red-500/40 text-red-300'
          : 'bg-ink-900 border-ink-800 text-ink-300 hover:bg-ink-850 hover:text-white',
      )}
    >
      {icon}
      <span className="text-[8px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  )
}
