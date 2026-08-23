import type { Book, SearchResult, Translation, Verse } from '../../types/bible'
import type { BibleSource, InstallProgress } from './BibleSource'
import { highlightRanges } from './BibleSource'
import { booksFor } from '../../data/bibleMeta'
import { MOCK_TRANSLATIONS } from '../../data/mockTranslations'
import { MOCK_CHAPTERS, PLACEHOLDER_VERSE } from '../../data/mockChapters'
import { parseReference } from './parseReference'

/** Simulated I/O latency, so loading states are exercised during development. */
const LATENCY_MS = 90

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

/**
 * In-memory BibleSource for browser development mode.
 *
 * It mirrors the shape of the SQLite-backed source, including async access,
 * per-translation book naming, and staged install progress, so the Bible
 * Manager needs no platform branches and the browser exercises the same code
 * paths the desktop build will.
 */
export class MockBibleSource implements BibleSource {
  private translations: Translation[]
  private progressHandlers = new Set<(progress: InstallProgress) => void>()

  constructor(translations: Translation[] = MOCK_TRANSLATIONS) {
    this.translations = translations.map((t) => ({ ...t }))
  }

  listTranslations(): Promise<Translation[]> {
    return delay(this.translations.map((t) => ({ ...t })))
  }

  getBooks(translationId: string): Promise<Book[]> {
    return delay(booksFor(this.languageOf(translationId)))
  }

  getChapter(translationId: string, bookId: string, chapter: number): Promise<Verse[]> {
    const language = this.languageOf(translationId)
    const bookName = booksFor(language).find((b) => b.id === bookId)?.name ?? bookId
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
        const highlights = highlightRanges(text, needle)
        if (highlights.length === 0) return
        results.push({
          translationId,
          bookId,
          bookName,
          chapter: Number(chapterStr),
          verse: i + 1,
          text,
          highlights,
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

  /**
   * Walks the same phases the real installer reports, so the Bible Manager's
   * progress UI is exercised in the browser. No text is actually fetched —
   * only translations with sample chapters compiled in will have content.
   */
  async install(translationId: string): Promise<void> {
    const phases: Array<[InstallProgress['phase'], number]> = [
      ['downloading', 12], ['downloading', 46], ['downloading', 88],
      ['extracting', 100], ['importing', 40], ['importing', 90],
      ['indexing', 100], ['done', 100],
    ]

    for (const [phase, percent] of phases) {
      await delay(null)
      this.progressHandlers.forEach((h) => h({ translationId, phase, percent }))
    }

    this.translations = this.translations.map((t) =>
      t.id === translationId ? { ...t, installed: true } : t,
    )
  }

  async uninstall(translationId: string): Promise<void> {
    this.translations = this.translations.map((t) =>
      t.id === translationId ? { ...t, installed: false } : t,
    )
    await delay(null)
  }

  async sideload(): Promise<void> {
    throw new Error(
      'Memasang dari berkas hanya tersedia di aplikasi desktop, karena mode browser tidak punya tempat menyimpan pack.',
    )
  }

  onInstallProgress(handler: (progress: InstallProgress) => void): () => void {
    this.progressHandlers.add(handler)
    return () => this.progressHandlers.delete(handler)
  }

  private languageOf(translationId: string): string {
    return this.translations.find((t) => t.id === translationId)?.language ?? 'eng'
  }
}
