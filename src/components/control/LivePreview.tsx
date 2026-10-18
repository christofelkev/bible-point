import { SkipBack, SkipForward, Square, EyeOff, Image as ImageIcon } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { VerseStage } from '../stage/VerseStage'
import type { ProjectionMode } from '../../types/projection'

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

  const toggle = (target: ProjectionMode) => setMode(mode === target ? 'live' : target)
  const hasContent = liveVerses.length > 0 || liveSlide != null
  const effectiveTheme = liveBackgroundOverride ? { ...theme, background: liveBackgroundOverride } : theme

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
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-ink-700 bg-black">
          <VerseStage
            state={{ mode, verses: liveVerses, slide: liveSlide, theme: effectiveTheme, revision }}
            showSafeArea
          />
        </div>

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
