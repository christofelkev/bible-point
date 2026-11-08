import { isTauri } from '../platform'
import { isSongList, type SongStore } from './SongStore'
import { isSongLibraryTree, type LibraryTreeStore } from './LibraryTreeStore'
import type { Song, SongLibraryTree } from '../../types/song'

export type { SongStore } from './SongStore'
export { isSongList } from './SongStore'
export type { LibraryTreeStore } from './LibraryTreeStore'
export { isSongLibraryTree } from './LibraryTreeStore'

const BROWSER_KEY = 'bible-point/songs'
const BROWSER_TREE_KEY = 'bible-point/library-tree'

class TauriSongStore implements SongStore {
  async load(): Promise<Song[] | null> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const raw = await invoke<string | null>('load_songs')
      if (!raw) return null
      const parsed = JSON.parse(raw) as unknown
      return isSongList(parsed) ? parsed : null
    } catch (e) {
      console.warn('Gagal memuat songs dari Tauri backend, memulai dengan daftar awal:', e)
      return null
    }
  }

  async save(songs: Song[]): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('save_songs', { contents: JSON.stringify(songs, null, 2) })
  }
}

class BrowserSongStore implements SongStore {
  async load(): Promise<Song[] | null> {
    const raw = localStorage.getItem(BROWSER_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as unknown
      return isSongList(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  async save(songs: Song[]): Promise<void> {
    localStorage.setItem(BROWSER_KEY, JSON.stringify(songs))
  }
}

class TauriLibraryTreeStore implements LibraryTreeStore {
  async load(): Promise<SongLibraryTree | null> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const raw = await invoke<string | null>('load_library_tree')
      if (!raw) return null
      const parsed = JSON.parse(raw) as unknown
      return isSongLibraryTree(parsed) ? parsed : null
    } catch (e) {
      console.warn('Gagal memuat library tree dari Tauri backend:', e)
      return null
    }
  }

  async save(tree: SongLibraryTree): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('save_library_tree', { contents: JSON.stringify(tree, null, 2) })
  }
}

class BrowserLibraryTreeStore implements LibraryTreeStore {
  async load(): Promise<SongLibraryTree | null> {
    const raw = localStorage.getItem(BROWSER_TREE_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as unknown
      return isSongLibraryTree(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  async save(tree: SongLibraryTree): Promise<void> {
    localStorage.setItem(BROWSER_TREE_KEY, JSON.stringify(tree))
  }
}

export const songStore: SongStore = isTauri()
  ? new TauriSongStore()
  : new BrowserSongStore()

export const libraryTreeStore: LibraryTreeStore = isTauri()
  ? new TauriLibraryTreeStore()
  : new BrowserLibraryTreeStore()
