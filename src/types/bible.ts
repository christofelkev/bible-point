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
  /** Stable pack id, e.g. "id-tb", "en-kjv". */
  id: string
  /** Full display name, e.g. "Terjemahan Baru". */
  name: string
  /** Short label shown in dense UI, e.g. "TB". */
  abbrev: string
  /** BCP-47-ish language tag, e.g. "id", "en". */
  language: string
  /** Human-readable language name for grouping in the UI. */
  languageName: string
  /** Copyright / licence line shown in the Bible Manager. */
  license: string
  /** Year of publication, when known. */
  year?: number
  /** Whether the pack is present locally and ready to project. */
  installed: boolean
  /** Download size of the pack, used by the Bible Manager. */
  sizeBytes: number
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
