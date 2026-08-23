import { create } from 'zustand'
import type { Book, SearchResult, Translation, Verse } from '../types/bible'
import type { Background, Theme, Typography, StageLayout, Overlay, Transition } from '../types/theme'
import type { ProjectionMode, ProjectionState } from '../types/projection'
import { bibleSource } from '../services/bible'
import type { InstallProgress } from '../services/bible'
import { projectionChannel, outputWindow, defaultMonitor } from '../services/projection'
import type { MonitorInfo } from '../services/projection'
import { isTauri } from '../services/platform'
import { BUILTIN_THEMES } from '../data/presets'
import { settingsStore } from '../services/settings'
import { rehydrateBackground } from '../services/media'
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

  // --- Bible Manager -------------------------------------------------------
  /** Live progress per translation being installed, keyed by translation id. */
  installProgress: Record<string, InstallProgress>
  /** Last failure per translation, so the row can show what went wrong. */
  installError: Record<string, string>

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
  deleteTheme: (id: string) => void

  addToPlaylist: (verses?: Verse[]) => void
  removeFromPlaylist: (id: string) => void
  movePlaylistItem: (id: string, delta: number) => void
  projectPlaylistItem: (id: string) => void
  clearPlaylist: () => void

  setPanelTab: (tab: PanelTab) => void
  refreshTranslations: () => Promise<void>
  installTranslation: (id: string) => Promise<void>
  uninstallTranslation: (id: string) => Promise<void>
  dismissInstallError: (id: string) => void
}

let idCounter = 0
const nextId = () => `item-${++idCounter}`

/** Deep-ish clone that is enough for the plain-data Theme shape. */
const cloneTheme = (theme: Theme): Theme => JSON.parse(JSON.stringify(theme)) as Theme

export const useAppStore = create<AppState>((set, get) => ({
  translations: [],
  activeTranslationId: '',
  books: [],
  activeBookId: 'JHN',
  activeChapter: 3,
  chapterVerses: [],
  loadingChapter: false,

  selection: [],

  searchQuery: '',
  searchResults: [],
  searching: false,

  installProgress: {},
  installError: {},

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
    bibleSource.onInstallProgress((progress) => {
      set({ installProgress: { ...get().installProgress, [progress.translationId]: progress } })
    })

    // Restore preferences before anything reads them, so the first render is
    // already the operator's setup rather than defaults that flash and change.
    const saved = await settingsStore.load()
    if (saved) {
      // An image background's URL is only valid for the run that made it, so
      // every restored theme has its background resolved again from the stored
      // path — or dropped to a colour if it cannot be recovered.
      const [theme, ...customThemes] = await Promise.all(
        [saved.theme, ...saved.customThemes].map(async (t) => ({
          ...t,
          background: await rehydrateBackground(t.background),
        })),
      )

      set({
        // Built-ins always come from code; saved presets are appended. A saved
        // preset that shares an id with a built-in would be a bug, not a case
        // to support, so ids are left as they are.
        themes: [...BUILTIN_THEMES.map(cloneTheme), ...customThemes],
        activeThemeId: saved.activeThemeId,
        theme,
        playlist: saved.playlist,
        activeBookId: saved.activeBookId,
        activeChapter: saved.activeChapter,
        selectedMonitorId: saved.selectedMonitorId,
      })

      // Playlist ids must not collide with ids minted later this session.
      idCounter = saved.playlist.length
    }

    const translations = await bibleSource.listTranslations()
    set({ translations })

    // Reopen the translation that was in use, but only if it is still
    // installed — it may have been removed since, or the settings file may have
    // come from a different machine.
    const installed = translations.filter((t) => t.installed)
    const remembered = installed.find((t) => t.id === saved?.activeTranslationId)
    const target = remembered ?? installed[0]

    // A fresh desktop install has no packs yet. Leave the reader empty and let
    // the UI point the operator at the Bible Manager rather than crashing on a
    // translation that does not exist.
    if (target) {
      await get().setTranslation(target.id)
    } else {
      set({ activeTranslationId: '', books: [], chapterVerses: [], panelTab: 'library' })
    }

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

    // The previously open book may be absent from this translation — a New
    // Testament-only pack has no Genesis — so fall back to its first book.
    const current = books.find((b) => b.id === get().activeBookId)
    const target = current ?? books[0]
    if (!target) {
      set({ chapterVerses: [] })
      return
    }
    const chapter = Math.min(get().activeChapter, target.chapterCount)
    await get().openChapter(target.id, current ? chapter : 1)
  },

  async openChapter(bookId, chapter) {
    const translationId = get().activeTranslationId
    if (!translationId) return

    set({ loadingChapter: true, activeBookId: bookId, activeChapter: chapter })
    const verses = await bibleSource.getChapter(translationId, bookId, chapter)
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

  deleteTheme(id) {
    const target = get().themes.find((t) => t.id === id)
    // Built-ins come from code and would simply reappear on next launch.
    if (!target || target.builtin) return

    const themes = get().themes.filter((t) => t.id !== id)
    set({ themes })

    // Deleting the preset currently in use would leave the design panel
    // pointing at nothing, so fall back to the first built-in.
    if (get().activeThemeId === id) {
      const fallback = themes[0]
      set({ activeThemeId: fallback.id, theme: cloneTheme(fallback) })
      get().publish()
    }

    // Playlist entries referencing it fall back to the active theme.
    set({
      playlist: get().playlist.map((item) =>
        item.themeId === id ? { ...item, themeId: undefined } : item,
      ),
    })
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

  async refreshTranslations() {
    set({ translations: await bibleSource.listTranslations() })
  },

  async installTranslation(id) {
    const { [id]: _cleared, ...remainingErrors } = get().installError
    set({ installError: remainingErrors })

    try {
      await bibleSource.install(id)
      await get().refreshTranslations()

      // First pack on a fresh machine: open it straight away so the operator
      // lands in the reader instead of an empty screen.
      if (!get().activeTranslationId) {
        await get().setTranslation(id)
        set({ panelTab: 'design' })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      set({ installError: { ...get().installError, [id]: message } })
    } finally {
      const { [id]: _done, ...remainingProgress } = get().installProgress
      set({ installProgress: remainingProgress })
    }
  },

  async uninstallTranslation(id) {
    await bibleSource.uninstall(id)
    await get().refreshTranslations()

    if (get().activeTranslationId !== id) return

    // Fall back to another installed pack, or empty the reader if that was the
    // last one, rather than leaving the UI pointed at something now gone.
    const fallback = get().translations.find((t) => t.installed)
    if (fallback) {
      await get().setTranslation(fallback.id)
    } else {
      set({ activeTranslationId: '', books: [], chapterVerses: [], selection: [] })
    }
  },

  dismissInstallError(id) {
    const { [id]: _cleared, ...rest } = get().installError
    set({ installError: rest })
  },
}))
