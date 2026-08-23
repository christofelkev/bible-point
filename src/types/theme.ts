/**
 * Everything that controls how a verse looks on the output screen.
 *
 * A Theme is fully serialisable so it can be saved as a preset, exported, and
 * sent across the projection channel to the output window verbatim.
 */

export type BackgroundKind = 'solid' | 'gradient' | 'image'

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
  /** Object URL, data URL, or file path once running under Tauri. */
  src: string
  fit: 'cover' | 'contain'
  /** Optional descriptive name shown in the design panel. */
  label?: string
}

export type Background = SolidBackground | GradientBackground | ImageBackground

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
  fontFamily: string
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
  background: Background
  overlay: Overlay
  typography: Typography
  layout: StageLayout
  transition: Transition
}
