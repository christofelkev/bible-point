import { create } from 'zustand'
import type { Book, SearchResult, Translation, Verse } from '../types/bible'
import type { Background, Theme, Typography, StageLayout, Overlay, Transition } from '../types/theme'
import type { AppWorkspaceMode, ProjectionMode, ProjectionSlide, ProjectionState } from '../types/projection'
import { bibleSource } from '../services/bible'
import type { InstallProgress, SideloadMeta } from '../services/bible'
import { projectionChannel, outputWindow, defaultMonitor } from '../services/projection'
import type { MonitorInfo } from '../services/projection'
import { isTauri } from '../services/platform'
import { BUILTIN_THEMES } from '../data/presets'
import { settingsStore } from '../services/settings'
import { rehydrateTheme, pruneUnusedAssets, rehydrateBackground } from '../services/media'
import { exportPresets, importPresets } from '../services/presets'
import { formatRange } from '../types/bible'
import type { Song } from '../types/song'
import { songStore } from '../services/songs'
import { DEFAULT_SONGS } from '../data/defaultSongs'
import type { PresentationDeck } from '../types/presentation'
import { presentationStore } from '../services/presentation'

export type PlaylistItemKind = 'bible' | 'song' | 'presentation'

/** One entry in the unified service order (Scripture, Song, or Presentation). */
export interface PlaylistItem {
  id: string
  label: string
  kind?: PlaylistItemKind
  verses?: Verse[]
  songId?: string
  deckId?: string
  slides?: ProjectionSlide[]
  artist?: string
  /** Theme override; falls back to the active theme when absent. */
  themeId?: string
  backgroundOverride?: Background
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

  // --- Workspace mode & Sub-tabs -------------------------------------------
  workspaceMode: AppWorkspaceMode
  presentationSubTab: 'songs' | 'presentations'

  // --- Songs (Live Mode) ---------------------------------------------------
  songs: Song[]
  activeSongId: string | null

  // --- Presentations (Live Mode) -------------------------------------------
  presentations: PresentationDeck[]
  activeDeckId: string | null

  // --- Projection ----------------------------------------------------------
  mode: ProjectionMode
  liveVerses: Verse[]
  liveSlide: ProjectionSlide | null
  liveSongSlides: ProjectionSlide[]
  activeLiveSlideIndex: number
  /** Live background override from Media Bin (overrides theme.background without modifying preset) */
  liveBackgroundOverride: Background | null
  /** User-uploaded and custom media backgrounds */
  mediaLibrary: Background[]
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
  setWorkspaceMode: (mode: AppWorkspaceMode) => void
  setPresentationSubTab: (tab: 'songs' | 'presentations') => void

  loadSongs: () => Promise<void>
  saveSong: (song: Song) => Promise<void>
  deleteSong: (id: string) => Promise<void>
  setActiveSongId: (id: string | null) => void

  loadPresentations: () => Promise<void>
  saveDeck: (deck: PresentationDeck) => Promise<void>
  deleteDeck: (deckId: string) => Promise<void>
  setActiveDeckId: (id: string | null) => void
  addDeckToPlaylist: (deck: PresentationDeck) => void

  setTranslation: (id: string) => Promise<void>
  openChapter: (bookId: string, chapter: number) => Promise<void>
  /** Returns false when there is no neighbouring chapter to move to. */
  stepChapter: (delta: number) => Promise<boolean>

  toggleVerse: (verse: number, extend: boolean) => void
  selectOnly: (verse: number) => void
  clearSelection: () => void

  runSearch: (query: string) => Promise<void>
  clearSearch: () => void
  jumpToReference: (reference: string) => Promise<boolean>

  goLive: (verses?: Verse[]) => void
  goLiveSlide: (slide: ProjectionSlide, allSlides?: ProjectionSlide[], index?: number) => void
  setMode: (mode: ProjectionMode) => void
  stepLive: (delta: number) => Promise<void>
  jumpToSlideIndex: (index: number) => void
  jumpToSection: (query: string) => void
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
  setLiveBackgroundOverride: (background: Background | null) => void
  addMediaAsset: (background: Background) => void
  removeMediaAsset: (index: number) => void
  saveThemeAsPreset: (name: string) => void
  deleteTheme: (id: string) => void

