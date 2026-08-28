/**
 * Everything that controls how a verse looks on the output screen.
 *
 * A Theme is fully serialisable so it can be saved as a preset, exported, and
 * sent across the projection channel to the output window verbatim.
 */

export type BackgroundKind = 'solid' | 'gradient' | 'image' | 'video'

export interface SolidBackground {
  kind: 'solid'
  color: string
}

export interface GradientBackground {
  kind: 'gradient'
  /** Angle in degrees for linear; ignored for radial. */
  angle: number
  shape: 'linear' | 'radial'
  stops: Array<{ color: string; at: number }>
}

export interface ImageBackground {
  kind: 'image'
  /**
   * A URL the stage can render right now.
   *
   * Not stable across restarts: in the browser it is an object URL that dies
   * with the page, and under Tauri it is an asset URL derived from `path`.
   * Persistence relies on `path`, never on this.
   */
  src: string
  fit: 'cover' | 'contain'
  /** Optional descriptive name shown in the design panel. */
  label?: string
  /**
   * Location of the app's own copy of the image, on desktop only.
   *
   * This is what survives a restart; `src` is recomputed from it on load.
   */
  path?: string
}

/**
 * A looping video backdrop.
 *
 * Shares `src`/`path` semantics with ImageBackground: `path` is what survives a
 * restart, `src` is recomputed from it. Playback is always muted and looping —
 * a background that demanded attention or stopped mid-service would be a fault,
 * not a feature.
 */
export interface VideoBackground {
  kind: 'video'
  src: string
  fit: 'cover' | 'contain'
  label?: string
  path?: string
}

export type Background =
  | SolidBackground
  | GradientBackground
  | ImageBackground
  | VideoBackground

export interface Overlay {
  /** 0..1 black scrim strength, keeps text readable over busy photos. */
  dim: number
  /** Blur radius in px applied to the background only. */
  blur: number
}

export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'
export type ReferencePosition = 'top' | 'bottom' | 'hidden'

export interface Typography {
  /**
   * Either one of the built-in stacks, or the family name of a font the
   * operator supplied. Custom fonts also carry `fontSrc`.
   */
  fontFamily: string
  /**
   * URL of a custom font file, when the family is not a built-in.
   *
   * Carried on the theme rather than looked up separately so the theme stays
   * self-describing: the output window renders from the snapshot it receives
   * and never has to consult app settings for a font.
   */
  fontSrc?: string
  /** Stable location of the custom font file; `fontSrc` is derived from it. */
  fontPath?: string
  /** Size relative to stage height (vh-like), so it scales with any screen. */
  size: number
  weight: number
  color: string
  lineHeight: number
  letterSpacing: number
  uppercase: boolean
  /** Text shadow strength in px; 0 disables the shadow. */
  shadow: number
  /** Outline (stroke) width in px; 0 disables the outline. */
  outline: number
  outlineColor: string
}

export interface StageLayout {
  align: TextAlign
  verticalAlign: VerticalAlign
  /** Padding as a percentage of the stage's shorter side. */
  padding: number
  /** Max text column width as a percentage of stage width. */
  maxWidth: number
  referencePosition: ReferencePosition
  /** Reference size relative to the verse size, e.g. 0.4 = 40%. */
  referenceScale: number
  showTranslation: boolean
  /**
   * Shrink the text until it fits the screen.
   *
   * Without this a long verse at a large size is silently clipped by the stage,
   * and the congregation sees a sentence cut off mid-word. Optional so themes
   * saved before it existed default to on, which is the safe behaviour.
   */
  autoFit?: boolean
}

export type TransitionKind = 'none' | 'fade' | 'slide-up' | 'zoom'

export interface Transition {
  kind: TransitionKind
  /** Duration in milliseconds. */
  duration: number
}

export interface Theme {
  id: string
  name: string
  /**
   * True for presets defined in code. They are never persisted — they ship with
   * the app and may change between versions — while operator-created presets are.
   */
  builtin?: boolean
  background: Background
  overlay: Overlay
  typography: Typography
  layout: StageLayout
  transition: Transition
}
