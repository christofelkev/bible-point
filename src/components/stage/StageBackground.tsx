import { useEffect, useRef } from 'react'
import type { Background, Overlay } from '../../types/theme'

/**
 * Turns a Background into the CSS `background` shorthand it represents.
 *
 * Video is not expressible in CSS, so it returns black — callers that can show
 * a video render one on top, and callers that only need a swatch (the preset
 * grid) get a sensible stand-in.
 */
export function backgroundCss(background: Background): string {
  switch (background.kind) {
    case 'solid':
      return background.color
    case 'gradient': {
      const stops = background.stops.map((s) => `${s.color} ${s.at}%`).join(', ')
      return background.shape === 'radial'
        ? `radial-gradient(circle at 50% 45%, ${stops})`
        : `linear-gradient(${background.angle}deg, ${stops})`
    }
    case 'image':
      return `#000 url("${background.src}") center / ${background.fit} no-repeat`
    case 'video':
      return '#000'
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const inset = overlay.blur > 0 ? `-${overlay.blur * 2}px` : 0
  const filter = overlay.blur > 0 ? `blur(${overlay.blur}px)` : undefined

  const isVideo = background.kind === 'video'
  const isPaused = isVideo ? background.paused : undefined
  const seekTime = isVideo ? background.seekTime : undefined
  const isLoop = isVideo ? (background.loop ?? true) : true

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isVideo) return

    if (isPaused) {
      video.pause()
    } else {
      void video.play().catch(() => {})
    }
  }, [isVideo, isPaused])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isVideo) return

    if (typeof seekTime === 'number' && Math.abs(video.currentTime - seekTime) > 0.4) {
      video.currentTime = seekTime
    }
  }, [isVideo, seekTime])

  return (
    <>
      {isVideo ? (
        <video
          ref={videoRef}
          key={background.src}
          className="absolute pointer-events-none"
          style={{
            inset,
            width: `calc(100% + ${overlay.blur * 4}px)`,
            height: `calc(100% + ${overlay.blur * 4}px)`,
            objectFit: background.fit,
            filter,
          }}
          src={background.src}
          autoPlay
          loop={isLoop}
          muted
          playsInline
        />
      ) : (
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{ inset, background: backgroundCss(background), filter }}
        />
      )}

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