  addToPlaylist: (verses?: Verse[]) => void
  addSongToPlaylist: (song: Song) => void
  removeFromPlaylist: (id: string) => void
  movePlaylistItem: (id: string, delta: number) => void
  projectPlaylistItem: (id: string) => void
  clearPlaylist: () => void

  setPanelTab: (tab: PanelTab) => void
  refreshTranslations: () => Promise<void>
  installTranslation: (id: string) => Promise<void>
  uninstallTranslation: (id: string) => Promise<void>
  dismissInstallError: (id: string) => void
  sideloadTranslation: (file: File, meta: SideloadMeta) => Promise<void>
  exportThemePresets: () => Promise<string | null>
  importThemePresets: () => Promise<{ added: number; skipped: number } | null>
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

  workspaceMode: 'bible',
  presentationSubTab: 'songs',
  songs: [],
  activeSongId: null,
  presentations: [],
  activeDeckId: null,

  themes: BUILTIN_THEMES.map(cloneTheme),
  activeThemeId: BUILTIN_THEMES[0].id,
  theme: cloneTheme(BUILTIN_THEMES[0]),

  mode: 'logo',
  liveVerses: [],
  liveSlide: null,
  liveSongSlides: [],
  activeLiveSlideIndex: -1,
  liveBackgroundOverride: null,
  mediaLibrary: [],
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
      // A stored file's URL is only valid for the run that made it, so every
      // restored theme has its background and custom font resolved again from
      // their stored paths — or dropped if they cannot be recovered.
      const [theme, ...customThemes] = await Promise.all(
        [saved.theme, ...saved.customThemes].map(rehydrateTheme),
      )
      const mediaLibrary = await Promise.all(
        (saved.mediaLibrary ?? []).map(rehydrateBackground),
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
        workspaceMode: saved.workspaceMode ?? 'bible',
        mediaLibrary,
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

    // Restore worship songs from persistent storage (or seed initial demo songs).
    const loadedSongs = await songStore.load()
    const songs = loadedSongs && loadedSongs.length > 0 ? loadedSongs : DEFAULT_SONGS
    if (!loadedSongs || loadedSongs.length === 0) {
      void songStore.save(DEFAULT_SONGS)
    }
    set({
      songs,
      activeSongId: songs[0]?.id ?? null,
    })

    // Restore presentations from persistent storage
    const loadedDecks = await presentationStore.load()
    const presentations = loadedDecks ?? []
    set({
      presentations,
      activeDeckId: presentations[0]?.id ?? null,
    })

    // Files the operator tried and moved on from would otherwise pile up
    // forever. Runs after hydration so every live reference is already known.
    const mediaThemes: Theme[] = get().mediaLibrary.map((bg) => ({
      ...get().theme,
      background: bg,
    }))
    void pruneUnusedAssets([get().theme, ...get().themes, ...mediaThemes])
  },

  async setTranslation(id) {
    const books = await bibleSource.getBooks(id)
    set({ activeTranslationId: id, books })

    // Keep the book/chapter if the newly chosen translation has it; jump to
    // Genesis 1 when switching to a translation that lacks this book entirely.
    const targetBook = books.find((b) => b.id === get().activeBookId) ?? books[0]
    if (targetBook) {
      const chapter = Math.min(get().activeChapter, targetBook.chapterCount)
      await get().openChapter(targetBook.id, chapter)
    } else {
      set({ chapterVerses: [], selection: [] })
    }
  },

  async openChapter(bookId, chapter) {
    set({ activeBookId: bookId, activeChapter: chapter, loadingChapter: true })
    const chapterVerses = await bibleSource.getChapter(get().activeTranslationId, bookId, chapter)
    set({ chapterVerses, loadingChapter: false, selection: [] })
  },

  async stepChapter(delta) {
    const { books, activeBookId, activeChapter } = get()
    const book = books.find((b) => b.id === activeBookId)
    if (!book) return false

    const targetChapter = activeChapter + delta
    if (targetChapter >= 1 && targetChapter <= book.chapterCount) {
      await get().openChapter(book.id, targetChapter)
      return true
    }

    const index = books.indexOf(book)
    const neighbour = books[index + delta]
    if (!neighbour) return false

    await get().openChapter(neighbour.id, delta > 0 ? 1 : neighbour.chapterCount)
    return true
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
    if (get().searchQuery === query) {
      set({ searchResults: results, searching: false })
    }
  },

