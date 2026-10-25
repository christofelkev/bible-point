import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ProjectionState } from '../../types/projection'
import { formatRange } from '../../types/bible'
import { fontStack } from '../../data/presets'
import { StageBackground } from './StageBackground'

/**
 * Never shrink past this. Text this much smaller than the operator asked for is
 * unreadable from the back of a room anyway, so clipping the remainder is the
 * lesser failure and the size they set stays recognisable.
 */
const MIN_FIT = 0.45

/**
 * Hard ceiling on measuring passes.
 *
 * The measuring effect runs after every render and can call setState, so its
 * termination rests on the search converging. A cap makes that guarantee
 * structural instead: whatever the text or the font does, the loop stops.
 */
const MAX_FIT_PASSES = 14

/** Stop searching once the bracket is this tight; further passes buy nothing. */
const FIT_PRECISION = 0.015

interface FitSearch {
  /** Largest scale known to fit. */
  lo: number
  /** Smallest scale known to overflow. */
  hi: number
  current: number
  settled: boolean
}

const FIT_START: FitSearch = { lo: MIN_FIT, hi: 1, current: 1, settled: false }

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
  const { theme, verses, slide, mode, revision } = state
  const { typography: type, layout, transition } = theme

  // Retrigger the entrance animation whenever a new snapshot arrives.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    setEntered(false)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [revision])

  const flowRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  /**
   * Multiplier applied to every type size so a long verse fits the screen.
   *
   * Derived, never configured: it depends on this verse in this theme at this
   * screen size, so it is recomputed rather than stored on the Theme.
   */
  const [search, setSearch] = useState<FitSearch>(FIT_START)
  const passes = useRef(0)
  const fit = search.current

  // Start from the operator's chosen size again whenever what is on screen
  // changes, so a short verse after a long one is not left shrunken.
  useLayoutEffect(() => {
    passes.current = 0
    setSearch(FIT_START)
  }, [revision, theme, verses, slide])

  /**
   * Binary search for the largest scale that still fits.
   *
   * A single proportional guess undershoots badly: shrinking the text also
   * makes it wrap onto fewer lines, so one pass can land at half the size when
   * ninety percent would have fitted — and text smaller than it needs to be is
   * exactly what this feature exists to prevent. Bracketing instead converges
   * on the real limit in about six passes.
   *
   * All passes run inside layout effects, so they complete before the browser
   * paints and the operator never sees the intermediate sizes.
   */
  useLayoutEffect(() => {
    if (theme.layout.autoFit === false || search.settled || slide?.imageUrl) return
    if (passes.current >= MAX_FIT_PASSES) {
      setSearch((s) => ({ ...s, current: s.lo, settled: true }))
      return
    }

    const flow = flowRef.current
    const content = contentRef.current
    if (!flow || !content) return

    const style = getComputedStyle(flow)
    const available =
      flow.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    if (available <= 0) return

    passes.current += 1
    const fits = content.scrollHeight <= available + 0.5
    const lo = fits ? search.current : search.lo
    const hi = fits ? search.hi : search.current

    // Settle on `lo`, the largest size actually measured as fitting. Settling on
    // the midpoint would mean shipping a size that was never verified.
    if (hi - lo < FIT_PRECISION) {
      setSearch({ lo, hi, current: lo, settled: true })
      return
    }

    setSearch({ lo, hi, current: (lo + hi) / 2, settled: false })
  })

  // The same theme needs a different fit on a 348px preview and a 4K projector,
  // so search again whenever the stage itself changes size.
  useLayoutEffect(() => {
    const flow = flowRef.current
    if (!flow || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      passes.current = 0
      setSearch(FIT_START)
    })
    observer.observe(flow)
    return () => observer.disconnect()
  }, [])

  if (mode === 'black') {
    return <div className="absolute inset-0 bg-black" />
  }

  const hasSlide = Boolean(slide && ((slide.lines && slide.lines.length > 0) || slide.imageUrl))
  const hasVerses = Boolean(verses && verses.length > 0)
  const showText = mode === 'live' && (hasSlide || hasVerses)

  const reference = slide ? (slide.reference ?? '') : (hasVerses ? formatRange(verses) : '')
  const translationLabel = slide
    ? (slide.secondaryMeta ?? '')
    : (hasVerses ? (verses[0]?.translationId.split('-')[1]?.toUpperCase() ?? '') : '')
  const sectionBadge = slide?.badge
  const slideProgress = slide?.slideProgress

  const justify =
    layout.verticalAlign === 'top' ? 'flex-start'
    : layout.verticalAlign === 'bottom' ? 'flex-end'
    : 'center'

  const crossAlign =
    layout.align === 'left' ? 'flex-start'
    : layout.align === 'right' ? 'flex-end'
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

  const referenceBlock = layout.referencePosition !== 'hidden' && (reference || sectionBadge || slideProgress) && (
    <div
      className="shrink-0 flex items-center flex-wrap gap-2"
      style={{
        fontSize: `${type.size * layout.referenceScale * fit}cqh`,
        opacity: 0.75,
        letterSpacing: '0.06em',
        fontWeight: 500,
        textShadow,
        marginTop: layout.referencePosition === 'bottom' ? '2.2cqh' : 0,
        marginBottom: layout.referencePosition === 'top' ? '2.2cqh' : 0,
      }}
    >
      {sectionBadge && (
        <span className="px-[0.8cqh] py-[0.1cqh] rounded bg-white/20 border border-white/25 text-[0.85em] uppercase font-bold tracking-wider">
          {sectionBadge}
        </span>
      )}
      {reference && <span>{reference}</span>}
      {layout.showTranslation && translationLabel ? <span>{` · ${translationLabel}`}</span> : ''}
      {slideProgress && <span className="opacity-60 text-[0.85em] ml-1">({slideProgress})</span>}
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
          ref={flowRef}
          className="absolute inset-0 flex flex-col"
          style={{
            justifyContent: justify,
            alignItems: crossAlign,
            padding: `${layout.padding}cqh ${layout.padding}cqh`,
            color: type.color,
            fontFamily: type.fontSrc
              ? `"${type.fontFamily}", ${fontStack('Inter')}`
              : fontStack(type.fontFamily),
            textAlign: layout.align,
            ...enterStyle,
          }}
        >
          {/* One wrapper so the whole block can be measured at once. It must not
              shrink: a squashed flex item would report the height it was forced
              into rather than the height the text actually needs. */}
          <div
            ref={contentRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: crossAlign,
              flexShrink: 0,
              maxWidth: '100%',
              ...(slide?.imageUrl
                ? {
                    flex: 1,
                    minHeight: 0,
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }
                : {}),
            }}
          >
            {layout.referencePosition === 'top' && referenceBlock}

            {slide?.imageUrl ? (
              <div
                className="flex items-center justify-center overflow-hidden flex-1 min-h-0 w-full"
                style={{
                  maxWidth: `${layout.maxWidth}cqw`,
                }}
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.badge ?? 'Slide'}
                  className="max-w-full max-h-full object-contain select-none pointer-events-none rounded-[0.5cqh] shadow-2xl"
                />
              </div>
            ) : slide ? (
              <div
                style={{
                  maxWidth: `${layout.maxWidth}cqw`,
                  fontSize: `${type.size * fit}cqh`,
                  fontWeight: type.weight,
                  lineHeight: type.lineHeight,
                  letterSpacing: `${type.letterSpacing}px`,
                  textTransform: type.uppercase ? 'uppercase' : 'none',
                  textShadow,
                  textWrap: 'balance',
                  ...outline,
                }}
              >
                {slide.lines.map((line, idx) => (
                  <div key={idx} className={idx > 0 ? 'mt-[0.5cqh]' : ''}>
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  maxWidth: `${layout.maxWidth}cqw`,
                  fontSize: `${type.size * fit}cqh`,
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
            )}

            {layout.referencePosition === 'bottom' && referenceBlock}
          </div>
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
