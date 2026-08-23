import type { Book, SearchResult, Translation, Verse } from '../../types/bible'
import type { BibleSource } from './BibleSource'
import { MOCK_TRANSLATIONS, booksFor } from '../../data/bibleMeta'
import { MOCK_CHAPTERS, PLACEHOLDER_VERSE } from '../../data/mockChapters'

/** Simulated I/O latency, so loading states are exercised during development. */
const LATENCY_MS = 90

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

/**
 * In-memory BibleSource used while the frontend is built.
 *
 * It deliberately mimics the shape of the eventual SQLite-backed source,
 * including async access and per-translation book naming, so swapping in the
 * real implementation is a one-line change in `services/bible/index.ts`.
 */
export class MockBibleSource implements BibleSource {
  private translations: Translation[]

  constructor(translations: Translation[] = MOCK_TRANSLATIONS) {
    this.translations = translations.map((t) => ({ ...t }))
  }

  listTranslations(): Promise<Translation[]> {
    return delay(this.translations.map((t) => ({ ...t })))
  }

  /** Stands in for a pack download; flips the translation to installed. */
  install(translationId: string): Promise<Translation[]> {
    this.translations = this.translations.map((t) =>
      t.id === translationId ? { ...t, installed: true } : t,
    )
    return this.listTranslations()
  }

  uninstall(translationId: string): Promise<Translation[]> {
    this.translations = this.translations.map((t) =>
      t.id === translationId ? { ...t, installed: false } : t,
    )
    return this.listTranslations()
  }

  getBooks(translationId: string): Promise<Book[]> {
    const language = this.languageOf(translationId)
    return delay(booksFor(language))
  }

  getChapter(translationId: string, bookId: string, chapter: number): Promise<Verse[]> {
    const language = this.languageOf(translationId)
    const book = booksFor(language).find((b) => b.id === bookId)
    const bookName = book?.name ?? bookId
    const texts = MOCK_CHAPTERS[translationId]?.[`${bookId}:${chapter}`]

    // Chapters outside the sample set still render, with one placeholder verse,
    // so navigating the full canon never dead-ends during development.
    const verses: Verse[] = (texts ?? [PLACEHOLDER_VERSE]).map((text, i) => ({
      translationId,
      bookId,
      bookName,
      chapter,
      verse: i + 1,
      text,
    }))

    return delay(verses)
  }

  async search(translationId: string, query: string, limit = 50): Promise<SearchResult[]> {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []

    const language = this.languageOf(translationId)
    const books = booksFor(language)
    const chapters = MOCK_CHAPTERS[translationId] ?? {}
    const results: SearchResult[] = []

    for (const [key, texts] of Object.entries(chapters)) {
      const [bookId, chapterStr] = key.split(':')
      const bookName = books.find((b) => b.id === bookId)?.name ?? bookId
      texts.forEach((text, i) => {
        if (results.length >= limit) return
        const at = text.toLowerCase().indexOf(needle)
        if (at === -1) return
        results.push({
          translationId,
          bookId,
          bookName,
          chapter: Number(chapterStr),
          verse: i + 1,
          text,
          highlights: [[at, at + needle.length]],
        })
      })
    }

    return delay(results)
  }

  async lookupReference(translationId: string, reference: string): Promise<Verse[]> {
    const parsed = parseReference(reference, await this.getBooks(translationId))
    if (!parsed) return []

    const verses = await this.getChapter(translationId, parsed.bookId, parsed.chapter)
    if (parsed.verseStart == null) return verses

    const end = parsed.verseEnd ?? parsed.verseStart
    return verses.filter((v) => v.verse >= parsed.verseStart! && v.verse <= end)
  }

  private languageOf(translationId: string): string {
    return this.translations.find((t) => t.id === translationId)?.language ?? 'en'
  }
}

interface ParsedReference {
  bookId: string
  chapter: number
  verseStart?: number
  verseEnd?: number
}

/**
 * Parses references the way a person types them under time pressure:
 * "yoh 3:16", "Yohanes 3", "php 4:6-7", "1 kor 13:4".
 *
 * Book matching is a case-insensitive prefix match against both the full name
 * and the abbreviation, which is forgiving enough for the quick-jump box.
 */
export function parseReference(input: string, books: Book[]): ParsedReference | null {
  const cleaned = input.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!cleaned) return null

  const match = cleaned.match(/^(.+?)\s*(\d+)(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!match) return null

  const [, rawBook, chapterStr, verseStartStr, verseEndStr] = match
  const bookQuery = rawBook.trim()
  if (!bookQuery) return null

  const book =
    books.find((b) => b.name.toLowerCase() === bookQuery || b.abbrev.toLowerCase() === bookQuery) ??
    books.find((b) => b.name.toLowerCase().startsWith(bookQuery) || b.abbrev.toLowerCase().startsWith(bookQuery))

  if (!book) return null

  const chapter = Number(chapterStr)
  if (chapter < 1 || chapter > book.chapterCount) return null

  return {
    bookId: book.id,
    chapter,
    verseStart: verseStartStr ? Number(verseStartStr) : undefined,
    verseEnd: verseEndStr ? Number(verseEndStr) : undefined,
  }
}