  clearSearch() {
    set({ searchQuery: '', searchResults: [], searching: false })
  },

  setWorkspaceMode(mode) {
    set({ workspaceMode: mode })
  },

  setPresentationSubTab(tab) {
    set({ presentationSubTab: tab })
  },

  async loadSongs() {
    const loaded = await songStore.load()
    if (loaded) {
      set({ songs: loaded })
    }
  },

  async saveSong(song) {
    const { songs } = get()
    const idx = songs.findIndex((s) => s.id === song.id)
    let nextSongs: Song[]
    if (idx >= 0) {
      nextSongs = [...songs]
      nextSongs[idx] = song
    } else {
      nextSongs = [song, ...songs]
    }
    set({ songs: nextSongs, activeSongId: song.id, presentationSubTab: 'songs' })
    await songStore.save(nextSongs)
  },

  async deleteSong(id) {
    const { songs, activeSongId } = get()
    const nextSongs = songs.filter((s) => s.id !== id)
    const nextActive = activeSongId === id ? (nextSongs[0]?.id ?? null) : activeSongId
    set({ songs: nextSongs, activeSongId: nextActive })
    await songStore.save(nextSongs)
  },

  setActiveSongId(id) {
    set({ activeSongId: id })
  },

  async loadPresentations() {
    const loaded = await presentationStore.load()
    if (loaded) {
      set({ presentations: loaded })
    }
  },

  async saveDeck(deck) {
    const list = [...get().presentations]
    const idx = list.findIndex((d) => d.id === deck.id)
    if (idx >= 0) {
      list[idx] = deck
    } else {
      list.unshift(deck)
    }
    set({ presentations: list, activeDeckId: deck.id, presentationSubTab: 'presentations' })
    await presentationStore.save(list)
  },

  async deleteDeck(id) {
    const list = get().presentations.filter((d) => d.id !== id)
    const nextActive = get().activeDeckId === id ? (list[0]?.id ?? null) : get().activeDeckId
    set({ presentations: list, activeDeckId: nextActive })
    await presentationStore.save(list)
    await presentationStore.deleteDeck(id)
  },

  setActiveDeckId(id) {
    set({ activeDeckId: id })
  },

