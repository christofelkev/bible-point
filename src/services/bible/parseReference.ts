import type { Book } from '../../types/bible'

export interface ParsedReference {
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
 *
 * Shared by every BibleSource: the rules an operator types under are the same
 * whether the verses come from a mock, from SQLite, or from anywhere else.
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
    books.find(
      (b) => b.name.toLowerCase() === bookQuery || b.abbrev.toLowerCase() === bookQuery,
    ) ??
    books.find(
      (b) =>
        b.name.toLowerCase().startsWith(bookQuery) ||
        b.abbrev.toLowerCase().startsWith(bookQuery),
    )

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
