import type { Book, SearchResult, Translation, Verse } from '../../types/bible'

/**
 * The only way the UI is allowed to reach scripture.
 *
 * Keeping this narrow is what lets the app swap storage without touching a
 * single component: `MockBibleSource` backs frontend development today, and a
 * `TauriBibleSource` talking to local SQLite packs replaces it later. A remote
 * `ApiBibleSource` could slot in the same way if online lookup is ever wanted.
 */
export interface BibleSource {
  /** Every translation the app knows about, installed or merely downloadable. */
  listTranslations(): Promise<Translation[]>

  /** Books of a translation, named in that translation's language. */
  getBooks(translationId: string): Promise<Book[]>

  /** All verses of one chapter, in order. */
  getChapter(translationId: string, bookId: string, chapter: number): Promise<Verse[]>

  /**
   * Full-text search within one translation.
   * `limit` caps results so the UI never has to render an unbounded list.
   */
  search(translationId: string, query: string, limit?: number): Promise<SearchResult[]>

  /**
   * Resolves a free-text reference like "yoh 3:16" or "mazmur 23" into verses.
   * Returns an empty array when the reference cannot be parsed or found.
   */
  lookupReference(translationId: string, reference: string): Promise<Verse[]>
}
