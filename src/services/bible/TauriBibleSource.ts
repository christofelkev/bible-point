import type { Book, SearchResult, Translation, Verse } from '../../types/bible'
import type { BibleSource, InstallProgress, SideloadMeta } from './BibleSource'
import { highlightRanges } from './BibleSource'
import { namedBooks, bookNameFor } from '../../data/bibleMeta'
import { parseReference } from './parseReference'

const PROGRESS_EVENT = 'bible-point://install-progress'

/** Shape the Rust `get_books` command returns. */
interface BookRow {
  bookId: string
  chapterCount: number
}

/** Shape the Rust verse commands return; the book name is added on this side. */
interface VerseRow {
  translationId: string
  bookId: string
  chapter: number
  verse: number
  text: string
}

/**
 * Reads scripture from the local SQLite packs through Tauri commands.
 *
 * Verse *text* comes from the database; book *names* stay in the frontend,
 * because a pack ships USFM book codes and knows nothing about what to call
 * them in Indonesian. Chapter counts come from the pack rather than the canon,
 * so a New Testament-only translation never offers an empty chapter.
 */
export class TauriBibleSource implements BibleSource {
  private languages = new Map<string, string>()
  private progressHandlers = new Set<(progress: InstallProgress) => void>()
  private progressListener: Promise<() => void> | null = null

  async listTranslations(): Promise<Translation[]> {
    const { invoke } = await import('@tauri-apps/api/core')
    const translations = await invoke<Translation[]>('list_catalog')
    // Book naming needs the language of any translation the operator opens,
    // including ones resolved from a cached list later.
    translations.forEach((t) => this.languages.set(t.id, t.language))
    return translations
  }

  async getBooks(translationId: string): Promise<Book[]> {
    const { invoke } = await import('@tauri-apps/api/core')
    const rows = await invoke<BookRow[]>('get_books', { translationId })
    return namedBooks(await this.languageOf(translationId), rows)
  }

  async getChapter(translationId: string, bookId: string, chapter: number): Promise<Verse[]> {
    const { invoke } = await import('@tauri-apps/api/core')
    const rows = await invoke<VerseRow[]>('get_chapter', { translationId, bookId, chapter })
    const language = await this.languageOf(translationId)
    return rows.map((r) => ({ ...r, bookName: bookNameFor(language, r.bookId) }))
  }

  async search(translationId: string, query: string, limit = 100): Promise<SearchResult[]> {
    const { invoke } = await import('@tauri-apps/api/core')
    const rows = await invoke<VerseRow[]>('search_verses', { translationId, query, limit })
    const language = await this.languageOf(translationId)
    return rows.map((r) => ({
      ...r,
      bookName: bookNameFor(language, r.bookId),
      highlights: highlightRanges(r.text, query),
    }))
  }

  async lookupReference(translationId: string, reference: string): Promise<Verse[]> {
    const parsed = parseReference(reference, await this.getBooks(translationId))
    if (!parsed) return []

    const verses = await this.getChapter(translationId, parsed.bookId, parsed.chapter)
    if (parsed.verseStart == null) return verses

    const end = parsed.verseEnd ?? parsed.verseStart
    return verses.filter((v) => v.verse >= parsed.verseStart! && v.verse <= end)
  }

  async install(translationId: string): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('install_translation', { translationId })
  }

  async uninstall(translationId: string): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('uninstall_translation', { translationId })
  }

  async sideload(file: File, meta: SideloadMeta): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    const bytes = new Uint8Array(await file.arrayBuffer())
    await invoke('sideload_translation', { fileName: file.name, bytes, meta })
  }

  onInstallProgress(handler: (progress: InstallProgress) => void): () => void {
    this.progressHandlers.add(handler)
    this.ensureProgressListener()
    return () => this.progressHandlers.delete(handler)
  }

  /**
   * Attaches the Tauri listener once, lazily.
   *
   * The event API is async while this interface is synchronous, so handlers
   * live in a Set that the resolved listener dispatches into — anyone who
   * subscribes before it resolves still receives every event.
   */
  private ensureProgressListener(): void {
    if (this.progressListener) return
    this.progressListener = import('@tauri-apps/api/event').then(({ listen }) =>
      listen<InstallProgress>(PROGRESS_EVENT, (event) => {
        this.progressHandlers.forEach((h) => h(event.payload))
      }),
    )
  }

  private async languageOf(translationId: string): Promise<string> {
    const known = this.languages.get(translationId)
    if (known) return known
    // A cold start can ask for a chapter before the catalog has been listed.
    await this.listTranslations()
    return this.languages.get(translationId) ?? 'eng'
  }
}
