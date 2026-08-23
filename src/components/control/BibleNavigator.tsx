import { useMemo, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { SAMPLE_CHAPTERS } from '../../data/mockChapters'

/**
 * Two-column canon browser: books on the left, chapters of the selected book on
 * the right. Both stay visible at once so jumping between chapters mid-service
 * never costs an extra click.
 */
export function BibleNavigator() {
  const books = useAppStore((s) => s.books)
  const activeBookId = useAppStore((s) => s.activeBookId)
  const activeChapter = useAppStore((s) => s.activeChapter)
  const openChapter = useAppStore((s) => s.openChapter)

  const activeBook = books.find((b) => b.id === activeBookId)
  const bookRef = useRef<HTMLButtonElement>(null)

  // Keep the selected book in view when navigation comes from elsewhere
  // (omnibox jump, chapter roll-over into the next book).
  useEffect(() => {
    bookRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeBookId])

  const grouped = useMemo(() => ({
    OT: books.filter((b) => b.testament === 'OT'),
    NT: books.filter((b) => b.testament === 'NT'),
  }), [books])

  /** Chapters carrying sample text get a dot, so the demo's content is findable. */
  const sampleChapters = useMemo(
    () => new Set(SAMPLE_CHAPTERS.filter((s) => s.bookId === activeBookId).map((s) => s.chapter)),
    [activeBookId],
  )

  return (
    <aside className="w-[268px] shrink-0 flex border-r border-ink-800 bg-ink-900 overflow-hidden">
      <div className="w-[168px] shrink-0 overflow-y-auto border-r border-ink-800">
        {(['OT', 'NT'] as const).map((testament) => (
          <div key={testament}>
            <div className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-400 border-b border-ink-850">
              {testament === 'OT' ? 'Perjanjian Lama' : 'Perjanjian Baru'}
            </div>
            {grouped[testament].map((book) => (
              <button
                key={book.id}
                ref={book.id === activeBookId ? bookRef : undefined}
                onClick={() => openChapter(book.id, 1)}
                className={clsx(
                  'w-full text-left px-3 py-[7px] text-xs transition-colors flex items-center justify-between group',
                  book.id === activeBookId
                    ? 'bg-brand-500/12 text-brand-400 font-medium'
                    : 'text-ink-300 hover:bg-ink-850',
                )}
              >
                <span className="truncate">{book.name}</span>
                <span className="text-[9px] text-ink-400/60 tabular-nums shrink-0 ml-1.5">
                  {book.chapterCount}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-400 border-b border-ink-850 truncate">
          {activeBook?.name ?? 'Pasal'}
        </div>
        <div className="grid grid-cols-3 gap-1 p-2">
          {Array.from({ length: activeBook?.chapterCount ?? 0 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => openChapter(activeBookId, n)}
              className={clsx(
                'relative h-8 rounded-md text-[11px] tabular-nums transition-colors',
                n === activeChapter
                  ? 'bg-brand-500 text-ink-950 font-semibold'
                  : 'bg-ink-850 text-ink-300 hover:bg-ink-800 hover:text-white',
              )}
            >
              {n}
              {sampleChapters.has(n) && n !== activeChapter && (
                <span
                  title="Ada teks contoh"
                  className="absolute top-1 right-1 h-1 w-1 rounded-full bg-brand-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
