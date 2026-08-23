import { create } from 'zustand'
import type { Book, SearchResult, Translation, Verse } from '../types/bible'
import type { Background, Theme, Typography, StageLayout, Overlay, Transition } from '../types/theme'
import type { ProjectionMode, ProjectionState } from '../types/projection'
import { bibleSource } from '../services/bible'
import { projectionChannel, outputWindow, defaultMonitor } from '../services/projection'
import type { MonitorInfo } from '../services/projection'
import { isTauri } from '../services/platform'
import { BUILTIN_THEMES } from '../data/presets'
import { formatRange } from '../types/bible'

/** One entry in the service order the operator builds before the meeting. */
export interface PlaylistItem {
  id: string
  label: string
  verses: Verse[]
  /** Theme override; falls back to the active theme when absent. */
  themeId?: string
}

export type PanelTab = 'design' | 'playlist' | 'library'

interface AppState {
  // --- Bible content -------------------------------------------------------
  translations: Translation[]
  activeTranslationId: string
  books: Book[]
  activeBookId: string
  activeChapter: number
  chapterVerses: Verse[]
  loadingChapter: boolean

  // --- Selection in the verse list ----------------------------------------
  /** Verse numbers currently ticked in the chapter list. */
  selection: number[]

  // --- Search --------------------------------------------------------------
  searchQuery: string
  searchResults: SearchResult[]
  searching: boolean

  // --- Look ----------------------------------------------------------------
  themes: Theme[]
  activeThemeId: string
  /** Working copy of the active theme; edits land here before being saved. */
  theme: Theme

  // --- Projection ----------------------------------------------------------
  mode: ProjectionMode
  liveVerses: Verse[]
  revision: number
  outputOpen: boolean
  /** True inside the Tauri shell; the browser build hides desktop-only controls. */
  isDesktop: boolean
  monitors: MonitorInfo[]
  /** Display the operator chose to project onto; null means "decide for me". */
  selectedMonitorId: string | null

  // --- Service order -------------------------------------------------------
  playlist: PlaylistItem[]
  activePlaylistId: string | null

  // --- UI ------------------------------------------------------------------
  panelTab: PanelTab

  // --- Actions -------------------------------------------------------------
  init: () => Promise<void>
  setTranslation: (id: string) => Promise<void>
  openChapter: (bookId: string, chapter: number) => Promise<void>
  stepChapter: (delta: number) => Promise<void>

  toggleVerse: (verse: number, extend: boolean) => void
  selectOnly: (verse: number) => void
  clearSelection: () => void

  runSearch: (query: string) => Promise<void>
  clearSearch: () => void
  jumpToReference: (reference: string) => Promise<boolean>

  goLive: (verses?: Verse[]) => void
  setMode: (mode: ProjectionMode) => void
  stepLive: (delta: number) => void
  publish: () => void

  refreshMonitors: () => Promise<void>
  setSelectedMonitor: (id: string) => void
  openOutput: () => Promise<void>
  closeOutput: () => Promise<void>

  applyTheme: (id: string) => void
  patchTheme: (patch: Partial<Theme>) => void
  patchTypography: (patch: Partial<Typography>) => void
  patchLayout: (patch: Partial<StageLayout>) => void
  patchOverlay: (patch: Partial<Overlay>) => void
  patchTransition: (patch: Partial<Transition>) => void
  setBackground: (background: Background) => void
  saveThemeAsPreset: (name: string) => void

  addToPlaylist: (verses?: Verse[]) => void
  removeFromPlaylist: (id: string) => void
  movePlaylistItem: (id: string, delta: number) => void
  projectPlaylistItem: (id: string) => void
  clearPlaylist: () => void

  setPanelTab: (tab: PanelTab) => void
  installTranslation: (id: string) => Promise<void>
  uninstallTranslation: (id: string) => Promise<void>
}

let idCounter = 0
const nextId = () => `item-${++idCounter}`

/** Deep-ish clone that is enough for the plain-data Theme shape. */
const cloneTheme = (theme: Theme): Theme => JSON.parse(JSON.stringify(theme)) as Theme

