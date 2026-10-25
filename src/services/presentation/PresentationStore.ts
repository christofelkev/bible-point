import type { PresentationDeck } from '../../types/presentation'

export interface PresentationStore {
  /** Loads the saved presentations, or returns null if no file has been saved yet */
  load(): Promise<PresentationDeck[] | null>
  /** Atomically saves the list of presentations */
  save(decks: PresentationDeck[]): Promise<void>
  /** Saves a slide image (PNG) and returns the accessible URL and file path */
  saveSlideImage(
    deckId: string,
    slideIndex: number,
    bytes: Uint8Array,
  ): Promise<{ url: string; path?: string }>
  /** Deletes a presentation deck and all its stored slide images */
  deleteDeck(deckId: string): Promise<void>
  /** Converts a PPTX presentation to slide images on Windows */
  convertPptx(
    deckId: string,
    filePath: string,
  ): Promise<Array<{ url: string; path: string }>>
}

/** Validates that loaded content is an array of PresentationDeck objects */
export function isPresentationDeckList(value: unknown): value is PresentationDeck[] {
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
