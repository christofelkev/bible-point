import type { Background, Overlay } from '../../types/theme'

/** Turns a Background into the CSS `background` shorthand it represents. */
export function backgroundCss(background: Background): string {
  switch (background.kind) {
    case 'solid':
      return background.color
    case 'gradient': {
      const stops = background.stops
        .map((s) => `${s.color} ${s.at}%`)
        .join(', ')
      return background.shape === 'radial'
        ? `radial-gradient(circle at 50% 45%, ${stops})`
        : `linear-gradient(${background.angle}deg, ${stops})`
    }
    case 'image':
      return `#000 url("${background.src}") center / ${background.fit} no-repeat`
  }
}

interface Props {
  background: Background
  overlay: Overlay
}

/**
 * The backdrop layer of the stage.
 *
 * Blur is applied to this layer only — never to the text — so a photo can be
 * softened without making the verse itself unreadable. The layer is inset
 * slightly beyond the stage so the blur does not reveal transparent edges.
 */
export function StageBackground({ background, overlay }: Props) {
  return (
    <>
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          inset: overlay.blur > 0 ? `-${overlay.blur * 2}px` : 0,
          background: backgroundCss(background),
          filter: overlay.blur > 0 ? `blur(${overlay.blur}px)` : undefined,
        }}
      />
      {overlay.dim > 0 && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: `rgba(0,0,0,${overlay.dim})` }}
        />
      )}
    </>
  )
}