export const useAppStore = create<AppState>((set, get) => ({
  translations: [],
  activeTranslationId: 'id-tl',
  books: [],
  activeBookId: 'JHN',
  activeChapter: 3,
  chapterVerses: [],
  loadingChapter: false,

  selection: [],

  searchQuery: '',
  searchResults: [],
  searching: false,

  themes: BUILTIN_THEMES.map(cloneTheme),
  activeThemeId: BUILTIN_THEMES[0].id,
  theme: cloneTheme(BUILTIN_THEMES[0]),

  mode: 'logo',
  liveVerses: [],
  revision: 0,
  outputOpen: false,
  isDesktop: isTauri(),
  monitors: [],
  selectedMonitorId: null,

  playlist: [],
  activePlaylistId: null,

  panelTab: 'design',

  async init() {
    const translations = await bibleSource.listTranslations()
    const installed = translations.filter((t) => t.installed)
    const activeTranslationId = installed[0]?.id ?? translations[0].id
    const books = await bibleSource.getBooks(activeTranslationId)
    set({ translations, activeTranslationId, books })
    await get().openChapter(get().activeBookId, get().activeChapter)

    // The output window may open at any time; answer its sync request with the
    // current snapshot so it never sits blank waiting for the next action.
    projectionChannel.onSyncRequest(() => get().publish())

    // The window can also be closed from outside the app — the OS close button,
    // or the shell tearing it down. Trust the controller, not our own flag.
    outputWindow.onClosed(() => set({ outputOpen: false }))

    await get().refreshMonitors()
  },

  async setTranslation(id) {
    const books = await bibleSource.getBooks(id)
    set({ activeTranslationId: id, books })
    await get().openChapter(get().activeBookId, get().activeChapter)
  },

  async openChapter(bookId, chapter) {
    set({ loadingChapter: true, activeBookId: bookId, activeChapter: chapter })
    const verses = await bibleSource.getChapter(get().activeTranslationId, bookId, chapter)
    set({ chapterVerses: verses, loadingChapter: false, selection: [] })
  },

  async stepChapter(delta) {
    const { books, activeBookId, activeChapter } = get()
    const book = books.find((b) => b.id === activeBookId)
    if (!book) return

    const target = activeChapter + delta
    if (target >= 1 && target <= book.chapterCount) {
      await get().openChapter(activeBookId, target)
      return
    }

    // Roll over into the neighbouring book so paging never dead-ends.
    const index = books.findIndex((b) => b.id === activeBookId)
    const neighbour = books[index + delta]
    if (!neighbour) return
    await get().openChapter(neighbour.id, delta > 0 ? 1 : neighbour.chapterCount)
  },

  toggleVerse(verse, extend) {
    const { selection } = get()
    if (!extend) {
      set({ selection: selection.includes(verse) && selection.length === 1 ? [] : [verse] })
      return
    }
    // Shift-click extends from the first selected verse to the clicked one.
    if (selection.length === 0) {
      set({ selection: [verse] })
      return
    }
    const anchor = selection[0]
    const [lo, hi] = anchor <= verse ? [anchor, verse] : [verse, anchor]
    const range = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
    set({ selection: anchor <= verse ? range : range.reverse() })
  },

  selectOnly(verse) {
    set({ selection: [verse] })
  },

  clearSelection() {
    set({ selection: [] })
  },

  async runSearch(query) {
    set({ searchQuery: query })
    if (query.trim().length < 2) {
      set({ searchResults: [], searching: false })
      return
    }
    set({ searching: true })
    const results = await bibleSource.search(get().activeTranslationId, query)
    // Discard results for a query the operator has already moved on from.
    if (get().searchQuery !== query) return
    set({ searchResults: results, searching: false })
  },

  clearSearch() {
    set({ searchQuery: '', searchResults: [], searching: false })
  },

  async jumpToReference(reference) {
    const verses = await bibleSource.lookupReference(get().activeTranslationId, reference)
    if (verses.length === 0) return false
    const first = verses[0]
    await get().openChapter(first.bookId, first.chapter)
    set({ selection: verses.map((v) => v.verse) })
    return true
  },

  goLive(verses) {
    const state = get()
    const chosen =
      verses ??
      state.chapterVerses.filter((v) => state.selection.includes(v.verse))

    if (chosen.length === 0) return

    set({
      liveVerses: chosen,
      mode: 'live',
      revision: state.revision + 1,
      activePlaylistId: null,
    })
    get().publish()
  },

  setMode(mode) {
    set({ mode, revision: get().revision + 1 })
    get().publish()
  },

  stepLive(delta) {
    const { liveVerses, chapterVerses, revision } = get()
    if (liveVerses.length === 0) return

    // Step by the size of the current block, keeping multi-verse slides intact.
    const size = liveVerses.length
    const firstNumber = liveVerses[0].verse
    const targetStart = firstNumber + delta * size

    const next = chapterVerses.filter(
      (v) => v.verse >= targetStart && v.verse < targetStart + size,
    )
    if (next.length === 0) return

    set({
      liveVerses: next,
      selection: next.map((v) => v.verse),
      mode: 'live',
      revision: revision + 1,
    })
    get().publish()
  },

  async refreshMonitors() {
    const monitors = await outputWindow.listMonitors()
    const selected = get().selectedMonitorId
    // Keep the operator's choice if that display is still attached; otherwise
    // fall back to the projector guess so unplugging a screen is not fatal.
    const stillPresent = selected != null && monitors.some((m) => m.id === selected)
    set({
      monitors,
      selectedMonitorId: stillPresent ? selected : defaultMonitor(monitors)?.id ?? null,
    })
  },

  setSelectedMonitor(id) {
    set({ selectedMonitorId: id })
  },

  async openOutput() {
    await get().refreshMonitors()
    const opened = await outputWindow.open(get().selectedMonitorId ?? undefined)
    set({ outputOpen: opened })
    if (opened) get().publish()
  },

  async closeOutput() {
    await outputWindow.close()
    set({ outputOpen: false })
  },

  publish() {
    const { mode, liveVerses, theme, revision } = get()
    const snapshot: ProjectionState = { mode, verses: liveVerses, theme, revision }
    projectionChannel.publish(snapshot)
  },

  applyTheme(id) {
    const preset = get().themes.find((t) => t.id === id)
    if (!preset) return
    set({ activeThemeId: id, theme: cloneTheme(preset) })
    get().publish()
  },

  patchTheme(patch) {
    set({ theme: { ...get().theme, ...patch } })
    get().publish()
  },

  patchTypography(patch) {
    const theme = get().theme
    set({ theme: { ...theme, typography: { ...theme.typography, ...patch } } })
    get().publish()
  },

  patchLayout(patch) {
    const theme = get().theme
    set({ theme: { ...theme, layout: { ...theme.layout, ...patch } } })
    get().publish()
  },

  patchOverlay(patch) {
    const theme = get().theme
    set({ theme: { ...theme, overlay: { ...theme.overlay, ...patch } } })
    get().publish()
  },

  patchTransition(patch) {
    const theme = get().theme
    set({ theme: { ...theme, transition: { ...theme.transition, ...patch } } })
    get().publish()
  },

  setBackground(background) {
    set({ theme: { ...get().theme, background } })
    get().publish()
  },

  saveThemeAsPreset(name) {
    const id = `custom-${Date.now()}`
    const saved = { ...cloneTheme(get().theme), id, name }
    set({ themes: [...get().themes, saved], activeThemeId: id, theme: cloneTheme(saved) })
  },

  addToPlaylist(verses) {
    const state = get()
    const chosen =
      verses ?? state.chapterVerses.filter((v) => state.selection.includes(v.verse))
    if (chosen.length === 0) return

    const item: PlaylistItem = {
      id: nextId(),
      label: formatRange(chosen),
      verses: chosen,
      themeId: state.activeThemeId,
    }
    set({ playlist: [...state.playlist, item], panelTab: 'playlist' })
  },

  removeFromPlaylist(id) {
    set({
      playlist: get().playlist.filter((i) => i.id !== id),
      activePlaylistId: get().activePlaylistId === id ? null : get().activePlaylistId,
    })
  },

  movePlaylistItem(id, delta) {
    const list = [...get().playlist]
    const index = list.findIndex((i) => i.id === id)
    const target = index + delta
    if (index === -1 || target < 0 || target >= list.length) return
    const [item] = list.splice(index, 1)
    list.splice(target, 0, item)
    set({ playlist: list })
  },

  projectPlaylistItem(id) {
    const item = get().playlist.find((i) => i.id === id)
    if (!item) return

    if (item.themeId) {
      const preset = get().themes.find((t) => t.id === item.themeId)
      if (preset) set({ activeThemeId: preset.id, theme: cloneTheme(preset) })
    }

    set({ liveVerses: item.verses, mode: 'live', revision: get().revision + 1, activePlaylistId: id })
    get().publish()
  },

  clearPlaylist() {
    set({ playlist: [], activePlaylistId: null })
  },

  setPanelTab(tab) {
    set({ panelTab: tab })
  },

  async installTranslation(id) {
    const translations = await bibleSource.install(id)
    set({ translations })
  },

  async uninstallTranslation(id) {
    const translations = await bibleSource.uninstall(id)
    set({ translations })
    // Fall back to another installed translation if the active one was removed.
    if (get().activeTranslationId === id) {
      const fallback = translations.find((t) => t.installed)
      if (fallback) await get().setTranslation(fallback.id)
    }
  },
}))
