import type { SongLibraryTree } from '../../types/song'

export interface LibraryTreeStore {
  /** Loads persisted folders & playlists tree, or null if not yet saved */
  load(): Promise<SongLibraryTree | null>
  /** Atomically saves the folders & playlists tree */
  save(tree: SongLibraryTree): Promise<void>
}

/** Runtime type guard for SongLibraryTree */
export function isSongLibraryTree(value: unknown): value is SongLibraryTree {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  if (!Array.isArray(candidate.folders) || !Array.isArray(candidate.playlists)) return false

  const validFolders = candidate.folders.every(
    (f) => typeof f === 'object' && f !== null && typeof f.id === 'string' && typeof f.name === 'string',
  )
  const validPlaylists = candidate.playlists.every(
    (p) =>
      typeof p === 'object' &&
      p !== null &&
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      Array.isArray(p.songIds),
  )

  return validFolders && validPlaylists
}