  addDeckToPlaylist(deck) {
    const state = get()
    const slides: ProjectionSlide[] = deck.slides.map((s, idx) => ({
      kind: 'presentation',
      lines: [],
      imageUrl: s.imageUrl,
      imagePath: s.imagePath,
      badge: s.badge ?? `Slide ${idx + 1}`,
      reference: deck.title,
      slideProgress: `${idx + 1} / ${deck.slides.length}`,
    }))

    const item: PlaylistItem = {
      id: nextId(),
      label: deck.title,
      kind: 'presentation',
      deckId: deck.id,
      artist: `${deck.sourceType.toUpperCase()} · ${deck.slideCount} Slide`,
      slides,
      themeId: state.activeThemeId,
      backgroundOverride: state.liveBackgroundOverride ?? undefined,
    }
    set({ playlist: [...state.playlist, item], panelTab: 'playlist' })
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
      liveSlide: null,
      mode: 'live',
      revision: state.revision + 1,
      activePlaylistId: null,
    })
    get().publish()
  },

  goLiveSlide(slide, allSlides, index) {
    const state = get()
    const slides = allSlides ?? (state.liveSongSlides.length > 0 ? state.liveSongSlides : [slide])
    const slideIdx =
      index !== undefined
        ? index
        : slides.findIndex(
            (s) =>
              s === slide ||
              (s.imageUrl && s.imageUrl === slide.imageUrl) ||
              (s.badge === slide.badge && s.lines.join() === slide.lines.join()),
          )

    set({
      liveSlide: slide,
      liveVerses: [],
      liveSongSlides: slides,
      activeLiveSlideIndex: slideIdx >= 0 ? slideIdx : 0,
      mode: 'live',
      revision: state.revision + 1,
      activePlaylistId: null,
    })
    get().publish()
  },

  jumpToSlideIndex(index) {
    const { liveSongSlides, songs, activeSongId, presentations, activeDeckId, presentationSubTab } = get()
    let slides = liveSongSlides
    if (slides.length === 0) {
      if (presentationSubTab === 'presentations') {
        const deck = presentations.find((d) => d.id === activeDeckId)
        if (deck) {
          slides = deck.slides.map((s, idx) => ({
            kind: 'presentation',
            lines: [],
            imageUrl: s.imageUrl,
            imagePath: s.imagePath,
            badge: s.badge ?? `Slide ${idx + 1}`,
            reference: deck.title,
            slideProgress: `${idx + 1} / ${deck.slides.length}`,
          }))
        }
      } else {
        const activeSong = songs.find((s) => s.id === activeSongId)
        slides = activeSong?.slides ?? []
      }
    }
    if (index >= 0 && index < slides.length) {
      get().goLiveSlide(slides[index], slides, index)
    }
  },

  jumpToSection(query) {
    const { liveSongSlides, songs, activeSongId } = get()
    const activeSong = songs.find((s) => s.id === activeSongId)
    const slides = liveSongSlides.length > 0 ? liveSongSlides : (activeSong?.slides ?? [])
    const q = query.toLowerCase()
    const foundIdx = slides.findIndex((s) => s.badge?.toLowerCase().includes(q))
    if (foundIdx >= 0) {
      get().goLiveSlide(slides[foundIdx], slides, foundIdx)
    }
  },

  setMode(mode) {
    set({ mode, revision: get().revision + 1 })
    get().publish()
  },

  async stepLive(delta) {
    const { liveSlide, liveSongSlides, activeLiveSlideIndex, liveVerses, chapterVerses } = get()

    // 1. If currently projecting a song or presentation slide, step within the slides
    if (liveSlide != null && liveSongSlides.length > 0) {
      const target = activeLiveSlideIndex + delta
      if (target >= 0 && target < liveSongSlides.length) {
        const nextSlide = liveSongSlides[target]
        set({
          liveSlide: nextSlide,
          activeLiveSlideIndex: target,
          mode: 'live',
          revision: get().revision + 1,
        })
        get().publish()
      }
      return
    }

    // 2. Otherwise step through Bible verses
    if (liveVerses.length === 0) return

    // Step by the size of the current block, keeping multi-verse slides intact.
    const size = liveVerses.length
    const targetStart = liveVerses[0].verse + delta * size

    let next = chapterVerses.filter(
      (v) => v.verse >= targetStart && v.verse < targetStart + size,
    )

    if (next.length === 0) {
      const bookId = get().activeBookId
      const chapter = get().activeChapter
      if (!(await get().stepChapter(delta))) return

      const fresh = get().chapterVerses
      next = delta > 0 ? fresh.slice(0, size) : fresh.slice(-size)

      if (next.length === 0) {
        await get().openChapter(bookId, chapter)
        return
      }
    }

    set({
      liveVerses: next,
      liveSlide: null,
      selection: next.map((v) => v.verse),
      mode: 'live',
      revision: get().revision + 1,
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
    const { theme } = get()
    set({ theme: { ...theme, typography: { ...theme.typography, ...patch } } })
    get().publish()
  },

  patchLayout(patch) {
    const { theme } = get()
    set({ theme: { ...theme, layout: { ...theme.layout, ...patch } } })
    get().publish()
  },

  patchOverlay(patch) {
    const { theme } = get()
    set({ theme: { ...theme, overlay: { ...theme.overlay, ...patch } } })
    get().publish()
  },

  patchTransition(patch) {
    const { theme } = get()
    set({ theme: { ...theme, transition: { ...theme.transition, ...patch } } })
    get().publish()
  },

  setBackground(background) {
    const { theme } = get()
    set({ theme: { ...theme, background } })
    get().publish()
  },

  setLiveBackgroundOverride(background) {
    set({ liveBackgroundOverride: background })
    get().publish()
  },

  addMediaAsset(background) {
    const { mediaLibrary } = get()
    set({ mediaLibrary: [background, ...mediaLibrary] })
  },

  removeMediaAsset(index) {
    const { mediaLibrary } = get()
    const next = [...mediaLibrary]
    next.splice(index, 1)
    set({ mediaLibrary: next })
  },

  saveThemeAsPreset(name) {
    const { theme, themes } = get()
    const custom: Theme = {
      ...cloneTheme(theme),
      id: `custom-${Date.now()}`,
      name,
      builtin: false,
    }
    set({ themes: [...themes, custom], activeThemeId: custom.id })
  },

  deleteTheme(id) {
    const { themes, activeThemeId } = get()
    const remaining = themes.filter((t) => t.id !== id)
    const nextActive = activeThemeId === id ? remaining[0].id : activeThemeId
    const nextTheme =
      activeThemeId === id
        ? cloneTheme(remaining[0])
        : get().theme

    set({ themes: remaining, activeThemeId: nextActive, theme: nextTheme })
    get().publish()
  },

  publish() {
    const { mode, liveVerses, liveSlide, theme, liveBackgroundOverride, revision } = get()
    const activeTheme = liveBackgroundOverride
      ? { ...theme, background: liveBackgroundOverride }
      : theme

    const snapshot: ProjectionState = {
      mode,
      verses: liveVerses,
      slide: liveSlide,
      theme: activeTheme,
      revision,
    }
    projectionChannel.publish(snapshot)
  },

  addToPlaylist(verses) {
    const state = get()
    const chosen =
      verses ?? state.chapterVerses.filter((v) => state.selection.includes(v.verse))
    if (chosen.length === 0) return

    const item: PlaylistItem = {
      id: nextId(),
      label: formatRange(chosen),
      kind: 'bible',
      verses: chosen,
      themeId: state.activeThemeId,
    }
    set({ playlist: [...state.playlist, item], panelTab: 'playlist' })
  },

  addSongToPlaylist(song) {
    const state = get()
    const item: PlaylistItem = {
      id: nextId(),
      label: song.title,
      kind: 'song',
      songId: song.id,
      artist: song.artist,
      slides: song.slides,
      themeId: state.activeThemeId,
      backgroundOverride: state.liveBackgroundOverride ?? undefined,
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

    if (item.backgroundOverride !== undefined) {
      set({ liveBackgroundOverride: item.backgroundOverride })
    }

    if (item.kind === 'presentation') {
      const slides = item.slides ?? []
      const firstSlide = slides[0] ?? null
      set({
        workspaceMode: 'live',
        presentationSubTab: 'presentations',
        activeDeckId: item.deckId ?? get().activeDeckId,
        liveSongSlides: slides,
        liveSlide: firstSlide,
        activeLiveSlideIndex: firstSlide ? 0 : -1,
        liveVerses: [],
        mode: 'live',
        revision: get().revision + 1,
        activePlaylistId: id,
      })
      get().publish()
      return
    }

    if (item.kind === 'song' || item.slides) {
      const slides = item.slides ?? []
      const firstSlide = slides[0] ?? null
      set({
        workspaceMode: 'live',
        presentationSubTab: 'songs',
        activeSongId: item.songId ?? get().activeSongId,
        liveSongSlides: slides,
        liveSlide: firstSlide,
        activeLiveSlideIndex: firstSlide ? 0 : -1,
        liveVerses: [],
        mode: 'live',
        revision: get().revision + 1,
        activePlaylistId: id,
      })
      get().publish()
      return
    }

    const verses = item.verses ?? []
    set({
      workspaceMode: 'bible',
      liveVerses: verses,
      liveSlide: null,
      mode: 'live',
      revision: get().revision + 1,
      activePlaylistId: id,
    })
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

  async sideloadTranslation(file, meta) {
    await bibleSource.sideload(file, meta)
    await get().refreshTranslations()

    // First pack on a fresh machine: open it so the operator lands in the
    // reader rather than being left staring at the empty state they just fixed.
    if (!get().activeTranslationId) {
      const installed = get().translations.find((t) => t.installed)
      if (installed) {
        await get().setTranslation(installed.id)
        set({ panelTab: 'design' })
      }
    }
  },

  async exportThemePresets() {
    return exportPresets(get().themes)
  },

  async importThemePresets() {
    const result = await importPresets()
    if (!result) return null

    // Imported presets are added, never merged over existing ones: an operator
    // who imports a colleague's file should not silently lose their own work.
    // Colliding ids are re-minted so both copies survive.
    const existing = new Set(get().themes.map((t) => t.id))
    const added = result.themes.map((theme, i) => ({
      ...theme,
      id: existing.has(theme.id) ? `imported-${Date.now()}-${i}` : theme.id,
      name: existing.has(theme.id) ? `${theme.name} (impor)` : theme.name,
    }))

    set({ themes: [...get().themes, ...added] })
    return { added: added.length, skipped: result.skipped }
  },
}))
