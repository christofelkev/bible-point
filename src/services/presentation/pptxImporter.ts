import type { PresentationDeck, PresentationSlideItem } from '../../types/presentation'
import { presentationStore } from './index'

export interface ImportPptxProgressCallback {
  (message: string): void
}

/**
 * Imports a PPTX file using Windows PowerPoint COM automation via Tauri.
 *
 * If Microsoft PowerPoint is installed, slides are exported directly to high-res PNGs.
 * If not installed, throws a descriptive error prompting the user to export as PDF.
 */
export async function importPptxToDeck(
  filePath: string,
  fileName: string,
  onProgress?: ImportPptxProgressCallback,
): Promise<PresentationDeck> {
  onProgress?.('Mengekspor slide PowerPoint ke gambar beresolusi tinggi...')

  const deckId = `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const title = fileName.replace(/\.[^/.]+$/, '')

  const exportedSlides = await presentationStore.convertPptx(deckId, filePath)

  const slides: PresentationSlideItem[] = exportedSlides.map((slide, index) => ({
    id: `${deckId}-s${index}`,
    deckId,
    index,
    imageUrl: slide.url,
    imagePath: slide.path,
    badge: `Slide ${index + 1}`,
  }))

  const deck: PresentationDeck = {
    id: deckId,
    title,
    sourceFileName: fileName,
    sourceType: 'pptx',
    slideCount: slides.length,
    slides,
    createdAt: new Date().toISOString(),
  }

  return deck
}
