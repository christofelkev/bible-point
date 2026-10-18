import type { Song } from '../../types/song'

export interface SongStore {
  /** Loads the saved songs, or returns null if no file has been saved yet */
  load(): Promise<Song[] | null>
  /** Atomically saves the list of songs */
  save(songs: Song[]): Promise<void>
}

/** Validates that loaded content is an array of Song objects */
export function isSongList(value: unknown): value is Song[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      Array.isArray(item.slides),
  )
}
