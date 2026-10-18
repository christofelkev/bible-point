import type { ProjectionSlide } from './projection'

/** A distinct section of a song (e.g. Verse 1, Chorus, Bridge) */
export interface SongSection {
  id: string
  /** Section badge/type e.g. "Verse 1", "Chorus", "Bridge", "Tag", "Ending" */
  label: string
  /** The lines belonging to this section */
  lines: string[]
}

/** Complete song domain object */
export interface Song {
  id: string
  title: string
  artist: string
  key: string
  tempo: number
  /** e.g. "V1 → C → V2 → C → B → C → Tag" */
  arrangement?: string
  /** Raw lyrics text as pasted/edited by the operator */
  rawLyrics?: string
  /** Copyright / CCLI license text */
  ccli?: string
  /** Optional custom background override for this song */
  defaultBackgroundPath?: string
  /** Pre-compiled projection slides ready to be sent to stage */
  slides: ProjectionSlide[]
  createdAt?: string
  updatedAt?: string
}
