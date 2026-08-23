/**
 * Domain types for Bible content.
 *
 * These are storage-agnostic on purpose: the same shapes come back whether the
 * verses were read from a downloaded local pack (SQLite), a remote API, or the
 * in-memory mock used during frontend development.
 */

export type TestamentId = 'OT' | 'NT'

/** A Bible translation available to the app, installed or not. */
export interface Translation {
  /** Stable pack id from the source catalog, e.g. "indayt", "eng-kjv2006". */
  id: string
  /** Full display name, e.g. "Alkitab Yang Terbuka". */
  name: string
  /** Short label shown in dense UI, e.g. "AYT". */
  abbrev: string
  /** Language code as the catalog publishes it, e.g. "ind", "eng". */
  language: string
  /** Human-readable language name, used to group the Bible Manager. */
  languageName: string
  /**
   * Copyright line exactly as the publisher states it.
   *
   * Shown wherever the translation is, and never synthesised — it is the record
   * of why redistributing this text is permitted.
   */
  license: string
  /** Year of publication, when the copyright line names one. */
  year?: number
  /** Whether the pack is present locally and ready to project. */
  installed: boolean
  /** Verses the pack contains; more meaningful to an operator than megabytes. */
  verseCount: number
  hasOldTestament: boolean
  hasNewTestament: boolean
  /** Bytes on disk. Known only once installed. */
  sizeBytes?: number
  /** Publisher's page for this translation. */
  sourceUrl?: string
}

export interface Book {
  /** Canonical short id, e.g. "JHN". */
  id: string
  name: string
  abbrev: string
  testament: TestamentId
  /** Number of chapters; the navigator uses this to build the chapter grid. */
  chapterCount: number
}

export interface Verse {
  translationId: string
  bookId: string
  bookName: string
  chapter: number
  verse: number
  text: string
}

export interface SearchResult extends Verse {
  /** Character ranges in `text` that matched the query, for highlighting. */
  highlights: Array<[start: number, end: number]>
}

/** Formats a verse reference the way it is shown on stage, e.g. "Yohanes 3:16". */
export function formatReference(verse: Pick<Verse, 'bookName' | 'chapter' | 'verse'>): string {
  return `${verse.bookName} ${verse.chapter}:${verse.verse}`
}

/** Formats a contiguous range, e.g. "Yohanes 3:16-18". Falls back to a single ref. */
export function formatRange(verses: Verse[]): string {
  if (verses.length === 0) return ''
  const first = verses[0]
  const last = verses[verses.length - 1]
  if (first.verse === last.verse) return formatReference(first)
  return `${first.bookName} ${first.chapter}:${first.verse}-${last.verse}`
}
