import type { Theme } from './theme'
import type { Verse } from './bible'

/**
 * What the output window is currently showing.
 *
 * - `live`   – verses are on screen
 * - `clear`  – background only, text hidden (for worship / transitions)
 * - `black`  – full black, used to cut away instantly
 * - `logo`   – idle screen shown before the service starts
 */
export type ProjectionMode = 'live' | 'clear' | 'black' | 'logo'

/** The complete snapshot the output window needs in order to render. */
export interface ProjectionState {
  mode: ProjectionMode
  verses: Verse[]
  theme: Theme
  /** Increments on every push so the stage can retrigger its transition. */
  revision: number
}
