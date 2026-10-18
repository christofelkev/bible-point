import { isTauri } from '../platform'
import { isSongList, type SongStore } from './SongStore'
import type { Song } from '../../types/song'

export type { SongStore } from './SongStore'
export { isSongList } from './SongStore'

const BROWSER_KEY = 'bible-point/songs'

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

export const songStore: SongStore = isTauri()
  ? new TauriSongStore()
  : new BrowserSongStore()
