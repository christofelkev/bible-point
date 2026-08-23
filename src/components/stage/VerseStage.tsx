import { useEffect, useState } from 'react'
import type { ProjectionState } from '../../types/projection'
import { formatRange } from '../../types/bible'
import { fontStack } from '../../data/presets'
import { StageBackground } from './StageBackground'

interface Props {
  state: ProjectionState
  /** Shown in the operator's preview only; never rendered on the real output. */
  showSafeArea?: boolean
}

/**
 * The one component that knows what a projected verse looks like.
 *
 * It is mounted twice: scaled down inside the operator's live preview, and
 * fullscreen in the output window. Because both mounts share this code, the
 * preview is a true representation rather than an approximation.
 *
 * All type sizes are expressed in container query height units (`cqh`), so the
 * layout is resolution-independent: the same theme fills a 4K projector and a
 * 320px preview thumbnail identically.
 */
export function VerseStage({ state, showSafeArea = false }: Props) {
  const { theme, verses, mode, revision } = state
  const { typography: type, layout, transition } = theme

  // Retrigger the entrance animation whenever a new snapshot arrives.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    setEntered(false)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [revision])

  if (mode === 'black') {
    return <div className="absolute inset-0 bg-black" />
  }

  const showText = mode === 'live' && verses.length > 0
  const reference = verses.length > 0 ? formatRange(verses) : ''
  const translationLabel = verses[0]?.translationId.split('-')[1]?.toUpperCase() ?? ''

  const justify =
    layout.verticalAlign === 'top' ? 'flex-start'
    : layout.verticalAlign === 'bottom' ? 'flex-end'
    : 'center'

  const textShadow = type.shadow > 0
    ? `0 ${Math.round(type.shadow * 0.25)}px ${type.shadow}px rgba(0,0,0,0.55)`
    : undefined

  const outline = type.outline > 0
    ? { WebkitTextStrokeWidth: `${type.outline}px`, WebkitTextStrokeColor: type.outlineColor }
    : undefined

  // A custom font travels on the theme itself, so the output window can render
  // it from the snapshot alone without consulting app settings. The rule is
  // emitted per stage; duplicate identical @font-face rules are harmless.
  const fontFace = type.fontSrc
    ? `@font-face{font-family:"${type.fontFamily}";src:url("${type.fontSrc}");font-display:swap}`
    : null

  const enterStyle: React.CSSProperties = (() => {
    if (transition.kind === 'none') return {}
    const base = {
      transitionProperty: 'opacity, transform',
      transitionDuration: `${transition.duration}ms`,
      transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      opacity: entered ? 1 : 0,
    }
    if (transition.kind === 'slide-up') {
      return { ...base, transform: entered ? 'translateY(0)' : 'translateY(3cqh)' }
    }
    if (transition.kind === 'zoom') {
      return { ...base, transform: entered ? 'scale(1)' : 'scale(0.96)' }
    }
    return base
  })()

  const referenceBlock = layout.referencePosition !== 'hidden' && reference && (
    <div
      className="shrink-0"
      style={{
        fontSize: `${type.size * layout.referenceScale}cqh`,
        opacity: 0.72,
        letterSpacing: '0.06em',
        fontWeight: 500,
        textShadow,
        marginTop: layout.referencePosition === 'bottom' ? '2.2cqh' : 0,
        marginBottom: layout.referencePosition === 'top' ? '2.2cqh' : 0,
      }}
    >
      {reference}
      {layout.showTranslation && translationLabel ? ` · ${translationLabel}` : ''}
    </div>
  )

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ containerType: 'size' }}
    >
      {fontFace && <style>{fontFace}</style>}

      <StageBackground background={theme.background} overlay={theme.overlay} />

      {showSafeArea && (
        <div
          aria-hidden
          className="absolute inset-[5%] border border-dashed border-white/20 rounded-[2px] pointer-events-none z-20"
        />
      )}

      {showText && (
        <div
          className="absolute inset-0 flex flex-col"
          style={{
            justifyContent: justify,
            alignItems:
              layout.align === 'left' ? 'flex-start'
              : layout.align === 'right' ? 'flex-end'
              : 'center',
            padding: `${layout.padding}cqh ${layout.padding}cqh`,
            color: type.color,
            fontFamily: type.fontSrc
              ? `"${type.fontFamily}", ${fontStack('Inter')}`
              : fontStack(type.fontFamily),
            textAlign: layout.align,
            ...enterStyle,
          }}
        >
          {layout.referencePosition === 'top' && referenceBlock}

          <div
            style={{
              maxWidth: `${layout.maxWidth}cqw`,
              fontSize: `${type.size}cqh`,
              fontWeight: type.weight,
              lineHeight: type.lineHeight,
              letterSpacing: `${type.letterSpacing}px`,
              textTransform: type.uppercase ? 'uppercase' : 'none',
              textShadow,
              textWrap: 'balance',
              ...outline,
            }}
          >
            {verses.map((v, i) => (
              <span key={`${v.bookId}-${v.chapter}-${v.verse}`}>
                {i > 0 && ' '}
                {verses.length > 1 && (
                  <sup
                    style={{ fontSize: '0.5em', opacity: 0.6, marginRight: '0.15em', fontWeight: 400 }}
                  >
                    {v.verse}
                  </sup>
                )}
                {v.text}
              </span>
            ))}
          </div>

          {layout.referencePosition === 'bottom' && referenceBlock}
        </div>
      )}

      {mode === 'logo' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.5cqh] text-white/85">
          <div
            className="rounded-[1.4cqh] border border-white/25 flex items-center justify-center"
            style={{ width: '11cqh', height: '11cqh' }}
          >
            <span style={{ fontSize: '5.5cqh', fontWeight: 300, letterSpacing: '-0.04em' }}>BP</span>
          </div>
          <div style={{ fontSize: '3.4cqh', fontWeight: 300, letterSpacing: '0.35em' }}>
            BIBLE POINT
          </div>
        </div>
      )}
    </div>
  )
}
