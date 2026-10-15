import type { Theme } from './theme'
import type { Verse } from './bible'

/**
 * Workspace mode:
 * - `bible` - Scripture reading, omnibox search, and verse selection.
 * - `live`  - Worship song presentation, slide matrix, and service setlist.
 */
export type AppWorkspaceMode = 'bible' | 'live'

/**
 * What the output window is currently showing.
 *
 * - `live`   – verses or slides are on screen
 * - `clear`  – background only, text hidden (for worship / transitions)
 * - `black`  – full black, used to cut away instantly
 * - `logo`   – idle screen shown before the service starts
 */
export type ProjectionMode = 'live' | 'clear' | 'black' | 'logo'

export type SlideKind = 'bible' | 'song' | 'custom'

/** Universal presentation slide payload (used for songs, lyrics, and custom slides). */
export interface ProjectionSlide {
  kind: SlideKind
  lines: string[]
  /** Section label e.g. "Verse 1", "Chorus", "Bridge" */
  badge?: string
  /** Reference or metadata e.g. "Goodness of God — Bethel Music" */
  reference?: string
  /** Secondary label e.g. "TB", "CCLI #123456" */
  secondaryMeta?: string
  /** Current slide progress indicator e.g. "1 / 3" */
  slideProgress?: string
}

/** The complete snapshot the output window needs in order to render. */
export interface ProjectionState {
  mode: ProjectionMode
  verses: Verse[]
  slide?: ProjectionSlide | null
  theme: Theme
  /** Increments on every push so the stage can retrigger its transition. */
  revision: number
}

