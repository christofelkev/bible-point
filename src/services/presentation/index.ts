import { isTauri } from '../platform'
import { isPresentationDeckList, type PresentationStore } from './PresentationStore'
import type { PresentationDeck } from '../../types/presentation'

export type { PresentationStore } from './PresentationStore'
export { isPresentationDeckList } from './PresentationStore'

const BROWSER_KEY = 'bible-point/presentations'

class TauriPresentationStore implements PresentationStore {
  async load(): Promise<PresentationDeck[] | null> {
    try {
      const { invoke, convertFileSrc } = await import('@tauri-apps/api/core')
      const raw = await invoke<string | null>('load_presentations')
      if (!raw) return null
      const parsed = JSON.parse(raw) as unknown
      if (!isPresentationDeckList(parsed)) return null

      // Rehydrate image URLs from stable disk paths so they work across restarts
      for (const deck of parsed) {
        for (const slide of deck.slides) {
          if (slide.imagePath) {
            slide.imageUrl = convertFileSrc(slide.imagePath)
          }
        }
      }
      return parsed
    } catch (e) {
      console.warn('Gagal memuat presentasi dari Tauri backend:', e)
      return null
    }
  }

  async save(decks: PresentationDeck[]): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('save_presentations', { contents: JSON.stringify(decks, null, 2) })
  }

  async saveSlideImage(
    deckId: string,
    slideIndex: number,
    bytes: Uint8Array,
  ): Promise<{ url: string; path?: string }> {
    const { invoke, convertFileSrc } = await import('@tauri-apps/api/core')
    const path = await invoke<string>('save_presentation_slide', {
      deckId,
      slideIndex,
      bytes: Array.from(bytes),
    })
    return { url: convertFileSrc(path), path }
  }

  async deleteDeck(deckId: string): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('delete_presentation_deck', { deckId })
  }

  async convertPptx(
    deckId: string,
    filePath: string,
  ): Promise<Array<{ url: string; path: string }>> {
    const { invoke, convertFileSrc } = await import('@tauri-apps/api/core')
    const paths = await invoke<string[]>('convert_pptx_slides', {
      deckId,
      pptxPath: filePath,
    })
    return paths.map((p) => ({ url: convertFileSrc(p), path: p }))
  }
}

class BrowserPresentationStore implements PresentationStore {
  async load(): Promise<PresentationDeck[] | null> {
    const raw = localStorage.getItem(BROWSER_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as unknown
      return isPresentationDeckList(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  async save(decks: PresentationDeck[]): Promise<void> {
    localStorage.setItem(BROWSER_KEY, JSON.stringify(decks))
  }

  async saveSlideImage(
    _deckId: string,
    _slideIndex: number,
    bytes: Uint8Array,
  ): Promise<{ url: string; path?: string }> {
    // In browser mode, slide images are stored as in-memory blob URLs
    const blob = new Blob([bytes as BlobPart], { type: 'image/png' })
    return { url: URL.createObjectURL(blob) }
  }

  async deleteDeck(_deckId: string): Promise<void> {
    // No-op for disk files in browser mode
  }

  async convertPptx(
    _deckId: string,
    _filePath: string,
  ): Promise<Array<{ url: string; path: string }>> {
    throw new Error(
      'Konversi file PowerPoint (.pptx) langsung memerlukan Microsoft Office di Windows. ' +
        'Silakan buka file Anda di PowerPoint / Canva / Google Slides dan ekspor sebagai PDF, ' +
        'lalu gunakan tombol Import PDF.',
    )
  }
}

export const presentationStore: PresentationStore = isTauri()
  ? new TauriPresentationStore()
  : new BrowserPresentationStore()
