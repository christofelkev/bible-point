import type { Book, SearchResult, Translation, Verse } from '../../types/bible'

/** Stages an installation passes through, reported as it runs. */
export type InstallPhase =
  | 'downloading'
  | 'extracting'
  | 'importing'
  | 'indexing'
  | 'done'
  | 'error'

export interface InstallProgress {
  translationId: string
  phase: InstallPhase
  /** 0..100 within the current phase. */
  percent: number
  message?: string
}

/** Details a bare verse-per-line file cannot carry, so the operator supplies them. */
export interface SideloadMeta {
  id: string
  name: string
  abbrev: string
  language: string
  languageName: string
  license: string
}

/**
 * The only way the UI is allowed to reach scripture.
 *
 * Keeping this narrow is what lets the app swap storage without touching a
 * single component: `MockBibleSource` backs browser development, and
 * `TauriBibleSource` talks to the local SQLite packs in the desktop build.
 *
 * Installation lives here too, rather than in a separate service: what
 * translations exist and how one is obtained are the same concern, and putting
 * them behind one interface keeps the Bible Manager free of platform checks.
 */
export interface BibleSource {
  /** Every translation the app knows about, installed or merely downloadable. */
  listTranslations(): Promise<Translation[]>

  /** Books present in a translation, named in that translation's language. */
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

  /** Downloads and installs a translation. Rejects with a human-readable message. */
  install(translationId: string): Promise<void>

  /** Removes an installed translation and everything indexed from it. */
  uninstall(translationId: string): Promise<void>

  /**
   * Installs a translation from a file the operator supplies.
   *
   * The legitimate route for texts the catalog cannot carry. Browser mode has
   * nowhere to store a pack, so it rejects with an explanation rather than
   * pretending to succeed.
   */
  sideload(file: File, meta: SideloadMeta): Promise<void>

  /** Subscribe to installation progress. Returns an unsubscribe function. */
  onInstallProgress(handler: (progress: InstallProgress) => void): () => void
}

/**
 * Finds where a search query appears in a verse, for highlighting.
 *
 * The backend ranks and returns matches but does not say where they are, so
 * this locates each query word case-insensitively. Ranges are merged when they
 * touch, which keeps adjacent words from rendering as separate marks.
 */
export function highlightRanges(text: string, query: string): Array<[number, number]> {
  const haystack = text.toLowerCase()
  const found: Array<[number, number]> = []

  for (const token of query.toLowerCase().split(/\s+/).filter((t) => t.length > 1)) {
    let from = 0
    for (;;) {
      const at = haystack.indexOf(token, from)
      if (at === -1) break
      found.push([at, at + token.length])
      from = at + token.length
    }
  }

  if (found.length === 0) return []

  found.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = [found[0]]
  for (const [start, end] of found.slice(1)) {
    const last = merged[merged.length - 1]
    if (start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }
  return merged
}
