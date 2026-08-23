import { BookMarked, ChevronLeft, ChevronRight, ListPlus, Play, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/controls'
import type { SearchResult } from '../../types/bible'

/**
 * Centre column: the chapter being read, or search results when a query is
 * active. Selecting verses here is what feeds Go Live and the service order.
 */
export function VerseList() {
  const searchQuery = useAppStore((s) => s.searchQuery)
  const searchResults = useAppStore((s) => s.searchResults)
  const searching = useAppStore((s) => s.searching)
  const activeTranslationId = useAppStore((s) => s.activeTranslationId)

  const showingSearch = searchQuery.trim().length >= 2

  return (
    <main className="flex-1 min-w-0 flex flex-col bg-ink-950">
      {!activeTranslationId ? (
        <NoTranslationInstalled />
      ) : showingSearch ? (
        <SearchResults results={searchResults} loading={searching} />
      ) : (
        <ChapterReader />
      )}
    </main>
  )
}

/**
 * Shown before the first pack is installed. A blank reader would read as a bug,
 * so say plainly what is missing and where to fix it.
 */
function NoTranslationInstalled() {
  const setPanelTab = useAppStore((s) => s.setPanelTab)

  return (
    <div className="flex-1 grid place-items-center px-8 text-center">
      <div className="max-w-[380px]">
        <BookMarked size={28} className="mx-auto text-ink-600 mb-4" />
        <h2 className="text-sm font-semibold text-white">Belum ada Alkitab terpasang</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-ink-400">
          Bible Point tidak membawa teks Alkitab bawaan. Pasang satu terjemahan
          lewat Bible Manager — sekali unduh, setelah itu bisa dipakai tanpa internet.
        </p>
        <Button variant="brand" className="mt-4" onClick={() => setPanelTab('library')}>
          <BookMarked size={13} /> Buka Bible Manager
        </Button>
      </div>
    </div>
  )
}

function ChapterReader() {
  const books = useAppStore((s) => s.books)
  const activeBookId = useAppStore((s) => s.activeBookId)
  const activeChapter = useAppStore((s) => s.activeChapter)
  const verses = useAppStore((s) => s.chapterVerses)
  const loading = useAppStore((s) => s.loadingChapter)
  const selection = useAppStore((s) => s.selection)
  const liveVerses = useAppStore((s) => s.liveVerses)
  const mode = useAppStore((s) => s.mode)
  const toggleVerse = useAppStore((s) => s.toggleVerse)
  const goLive = useAppStore((s) => s.goLive)
  const stepChapter = useAppStore((s) => s.stepChapter)
  const addToPlaylist = useAppStore((s) => s.addToPlaylist)
  const clearSelection = useAppStore((s) => s.clearSelection)

  const book = books.find((b) => b.id === activeBookId)
  const liveNumbers = new Set(mode === 'live' ? liveVerses.map((v) => v.verse) : [])

  return (
    <>
      <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b border-ink-800">
        <Button size="sm" variant="ghost" onClick={() => stepChapter(-1)} title="Pasal sebelumnya">
          <ChevronLeft size={14} />
        </Button>
        <h2 className="text-sm font-semibold tracking-tight">
          {book?.name} {activeChapter}
        </h2>
        <Button size="sm" variant="ghost" onClick={() => stepChapter(1)} title="Pasal berikutnya">
          <ChevronRight size={14} />
        </Button>

        <div className="flex-1" />

        {selection.length > 0 && (
          <>
            <span className="text-[11px] text-ink-400 tabular-nums">
              {selection.length} ayat dipilih
            </span>
            <Button size="sm" variant="ghost" onClick={clearSelection} title="Batal pilih">
              <X size={13} />
            </Button>
            <Button size="sm" variant="solid" onClick={() => addToPlaylist()}>
              <ListPlus size={13} /> Antrian
            </Button>
            <Button size="sm" variant="brand" onClick={() => goLive()}>
              <Play size={12} /> Tayangkan
            </Button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full grid place-items-center text-ink-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (
          <ol className="p-2">
            {verses.map((v) => {
              const selected = selection.includes(v.verse)
              const live = liveNumbers.has(v.verse)
              return (
                <li key={v.verse}>
                  <button
                    onClick={(e) => toggleVerse(v.verse, e.shiftKey)}
                    onDoubleClick={() => goLive([v])}
                    className={clsx(
                      'w-full text-left flex gap-3 rounded-lg px-3 py-2 transition-colors group',
                      selected ? 'bg-brand-500/12' : 'hover:bg-ink-900',
                    )}
                  >
                    <span
                      className={clsx(
                        'shrink-0 w-6 text-right text-[11px] tabular-nums pt-[3px] font-medium',
                        live ? 'text-red-400' : selected ? 'text-brand-400' : 'text-ink-400',
                      )}
                    >
                      {v.verse}
                    </span>
                    <span
                      className={clsx(
                        'text-[13px] leading-relaxed',
                        selected ? 'text-white' : 'text-ink-300 group-hover:text-white',
                      )}
                    >
                      {v.text}
                    </span>
                    {live && (
                      <span className="shrink-0 self-start mt-[3px] text-[8px] font-bold uppercase tracking-wider text-red-400 border border-red-400/40 rounded px-1 py-px">
                        Live
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <div className="h-8 shrink-0 flex items-center px-3 border-t border-ink-800 text-[10px] text-ink-400 gap-4">
        <span>Klik = pilih</span>
        <span>Shift+klik = pilih rentang</span>
        <span>Klik dua kali = langsung tayang</span>
      </div>
    </>
  )
}

function SearchResults({ results, loading }: { results: SearchResult[]; loading: boolean }) {
  const searchQuery = useAppStore((s) => s.searchQuery)
  const goLive = useAppStore((s) => s.goLive)
  const openChapter = useAppStore((s) => s.openChapter)
  const clearSearch = useAppStore((s) => s.clearSearch)

  return (
    <>
      <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b border-ink-800">
        <h2 className="text-sm font-semibold tracking-tight">
          Hasil pencarian
          <span className="ml-2 text-[11px] font-normal text-ink-400 tabular-nums">
            {loading ? '…' : `${results.length} ayat`}
          </span>
        </h2>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={clearSearch}>
          <X size={13} /> Tutup
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full grid place-items-center text-ink-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="h-full grid place-items-center px-8 text-center">
            <div>
              <p className="text-sm text-ink-300">Tidak ada hasil untuk "{searchQuery}"</p>
              <p className="mt-1.5 text-[11px] text-ink-400 max-w-[340px]">
                Data contoh baru mencakup beberapa pasal. Pasang Bible pack lengkap
                lewat tab Alkitab untuk mencari seluruh isi Alkitab.
              </p>
            </div>
          </div>
        ) : (
          <ol className="p-2 space-y-0.5">
            {results.map((r) => (
              <li key={`${r.bookId}-${r.chapter}-${r.verse}`}>
                <button
                  onClick={() => { clearSearch(); openChapter(r.bookId, r.chapter) }}
                  onDoubleClick={() => goLive([r])}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-ink-900 transition-colors group"
                >
                  <div className="text-[10px] font-medium text-brand-400 mb-0.5">
                    {r.bookName} {r.chapter}:{r.verse}
                  </div>
                  <p className="text-[13px] leading-relaxed text-ink-300 group-hover:text-white">
                    <Highlighted text={r.text} ranges={r.highlights} />
                  </p>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  )
}

function Highlighted({ text, ranges }: { text: string; ranges: Array<[number, number]> }) {
  if (ranges.length === 0) return <>{text}</>
  const [start, end] = ranges[0]
  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-brand-500/30 text-brand-400 rounded-sm px-0.5">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  )
}
